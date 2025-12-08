#!/bin/bash

# 부하 테스트 실행 스크립트
# 실행: bash scripts/run_load_test.sh

echo "=========================================="
echo "📊 부하 테스트 시작"
echo "=========================================="

# 서버 실행 확인
if ! curl -s http://localhost:8000/health > /dev/null; then
    echo "❌ 백엔드 서버가 실행 중이 아닙니다."
    echo "   먼저 서버를 시작하세요: uvicorn app.main:app"
    exit 1
fi

echo "✅ 백엔드 서버 연결 확인"

# 테스트 옵션
USERS=${1:-100}        # 동시 사용자 수 (기본 100명)
SPAWN_RATE=${2:-10}    # 초당 증가율 (기본 10명/초)
RUN_TIME=${3:-5m}      # 실행 시간 (기본 5분)

echo ""
echo "테스트 설정:"
echo "  - 동시 사용자: $USERS명"
echo "  - 증가율: $SPAWN_RATE명/초"
echo "  - 실행 시간: $RUN_TIME"
echo ""

# Locust 실행
cd load_tests

echo "부하 테스트 실행 중..."
locust -f locustfile.py \
  --host http://localhost:8000 \
  --users $USERS \
  --spawn-rate $SPAWN_RATE \
  --run-time $RUN_TIME \
  --headless \
  --html reports/load_test_report_$(date +%Y%m%d_%H%M%S).html \
  --csv reports/load_test_$(date +%Y%m%d_%H%M%S)

echo ""
echo "=========================================="
echo "✅ 부하 테스트 완료!"
echo "   리포트: load_tests/reports/"
echo "=========================================="
