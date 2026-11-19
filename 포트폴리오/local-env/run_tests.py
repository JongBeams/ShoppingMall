"""
백엔드 테스트 실행 (로컬 재현 환경 설정으로)

  python run_tests.py                     # tests/test_agent.py
  python run_tests.py tests/test_xxx.py   # 다른 파일

backend/.env 의 일부 키를 Settings 가 거부하므로 .cache/run 에서 실행합니다.
pytest 는 전역이 아니라 .cache/pylib-test 에 설치해 둔 것을 씁니다.
"""
import json
import os
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
BACKEND = HERE.parents[1] / "backend"
CFG = json.loads((HERE / ".cache" / "local.json").read_text(encoding="utf-8"))
P = CFG["ports"]

env = {**os.environ,
       "SUPABASE_URL": f"http://127.0.0.1:{P['gateway']}", "SUPABASE_ANON_KEY": CFG["anon_key"],
       "SUPABASE_SERVICE_ROLE_KEY": CFG["service_key"], "REDIS_URL": f"redis://127.0.0.1:{P['redis']}/0",
       "ENVIRONMENT": "development", "CSRF_ENABLED": "false", "ALLOWED_ORIGINS": "http://localhost:3000",
       "PYTHONIOENCODING": "utf-8",
       "PYTHONPATH": os.pathsep.join([p for p in (os.environ.get("EXTRA_PYTHONPATH"), str(HERE / ".cache" / "pylib-test"), str(BACKEND)) if p])}
targets = [str(BACKEND / a) for a in sys.argv[1:]] or [str(BACKEND / "tests" / "test_agent.py")]
run_dir = HERE / ".cache" / "run"
run_dir.mkdir(parents=True, exist_ok=True)
sys.exit(subprocess.call([sys.executable, "-m", "pytest", *targets, "-p", "no:cacheprovider",
                          "--rootdir", str(BACKEND), "-c", str(BACKEND / "pytest.ini")], cwd=run_dir, env=env))
