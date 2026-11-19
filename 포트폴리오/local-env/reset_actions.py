"""
실행 도구 시연 · 평가 전 상태 초기화

  python reset_actions.py

- 데모 고객의 '결제 완료' 주문 1건 (취소 시연용, 결제 키 없음 → 토스 취소 호출 없이 상태만 바뀜)
  이미 취소됐으면 결제 완료로 되돌리고, 취소 때 복구된 재고 1개를 다시 뺌
- 데모 고객의 장바구니 · 1:1 문의 비우기 (시드에는 없음 — 에이전트가 만든 것만 지움)
"""
import json
from datetime import datetime, timedelta
from pathlib import Path

import psycopg2

HERE = Path(__file__).resolve().parent
CFG = json.loads((HERE / ".cache" / "local.json").read_text(encoding="utf-8"))
PRODUCT = "MA-1 봄버 자켓 (브라운)"
SUFFIX = "5402"


def main():
    pg = CFG["pg"]
    conn = psycopg2.connect(host=pg["host"], port=pg["port"], user=pg["user"], password=pg["password"], dbname=pg["db"])
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("select id from profiles where email = 'demo@example.com'")
    demo = cur.fetchone()[0]
    cur.execute("select id, price, vendor_id from products where name = %s", (PRODUCT,))
    pid, price, vendor = cur.fetchone()

    cur.execute("select id, status from orders where buyer_id = %s and order_number like %s", (demo, f"%-{SUFFIX}"))
    row = cur.fetchone()
    if row is None:
        created = datetime.now() - timedelta(hours=3)
        cur.execute("""insert into orders (buyer_id, order_number, status, subtotal, total, total_amount, final_amount,
                       payment_method, payment_status, recipient_name, shipping_address, paid_at, created_at, updated_at)
                       values (%s,%s,'paid',%s,%s,%s,%s,'card','paid','이하늘','서울특별시 (데모)',%s,%s,%s) returning id""",
                    (demo, f"ORD-{created:%Y%m%d}-{SUFFIX}", price, price, price, price, created, created, created))
        oid = cur.fetchone()[0]
        cur.execute("""insert into order_items (order_id, product_id, vendor_id, product_name, quantity, price, subtotal,
                       total_price, status, created_at) values (%s,%s,%s,%s,1,%s,%s,%s,'paid',%s)""",
                    (oid, pid, vendor, PRODUCT, price, price, price, created))
        print("결제 완료 주문 생성")
    elif row[1] != "paid":
        cur.execute("update orders set status = 'paid', payment_status = 'paid', cancelled_at = null where id = %s", (row[0],))
        cur.execute("update products set stock_quantity = greatest(stock_quantity - 1, 0) where id = %s", (pid,))
        print(f"주문 상태 {row[1]} → paid 로 되돌림")
    else:
        print("결제 완료 주문 그대로")

    cur.execute("delete from cart_items where user_id = %s", (demo,))
    cart = cur.rowcount
    cur.execute("delete from inquiries where user_id = %s", (demo,))
    print(f"장바구니 {cart}건 · 문의 {cur.rowcount}건 삭제")
    cur.execute("select order_number, status from orders where buyer_id = %s order by created_at desc limit 3", (demo,))
    print(cur.fetchall())


if __name__ == "__main__":
    main()
