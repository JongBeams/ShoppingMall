#!/usr/bin/env python3
"""
Database Migration Runner
Supabase에 마이그레이션 파일을 실행합니다.
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# 환경 변수 로드
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
    sys.exit(1)

# Supabase 클라이언트 생성
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# 마이그레이션 디렉토리
MIGRATIONS_DIR = Path(__file__).parent.parent / "migrations"

def run_migration(file_path: Path):
    """단일 마이그레이션 파일 실행"""
    print(f"📄 Running migration: {file_path.name}")

    with open(file_path, 'r', encoding='utf-8') as f:
        sql = f.read()

    try:
        # Supabase의 RPC를 통해 SQL 실행
        # 주의: Supabase Python SDK는 직접 SQL 실행을 지원하지 않으므로
        # PostgreSQL 라이브러리를 사용해야 합니다
        print(f"⚠️  Warning: Direct SQL execution requires psycopg2 or similar library")
        print(f"   Please run this SQL manually in Supabase SQL Editor:")
        print(f"   File: {file_path}")
        return False
    except Exception as e:
        print(f"❌ Error running migration {file_path.name}: {str(e)}")
        return False

def main():
    """모든 마이그레이션 실행"""
    print("🚀 Starting database migrations...")
    print(f"📂 Migrations directory: {MIGRATIONS_DIR}")

    if not MIGRATIONS_DIR.exists():
        print(f"❌ Error: Migrations directory not found: {MIGRATIONS_DIR}")
        sys.exit(1)

    # .sql 파일을 순서대로 정렬
    migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))

    if not migration_files:
        print("⚠️  No migration files found")
        return

    print(f"\n📋 Found {len(migration_files)} migration files:")
    for f in migration_files:
        print(f"   - {f.name}")

    print("\n" + "="*60)
    print("⚠️  IMPORTANT: Supabase Python SDK doesn't support direct SQL execution")
    print("   Please run these migrations manually in Supabase SQL Editor:")
    print(f"   URL: {SUPABASE_URL.replace('https://', 'https://app.supabase.com/project/')}/sql")
    print("="*60)

    # 각 마이그레이션 파일 내용 출력
    for file_path in migration_files:
        print(f"\n{'='*60}")
        print(f"File: {file_path.name}")
        print('='*60)
        with open(file_path, 'r', encoding='utf-8') as f:
            print(f.read())

    print("\n✅ Migration files listed above. Please run them in Supabase SQL Editor.")

if __name__ == "__main__":
    main()
