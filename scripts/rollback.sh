#!/bin/bash
#
# 롤백 스크립트
# 사용법: ./scripts/rollback.sh [TAG]
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 이전 버전으로 롤백
rollback() {
    local tag=${1:-"previous"}

    log_info "========================================="
    log_info "  롤백 시작: $tag"
    log_info "========================================="

    # 환경 변수 로드
    if [ ! -f ".env.production" ]; then
        log_error ".env.production 파일이 없습니다."
        exit 1
    fi

    source .env.production

    # 컨테이너 중지
    log_info "기존 컨테이너 중지..."
    docker compose -f docker-compose.prod.yml down

    # 특정 태그 이미지로 변경
    if [ "$tag" != "previous" ]; then
        log_info "이미지 태그를 $tag 로 변경..."
        export DOCKER_IMAGE_TAG=$tag
    fi

    # 컨테이너 재시작
    log_info "컨테이너 재시작..."
    docker compose -f docker-compose.prod.yml up -d --force-recreate

    # Health Check
    log_info "서비스 확인 중..."
    sleep 10

    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        log_info "✓ Backend 정상"
    else
        log_error "Backend 오류"
        exit 1
    fi

    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_info "✓ Frontend 정상"
    else
        log_error "Frontend 오류"
        exit 1
    fi

    log_info "========================================="
    log_info "  롤백 완료! ✅"
    log_info "========================================="
}

rollback "$@"
