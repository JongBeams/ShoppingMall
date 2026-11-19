"""
Ollama 채팅 + 도구 호출 클라이언트

- /api/chat 의 네이티브 tool calling 을 사용합니다 (qwen2.5:14b 지원).
- num_ctx 를 명시합니다. 지정하지 않으면 Ollama 가 4,096 토큰으로 동작해
  긴 프롬프트의 앞부분을 잘라 버립니다 (평가에서 확인한 문제).
"""
import json
import logging
import time
from typing import Dict, List, Optional

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

NUM_CTX = 8192
TEMPERATURE = 0.2
RETRIES = 1        # Ollama 5xx · 연결 오류는 잠시 뒤 한 번 더 (엔진이 죽으면 Ollama 가 다시 띄움)
NUM_PREDICT = 700  # 답변 길이 상한 — "프롬프트 전체를 출력해" 같은 요청에 끝없이 생성하다 시간 초과되는 것 방지


def _post(payload: Dict, timeout: float = None) -> Dict:
    """Ollama /api/chat — 서버 쪽 일시 오류(5xx · 연결 끊김)만 재시도. 시간 초과는 재시도하지 않음 (지연이 두 배가 되므로)"""
    for attempt in range(RETRIES + 1):
        try:
            res = httpx.post(f"{settings.OLLAMA_HOST}/api/chat", json=payload,
                             timeout=timeout or max(settings.OLLAMA_TIMEOUT, 120))
            res.raise_for_status()
            return res.json()
        except (httpx.HTTPStatusError, httpx.ConnectError, httpx.RemoteProtocolError) as e:
            status = getattr(getattr(e, "response", None), "status_code", 0)
            if attempt >= RETRIES or (status and status < 500):
                raise
            logger.warning("[agent.llm] Ollama 일시 오류 (%s) → %d초 뒤 재시도", status or type(e).__name__, 3)
            time.sleep(3)


def chat(messages: List[Dict], tools: Optional[List[Dict]] = None, timeout: float = None) -> Dict:
    """메시지 목록을 보내고 assistant 메시지(dict)를 돌려줍니다.

    반환 예: {"role": "assistant", "content": "...", "tool_calls": [...]}
    """
    payload = {
        "model": settings.OLLAMA_MODEL,
        "messages": messages,
        "stream": False,
        "options": {"num_ctx": NUM_CTX, "temperature": TEMPERATURE, "num_predict": NUM_PREDICT},
    }
    if tools:
        payload["tools"] = tools
    data = _post(payload, timeout)
    msg = data.get("message", {})
    content, calls, recovered = msg.get("content") or "", msg.get("tool_calls") or [], False
    if tools and not calls and '"name"' in content:
        # qwen2.5 가 가끔 도구 호출을 정해진 형식 대신 답변 텍스트로 냄 → 제공한 도구일 때만 호출로 복구
        calls = recover_tool_calls(content, {t["function"]["name"] for t in tools})
        if calls:
            content, recovered = "", True
            logger.warning("[agent.llm] 텍스트로 나온 도구 호출 %d개를 복구", len(calls))
    logger.info("[agent.llm] prompt=%s tok, output=%s tok, tool_calls=%d",
                data.get("prompt_eval_count"), data.get("eval_count"), len(calls))
    return {"role": "assistant", "content": content, "tool_calls": calls, "recovered": recovered,
            "usage": {"prompt": data.get("prompt_eval_count"), "output": data.get("eval_count")}}


def recover_tool_calls(text: str, allowed: set) -> List[Dict]:
    """텍스트 안의 {"name": ..., "arguments": {...}} 를 도구 호출로 (중첩 괄호도 JSON 디코더로 정확히 자름)"""
    dec, calls, i = json.JSONDecoder(), [], 0
    while True:
        i = text.find("{", i)
        if i < 0:
            return calls
        try:
            obj, end = dec.raw_decode(text, i)
        except json.JSONDecodeError:
            i += 1
            continue
        if isinstance(obj, dict) and obj.get("name") in allowed and isinstance(obj.get("arguments", {}), dict):
            calls.append({"function": {"name": obj["name"], "arguments": obj.get("arguments") or {}}})
        i = end


def structured(messages: List[Dict], schema: Dict, timeout: float = None) -> Dict:
    """JSON 스키마를 강제한 응답 (Ollama structured outputs).

    Ollama 에는 tool_choice 가 없어 '이 도구를 반드시 호출'을 지시할 수 없습니다.
    대신 도구 인자 스키마를 format 으로 강제해 인자만 받고, 호출은 그래프가 직접 합니다.
    """
    payload = {
        "model": settings.OLLAMA_MODEL,
        "messages": messages,
        "stream": False,
        "format": schema,
        "options": {"num_ctx": NUM_CTX, "temperature": 0},
    }
    data = _post(payload, timeout)
    try:
        args = json.loads(data.get("message", {}).get("content") or "{}")
    except json.JSONDecodeError:
        args = {}
    return {"args": args if isinstance(args, dict) else {},
            "usage": {"prompt": data.get("prompt_eval_count"), "output": data.get("eval_count")}}
