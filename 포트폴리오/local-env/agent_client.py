"""
에이전트 API 클라이언트 (평가 · 수동 확인 공용)

  from agent_client import login, chat, resume
  token = login()                         # 데모 고객 JWT
  r = chat("러닝화 추천해줘", token)        # {"thread_id", "events", "answer", "calls", "confirm", ...}
  r = chat("첫 번째 거 담아줘", token, r["thread_id"])
  r = resume(r["thread_id"], True, token)

  python agent_client.py "질문" [--login]   # 한 번 호출해 이벤트 출력
"""
import json
import sys
import time
from pathlib import Path

import requests

HERE = Path(__file__).resolve().parent
CFG = json.loads((HERE / ".cache" / "local.json").read_text(encoding="utf-8"))
API = f"http://127.0.0.1:{CFG['ports']['backend']}"


def login(email="demo@example.com", password="demo1234!") -> str:
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=60)
    r.raise_for_status()
    return r.json()["access_token"]


def _stream(path: str, body: dict, token=None, timeout=900) -> dict:
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    t0 = time.time()
    events = []
    with requests.post(f"{API}{path}", json=body, headers=headers, stream=True, timeout=timeout) as res:
        if res.status_code != 200:
            return {"status": res.status_code, "detail": res.text, "events": []}
        for line in res.iter_lines(decode_unicode=True):
            if line and line.startswith("data: "):
                ev = json.loads(line[6:])
                ev["t"] = round(time.time() - t0, 2)
                events.append(ev)
    out = {"status": 200, "events": events, "sec": round(time.time() - t0, 1),
           "calls": [e["name"] for e in events if e["type"] == "tool_call"],
           "call_args": [(e["name"], e.get("args")) for e in events if e["type"] == "tool_call"],
           "rounds": [], "answer": "", "cards": [], "confirm": None, "actions": [], "verify": []}
    rnd = -1
    for e in events:
        if e["type"] == "llm":
            rnd += 1
        elif e["type"] == "tool_call":
            out["rounds"].append((rnd, e["name"]))
        elif e["type"] == "thread":
            out["thread_id"] = e["thread_id"]
        elif e["type"] == "answer":
            out["answer"] = e["answer"]
            out["cards"] = [p["name"] for p in e.get("products") or []]
        elif e["type"] == "confirm":
            out["confirm"] = e
            out["thread_id"] = e["thread_id"]
        elif e["type"] == "action":
            out["actions"].append(e)
        elif e["type"] == "verify":
            out["verify"].append(e)
        elif e["type"] == "done":
            out["prompt_max"] = e.get("max_prompt_tokens")
    out.setdefault("thread_id", body.get("thread_id"))
    return out


def chat(message: str, token=None, thread_id=None, **extra) -> dict:
    return _stream("/agent/chat", {"message": message, "thread_id": thread_id, **extra}, token)


def resume(thread_id: str, approve: bool, token=None) -> dict:
    out = _stream("/agent/resume", {"thread_id": thread_id, "approve": approve}, token)
    out["thread_id"] = thread_id
    return out


if __name__ == "__main__":
    tok = login() if "--login" in sys.argv else None
    r = chat(sys.argv[1], tok)
    for e in r["events"]:
        print(json.dumps(e, ensure_ascii=False)[:300])
