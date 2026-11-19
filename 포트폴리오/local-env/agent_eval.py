"""
RAG 에이전트 평가 → 포트폴리오/data/agent_metrics.json

  HALLUC_RUNS=10 python agent_eval.py

- 시나리오 12개: 기대 도구 집합과 실제 호출 비교(도구 선택 정확도), 핵심 사실 포함 여부
- 개인화 질문 반복: 답변 속 '카탈로그에 없는 상품명' (기존 /chat/smart 와 같은 검사기)
- 기존 라우터(/chat/smart)와 같은 질문 비교: 복합 질문 · 주문 조회
"""
import json
import os
import re
import statistics
import sys
import time
from pathlib import Path

import psycopg2
import requests

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / "data"
API = "http://127.0.0.1:18000"
sys.path.insert(0, str(HERE))
from measure import product_mentions  # noqa: E402  (같은 환각 검사기)
from agent_client import chat, login  # noqa: E402

TOKEN = login()

conn = psycopg2.connect(host="127.0.0.1", user="postgres", password="admin", dbname="shoppingmall_local")
cur = conn.cursor()
cur.execute("select id from profiles where email='demo@example.com'")
DEMO = str(cur.fetchone()[0])
cur.execute("select name from products")
CATALOG = {r[0] for r in cur.fetchall()}
CJK = re.compile(r"[一-鿿]")

# (질문, 로그인, 기대 도구 집합, 답변에 있어야 할 사실 후보)
SCENARIOS = [
    ("단순 변심으로 반품하면 배송비는 얼마야?", False, {"search_policy"}, ["6,000"]),
    ("포인트 유효기간이 어떻게 돼?", False, {"search_policy"}, ["1년"]),
    ("15만원 이하 러닝화 추천해줘", False, {"search_products"}, ["러닝화"]),
    ("평점 높은 헤드폰 있어?", False, {"search_products"}, ["헤드폰"]),
    ("10만원 이하로 선물용 향수 추천해줘", False, {"search_products"}, ["향수|퍼퓸|뚜왈렛"]),  # 대안 표현 허용
    ("나한테 어울리는 상품 추천해줘", True, {"get_user_pattern"}, []),
    ("내가 주문한 거 지금 어디쯤 왔어?", True, {"get_order_status"}, ["배송"]),
    ("러닝화 추천해주고, 단순 변심 반품하면 배송비도 알려줘", False, {"search_products", "search_policy"}, ["6,000"]),
    ("주문한 이어버드 배송 상태랑 반품 신청 기한 알려줘", True, {"get_order_status", "search_policy"}, ["배송", "7일"]),
    ("멤버십 플러스 적립률이랑 쿠폰 중복 사용 되는지 알려줘", False, {"search_policy"}, ["3%"]),
    ("오늘 서울 날씨 어때?", False, set(), []),
    ("내 주문 조회해줘", False, None, ["로그인"]),  # None: 도구 호출 여부 무관, 로그인 안내만 확인
]


def agent(q, login):
    """에이전트 API — 고객은 JWT 로만 확인 (본문 user_id 는 받지 않음)"""
    r = chat(q, TOKEN if login else None)
    return {"calls": r["calls"], "answer": r["answer"], "verify": r["verify"], "cards": r["cards"], "sec": r["sec"],
            "prompt_max": r.get("prompt_max"), "rounds": r["rounds"]}


def smart(q, login):
    ans, cards = "", []
    with requests.post(f"{API}/chat/smart", json={"message": q, "user_id": DEMO if login else None},
                       stream=True, timeout=900) as r:
        for line in r.iter_lines(decode_unicode=True):
            if line and line.startswith("data:"):
                d = json.loads(line[5:])
                if d.get("type") == "token":
                    ans += d["token"]
                elif d.get("type") == "products_final":
                    cards = [p["name"] for p in d["products"]]
    return {"answer": ans, "cards": cards}


def has_fact(text, facts):
    """facts 의 각 항목이 답변에 있는지 — 'a|b' 는 둘 중 하나"""
    t = text.replace(" ", "")
    return all(any(f.replace(" ", "") in t for f in x.split("|")) for x in facts) if facts else True


