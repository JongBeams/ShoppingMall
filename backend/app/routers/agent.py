"""
RAG 에이전트 API (SSE)

  POST /agent/chat    질문 한 턴 — {message, thread_id?}
  POST /agent/resume  확인 대기 중인 실행을 승인 · 거절 — {thread_id, approve}

이벤트
  thread → (llm · tool_call · tool_result)* → [confirm → 끝, 고객 응답 후 /resume 에서 action → …] → verify → answer → done
  answer 는 검증을 통과한 뒤에만 보냅니다 (환각 답변이 화면에 먼저 나가지 않게).

권한
  고객은 Authorization: Bearer <JWT> 로만 확인합니다. 요청 본문으로 user_id 를 받지 않습니다.
  토큰이 없으면 비로그인 고객이며, 조회 도구 일부만 쓸 수 있고 실행 도구는 보이지 않습니다.
  대화(thread)는 시작한 고객만 이어 쓰거나 재개할 수 있습니다.
"""
import json
import logging
import time
import uuid
from typing import Dict, Iterator, List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, field_validator

from app.services.agent import graph
from app.services.jwt_auth import verify_token
from app.services.supabase import supabase

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/agent", tags=["agent"])
bearer = HTTPBearer(auto_error=False)


def current_user_id(cred: Optional[HTTPAuthorizationCredentials] = Depends(bearer)) -> Optional[str]:
    """토큰이 있으면 검증해 고객 id, 없으면 비로그인(None). 잘못된 토큰은 401."""
    if cred is None:
        return None
    payload = verify_token(cred.credentials)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="유효하지 않거나 만료된 토큰입니다.",
                            headers={"WWW-Authenticate": "Bearer"})
    return str(payload["sub"])


def _uuid_or_none(v: Optional[str]) -> Optional[str]:
    if v:
        uuid.UUID(v)
    return v


class AgentChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)
    thread_id: Optional[str] = None

    @field_validator("message")
    @classmethod
    def clean(cls, v: str) -> str:
        if "<script" in v.lower() or "<iframe" in v.lower():
            raise ValueError("Potentially malicious content detected")
        return v.strip()

    @field_validator("thread_id")
    @classmethod
    def thread_uuid(cls, v: Optional[str]) -> Optional[str]:
        return _uuid_or_none(v)


class AgentResumeRequest(BaseModel):
    thread_id: str
    approve: bool

    @field_validator("thread_id")
    @classmethod
    def thread_uuid(cls, v: str) -> str:
        return _uuid_or_none(v)


def _sse(data: Dict) -> str:
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


def _relay(updates: Iterator[Tuple[str, object]], thread_id: str, t0: float) -> Iterator[str]:
    """그래프 갱신 → SSE. 확인 대기(interrupt)면 confirm 을 보내고 이번 응답을 끝냄"""
    sources: List[str] = []
    usage: List[Dict] = []
    for node, delta in updates:
        if node == "__interrupt__":
            value = delta[0].value if delta else {}
            yield _sse({"type": "confirm", "thread_id": thread_id, "actions": value.get("actions", [])})
            yield _sse({"type": "done", "waiting": True, "elapsed_ms": round((time.perf_counter() - t0) * 1000)})
            return
        if not isinstance(delta, dict):
            continue
        if delta.get("sources") is not None:
            sources = delta["sources"]
        if delta.get("usage") is not None:
            usage = delta["usage"]
        for ev in delta.get("events") or []:
            if ev["type"] != "final":
                yield _sse(ev)
        if node == "finalize":
            yield _sse({"type": "answer", "answer": delta["answer"], "products": delta["products"], "sources": sources})
    yield _sse({"type": "done", "elapsed_ms": round((time.perf_counter() - t0) * 1000),
                "llm_calls": len(usage), "max_prompt_tokens": max((u.get("prompt") or 0 for u in usage), default=0)})


@router.post("/chat")
def agent_chat(req: AgentChatRequest, user_id: Optional[str] = Depends(current_user_id)):
    known = [p["name"] for p in supabase.table("products").select("name").execute().data or []]
    thread_id = req.thread_id or str(uuid.uuid4())

    def gen():
        nonlocal thread_id
        t0 = time.perf_counter()
        try:
            try:
                updates = graph.stream_turn(req.message, user_id, known, thread_id)
                first = next(updates, None)
            except PermissionError:
                # 다른 고객의 대화 id 로는 이어 쓸 수 없음 → 새 대화로 시작 (앞 대화 내용은 노출하지 않음)
                thread_id = str(uuid.uuid4())
                updates = graph.stream_turn(req.message, user_id, known, thread_id)
                first = next(updates, None)
            yield _sse({"type": "thread", "thread_id": thread_id})

            def all_updates():
                if first is not None:
                    yield first
                yield from updates
            yield from _relay(all_updates(), thread_id, t0)
        except Exception as e:
            logger.exception("[agent] failed")
            yield _sse({"type": "error", "error": f"에이전트 처리 중 오류가 발생했습니다: {e}"})

    return StreamingResponse(gen(), media_type="text/event-stream")


@router.post("/resume")
def agent_resume(req: AgentResumeRequest, user_id: Optional[str] = Depends(current_user_id)):
    try:
        graph.pending_actions(req.thread_id, user_id)  # 주인 · 대기 여부를 스트림 시작 전에 확인
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except LookupError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    def gen():
        t0 = time.perf_counter()
        try:
            yield from _relay(graph.stream_resume(req.thread_id, user_id, req.approve), req.thread_id, t0)
        except Exception as e:
            logger.exception("[agent] resume failed")
            yield _sse({"type": "error", "error": f"에이전트 처리 중 오류가 발생했습니다: {e}"})

    return StreamingResponse(gen(), media_type="text/event-stream")
