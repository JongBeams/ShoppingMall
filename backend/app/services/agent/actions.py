"""
실행 도구 — 장바구니 담기 · 주문 취소 · 상담원 인계

원칙
- 실행 전에 반드시 고객 확인을 받습니다. 그래프의 confirm 노드가 interrupt 로 멈추고,
  고객이 승인해야 execute() 가 불립니다.
- 확인 문구는 모델이 쓴 글이 아니라 서버가 DB 값으로 만듭니다 (모델이 실행 내용을 바꿔 말할 수 없게).
- 실행할 수 없는 요청(배송중 주문 취소, 품절 등)은 확인을 묻기 전에 사전 검사(precheck)에서 이유와 함께 돌려줍니다.
- 실행은 기존 API 라우터 함수를 그대로 호출합니다. 재고 · 본인 주문 · 취소 가능 상태 · 결제 취소 ·
  재고와 포인트 환원 같은 규칙을 에이전트 쪽에 다시 구현하지 않습니다.
"""
import asyncio
import logging
import re
from typing import Dict, List

from fastapi import HTTPException

from app.services.agent.tools import CANCELLABLE, STATUS_KO
from app.services.supabase import supabase

logger = logging.getLogger(__name__)

INQUIRY_CATEGORIES = ["배송", "결제", "제품", "기타"]
MAX_QTY = 10

SCHEMAS: List[Dict] = [
    {"type": "function", "function": {
        "name": "add_to_cart",
        "description": "상품을 고객의 장바구니에 담습니다. 실행 전에 고객 확인을 받습니다. "
                       "상품은 도구 결과나 앞 대화에 나온 [P번호]로만 지정합니다.",
        "parameters": {"type": "object", "properties": {
            "product": {"type": "string", "description": "상품 번호 (예: P1)"},
            "quantity": {"type": "integer", "description": "수량 (1~10, 기본 1)"}},
            "required": ["product"]}}},
    {"type": "function", "function": {
        "name": "cancel_order",
        "description": "고객의 주문을 취소합니다. 실행 전에 고객 확인을 받습니다. "
                       "주문번호를 모르면 먼저 get_order_status 로 확인하세요. 결제 완료 전후(배송 준비 전)만 취소할 수 있습니다.",
        "parameters": {"type": "object", "properties": {
            "order_number": {"type": "string", "description": "주문번호 (예: ORD-20261021-7731)"}},
            "required": ["order_number"]}}},
    {"type": "function", "function": {
        "name": "request_human",
        "description": "상담원에게 1:1 문의로 넘깁니다. 실행 전에 고객 확인을 받습니다. "
                       "고객이 상담원을 원하거나, 도구로 처리할 수 없는 요청(반품 접수, 파손 신고 등)일 때 사용하세요.",
        "parameters": {"type": "object", "properties": {
            "category": {"type": "string", "enum": INQUIRY_CATEGORIES, "description": "문의 분류"},
            "title": {"type": "string", "description": "문의 제목 (한 줄)"},
            "content": {"type": "string", "description": "상담원이 바로 이해할 수 있게 고객 요청을 정리한 내용"}},
            "required": ["category", "title", "content"]}}},
]
WRITE_TOOLS = {s["function"]["name"] for s in SCHEMAS}
LABEL = {"add_to_cart": "장바구니 담기", "cancel_order": "주문 취소", "request_human": "상담원 연결"}


# ---------------------------------------------------------------- 사전 검사 → 확인 문구
def _add_to_cart(ctx: Dict, product: str = "", quantity: int = 1, **_) -> Dict:
    pid = str(product or "").strip().strip("[]")
    p = (ctx.get("catalog") or {}).get(pid)
    if not p:
        return {"error": f"상품 번호 {product or '(없음)'}를 이번 대화에서 찾지 못했습니다. 먼저 상품을 검색하세요."}
    try:
        qty = int(quantity or 1)
    except (TypeError, ValueError):
        qty = 1
    if not 1 <= qty <= MAX_QTY:
        return {"error": f"수량은 1~{MAX_QTY}개만 담을 수 있습니다."}
    rows = supabase.table("products").select("name, price, stock_quantity, is_active").eq("id", p["id"]).execute().data
    if not rows or not rows[0].get("is_active", True):
        return {"error": f"'{p['name']}'은(는) 판매 중이 아닙니다."}
    row = rows[0]
    if (row.get("stock_quantity") or 0) < qty:
        return {"error": f"'{row['name']}' 재고가 부족합니다 (현재 {row.get('stock_quantity') or 0}개)."}
    price = int(float(row.get("price") or 0))
    return {"summary": f"'{row['name']}' {qty}개를 장바구니에 담습니다 ({price * qty:,}원)",
            "exec": {"product_id": p["id"], "quantity": qty}}


