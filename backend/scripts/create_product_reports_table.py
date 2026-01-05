#!/usr/bin/env python3
"""
Product Reports 테이블 생성 스크립트
009_create_product_reports_table.sql 마이그레이션을 Supabase에 적용합니다.
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# 부모 디렉토리를 sys.path에 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.supabase import get_supabase_admin_client

# 환경 변수 로드
load_dotenv()

def main():
    """Product Reports 테이블 생성"""
    print("Creating product_reports table...")

    # Supabase 관리자 클라이언트 가져오기
    supabase = get_supabase_admin_client()

    # SQL 파일 읽기
    sql_file = Path(__file__).parent.parent / "migrations" / "009_create_product_reports_table.sql"

    if not sql_file.exists():
        print(f"❌ Error: SQL file not found: {sql_file}")
        sys.exit(1)

    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    print(f"SQL file loaded: {sql_file.name}")
    print("\n" + "="*60)
    print("SQL Content:")
    print("="*60)
    print(sql_content)
    print("="*60)

    print("\nNote: Supabase Python SDK doesn't support direct SQL execution.")
    print("Please run the SQL above manually in Supabase SQL Editor:")
    print(f"URL: https://app.supabase.com/project/{os.getenv('SUPABASE_URL', '').split('.')[0].replace('https://', '')}/sql")

    print("\nAlternatively, you can use the Supabase REST API to check if the table exists:")

    # 테이블 존재 여부 확인
    try:
        result = supabase.table("product_reports").select("id").limit(1).execute()
        print("OK - Table 'product_reports' already exists!")
        print(f"   Data: {result.data}")
    except Exception as e:
        print(f"ERROR - Table 'product_reports' does not exist or error occurred:")
        print(f"   Error: {str(e)}")
        print("\nPlease create the table using Supabase SQL Editor with the SQL above.")

if __name__ == "__main__":
    main()
