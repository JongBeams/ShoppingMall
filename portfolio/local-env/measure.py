"""
검색 품질 · 응답 시간 측정 → portfolio/data/metrics.json (빌드가 읽어 감)

  python measure.py              # 전체 (LLM 답변 포함, 수 분)
  python measure.py --no-llm     # 검색·이미지·개인화만

실행 중인 로컬 재현 환경(start.py)이 필요합니다.
- 검색(Hit@k)·지연: backend 의 search_documents / embed_query 를 직접 호출
- 답변 정확도·거절·TTFT: 실제 API POST /documents/search (SSE) 호출
"""
import html
import json
import os
import statistics
import sys
import time
from pathlib import Path

import requests

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
CFG = json.loads((HERE / ".cache" / "local.json").read_text(encoding="utf-8"))
P = CFG["ports"]
API = f"http://127.0.0.1:{P['backend']}"
OUT = HERE.parent / "data"
OUT.mkdir(exist_ok=True)

os.environ.update({
    "SUPABASE_URL": f"http://127.0.0.1:{P['gateway']}",
    "SUPABASE_ANON_KEY": CFG["anon_key"],
    "SUPABASE_SERVICE_ROLE_KEY": CFG["service_key"],
})
from dotenv import load_dotenv  # noqa: E402

load_dotenv(ROOT / "backend" / ".env")  # 나머지 필수 설정(SECRET_KEY 등)
os.chdir(HERE / ".cache")  # backend/.env 의 Settings 비호환 키를 피하려고 다른 폴더에서 실행
sys.path.insert(0, str(ROOT / "backend"))

# (질문, 정답 문서, 답변에 있어야 할 핵심 사실 후보)
POSITIVE = [
    ("배송비는 얼마고 무료배송 기준이 뭐야?", "배송_정책.pdf", ["3,000원", "30,000원"]),
    ("오후 몇 시 전에 결제해야 당일 출고돼?", "배송_정책.pdf", ["2시"]),
    ("도서산간 지역은 추가 배송비가 얼마야?", "배송_정책.pdf", ["5,000원"]),
    ("이미 출고됐는데 배송지를 바꿀 수 있어?", "배송_정책.pdf", ["택배사"]),
    ("배송 완료 후 며칠 지나면 자동으로 구매확정돼?", "배송_정책.pdf", ["7일"]),
    ("단순 변심 반품은 며칠 안에 신청해야 해?", "교환_반품_환불_규정.pdf", ["7일"]),
    ("단순 변심으로 반품하면 배송비는 얼마야?", "교환_반품_환불_규정.pdf", ["6,000원"]),
    ("불량품을 받았으면 언제까지 반품 신청할 수 있어?", "교환_반품_환불_규정.pdf", ["30일"]),
    ("반품하면 환불은 검수 후 며칠 안에 처리돼?", "교환_반품_환불_규정.pdf", ["3영업일"]),
    ("향수를 개봉했는데 단순 변심으로 반품할 수 있어?", "교환_반품_환불_규정.pdf", ["불가", "없습니다", "제한"]),
    ("포인트는 결제 금액의 몇 퍼센트가 적립돼?", "포인트_쿠폰_이용약관.pdf", ["1%"]),
    ("적립한 포인트 유효기간이 어떻게 돼?", "포인트_쿠폰_이용약관.pdf", ["1년"]),
    ("한 번 주문할 때 포인트를 최대 얼마까지 쓸 수 있어?", "포인트_쿠폰_이용약관.pdf", ["50%"]),
    ("쿠폰 여러 장을 한 주문에 같이 쓸 수 있어?", "포인트_쿠폰_이용약관.pdf", ["1장"]),
    ("멤버십 플러스 회원은 몇 퍼센트 적립돼?", "포인트_쿠폰_이용약관.pdf", ["3%"]),
    ("몇 살부터 회원가입할 수 있어?", "회원가입_및_계정관리_규정.pdf", ["14세"]),
    ("로그인을 안 하면 언제 휴면 계정으로 바뀌어?", "회원가입_및_계정관리_규정.pdf", ["6개월"]),
    ("탈퇴하고 다시 가입하려면 며칠 기다려야 해?", "회원가입_및_계정관리_규정.pdf", ["7일"]),
    ("탈퇴하면 거래 기록은 얼마나 보관돼?", "회원가입_및_계정관리_규정.pdf", ["5년"]),
    ("이메일 하나로 계정을 여러 개 만들 수 있어?", "회원가입_및_계정관리_규정.pdf", ["하나의 계정", "하나", "1개"]),
]
NEGATIVE = [
    "오프라인 매장 영업시간이 어떻게 돼?",
    "고객센터 전화번호 알려줘",
    "중고 물건도 여기서 팔 수 있어?",
    "다른 쇼핑몰보다 비싸면 최저가로 맞춰 줘?",
]


