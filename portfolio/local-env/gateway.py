"""
Supabase 호환 로컬 게이트웨이 (포트 54321)

백엔드는 supabase-py 클라이언트를 그대로 쓰고, SUPABASE_URL 만 이 게이트웨이로 바꿉니다.
  /rest/v1/*      → PostgREST (127.0.0.1:54330) 로 그대로 전달
  /auth/v1/*      → Supabase Auth(GoTrue) 의 최소 기능 (이메일 로그인/가입/유저 조회/로그아웃)
  /storage/v1/*   → .cache/storage 폴더에 파일 저장·제공
"""
import json
import re
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

import bcrypt
import httpx
import jwt
import psycopg2
import psycopg2.extras
from fastapi import FastAPI, Request, Response
from fastapi.responses import FileResponse, JSONResponse

HERE = Path(__file__).resolve().parent
CACHE = HERE / ".cache"
CFG = json.loads((CACHE / "local.json").read_text(encoding="utf-8"))
REST = f"http://127.0.0.1:{CFG['ports']['postgrest']}"
STORAGE = CACHE / "storage"
SECRET = CFG["jwt_secret"]

app = FastAPI(title="local-supabase-gateway")
client = httpx.AsyncClient(timeout=60)

PASS_REQ = {"authorization", "accept", "content-type", "prefer", "range", "range-unit",
            "accept-profile", "content-profile"}
PASS_RES = {"content-type", "content-range", "preference-applied", "location"}


def db():
    pg = CFG["pg"]
    conn = psycopg2.connect(host=pg["host"], port=pg["port"], user=pg["user"], password=pg["password"], dbname=pg["db"])
    conn.autocommit = True
    return conn


def iso(dt=None):
    return (dt or datetime.now(timezone.utc)).isoformat()


def user_json(row):
    return {
        "id": str(row["id"]), "aud": "authenticated", "role": "authenticated",
        "email": row["email"], "phone": "",
        "email_confirmed_at": iso(row["created_at"]), "confirmed_at": iso(row["created_at"]),
        "last_sign_in_at": iso(), "app_metadata": {"provider": "email", "providers": ["email"]},
        "user_metadata": {}, "identities": [], "created_at": iso(row["created_at"]), "updated_at": iso(),
    }


def session_json(row):
    now = int(time.time())
    token = jwt.encode({"sub": str(row["id"]), "email": row["email"], "role": "shop_authenticated",
                        "aud": "authenticated", "iat": now, "exp": now + 3600 * 24}, SECRET, algorithm="HS256")
    return {"access_token": token, "token_type": "bearer", "expires_in": 3600 * 24,
            "expires_at": now + 3600 * 24, "refresh_token": uuid.uuid4().hex, "user": user_json(row)}


def auth_error(msg, code=400):
    return JSONResponse({"error": "invalid_grant", "error_description": msg, "msg": msg, "code": code}, status_code=code)


# ---------------------------------------------------------------- REST
@app.api_route("/rest/v1/{path:path}", methods=["GET", "POST", "PATCH", "PUT", "DELETE", "HEAD"])
async def rest(path: str, request: Request):
    headers = {k: v for k, v in request.headers.items() if k.lower() in PASS_REQ}
    # 코드의 여러 줄 select 문자열("order_items (\n  ...\n)")을 PostgREST 16 이 거부해서 공백을 정리
    params = [(k, re.sub(r"\s+", "", v) if k == "select" else v) for k, v in request.query_params.multi_items()]
    upstream = await client.request(request.method, f"{REST}/{path}", params=params,
                                    headers=headers, content=await request.body())
    out = {k: v for k, v in upstream.headers.items() if k.lower() in PASS_RES}
    return Response(upstream.content, status_code=upstream.status_code, headers=out)


# ---------------------------------------------------------------- AUTH
@app.post("/auth/v1/token")
async def token(request: Request):
    body = await request.json()
    if request.query_params.get("grant_type") != "password":
        return auth_error("unsupported grant_type")
    with db() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("select * from auth.users where email = %s", (body.get("email", "").lower(),))
        row = cur.fetchone()
    if not row or not bcrypt.checkpw(body.get("password", "").encode(), row["encrypted_password"].encode()):
        return auth_error("Invalid login credentials")
    return session_json(row)


@app.post("/auth/v1/signup")
async def signup(request: Request):
    body = await request.json()
    pw = bcrypt.hashpw(body["password"].encode(), bcrypt.gensalt()).decode()
    with db() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("select 1 from auth.users where email = %s", (body["email"].lower(),))
        if cur.fetchone():
            return auth_error("User already registered", 422)
        cur.execute("insert into auth.users (email, encrypted_password) values (%s, %s) returning *", (body["email"].lower(), pw))
        row = cur.fetchone()
    return session_json(row)


@app.get("/auth/v1/user")
async def get_user(request: Request):
    raw = request.headers.get("authorization", "").removeprefix("Bearer ").strip()
    try:
        claims = jwt.decode(raw, SECRET, algorithms=["HS256"], audience="authenticated")
    except Exception:
        return auth_error("invalid JWT", 401)
    with db() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("select * from auth.users where id = %s", (claims["sub"],))
        row = cur.fetchone()
    return user_json(row) if row else auth_error("user not found", 404)


@app.post("/auth/v1/logout")
async def logout():
    return Response(status_code=204)


@app.get("/auth/v1/admin/users")
async def list_users():
    with db() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("select * from auth.users order by created_at")
        return {"users": [user_json(r) for r in cur.fetchall()], "aud": "authenticated"}


@app.delete("/auth/v1/admin/users/{user_id}")
async def delete_user(user_id: str):
    with db() as conn, conn.cursor() as cur:
        cur.execute("delete from auth.users where id = %s", (user_id,))
    return {}


# ---------------------------------------------------------------- STORAGE
@app.get("/storage/v1/object/public/{bucket}/{path:path}")
async def public_object(bucket: str, path: str):
    f = (STORAGE / bucket / path).resolve()
    if STORAGE.resolve() not in f.parents or not f.exists():
        return JSONResponse({"error": "not found"}, status_code=404)
    return FileResponse(f)


@app.post("/storage/v1/object/{bucket}/{path:path}")
@app.put("/storage/v1/object/{bucket}/{path:path}")
async def upload_object(bucket: str, path: str, request: Request):
    f = (STORAGE / bucket / path).resolve()
    f.parent.mkdir(parents=True, exist_ok=True)
    form = await request.form() if "multipart" in request.headers.get("content-type", "") else None
    if form:
        part = next(iter(form.values()))
        f.write_bytes(await part.read())
    else:
        f.write_bytes(await request.body())
    return {"Key": f"{bucket}/{path}", "Id": str(uuid.uuid4())}


@app.delete("/storage/v1/object/{bucket}")
async def remove_objects(bucket: str, request: Request):
    body = await request.json()
    for p in body.get("prefixes", []):
        f = (STORAGE / bucket / p).resolve()
        if f.exists() and STORAGE.resolve() in f.parents:
            f.unlink()
    return []


@app.get("/health")
async def health():
    r = await client.get(f"{REST}/")
    return {"gateway": "ok", "postgrest": r.status_code}
