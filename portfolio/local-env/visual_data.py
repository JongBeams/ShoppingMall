"""
슬라이드 시각화용 데이터 → portfolio/data/visual.json, 썸네일 → portfolio/shots/thumbs/

- vision   : 질의 사진 2장 + 상위 5개 결과(상품명 · 유사도 · 썸네일)  ← 실제 POST /products/search-by-image
- personal : 데모 구매자의 구매 이력 · 선호 태그 빈도 · 추천 결과   ← backend personalized_recommendation
실행 중인 로컬 재현 환경(start.py)이 필요합니다.
"""
import json
import os
import sys
from pathlib import Path

import requests
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = HERE.parent / "data"
THUMBS = HERE.parent / "shots" / "thumbs"
THUMBS.mkdir(parents=True, exist_ok=True)
CFG = json.loads((HERE / ".cache" / "local.json").read_text(encoding="utf-8"))
P = CFG["ports"]
API = f"http://127.0.0.1:{P['backend']}"

sys.path.insert(0, str(HERE))
import seed  # noqa: E402  (상품 목록 · 이미지 id 재사용)

NAME2PID = {p[1]: p[0] for p in seed.PRODUCTS}


def thumb(src: Path, name: str, size=320) -> str:
    out = THUMBS / f"{name}.jpg"
    im = Image.open(src).convert("RGB")
    w, h = im.size
    s = min(w, h)
    im = im.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2)).resize((size, size))
    im.save(out, quality=88)
    return f"thumbs/{out.name}"


def main():
    data = {"vision": [], "personal": {}}

    # ---------------------------------------------------------------- 비전 검색
    for q in ["query_sneaker.jpg", "query_backpack.jpg"]:
        src = HERE / "assets" / "query" / q
        r = requests.post(f"{API}/products/search-by-image", files={"file": (q, open(src, "rb"), "image/jpeg")}, timeout=120)
        items = []
        for p in r.json()["products"]:
            pid = NAME2PID[p["name"]]
            items.append({"name": p["name"], "sim": p["similarity"], "price": p["price"],
                          "img": thumb(seed.download(pid), pid)})
        data["vision"].append({"query": thumb(src, q.replace(".jpg", "")), "items": items})

    # ---------------------------------------------------------------- 개인화
    os.environ.update({"SUPABASE_URL": f"http://127.0.0.1:{P['gateway']}", "SUPABASE_ANON_KEY": CFG["anon_key"],
                       "SUPABASE_SERVICE_ROLE_KEY": CFG["service_key"]})
    from dotenv import load_dotenv
    load_dotenv(ROOT / "backend" / ".env")
    cwd = os.getcwd()
    os.chdir(HERE / ".cache")
    sys.path.insert(0, str(ROOT / "backend"))
    from app.services.supabase import supabase
    from app.services.personalized_recommendation import PurchasePattern, get_personalized_recommendations
    os.chdir(cwd)

    demo = supabase.table("profiles").select("id").eq("email", "demo@example.com").execute().data[0]["id"]
    analyzer = PurchasePattern(demo)
    history = analyzer._get_purchase_history(6)
    res = get_personalized_recommendations(demo, limit=50)
    pat = res["pattern"]
    data["personal"] = {
        "history": [{"date": h["order_date"][:10], "name": h["product_name"], "price": h["price"],
                     "img": thumb(seed.download(NAME2PID[h["product_name"]]), NAME2PID[h["product_name"]])}
                    for h in sorted(history, key=lambda x: x["order_date"])],
        "tags": pat.get("favorite_tags", [])[:6],
        "price_range": pat.get("price_range"),
        "avg_price": pat.get("avg_price"),
        "cycle": pat.get("purchase_frequency"),
        "repurchase": pat.get("repurchase_products", []),
        "recs": [{"name": p["name"], "price": p["price"], "score": p.get("match_score"),
                  "img": thumb(seed.download(NAME2PID[p["name"]]), NAME2PID[p["name"]])}
                 for p in res["recommendations"][:3]],
    }
    (OUT / "visual.json").write_text(json.dumps(data, ensure_ascii=False, indent=2, default=str), encoding="utf-8")
    print(json.dumps({k: (v if k != "vision" else [[i["name"] for i in x["items"]] for x in v]) for k, v in data.items()},
                     ensure_ascii=False, default=str)[:1500])


if __name__ == "__main__":
    main()