def _cancel_order(ctx: Dict, order_number: str = "", **_) -> Dict:
    if not order_number:
        return {"error": "주문번호가 필요합니다. 먼저 get_order_status 로 주문을 확인하세요."}
    rows = supabase.table("orders").select("id, order_number, status, total").eq(
        "buyer_id", ctx["user_id"]).eq("order_number", order_number).execute().data
    if not rows:  # 남의 주문은 존재 여부도 알려 주지 않음
        return {"error": f"고객님의 주문에서 {order_number} 를 찾지 못했습니다."}
    o = rows[0]
    if o["status"] not in CANCELLABLE:
        return {"error": f"{order_number} 주문은 '{STATUS_KO.get(o['status'], o['status'])}' 상태라 취소할 수 없습니다. "
                         "배송이 시작된 주문은 받으신 뒤 반품으로 처리합니다.",
                "status": STATUS_KO.get(o["status"], o["status"])}
    items = supabase.table("order_items").select("product_name, quantity").eq("order_id", o["id"]).execute().data or []
    mismatch = _target_mismatch(ctx, [i["product_name"] for i in items])
    if mismatch:
        return {"error": mismatch}
    names = ", ".join(f"{i['product_name']} ×{i['quantity']}" for i in items) or "상품"
    return {"summary": f"주문 {order_number} ({names} · {int(float(o.get('total') or 0)):,}원)을 취소합니다",
            "exec": {"order_id": o["id"]}}


def _words(name: str) -> set:
    return {w for w in re.findall(r"[가-힣A-Za-z0-9]{2,}", name or "")}


def _target_mismatch(ctx: Dict, this_items: List[str]) -> str:
    """실행 대상 일치 검사 — 고객이 질문에서 가리킨 상품이 이 주문에는 없고 다른 주문에만 있으면 거부
    ("이어버드 주문 취소해줘"에 결제 완료된 자켓 주문 취소 카드가 뜨는 것 방지)"""
    q = ctx.get("question") or ""
    mine = _words(" ".join(this_items))
    if not q or any(w in q for w in mine):
        return ""
    rows = supabase.table("orders").select("id, order_number").eq("buyer_id", ctx["user_id"]).order(
        "created_at", desc=True).limit(5).execute().data or []
    for r in rows:
        other = supabase.table("order_items").select("product_name").eq("order_id", r["id"]).execute().data or []
        hit = [w for w in _words(" ".join(i["product_name"] for i in other)) - mine if w in q]
        if hit:
            return (f"고객이 말한 '{hit[0]}'은(는) 이 주문에 없습니다 ({r['order_number']} 주문의 상품입니다). "
                    "다른 주문을 취소하지 말고, 고객이 말한 주문의 상태를 안내하세요.")
    return ""


def _request_human(ctx: Dict, category: str = "기타", title: str = "", content: str = "", **_) -> Dict:
    title = " ".join(str(title or "").split())[:60]
    content = str(content or "").strip()[:1000]
    if not title or not content:
        return {"error": "문의 제목과 내용이 필요합니다."}
    category = category if category in INQUIRY_CATEGORIES else "기타"
    return {"summary": f"상담원에게 1:1 문의를 등록합니다 · [{category}] {title}",
            "exec": {"category": category, "title": title, "content": content}}


PRECHECK = {"add_to_cart": _add_to_cart, "cancel_order": _cancel_order, "request_human": _request_human}


def precheck(name: str, args: Dict, ctx: Dict) -> Dict:
    """실행 가능하면 {summary, exec}, 아니면 {error}. 아무것도 바꾸지 않습니다."""
    if not ctx.get("user_id"):
        return {"error": "로그인이 필요합니다. 로그인 후 다시 요청해 주세요."}
    try:
        return PRECHECK[name](ctx, **(args or {}))
    except Exception as e:
        logger.exception("[agent.action] precheck %s failed", name)
        return {"error": f"{LABEL.get(name, name)} 준비 중 오류: {e}"}


# ---------------------------------------------------------------- 실행 (고객 승인 후에만)
def _run(coro) -> Dict:
    """기존 라우터 함수(async)를 동기 그래프에서 실행. HTTPException 은 이유 그대로 돌려줌"""
    try:
        res = asyncio.run(coro)
    except HTTPException as e:
        return {"error": str(e.detail)}
    if hasattr(res, "model_dump"):
        res = res.model_dump()
    return res if isinstance(res, dict) else {"message": str(res)}


def execute(name: str, exec_args: Dict, ctx: Dict) -> Dict:
    user = {"id": ctx["user_id"]}
    try:
        if name == "add_to_cart":
            from app.routers.cart import AddToCartRequest, add_to_cart
            return _run(add_to_cart(AddToCartRequest(**exec_args), current_user=user))
        if name == "cancel_order":
            from app.routers.orders import cancel_order
            return _run(cancel_order(exec_args["order_id"], current_user=user))
        if name == "request_human":
            from app.routers.inquiry import InquiryCreateRequest, create_inquiry
            return _run(create_inquiry(InquiryCreateRequest(**exec_args), current_user=user))
    except Exception as e:
        logger.exception("[agent.action] execute %s failed", name)
        return {"error": f"{LABEL.get(name, name)} 실행 실패: {e}"}
    return {"error": f"알 수 없는 실행 도구: {name}"}
