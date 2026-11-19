"""에이전트 API 를 한 번 호출해 이벤트를 출력합니다.  python agent_try.py "질문" [--login]"""
import json
import sys
import time

import psycopg2
import requests

q = sys.argv[1]
uid = None
if "--login" in sys.argv:
    c = psycopg2.connect(host="127.0.0.1", user="postgres", password="admin", dbname="shoppingmall_local")
    cur = c.cursor()
    cur.execute("select id from profiles where email='demo@example.com'")
    uid = str(cur.fetchone()[0])
t0 = time.time()
with requests.post("http://127.0.0.1:18000/agent/chat", json={"message": q, "user_id": uid}, stream=True, timeout=600) as r:
    for line in r.iter_lines(decode_unicode=True):
        if line and line.startswith("data:"):
            d = json.loads(line[5:])
            t = f"{time.time() - t0:5.1f}s"
            if d["type"] == "answer":
                print(t, "ANSWER:", d["answer"])
                print("      cards:", [p["name"] for p in d["products"]], "| sources:", d["sources"])
            else:
                print(t, json.dumps(d, ensure_ascii=False)[:220])