def pct(x):
    return f"{round(x * 100)}%"


def pctl(xs, q):
    xs = sorted(xs)
    return xs[min(len(xs) - 1, int(round(q * (len(xs) - 1))))]


def norm(s):
    return s.replace(" ", "").replace("\n", "")


def sse(query):
    t0 = time.perf_counter()
    first, answer, sources, error = None, "", [], None
    with requests.post(f"{API}/documents/search", json={"query": query, "limit": 3, "use_ollama": True},
                       stream=True, timeout=600) as r:
        for line in r.iter_lines(decode_unicode=True):
            if not line or not line.startswith("data:"):
                continue
            d = json.loads(line[5:])
            if d.get("type") == "token":
                first = first or time.perf_counter() - t0
                answer += d["token"]
            elif d.get("type") == "sources":
                sources = [s["filename"] for s in d["sources"]]
            elif d.get("type") == "error":
                error = d.get("message")
    return {"ttft": first, "total": time.perf_counter() - t0, "answer": answer, "sources": sources, "error": error}


def product_mentions(answer, catalog):
    """답변에서 '상품으로 제시된 이름'을 뽑아 카탈로그와 대조합니다.
    - 번호 목록의 제목 줄: "1. **이름**" / "1. 이름"
    - 따옴표로 감싼 이름: '이름'
    가격·평점 같은 라벨("- **가격**: …")은 제외합니다."""
    import re as _re
    names = []
    for line in answer.splitlines():
        m = _re.match(r"^\s*\d+\.\s*\**\s*([^*:\n]{2,40}?)\s*\**\s*$", line)
        if m:
            names.append(m.group(1).strip())
    names += [q.strip() for q in _re.findall(r"'([^'\n]{3,40})'", answer)]
    names = list(dict.fromkeys(names))
    return names, [n for n in names if n not in catalog]


