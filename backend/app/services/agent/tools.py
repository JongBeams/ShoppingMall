"""
에이전트 도구 — 기존 서비스 함수를 감싸 LLM이 고를 수 있게 합니다.

원칙
- 도구 결과는 짧게 (컨텍스트 예산): 상품은 최대 5개, 규정 청크는 400자.
- 상품은 P1, P2 … 같은 짧은 번호로 돌려주고, 실제 상품 정보는 서버(state)에 보관합니다.
  LLM 은 답변에서 [P1] 처럼 번호만 쓰고, 이름·가격은 서버가 채웁니다 (선물 마법사와 같은 방식).
- 로그인이 필요한 도구는 user_id 를 LLM 인자가 아니라 서버 상태에서 받습니다.
"""
import logging
import re
from typing import Callable, Dict, List, Optional

from app.services.supabase import supabase

logger = logging.getLogger(__name__)

# 검색된 문서 안의 지시문 (간접 프롬프트 인젝션) — 모델에게 보여 주지 않고 제외
INJECTION = re.compile(r"(이전|위의|앞의|모든)\s*(지시|명령|규칙|안내)\S{0,3}\s*(모두\s*)?무시|ignore\s+(all\s+|any\s+)?(previous|prior|above)\s+instructions"
                       r"|(AI|에이전트|어시스턴트|챗봇|상담\s*봇|AI\s*상담원)[은는이가]\s*.{0,40}(하세요|하라|해라|할 것)|시스템\s*프롬프트", re.I)
POLICY_THRESHOLD = 0.5  # 기존 fallback 경로에서 빠져 있던 임계값을 도구에서 일관되게 적용
MAX_PRODUCTS = 5

CANCELLABLE = {"pending", "paid"}  # 배송 준비 전까지만 취소 가능 (orders.cancel_order 와 같은 조건)
STATUS_KO = {
    "pending": "결제 대기", "paid": "결제 완료", "confirmed": "상품 준비중", "shipping": "배송중",
    "delivered": "배송 완료", "cancelled": "주문 취소", "refunded": "환불 완료",
}

# ---------------------------------------------------------------- 스키마 (Ollama tools 형식)
SCHEMAS: List[Dict] = [
    {"type": "function", "function": {
        "name": "search_policy",
        "description": "쇼핑몰 규정 문서(배송·교환·반품·환불·포인트·쿠폰·회원 정책)를 검색합니다. "
                       "규정·정책·비용·기간을 묻는 질문에 사용하세요.",
        "parameters": {"type": "object", "properties": {
            "query": {"type": "string", "description": "검색할 질문 (예: 단순 변심 반품 배송비)"}},
            "required": ["query"]}}},
    {"type": "function", "function": {
        "name": "search_products",
        "description": "상품 카탈로그에서 조건에 맞는 상품을 찾습니다. 상품 추천·검색에 사용하세요.",
        "parameters": {"type": "object", "properties": {
            "keyword": {"type": "string", "description": "상품 종류 키워드 하나 (예: 러닝화, 헤드폰, 향수)"},
            "max_price": {"type": "integer", "description": "최대 가격(원). '~이하', '~까지', '~안으로' (예: 15만원 이하 → 150000)"},
            "min_price": {"type": "integer", "description": "최소 가격(원). '~이상', '~부터', '~넘는' (예: 5만원 이상 → 50000)"},
            "min_rating": {"type": "number", "description": "최소 평점 (0~5)"},
            "sort": {"type": "string", "enum": ["sales", "rating", "price_low", "price_high"],
                     "description": "정렬 기준. 기본 sales(판매량)"},
            "limit": {"type": "integer", "description": "개수 (1~5)"}},
            "required": []}}},
    {"type": "function", "function": {
        "name": "get_user_pattern",
        "description": "로그인한 고객의 최근 6개월 구매 패턴(선호 태그·가격대·재구매)과 그에 맞는 추천 후보를 가져옵니다. "
                       "'나한테 어울리는', '내 취향' 같은 개인화 추천에 사용하세요.",
        "parameters": {"type": "object", "properties": {}, "required": []}}},
    {"type": "function", "function": {
        "name": "get_order_status",
        "description": "로그인한 고객의 최근 주문과 배송 상태를 조회합니다. 주문·배송 조회 질문에 사용하세요.",
        "parameters": {"type": "object", "properties": {
            "order_number": {"type": "string", "description": "특정 주문번호 (없으면 최근 주문들)"}},
            "required": []}}},
]


# ---------------------------------------------------------------- 상품 번호 등록
def _register(products: List[Dict], catalog: Dict[str, Dict]) -> List[Dict]:
    """상품을 catalog 에 P번호로 등록하고 LLM 에 보여 줄 짧은 형태를 돌려줍니다."""
    out = []
    by_id = {v["id"]: k for k, v in catalog.items()}
    for p in products[:MAX_PRODUCTS]:
        pid = by_id.get(p["id"])
        if not pid:
            pid = f"P{len(catalog) + 1}"
            catalog[pid] = {k: p.get(k) for k in ("id", "name", "price", "thumbnail_url", "rating",
                                                   "review_count", "sale_count", "tags")}
            by_id[p["id"]] = pid
        out.append({"pid": pid, "name": p["name"], "price": int(p.get("price") or 0),
                    "rating": float(p.get("rating") or 0), "reviews": p.get("review_count") or 0,
                    "sales": p.get("sale_count") or 0, "tags": (p.get("tags") or [])[:5]})
    return out


