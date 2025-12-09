#!/bin/bash
#
# EC2 배포 스크립트
# 사용법: ./scripts/deploy.sh
#

set -e  # 에러 발생 시 즉시 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 환경 변수 확인
check_env() {
    log_info "환경 변수 확인 중..."

    if [ ! -f ".env.production" ]; then
        log_error ".env.production 파일이 없습니다."
        exit 1
    fi

    source .env.production

    required_vars=(
        "DOCKER_USERNAME"
        "SUPABASE_URL"
        "SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "SECRET_KEY"
        "REDIS_PASSWORD"
    )

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "환경 변수 $var 가 설정되지 않았습니다."
            exit 1
        fi
    done

    log_info "✓ 환경 변수 확인 완료"
}

# Docker 이미지 Pull
pull_images() {
    log_info "최신 Docker 이미지 다운로드 중..."

    docker compose -f docker-compose.prod.yml pull

    log_info "✓ 이미지 다운로드 완료"
}

# 기존 컨테이너 중지
stop_containers() {
    log_info "기존 컨테이너 중지 중..."

    if docker compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        docker compose -f docker-compose.prod.yml down
        log_info "✓ 컨테이너 중지 완료"
    else
        log_warn "실행 중인 컨테이너가 없습니다."
    fi
}

# 새 컨테이너 시작
start_containers() {
    log_info "새 컨테이너 시작 중..."

    docker compose -f docker-compose.prod.yml up -d

    log_info "✓ 컨테이너 시작 완료"
}

# Health Check
health_check() {
    log_info "서비스 헬스 체크 중..."

    # Backend Health Check
    max_attempts=30
    attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if curl -f http://localhost:8000/health > /dev/null 2>&1; then
            log_info "✓ Backend 정상 작동"
            break
        fi

        attempt=$((attempt + 1))
        log_warn "Backend 대기 중... ($attempt/$max_attempts)"
        sleep 2
    done

    if [ $attempt -eq $max_attempts ]; then
        log_error "Backend Health Check 실패"
        docker compose -f docker-compose.prod.yml logs --tail=50 backend
        exit 1
    fi

    # Frontend Health Check
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -f http://localhost:3000 > /dev/null 2>&1; then
            log_info "✓ Frontend 정상 작동"
            break
        fi

        attempt=$((attempt + 1))
        log_warn "Frontend 대기 중... ($attempt/$max_attempts)"
        sleep 2
    done

    if [ $attempt -eq $max_attempts ]; then
        log_error "Frontend Health Check 실패"
        docker compose -f docker-compose.prod.yml logs --tail=50 frontend
        exit 1
    fi
}

# 오래된 이미지 정리
cleanup() {
    log_info "오래된 Docker 이미지 정리 중..."

    docker image prune -af

    log_info "✓ 정리 완료"
}

# 배포 상태 확인
check_status() {
    log_info "컨테이너 상태 확인..."

    docker compose -f docker-compose.prod.yml ps

    log_info "최근 로그 (마지막 20줄):"
    docker compose -f docker-compose.prod.yml logs --tail=20
}

# 메인 배포 프로세스
main() {
    log_info "========================================="
    log_info "  Shopping Mall 배포 시작"
    log_info "========================================="

    check_env
    pull_images
    stop_containers
    start_containers
    health_check
    cleanup
    check_status

    log_info "========================================="
    log_info "  배포 완료! "
    log_info "========================================="
    log_info "Backend: http://localhost:8000"
    log_info "Frontend: http://localhost:3000"
    log_info "========================================="
}

# 스크립트 실행
main "$@"