def token_budget(supabase, docs_for):
    """기능별로 앱이 실제로 만드는 프롬프트를 가로채 Qwen2.5 토크나이저로 셉니다."""
    from transformers import AutoTokenizer
    import app.services.rag_search as rag
    from app.services.product_statistics import search_by_tags, get_new_arrivals, format_products_for_llm
    from app.services.personalized_recommendation import (get_personalized_recommendations,
                                                          format_personalized_recommendations_for_llm)
    from app.services.gift_filtering import GiftFilteringService
    from app.services.gift_llm import GiftLLMService
    import asyncio

    tok = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-14B-Instruct")
    count = lambda s: len(tok(s)["input_ids"])

    captured = {}

    class _Stop(Exception):
        pass

    def fake_post(url, json=None, **kw):
        captured["prompt"] = json["prompt"]
        raise _Stop()

    def smart_prompt(message, product_context):
        orig = rag.requests.post
        rag.requests.post = fake_post
        try:
            list(rag.generate_answer_with_ollama_streaming(message, docs_for(message), product_context))
        finally:
            rag.requests.post = orig
        return captured.pop("prompt")

    rows = []
    # 규정 RAG — documents.py 와 같은 템플릿
    q = "단순 변심으로 반품하면 배송비는 얼마야?"
    ctx = "\n\n".join(f"문서 {i + 1}:\n{d.get('content', '')}" for i, d in enumerate(docs_for(q)))
    rows.append(("규정 RAG (청크 3)", count(f"당신은 쇼핑몰 AI 어시스턴트입니다. 아래 문서를 참고하여 질문에 답변하세요.\n\n참고 문서:\n{ctx}\n\n사용자 질문: {q}\n\n답변: (문서 내용을 바탕으로 간결하고 정확하게 답변하세요. 문서에 없는 내용은 \"문서에서 찾을 수 없습니다\"라고 답변하세요.)")))
    # 쇼핑 추천 — 키워드 / 개인화 / 기본(신상품 50 + 리뷰)
    p = search_by_tags(["러닝화"], limit=50)
    rows.append(("쇼핑 챗 · 키워드 (후보 3)", count(smart_prompt("러닝화 추천해줘",
        f"'러닝화' 관련 상품 목록 (총 {len(p)}개):\n{format_products_for_llm(p, include_reviews=True)}"))))
    demo = supabase.table("profiles").select("id").eq("email", "demo@example.com").execute().data[0]["id"]
    rows.append(("쇼핑 챗 · 개인화", count(smart_prompt("나에게 어울리는 상품 추천해줘",
        format_personalized_recommendations_for_llm(get_personalized_recommendations(demo, limit=50))))))
    p = get_new_arrivals(limit=50)
    rows.append(("쇼핑 챗 · 기본 (신상품 50 + 리뷰)", count(smart_prompt("추천해줘",
        f"전체 상품 목록 (총 {len(p)}개):\n{format_products_for_llm(p, include_reviews=True)}"))))
    # 선물 추천 — 후보 50
    answers = {"relationship": "부모", "age_range": "50대+", "style": "모던", "interests": ["운동"], "occasion": "생일",
               "budget_min": 100000, "budget_max": 300000, "special_request": "실용적인 것"}
    cands = asyncio.run(GiftFilteringService.filter_products(relationship="부모", age_range="50대+", style="모던",
                                                             interests=["운동"], budget_min=100000, budget_max=300000, limit=50))
    rows.append((f"선물 추천 (후보 {len(cands)})", count(GiftLLMService.generate_recommendation_prompt(answers, cands, []))))
    # 리뷰 요약 — 리뷰 10개 상품
    pid = supabase.table("products").select("id").eq("name", "노이즈캔슬링 무선 헤드폰").execute().data[0]["id"]
    rv = supabase.table("reviews").select("rating, content").eq("product_id", pid).execute().data
    text = f"총 {len(rv)}개의 리뷰\n\n" + "\n".join(f"{i}. [{r['rating']}점] {r['content']}" for i, r in enumerate(rv[:30], 1))
    rows.append(("리뷰 요약 (리뷰 10)", count(text) + 120))  # 고정 지시문 약 120토큰
    return rows


