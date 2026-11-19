"""
컨텍스트 예산 — 프롬프트가 무엇으로 채워지는지 → 포트폴리오/data/context_budget.json

  python context_budget.py

Qwen2.5 토크나이저로 셉니다 (measure.py 의 토큰 측정과 같은 방식).
- 기존 쇼핑 챗(기본 경로): 앱이 만드는 프롬프트를 가로채 지시문 · 상품 정보 · 리뷰로 나눔
- 에이전트: 데모 질문의 두 번째 LLM 호출(도구 결과를 받은 뒤)과 같은 메시지를
  chat template 으로 그려 시스템 프롬프트 · 도구 스키마 · 질문 · 도구 호출 · 도구 결과로 나눔
  (도구 결과는 tool_examples.json 의 실제 출력, 합계는 Ollama 집계값과 비교)
"""
import json
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
DATA = HERE.parent / "data"
CFG = json.loads((HERE / ".cache" / "local.json").read_text(encoding="utf-8"))
P = CFG["ports"]
os.environ.update({"SUPABASE_URL": f"http://127.0.0.1:{P['gateway']}", "SUPABASE_ANON_KEY": CFG["anon_key"],
                   "SUPABASE_SERVICE_ROLE_KEY": CFG["service_key"]})
from dotenv import load_dotenv  # noqa: E402

load_dotenv(ROOT / "backend" / ".env")
os.chdir(HERE / ".cache")
sys.path.insert(0, str(ROOT / "backend"))

from transformers import AutoTokenizer  # noqa: E402

import app.services.rag_search as rag  # noqa: E402
from app.services.agent.graph import SYSTEM  # noqa: E402
from app.services.agent.tools import SCHEMAS  # noqa: E402
from app.services.product_statistics import format_products_for_llm, get_new_arrivals  # noqa: E402

tok = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-14B-Instruct")
count = lambda s: len(tok(s)["input_ids"])  # noqa: E731

# ---------------------------------------------------------------- 기존 쇼핑 챗 · 기본 경로
captured = {}


class _Stop(Exception):
    pass


def fake_post(url, json=None, **kw):
    captured["prompt"] = json["prompt"]
    raise _Stop()


products = get_new_arrivals(limit=50)
docs = rag.search_documents("추천해줘", limit=3)  # 기존 경로는 규정 검색 결과도 함께 넣음 (measure.py 와 같은 조건)
ctx_full = f"전체 상품 목록 (총 {len(products)}개):\n{format_products_for_llm(products, include_reviews=True)}"
ctx_plain = f"전체 상품 목록 (총 {len(products)}개):\n{format_products_for_llm(products, include_reviews=False)}"
orig = rag.requests.post
rag.requests.post = fake_post
try:
    list(rag.generate_answer_with_ollama_streaming("추천해줘", docs, ctx_full))
except _Stop:
    pass
finally:
    rag.requests.post = orig
old_total = count(captured["prompt"])
doc_tok = sum(count(d.get("content", "")) for d in docs)
old = {"total": old_total, "parts": [
    ["지시문 · 질문", old_total - count(ctx_full) - doc_tok],
    [f"규정 문서 {len(docs)}건", doc_tok],
    [f"상품 정보 {len(products)}개", count(ctx_plain)],
    ["리뷰", count(ctx_full) - count(ctx_plain)],
]}

# ---------------------------------------------------------------- 에이전트 · 데모 질문의 두 번째 호출
TX = json.loads((DATA / "tool_examples.json").read_text(encoding="utf-8"))
q = "러닝화 15만원 이하로 추천해주고, 단순 변심으로 반품하면 배송비는 얼마야?"
calls = [{"name": "search_products", "arguments": {"keyword": "러닝화", "max_price": 150000, "limit": 5}},
         {"name": "search_policy", "arguments": {"query": "단순 변심 반품 배송비"}}]
results = [json.dumps(TX["search_products"]["result"], ensure_ascii=False),
           json.dumps(TX["search_policy"]["result"], ensure_ascii=False)]
system = SYSTEM.format(login="로그인 안 함 (개인화·주문 조회 불가)")
msgs = [{"role": "system", "content": system}, {"role": "user", "content": q},
        {"role": "assistant", "content": "", "tool_calls": [{"type": "function", "function": c} for c in calls]}]
msgs += [{"role": "tool", "content": r} for r in results]
render = lambda m, tools=None: len(tok.apply_chat_template(m, tools=tools, add_generation_prompt=True, tokenize=True))  # noqa: E731
with_tools = render(msgs, SCHEMAS)
no_tools = render(msgs)
parts = [
    ["시스템 프롬프트", count(system)],
    ["도구 스키마 4개", with_tools - no_tools],
    ["질문", count(q)],
    ["도구 호출", count(json.dumps(calls, ensure_ascii=False))],
    ["도구 결과 (상품 3 · 규정 3)", sum(count(r) for r in results)],
]
parts.append(["대화 형식 토큰", with_tools - sum(v for _, v in parts)])
measured = None
trace = HERE.parent / "shots" / "agent-multi.trace.json"
if trace.exists():
    llm = [e for e in json.loads(trace.read_text(encoding="utf-8")) if e.get("type") == "llm"]
    measured = llm[1]["prompt_tokens"] if len(llm) > 1 else None
agent = {"total": with_tools, "ollama": measured, "parts": parts}

out = {"old": old, "agent": agent, "windows": {"default": 4096, "num_ctx": 8192}}
(DATA / "context_budget.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(out, ensure_ascii=False, indent=1))