def main():
    runs = int(os.getenv("HALLUC_RUNS", "10"))
    rows = []
    for q, login, expect, facts in SCENARIOS:
        r = agent(q, login)
        tool_ok = True if expect is None else set(r["calls"]) == expect
        fact_ok = has_fact(r["answer"], facts)
        rows.append({"q": q, "login": login, "expect": sorted(expect) if expect is not None else None, **r,
                     "tool_ok": tool_ok, "fact_ok": fact_ok, "cjk": bool(CJK.search(r["answer"]))})
        print(f"  {'O' if tool_ok else 'X'}{'O' if fact_ok else 'X'} {q} → {r['calls']} | {r['answer'][:70]!r}")

    halluc = []
    for i in range(runs):
        r = agent("나한테 어울리는 상품 추천해줘", True)
        named, fake = product_mentions(r["answer"], CATALOG)
        halluc.append({"run": i + 1, "fake": fake, "retried": any(v.get("retry") for v in r["verify"]),
                       "answer": r["answer"], "cards": r["cards"], "sec": r["sec"], "prompt_max": r.get("prompt_max")})
        print(f"  [개인화 {i + 1}] 카탈로그 밖 {fake} · 재생성 {halluc[-1]['retried']}")

    # 복합 질문 반복 — 도구 선택이 매번 맞는지 (캡처 중 실패를 관찰한 질문)
    multi = []
    mq = "러닝화 15만원 이하로 추천해주고, 단순 변심으로 반품하면 배송비는 얼마야?"
    for i in range(runs):
        r = agent(mq, False)
        ok = {"search_products", "search_policy"} <= set(r["calls"]) and bool(r["cards"]) and has_fact(r["answer"], ["6,000"])
        multi.append({"run": i + 1, "calls": r["calls"], "ok": ok, "retried": any(v.get("retry") for v in r["verify"]),
                      "answer": r["answer"], "cards": r["cards"], "sec": r["sec"], "prompt_max": r.get("prompt_max")})
        print(f"  [복합 {i + 1}] {'O' if ok else 'X'} {r['calls']} · 재작성 {multi[-1]['retried']}")

    # 기존 라우터와 비교 (복합 질문 · 주문 조회)
    compare = []
    for q, login, facts in [("러닝화 추천해주고, 단순 변심 반품하면 배송비도 알려줘", False, ["6,000"]),
                            ("내가 주문한 거 지금 어디쯤 왔어?", True, ["6084-2215-9930"])]:
        old = smart(q, login)
        new = next(x for x in rows if x["q"] == q)
        compare.append({"q": q, "old_ok": has_fact(old["answer"], facts), "new_ok": has_fact(new["answer"], facts),
                        "old_answer": old["answer"][:400], "new_answer": new["answer"][:400]})
        print(f"  비교: {q} → 기존 {compare[-1]['old_ok']} / 에이전트 {compare[-1]['new_ok']}")

    secs = [r["sec"] for r in rows if r["calls"]]
    metrics = {
        "scenarios": len(rows),
        "tool_acc": f"{sum(r['tool_ok'] for r in rows)}/{len(rows)}",
        "fact_acc": f"{sum(r['fact_ok'] for r in rows)}/{len(rows)}",
        "cjk": sum(1 for r in rows + halluc + multi if CJK.search(r["answer"])),
        "answers": len(rows) + len(halluc) + len(multi),
        "degraded": sum(1 for r in rows + halluc + multi
                        if "제외했습니다" in r["answer"] or "답하기 어렵습니다" in r["answer"]),
        "multi_ok": f"{sum(m['ok'] for m in multi)} / {len(multi)}",
        "multi_retried": sum(m["retried"] for m in multi),
        "halluc": f"{sum(1 for h in halluc if h['fake'])} / {len(halluc)}",
        "retried": sum(h["retried"] for h in halluc),
        "median_sec": round(statistics.median(secs), 1) if secs else None,
        "multi_tool": sum(1 for r in rows if len(set(r["calls"])) >= 2),
        "max_prompt_tokens": max((r.get("prompt_max") or 0 for r in rows + halluc + multi), default=0),
        "compare": compare,
    }
    OUT.mkdir(exist_ok=True)
    (OUT / "agent_metrics.json").write_text(json.dumps({"metrics": metrics, "rows": rows, "halluc": halluc, "multi": multi},
                                                       ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k: v for k, v in metrics.items() if k != "compare"}, ensure_ascii=False))


if __name__ == "__main__":
    main()