def main():
    no_llm = "--no-llm" in sys.argv
    from app.services.rag_search import embed_query, search_documents
    from app.services.supabase import supabase

    docs = {d["id"]: d["filename"] for d in supabase.table("documents").select("id, filename").execute().data}
    n_chunks = len(supabase.table("document_chunks").select("id").execute().data)
    embed_query("워밍업")

    # ---------------------------------------------------------- 검색 품질 · 지연
    rows, t_embed, t_rpc = [], [], []
    for q, gold, _ in POSITIVE:
        t = time.perf_counter(); emb = embed_query(q); t_embed.append((time.perf_counter() - t) * 1000)
        t = time.perf_counter()
        res = supabase.rpc("search_documents_by_embedding",
                           {"query_embedding": emb, "match_threshold": 0.5, "match_count": 3}).execute().data
        t_rpc.append((time.perf_counter() - t) * 1000)
        ranked = [docs.get(r["document_id"]) for r in res]
        rows.append({"q": q, "gold": gold, "ranked": ranked, "sims": [round(r["similarity"], 3) for r in res],
                     "hit1": bool(ranked) and ranked[0] == gold, "hit3": gold in ranked})
    neg_rows = []
    for q in NEGATIVE:
        rpc = supabase.rpc("search_documents_by_embedding",
                           {"query_embedding": embed_query(q), "match_threshold": 0.5, "match_count": 3}).execute().data
        res = search_documents(q, limit=3)  # 앱과 같은 경로 (RPC 0건이면 fallback)
        neg_rows.append({"q": q, "rpc_count": len(rpc), "retrieved": len(res),
                         "top_sim": round(res[0]["similarity"], 3) if res else None})
    hit1 = sum(r["hit1"] for r in rows) / len(rows)
    hit3 = sum(r["hit3"] for r in rows) / len(rows)

    # ---------------------------------------------------------- 답변 (LLM)
    gen, ttft, total = [], [], []
    if not no_llm:
        requests.post("http://localhost:11434/api/generate",
                      json={"model": "qwen2.5:14b", "prompt": "hi", "stream": False, "keep_alive": "2h",
                            "options": {"num_predict": 1}}, timeout=300)
        for (q, gold, keys), r in zip(POSITIVE, rows):
            out = sse(q)
            ok = any(norm(k) in norm(out["answer"]) for k in keys)
            gen.append({**r, "answer": out["answer"], "correct": ok, "ttft": out["ttft"], "total": out["total"]})
            if out["ttft"]:
                ttft.append(out["ttft"]); total.append(out["total"])
            print(f"  {'O' if ok else 'X'} {q} → {out['answer'][:60]!r}")
        for nr in neg_rows:
            out = sse(nr["q"])
            nr["answer"] = out["answer"] or out["error"]
            nr["refused"] = bool(out["error"]) or "찾을 수 없" in out["answer"]
            print(f"  {'거절' if nr['refused'] else '응답'} {nr['q']} → {(nr['answer'] or '')[:60]!r}")

    # ---------------------------------------------------------- 쇼핑 챗 환각 검사 (카탈로그에 없는 상품명)
    halluc = []
    if not no_llm:
        import re as _re
        catalog = {p["name"] for p in supabase.table("products").select("name").execute().data}
        demo_id = supabase.table("profiles").select("id").eq("email", "demo@example.com").execute().data[0]["id"]
        cases = [("나에게 어울리는 상품 추천해줘", demo_id, "개인화"), ("러닝화 추천해줘", None, "키워드")]
        runs = int(os.getenv("HALLUC_RUNS", "3"))
        for msg, uid, kind in cases:
            for i in range(runs):
                ans, cards = "", []
                with requests.post(f"{API}/chat/smart", json={"message": msg, "user_id": uid}, stream=True, timeout=900) as r:
                    for line in r.iter_lines(decode_unicode=True):
                        if line and line.startswith("data:"):
                            d = json.loads(line[5:])
                            if d.get("type") == "token":
                                ans += d["token"]
                            elif d.get("type") == "products_final":
                                cards = [p["name"] for p in d["products"]]
                named, fake = product_mentions(ans, catalog)
                halluc.append({"kind": kind, "msg": msg, "run": i + 1, "named": named, "fake": fake, "cards": cards,
                               "answer": ans})
                print(f"  [{kind} {i + 1}] 언급 {len(named)} · 카탈로그 밖 {len(fake)} {fake[:3]}")

    # ---------------------------------------------------------- 이미지 검색
    vis = []
    qdir = HERE / "assets" / "query"
    expect = {"query_sneaker.jpg": ["스니커즈", "러닝화", "운동화", "트레이닝화", "구두", "슈즈"], "query_backpack.jpg": ["백팩"]}
    for f, keys in expect.items():
        times = []
        for _ in range(4):
            t = time.perf_counter()
            r = requests.post(f"{API}/products/search-by-image", files={"file": (f, open(qdir / f, "rb"), "image/jpeg")}, timeout=120)
            times.append((time.perf_counter() - t) * 1000)
        prods = r.json()["products"]
        vis.append({"query": f, "results": [(p["name"], p["similarity"]) for p in prods], "ms": times[1:],
                    "top1_ok": any(k in prods[0]["name"] for k in keys),
                    "same_kind_top5": sum(any(k in p["name"] for k in keys) for p in prods)})

    # ---------------------------------------------------------- 개인화 컨텍스트
    from app.services.personalized_recommendation import (format_personalized_recommendations_for_llm,
                                                          get_personalized_recommendations)
    demo = supabase.table("profiles").select("id").eq("email", "demo@example.com").execute().data[0]["id"]
    personal = get_personalized_recommendations(demo, limit=50)
    ctx = format_personalized_recommendations_for_llm(personal)
    # 슬라이드용: 패턴 분석 + 추천 상위 2개까지만
    cut = ctx.find("\n3. ")
    ctx = (ctx[:cut] if cut > 0 else ctx).rstrip() + f"\n\n… (매칭 상품 {len(personal['recommendations'])}개까지 이어짐)"

    # ---------------------------------------------------------- 토큰 예산
    docs_cache = {}

    def docs_for(q):
        if q not in docs_cache:
            docs_cache[q] = search_documents(q, limit=3)
        return docs_cache[q]

    budget = token_budget(supabase, docs_for)
    num_ctx = 4096
    for name, n in budget:
        print(f"  토큰 {name}: {n}")
    def verdict(n):
        if n > num_ctx:
            return "var(--risk)", "⚠ 초과 — 앞부분 잘림"
        if n > num_ctx - 1000:
            return "var(--gen-2)", "△ 출력까지 더하면 초과 위험"
        return "var(--rag-2)", "여유"

    tok_html = "".join(
        f"<tr><td>{html.escape(name)}</td><td class='num'><b>{n:,}</b></td>"
        f"<td><div style='position:relative;height:8px;border-radius:4px;background:#eef2f7'>"
        f"<div style='height:8px;border-radius:4px;background:{verdict(n)[0]};width:{min(100, n / 9000 * 100):.0f}%'></div>"
        f"<div style='position:absolute;left:{num_ctx / 9000 * 100:.0f}%;top:-4px;bottom:-4px;border-left:2px dashed #64748b'></div></div></td>"
        f"<td class='small'>{verdict(n)[1]}</td></tr>"
        for name, n in budget)

    # ---------------------------------------------------------- 저장
    lat_rows = [
        ("질문 임베딩 (bge-m3, CPU)", t_embed, "ms", "모델 상주 · 1문장"),
        ("벡터 검색 RPC (PostgREST → PostgreSQL)", t_rpc, "ms", f"청크 {n_chunks}개 · 코사인"),
    ]
    if ttft:
        lat_rows += [("RAG 첫 토큰 (TTFT)", ttft, "s", "qwen2.5:14b · 프롬프트 처리 포함"),
                     ("RAG 전체 응답", total, "s", "검색 + 생성 + SSE")]
    all_img = [m for v in vis for m in v["ms"]]
    lat_rows.append(("이미지 검색 API (CLIP CPU + RPC)", all_img, "ms", "업로드 → 결과 JSON"))

    def fmt(v, unit):
        return f"{v:.0f} ms" if unit == "ms" else f"{v:.1f} s"

    lat_html = "".join(
        f"<tr><td><b>{html.escape(n)}</b></td><td class='num'>{fmt(statistics.median(xs), u)}</td>"
        f"<td class='num'>{fmt(pctl(xs, .9), u)}</td><td class='small'>{html.escape(note)}</td></tr>"
        for n, xs, u, note in lat_rows if xs)

    misses = [r for r in rows if not r["hit1"]]
    wrong = [g for g in gen if not g["correct"]]
    leaked = [n for n in neg_rows if n["rpc_count"] == 0 and n["retrieved"] > 0]
    lesson = []
    if leaked:
        lesson.append(f"문서에 없는 질문 {len(NEGATIVE)}개 중 {len(leaked)}개는 RPC(≥0.5)에서 0건이었지만, "
                      "임계값이 없는 fallback이 관련 없는 청크 3개를 그대로 LLM에 넘겼습니다. 거절은 프롬프트 덕분 → "
                      "fallback에도 임계값을 적용하고 0건이면 LLM 호출 없이 안내.")
    if misses:
        m = misses[0]
        lesson.append(f"1순위 오검색 {len(misses)}건 — 예: \"{m['q']}\" → {m['ranked'][0] if m['ranked'] else '없음'} (정답 {m['gold']}). "
                      "비슷한 숫자·기간 표현이 여러 규정에 흩어져 있을 때 벡터 검색만으로는 구분이 약함 → 하이브리드 검색·재순위 후보.")
    if wrong:
        w = wrong[0]
        lesson.append(f"답변 오류 {len(wrong)}건 — 예: \"{w['q']}\" → \"{w['answer'][:70]}…\"")
    if not misses and not wrong:
        lesson.append("오검색·오답은 없었지만 문서 4개짜리 쉬운 셋이라, 문서를 늘린 평가가 다음 과제.")

    v0, v1 = vis[0], vis[1]
    metrics = {
        "rag": {"docs": len(docs), "chunks": n_chunks},
        "eval": {
            "n": len(POSITIVE), "neg_n": len(NEGATIVE),
            "hit1": pct(hit1), "hit3": pct(hit3),
            "answer_acc": pct(sum(g["correct"] for g in gen) / len(gen)) if gen else "—",
            "refusal": pct(sum(n.get("refused", False) for n in neg_rows) / len(neg_rows)) if gen else "—",
            "env": "측정: 로컬 재현 환경 (PostgreSQL 17 · bge-m3/CLIP CPU · qwen2.5:14b on RTX 5070, 다른 작업과 GPU 공유).",
            "lesson": html.escape(" ".join(lesson)),
        },
        "latency": {
            "rows": lat_html,
            "embed_ms": f"{statistics.median(t_embed):.0f}ms",
            "rpc_ms": f"{statistics.median(t_rpc):.0f}ms",
            "ttft_s": f"{statistics.median(ttft):.1f}s" if ttft else None,
            "total_s": f"{statistics.median(total):.1f}s" if total else None,
            "img_ms": f"{statistics.median(all_img):.0f}ms",
        },
        "neg": {"leaked": len(leaked), "n": len(NEGATIVE)},
        "tokens": {"raw": [[n, v] for n, v in budget], "rows": tok_html, "over": sum(1 for _, n in budget if n > num_ctx), "n": len(budget),
                   "max": f"{max(n for _, n in budget):,}"},
        "halluc": {
            kind: f"{sum(1 for h in halluc if h['kind'] == kind and h['fake'])} / {sum(1 for h in halluc if h['kind'] == kind)}"
            for kind in ("개인화", "키워드")
        } if halluc else {},
        "vision": {
            "summary": html.escape(
                f"운동화 사진 → 상위 5개 중 신발 {v0['same_kind_top5']}개 (1위 {v0['results'][0][0]} {v0['results'][0][1]:.2f}) · "
                f"백팩 사진 → 1위 {v1['results'][0][0]} ({v1['results'][0][1]:.2f}) · "
                f"API 응답 중앙값 {statistics.median(all_img):.0f}ms (CPU)"),
        },
        "personal": {"context": html.escape(ctx.strip())},
    }
    (OUT / "metrics.json").write_text(json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT / "eval_results.json").write_text(json.dumps(
        {"retrieval": rows, "generation": gen, "negative": neg_rows, "vision": vis, "hallucination": halluc},
        ensure_ascii=False, indent=2,
        default=str), encoding="utf-8")
    print(f"Hit@1 {pct(hit1)} · Hit@3 {pct(hit3)} · 답변 {metrics['eval']['answer_acc']} · 거절 {metrics['eval']['refusal']}")
    print(f"→ {OUT / 'metrics.json'}")


if __name__ == "__main__":
    main()
