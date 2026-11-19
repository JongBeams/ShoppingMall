"""
에이전트 도구 4개의 실제 출력 예 → 포트폴리오/data/tool_examples.json (도구 설계 쪽에 사용)

  python tool_examples.py
"""
import json
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = HERE.parent / "data" / "tool_examples.json"
CFG = json.loads((HERE / ".cache" / "local.json").read_text(encoding="utf-8"))
P = CFG["ports"]
os.environ.update({"SUPABASE_URL": f"http://127.0.0.1:{P['gateway']}", "SUPABASE_ANON_KEY": CFG["anon_key"],
                   "SUPABASE_SERVICE_ROLE_KEY": CFG["service_key"]})
from dotenv import load_dotenv  # noqa: E402

load_dotenv(ROOT / "backend" / ".env")
os.chdir(HERE / ".cache")
sys.path.insert(0, str(ROOT / "backend"))

import psycopg2  # noqa: E402

from app.services.agent.tools import run_tool  # noqa: E402

cur = psycopg2.connect(host="127.0.0.1", user="postgres", password="admin", dbname="shoppingmall_local").cursor()
cur.execute("select id from profiles where email='demo@example.com'")
demo = str(cur.fetchone()[0])

cases = [
    ("search_policy", {"query": "단순 변심 반품 배송비"}, None),
    ("search_products", {"keyword": "러닝화", "max_price": 150000, "limit": 3}, None),
    ("get_user_pattern", {}, demo),
    ("get_order_status", {}, demo),
]
out = {}
for name, args, uid in cases:
    ctx = {"user_id": uid, "catalog": {}, "sources": []}
    res = run_tool(name, args, ctx)
    out[name] = {"args": args, "result": res}
    print(name, json.dumps(res, ensure_ascii=False)[:200])
OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
print("→", OUT)
