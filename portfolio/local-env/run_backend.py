"""
백엔드(FastAPI)를 로컬 재현 환경에 붙여 실행합니다. backend/ 코드는 수정하지 않습니다.

- SUPABASE_URL/KEY 를 로컬 게이트웨이로 바꿔서 환경변수로 넘깁니다 (backend/.env 보다 우선).
- 작업 폴더를 .cache/run 으로 둡니다. (backend/.env 의 일부 키를 Settings 가 거부해서
  backend 폴더에서 실행하면 기동이 안 됩니다. main.py 의 load_dotenv 는 그대로 .env 를 읽습니다.)
- routers/documents.py 가 Ollama 주소를 localhost:11435 로 고정해 두었기 때문에,
  이 프로세스 안에서만 11435 → OLLAMA_HOST(11434) 로 돌려 줍니다.
- Ollama 호출 타임아웃을 최소 900초로 늘립니다 (LOCAL_OLLAMA_TIMEOUT). GPU 공유 환경 대비.
"""
import json
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
CACHE = HERE / ".cache"
BACKEND = HERE.parents[1] / "backend"
CFG = json.loads((CACHE / "local.json").read_text(encoding="utf-8"))
P = CFG["ports"]

env = {
    "SUPABASE_URL": f"http://127.0.0.1:{P['gateway']}",
    "SUPABASE_ANON_KEY": CFG["anon_key"],
    "SUPABASE_SERVICE_ROLE_KEY": CFG["service_key"],
    "OLLAMA_HOST": "http://localhost:11434",
    "REDIS_HOST": "127.0.0.1",
    "REDIS_PORT": str(P["redis"]),
    "REDIS_URL": f"redis://127.0.0.1:{P['redis']}/0",
    "ALLOWED_ORIGINS": f"http://localhost:{P['frontend']},http://127.0.0.1:{P['frontend']}",
    "NEXT_PUBLIC_URL": f"http://localhost:{P['frontend']}",
    "ENVIRONMENT": "development",
    "CSRF_ENABLED": "false",
    "PYTHONUTF8": "1",
}
os.environ.update(env)

import requests  # noqa: E402

_orig = requests.Session.request


OLLAMA_TIMEOUT_FLOOR = int(os.getenv("LOCAL_OLLAMA_TIMEOUT", "900"))


def _request(self, method, url, *args, **kwargs):
    if isinstance(url, str) and "localhost:11435" in url:
        url = url.replace("localhost:11435", "localhost:11434")
    # GPU 를 다른 작업과 공유하는 로컬 PC 에서는 생성이 느려(초당 수 토큰) 앱의 60~120초 타임아웃에 걸립니다.
    # 출력은 그대로 두고 기다리는 시간만 늘립니다.
    if isinstance(url, str) and "/api/generate" in url:
        t = kwargs.get("timeout")
        if isinstance(t, (int, float)) and t < OLLAMA_TIMEOUT_FLOOR:
            kwargs["timeout"] = OLLAMA_TIMEOUT_FLOOR
    return _orig(self, method, url, *args, **kwargs)


requests.Session.request = _request

run_dir = CACHE / "run"
run_dir.mkdir(parents=True, exist_ok=True)
os.chdir(run_dir)
sys.path.insert(0, str(BACKEND))

import uvicorn  # noqa: E402

uvicorn.run("app.main:app", host="127.0.0.1", port=P["backend"], log_level="info")