# ---------------------------------------------------------------- 도구 구현
def search_policy(query: str, ctx: Dict) -> Dict:
    from app.services.rag_search import search_documents
    docs = {d["id"]: d["filename"] for d in supabase.table("documents").select("id, filename").execute().data or []}
    chunks = [c for c in search_documents(query, limit=3) if (c.get("similarity") or 0) >= POLICY_THRESHOLD]
    blocked = [c for c in chunks if INJECTION.search(c.get("content") or "")]
    if blocked:
        logger.warning("[agent.tool] 지시문이 든 문서 청크 %d개 제외 (document_id=%s)", len(blocked),
                       [c.get("document_id") for c in blocked])
        chunks = [c for c in chunks if c not in blocked]
    for c in chunks:
        name = docs.get(c.get("document_id"))
        if name and name not in ctx["sources"]:
            ctx["sources"].append(name)
    if not chunks:
        return {"found": False, "message": "관련 규정을 찾지 못했습니다.", "blocked": len(blocked)}
    return {"found": True, "blocked": len(blocked), "chunks": [
        {"file": docs.get(c.get("document_id"), "규정"), "similarity": round(c["similarity"], 3),
         "text": " ".join((c.get("content") or "").split())[:400]} for c in chunks]}


def search_products(ctx: Dict, keyword: Optional[str] = None, max_price: Optional[int] = None,
                    min_price: Optional[int] = None, min_rating: Optional[float] = None,
                    sort: str = "sales", limit: int = 3) -> Dict:
    rows = supabase.table("products").select(
        "id, name, description, price, tags, rating, review_count, sale_count, thumbnail_url"
    ).eq("is_active", True).execute().data or []
    kw = (keyword or "").strip().lower()

    def match(p):
        if kw:
            hay = " ".join([p.get("name") or "", p.get("description") or "", " ".join(p.get("tags") or [])]).lower()
            if kw not in hay:
                return False
        price = float(p.get("price") or 0)
        if max_price and price > max_price:
            return False
        if min_price and price < min_price:
            return False
        if min_rating and float(p.get("rating") or 0) < min_rating:
            return False
        return True

    found = [p for p in rows if match(p)]
    key = {"sales": lambda p: -(p.get("sale_count") or 0), "rating": lambda p: (-(p.get("rating") or 0), -(p.get("review_count") or 0)),
           "price_low": lambda p: float(p.get("price") or 0), "price_high": lambda p: -float(p.get("price") or 0)}.get(sort)
    found.sort(key=key or (lambda p: -(p.get("sale_count") or 0)))
    limit = max(1, min(int(limit or 3), MAX_PRODUCTS))
    return {"count": len(found), "products": _register(found[:limit], ctx["catalog"])}


def get_user_pattern(ctx: Dict) -> Dict:
    if not ctx.get("user_id"):
        return {"error": "로그인이 필요합니다. 로그인하면 구매 이력 기반 추천을 받을 수 있습니다."}
    from app.services.personalized_recommendation import get_personalized_recommendations
    res = get_personalized_recommendations(ctx["user_id"], limit=MAX_PRODUCTS)
    pat = res.get("pattern") or {}
    if not pat.get("total_orders"):
        return {"has_history": False, "message": "구매 이력이 없습니다.",
                "popular": _register(res.get("recommendations") or [], ctx["catalog"])}
    return {
        "has_history": True,
        "favorite_tags": [t for t, _ in (pat.get("favorite_tags") or [])[:5]],
        "price_range": list(pat.get("price_range") or []),
        "avg_price": round(pat.get("avg_price") or 0),
        "purchase_cycle": pat.get("purchase_frequency"),
        "repurchased": [r["product_name"] for r in (pat.get("repurchase_products") or [])],
        "candidates": _register(res.get("recommendations") or [], ctx["catalog"]),
    }


def get_order_status(ctx: Dict, order_number: Optional[str] = None) -> Dict:
    if not ctx.get("user_id"):
        return {"error": "로그인이 필요합니다. 로그인 후 주문 내역을 조회할 수 있습니다."}
    q = supabase.table("orders").select("id, order_number, status, total, created_at").eq("buyer_id", ctx["user_id"])
    if order_number:
        q = q.eq("order_number", order_number)
    orders = q.order("created_at", desc=True).limit(3).execute().data or []
    if not orders:
        return {"orders": [], "message": "주문 내역이 없습니다."}
    out = []
    for o in orders:
        items = supabase.table("order_items").select("product_name, quantity, tracking_number").eq(
            "order_id", o["id"]).execute().data or []
        out.append({"order_number": o["order_number"], "status": STATUS_KO.get(o["status"], o["status"]),
                    "cancellable": o["status"] in CANCELLABLE,  # orders.cancel_order 와 같은 조건
                    "ordered_at": (o.get("created_at") or "")[:10], "total": int(float(o.get("total") or 0)),
                    "items": [f"{i['product_name']} ×{i['quantity']}" for i in items],
                    "tracking_number": next((i["tracking_number"] for i in items if i.get("tracking_number")), None)})
    return {"orders": out}


REGISTRY: Dict[str, Callable] = {
    "search_policy": lambda ctx, **a: search_policy(a.get("query") or "", ctx),
    "search_products": lambda ctx, **a: search_products(ctx, **{k: v for k, v in a.items() if k in (
        "keyword", "max_price", "min_price", "min_rating", "sort", "limit")}),
    "get_user_pattern": lambda ctx, **a: get_user_pattern(ctx),
    "get_order_status": lambda ctx, **a: get_order_status(ctx, a.get("order_number")),
}


def run_tool(name: str, args: Dict, ctx: Dict) -> Dict:
    fn = REGISTRY.get(name)
    if not fn:
        return {"error": f"알 수 없는 도구: {name}"}
    try:
        return fn(ctx, **(args or {}))
    except Exception as e:  # 도구 실패는 LLM 에 알려 다른 방법을 찾게 함
        logger.exception("[agent.tool] %s failed", name)
        return {"error": f"{name} 실행 실패: {e}"}
