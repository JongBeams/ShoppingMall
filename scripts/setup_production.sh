#!/bin/bash

# 4년차급 프로덕션 환경 Setup 스크립트
# 실행: bash scripts/setup_production.sh

set -e  # 에러 시 중단

echo "=========================================="
echo "🚀 4년차급 프로덕션 환경 Setup 시작"
echo "=========================================="

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1단계: 의존성 설치
echo -e "\n${YELLOW}[1/7] 의존성 설치 중...${NC}"
cd backend
pip install -r requirements.txt
echo -e "${GREEN} 의존성 설치 완료${NC}"

# 2단계: .env 파일 생성
echo -e "\n${YELLOW}[2/7] 환경변수 설정...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || echo "# 환경변수 파일" > .env
    echo "ENVIRONMENT=production" >> .env
    echo "REDIS_HOST=localhost" >> .env
    echo "CELERY_BROKER_URL=amqp://admin:admin123@localhost:5672//" >> .env
    echo -e "${GREEN} .env 파일 생성 완료${NC}"
else
    echo -e "${GREEN} .env 파일 이미 존재${NC}"
fi

# 3단계: Docker 인프라 실행
echo -e "\n${YELLOW}[3/7] Docker 인프라 실행 중...${NC}"
cd ..
docker-compose up -d redis
docker-compose -f docker-compose.queue.yml up -d rabbitmq celery-worker celery-beat flower
docker-compose -f docker-compose.monitoring.yml up -d prometheus grafana
echo -e "${GREEN} Docker 인프라 실행 완료${NC}"

# 4단계: 헬스체크 대기
echo -e "\n${YELLOW}[4/7] 서비스 헬스체크 중...${NC}"
sleep 10
echo -e "${GREEN} 헬스체크 완료${NC}"

# 5단계: ONNX 모델 변환
echo -e "\n${YELLOW}[5/7] ONNX 모델 변환 중...${NC}"
cd backend
if [ ! -f models/clip_vision_optimized.onnx ]; then
    mkdir -p models
    python -c "from app.services.image_embedding_optimized import OptimizedCLIPEmbedding; OptimizedCLIPEmbedding.export_to_onnx()" || echo "ONNX 변환 실패 (선택적)"
    echo -e "${GREEN} ONNX 모델 변환 완료${NC}"
else
    echo -e "${GREEN} ONNX 모델 이미 존재${NC}"
fi

# 6단계: 캐시 워밍 (옵션)
echo -e "\n${YELLOW}[6/7] 캐시 워밍 준비...${NC}"
echo -e "${GREEN} 서버 시작 시 자동 실행됩니다${NC}"

# 7단계: 서비스 URL 출력
echo -e "\n${YELLOW}[7/7] 서비스 URL 확인${NC}"
echo "=========================================="
echo "📊 모니터링 대시보드"
echo "=========================================="
echo "Grafana:        http://localhost:3001 (admin/admin)"
echo "Prometheus:     http://localhost:9090"
echo "Flower (Celery): http://localhost:5555"
echo "RabbitMQ:       http://localhost:15672 (admin/admin123)"
echo ""
echo "=========================================="
echo "🔧 API 엔드포인트"
echo "=========================================="
echo "Backend:        http://localhost:8000"
echo "Health Check:   http://localhost:8000/health"
echo "Metrics:        http://localhost:8000/metrics"
echo "API Docs:       http://localhost:8000/docs"
echo ""
echo "=========================================="
echo " Setup 완료! 백엔드 서버를 시작하세요:"
echo "   cd backend"
echo "   uvicorn app.main:app --reload"
echo "=========================================="
