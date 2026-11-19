"""
확정 호출 평가 (장애 주입) → 포트폴리오/data/forced_eval.json

  python forced_eval.py

재작성 경로는 드물게만 생겨 실제 대화를 반복해서는 재기 어렵습니다.
그래서 '모델이 첫 답변에서 상품 도구를 빼먹은 상태'를 그대로 만든 뒤
그래프의 확정 호출(_forced_call)이 맞는 도구 · 인자를 내는지, 그 인자로 상품이 실제로 검색되는지 채점합니다.
"""
import json
import os
import statistics
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = HERE.parent / "data" / "forced_eval.json"
CFG = json.loads((HERE / ".cache" / "local.json").read_text(encoding="utf-8"))
P = CFG["ports"]
os.environ.update({"SUPABASE_URL": f"http://127.0.0.1:{P['gateway']}", "SUPABASE_ANON_KEY": CFG["anon_key"],
                   "SUPABASE_SERVICE_ROLE_KEY": CFG["service_key"], "OLLAMA_HOST": "http://localhost:11434"})
from dotenv import load_dotenv  # noqa: E402

load_dotenv(ROOT / "backend" / ".env")
os.chdir(HERE / ".cache")
sys.path.insert(0, str(ROOT / "backend"))

import psycopg2  # noqa: E402

from app.services.agent import graph, verify  # noqa: E402
from app.services.agent.tools import run_tool  # noqa: E402

cur = psycopg2.connect(host="127.0.0.1", user="postgres", password="admin", dbname="shoppingmall_local").cursor()
cur.execute("select id from profiles where email='demo@example.com'")
DEMO = str(cur.fetchone()[0])

# (질문, 로그인, 기대 도구, 기대 인자) — 인자는 keyword 포함 여부 + 가격 · 평점 값 일치
CASES = [
    ("러닝화 15만원 이하로 추천해주고, 단순 변심으로 반품하면 배송비는 얼마야?", False, "search_products", {"keyword": "러닝화", "max_price": 150000}),
    ("헤드폰 추천해주고 교환 기한도 알려줘", False, "search_products", {"keyword": "헤드폰"}),
    ("10만원 이하 향수 하나 골라주고 포인트 유효기간도 알려줘", False, "search_products", {"keyword": "향수", "max_price": 100000}),
    ("5만원 이상 스니커즈 추천해주고 배송비 얼마야?", False, "search_products", {"keyword": "스니커즈", "min_price": 50000}),
    ("요가매트 추천해주고 반품 기한 알려줘", False, "search_products", {"keyword": "요가매트"}),
    ("선글라스 9만원 이하로 추천해주고 쿠폰 중복 사용 되는지 알려줘", False, "search_products", {"keyword": "선글라스", "max_price": 90000}),
    ("자켓 20만원 이하로 골라주고 교환 배송비도 알려줘", False, "search_products", {"keyword": "자켓", "max_price": 200000}),
    ("블루투스 스피커 추천해주고 포인트 적립률 알려줘", False, "search_products", {"keyword": "스피커"}),
    ("나한테 어울리는 상품 추천하고 멤버십 적립률도 알려줘", True, "get_user_pattern", {}),
    ("내 취향에 맞는 거 골라주고 반품 기한도 알려줘", True, "get_user_pattern", {}),
]

norm = lambda s: str(s).replace(" ", "")


def args_ok(got: dict, want: dict) -> bool:
    if "keyword" in want and norm(want["keyword"]) not in norm(got.get("keyword", "")):
        return False
    # 가격 · 평점 조건은 기대한 것만 정확히 (없는 조건을 만들어 넣으면 오답)
    for k in ("max_price", "min_price", "min_rating"):
        if got.get(k) != want.get(k):
            return False
    return True


rows = []
for q, login, tool, want in CASES:
    uid = DEMO if login else None
    state = graph.initial_state(q, uid, [])
    problems = ["추천 요청인데 상품 도구(search_products 또는 get_user_pattern)를 호출하지 않음"]
    # 장애 주입: 모델이 규정만 답하고 추천을 빠뜨린 상태 → 검증이 재작성을 요청한 직후
    state["messages"] += [{"role": "assistant", "content": "문의하신 규정은 다음과 같습니다."},
                          {"role": "user", "content": verify.feedback_message(problems)}]
    out = graph._forced_call(state, sorted(verify.PRODUCT_TOOLS))
    call = out["messages"][-1]["tool_calls"][0]["function"]
    ms = out["events"][0]["ms"]
    res = run_tool(call["name"], call["arguments"], {"user_id": uid, "catalog": {}, "sources": []})
    found = len(res.get("products") or res.get("candidates") or [])
    row = {"q": q, "tool": call["name"], "args": call["arguments"], "ms": ms, "found": found,
           "tool_ok": call["name"] == tool, "args_ok": call["name"] == tool and args_ok(call["arguments"], want)}
    rows.append(row)
    print(f"  {'O' if row['tool_ok'] and row['args_ok'] else 'X'} {q} → {call['name']} {call['arguments']} · {found}개 · {ms}ms")

llm_ms = [r["ms"] for r in rows if r["tool"] == "search_products"]
summary = {
    "cases": len(rows),
    "tool_ok": sum(r["tool_ok"] for r in rows),
    "args_ok": sum(r["args_ok"] for r in rows),
    "found": sum(r["found"] > 0 for r in rows),
    "median_ms": round(statistics.median(llm_ms)) if llm_ms else 0,
}
OUT.write_text(json.dumps({"summary": summary, "rows": rows}, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(summary, ensure_ascii=False))
