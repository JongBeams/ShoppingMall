"""
로컬 PostgreSQL 에 shoppingmall_local DB 를 (재)생성합니다.

  python setup_db.py            # DB 재생성 + 스키마 적용 + PostgREST 설정 파일 생성
  PG_PASSWORD=admin (기본값)    # postgres 슈퍼유저 비밀번호

만들어지는 것
  - DB: shoppingmall_local
  - 역할: shop_authenticator(로그인) → shop_anon / shop_authenticated / shop_service 로 전환
  - .cache/local.json   : JWT 비밀키, anon/service 키 (Supabase 키 대신 사용)
  - .cache/postgrest.conf
"""
import json
import os
import secrets
import time
from pathlib import Path

import jwt
import psycopg2
from psycopg2 import sql

HERE = Path(__file__).resolve().parent
CACHE = HERE / ".cache"
CACHE.mkdir(exist_ok=True)

PG_HOST = os.getenv("PG_HOST", "127.0.0.1")
PG_PORT = int(os.getenv("PG_PORT", "5432"))
PG_USER = os.getenv("PG_USER", "postgres")
PG_PASSWORD = os.getenv("PG_PASSWORD", "admin")
DB_NAME = "shoppingmall_local"
POSTGREST_PORT = 54330


def load_or_create_config() -> dict:
    path = CACHE / "local.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    secret = secrets.token_urlsafe(48)
    far = int(time.time()) + 10 * 365 * 24 * 3600
    cfg = {
        "jwt_secret": secret,
        "authenticator_password": secrets.token_urlsafe(18),
        "anon_key": jwt.encode({"role": "shop_anon", "iss": "local", "exp": far}, secret, algorithm="HS256"),
        "service_key": jwt.encode({"role": "shop_service", "iss": "local", "exp": far}, secret, algorithm="HS256"),
        "pg": {"host": PG_HOST, "port": PG_PORT, "user": PG_USER, "password": PG_PASSWORD, "db": DB_NAME},
        "ports": {"postgrest": POSTGREST_PORT, "gateway": 54321, "redis": 6379, "backend": 18000, "frontend": 13000},
    }
    path.write_text(json.dumps(cfg, indent=2), encoding="utf-8")
    return cfg


def main():
    cfg = load_or_create_config()

    admin = psycopg2.connect(host=PG_HOST, port=PG_PORT, user=PG_USER, password=PG_PASSWORD, dbname="postgres")
    admin.autocommit = True
    cur = admin.cursor()

    # 역할(클러스터 전역) — 이미 있으면 비밀번호만 갱신
    for role, login in [("shop_anon", False), ("shop_authenticated", False), ("shop_service", False), ("shop_authenticator", True)]:
        cur.execute("select 1 from pg_roles where rolname = %s", (role,))
        if not cur.fetchone():
            cur.execute(sql.SQL("create role {} {}").format(sql.Identifier(role), sql.SQL("login noinherit" if login else "nologin")))
    cur.execute(sql.SQL("alter role shop_authenticator with login password {}").format(sql.Literal(cfg["authenticator_password"])))
    cur.execute("grant shop_anon, shop_authenticated, shop_service to shop_authenticator")

    # DB 재생성
    cur.execute("select pg_terminate_backend(pid) from pg_stat_activity where datname = %s and pid <> pg_backend_pid()", (DB_NAME,))
    cur.execute(sql.SQL("drop database if exists {}").format(sql.Identifier(DB_NAME)))
    cur.execute(sql.SQL("create database {} encoding 'UTF8' template template0").format(sql.Identifier(DB_NAME)))
    admin.close()

    db = psycopg2.connect(host=PG_HOST, port=PG_PORT, user=PG_USER, password=PG_PASSWORD, dbname=DB_NAME)
    db.autocommit = True
    db.cursor().execute((HERE / "schema.sql").read_text(encoding="utf-8"))
    db.close()

    (CACHE / "postgrest.conf").write_text(
        "\n".join([
            f'db-uri = "postgres://shop_authenticator:{cfg["authenticator_password"]}@{PG_HOST}:{PG_PORT}/{DB_NAME}"',
            'db-schemas = "public"',
            'db-anon-role = "shop_anon"',
            f'jwt-secret = "{cfg["jwt_secret"]}"',
            'server-host = "127.0.0.1"',
            f'server-port = {POSTGREST_PORT}',
            'log-level = "warn"',
        ]) + "\n",
        encoding="utf-8",
    )
    print(f"[setup_db] {DB_NAME} 생성 완료 · PostgREST 설정: {CACHE / 'postgrest.conf'}")


if __name__ == "__main__":
    main()
