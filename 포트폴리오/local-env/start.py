"""
로컬 재현 환경 전체 기동 (Ctrl+C 로 모두 종료)

  python start.py                # PostgREST + Redis(대체) + 게이트웨이 + 백엔드 + 프론트
  python start.py --no-frontend  # 프론트 제외

로그: .cache/logs/*.log
"""
import json
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
CACHE = HERE / ".cache"
ROOT = HERE.parents[1]
CFG = json.loads((CACHE / "local.json").read_text(encoding="utf-8"))
P = CFG["ports"]
PG_BIN = os.getenv("PG_BIN", r"C:\Program Files\PostgreSQL\17\bin")
LOGS = CACHE / "logs"
LOGS.mkdir(exist_ok=True)

REDIS = (
    "import sys; sys.path.insert(0, r'%s');"
    "from fakeredis import TcpFakeServer;"
    "TcpFakeServer(('127.0.0.1', %d), server_type='redis').serve_forever()"
) % (CACHE / "pylib", P["redis"])

SERVICES = [
    ("postgrest", [str(CACHE / "bin" / "postgrest.exe"), str(CACHE / "postgrest.conf")], HERE,
     {"PATH": PG_BIN + os.pathsep + os.environ["PATH"]}, f"http://127.0.0.1:{P['postgrest']}/"),
    ("redis", [sys.executable, "-c", REDIS], HERE, {}, None),
    ("gateway", [sys.executable, "-m", "uvicorn", "gateway:app", "--host", "127.0.0.1", "--port", str(P["gateway"])], HERE,
     {}, f"http://127.0.0.1:{P['gateway']}/health"),
    ("backend", [sys.executable, "run_backend.py"], HERE, {}, f"http://127.0.0.1:{P['backend']}/health"),
    ("frontend", ["node", str(ROOT / "frontend" / "node_modules" / "next" / "dist" / "bin" / "next"), "dev", "-p", str(P["frontend"])],
     ROOT / "frontend",
     {"NEXT_PUBLIC_BACKEND_URL": f"http://localhost:{P['backend']}",
      "NEXT_PUBLIC_API_URL": f"http://localhost:{P['backend']}",
      "NEXT_PUBLIC_WS_URL": f"ws://localhost:{P['backend']}",
      "NEXT_TELEMETRY_DISABLED": "1"},
     f"http://127.0.0.1:{P['frontend']}/"),
]


def wait(url, name, timeout=240):
    start = time.time()
    while time.time() - start < timeout:
        try:
            urllib.request.urlopen(url, timeout=5)
            return True
        except urllib.error.HTTPError:
            return True
        except Exception:
            time.sleep(1)
    print(f"  ! {name} 응답 없음 ({url}) — .cache/logs/{name}.log 확인")
    return False


def main():
    skip = {"frontend"} if "--no-frontend" in sys.argv else set()
    procs = []
    try:
        for name, cmd, cwd, extra, health in SERVICES:
            if name in skip:
                continue
            log = open(LOGS / f"{name}.log", "w", encoding="utf-8")
            env = {**os.environ, "PYTHONIOENCODING": "utf-8", **extra}
            procs.append(subprocess.Popen(cmd, cwd=cwd, env=env, stdout=log, stderr=subprocess.STDOUT))
            if health:
                ok = wait(health, name)
                print(f"  {'✓' if ok else '✗'} {name:<9} {health}")
            else:
                time.sleep(1.5)
                print(f"  ✓ {name:<9} 127.0.0.1:{P['redis']}")
        print(f"\n준비 완료 → 프론트 http://localhost:{P['frontend']}  ·  API http://localhost:{P['backend']}/docs")
        print("Ctrl+C 로 종료합니다.")
        names = [s[0] for s in SERVICES if s[0] not in skip]
        reported = set()
        while True:  # 하나가 죽어도 나머지는 유지하고 알리기만 함
            for name, p in zip(names, procs):
                if p.poll() is not None and name not in reported:
                    reported.add(name)
                    print(f"  ! {name} 종료됨 (코드 {p.returncode}) — .cache/logs/{name}.log 확인")
            time.sleep(2)
    except KeyboardInterrupt:
        pass
    finally:
        for p in procs:
            p.terminate()


if __name__ == "__main__":
    main()
