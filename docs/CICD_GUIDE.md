# 🚀 CI/CD 파이프라인 가이드

본 프로젝트는 **GitHub Actions**를 사용한 완전 자동화된 CI/CD 파이프라인을 제공합니다.

---

## 📌 개요

### 구성 요소
- **CI (Continuous Integration)**: 코드 품질 검사, 린팅, 빌드 테스트
- **CD (Continuous Deployment)**: Docker 이미지 빌드 및 EC2 자동 배포
- **Rollback**: 배포 롤백 자동화

### 배포 플로우

```
┌─────────────────┐
│  Git Push       │
│  (main branch)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GitHub Actions │
│  CI Workflow    │◄─── ESLint, Black, Type Check
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Docker Build   │
│  & Push to Hub  │◄─── Backend, Frontend 이미지 빌드
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SSH to EC2     │
│  & Deploy       │◄─── docker compose pull & up
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Health Check   │◄─── Backend/Frontend 상태 확인
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Slack Notify   │◄─── 배포 성공/실패 알림
└─────────────────┘
```

---

## 📂 생성된 파일 목록

### 1. GitHub Actions Workflows

| 파일 | 설명 | 트리거 |
|------|------|--------|
| [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | 코드 품질 검사 | PR, Push to develop |
| [`.github/workflows/cd-ec2.yml`](.github/workflows/cd-ec2.yml) | EC2 자동 배포 | Push to main |

### 2. Docker 설정

| 파일 | 설명 |
|------|------|
| [`docker-compose.prod.yml`](docker-compose.prod.yml) | 프로덕션 Docker Compose 설정 |
| [`backend/Dockerfile`](backend/Dockerfile) | Backend 이미지 빌드 (멀티 워커) |
| [`frontend/Dockerfile`](frontend/Dockerfile) | Frontend 이미지 빌드 (최적화) |

### 3. 배포 스크립트

| 파일 | 설명 | 사용법 |
|------|------|--------|
| [`scripts/deploy.sh`](scripts/deploy.sh) | 배포 자동화 스크립트 | `./scripts/deploy.sh` |
| [`scripts/rollback.sh`](scripts/rollback.sh) | 롤백 스크립트 | `./scripts/rollback.sh [TAG]` |

### 4. 문서

| 파일 | 설명 |
|------|------|
| [`docs/EC2_SETUP.md`](docs/EC2_SETUP.md) | EC2 초기 설정 가이드 |
| [`.env.production.example`](.env.production.example) | 프로덕션 환경 변수 예시 |

---

## 🔧 초기 설정 (한 번만 실행)

### 1. GitHub Secrets 설정

**Settings > Secrets and variables > Actions > New repository secret**

필수 Secrets (총 16개):

```bash
# Docker Hub
DOCKER_USERNAME=your-docker-username
DOCKER_PASSWORD=your-docker-password

# AWS EC2
EC2_HOST=52.78.123.456
EC2_USERNAME=ubuntu
EC2_SSH_KEY=<shoppingmall-key.pem 내용 전체>
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/...

# Application
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
SECRET_KEY=super-secret-key-32-chars
REDIS_PASSWORD=redis-password

TOSS_SECRET_KEY=live_sk_xxx
TOSS_CLIENT_KEY=live_ck_xxx

BACKEND_URL=http://52.78.123.456:8000
FRONTEND_URL=http://52.78.123.456:3000
ALLOWED_ORIGINS=http://52.78.123.456:3000

# Optional
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

### 2. EC2 초기 설정

**상세 가이드**: [`docs/EC2_SETUP.md`](docs/EC2_SETUP.md)

```bash
# SSH 접속
ssh -i "shoppingmall-key.pem" ubuntu@<EC2_IP>

# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose-plugin -y
sudo usermod -aG docker $USER

# 프로젝트 클론
cd /home/ubuntu
git clone https://github.com/your-username/shoppingmall.git
cd shoppingmall

# 환경 변수 설정
cp .env.production.example .env.production
nano .env.production  # 값 입력

# 첫 배포
./scripts/deploy.sh
```

---

## 🚀 사용 방법

### 1. 자동 배포 (CI/CD)

```bash
# main 브랜치에 Push하면 자동 배포
git add .
git commit -m "feat: Add new feature"
git push origin main
```

**배포 과정**:
1. GitHub Actions CI 실행 (Lint, Build Check)
2. Docker 이미지 빌드 및 Push
3. EC2 SSH 접속 및 배포
4. Health Check
5. Slack 알림

### 2. 수동 배포

#### 방법 1: GitHub Actions 수동 트리거

```
GitHub > Actions > CD - Deploy to EC2 > Run workflow
```

#### 방법 2: EC2에서 스크립트 실행

```bash
ssh -i "shoppingmall-key.pem" ubuntu@<EC2_IP>
cd /home/ubuntu/shoppingmall
./scripts/deploy.sh
```

### 3. 롤백

```bash
# EC2 SSH 접속
ssh -i "shoppingmall-key.pem" ubuntu@<EC2_IP>
cd /home/ubuntu/shoppingmall

# 이전 버전으로 롤백
./scripts/rollback.sh

# 특정 커밋으로 롤백 (Git SHA)
./scripts/rollback.sh abc1234
```

### 4. 로그 확인

```bash
# 실시간 로그 (모든 컨테이너)
docker compose -f docker-compose.prod.yml logs -f

# Backend만
docker compose -f docker-compose.prod.yml logs -f backend

# Frontend만
docker compose -f docker-compose.prod.yml logs -f frontend

# 최근 100줄
docker compose -f docker-compose.prod.yml logs --tail=100
```

---

## 📊 CI Workflow 상세

**파일**: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

### 실행 조건
- Pull Request to `main` or `develop`
- Push to `develop`

### Jobs

#### 1. backend-lint
```yaml
- Black 코드 포맷팅 검사
- isort Import 정렬 검사
- Pylint 코드 품질 검사
- MyPy 타입 체크
```

#### 2. frontend-lint
```yaml
- ESLint 검사
- TypeScript 타입 체크
- Next.js 빌드 테스트
```

#### 3. security-check
```yaml
- Trivy 보안 취약점 스캔
- GitHub Security 탭에 결과 업로드
```

#### 4. dependency-check
```yaml
- Python 의존성 취약점 검사 (safety)
- npm 의존성 취약점 검사 (npm audit)
```

---

## 🚢 CD Workflow 상세

**파일**: [`.github/workflows/cd-ec2.yml`](.github/workflows/cd-ec2.yml)

### 실행 조건
- Push to `main`
- Manual trigger (workflow_dispatch)

### Jobs

#### 1. build
```yaml
- Docker Buildx 설정
- Docker Hub 로그인
- Backend 이미지 빌드 및 Push
  - Tag: latest, {git-sha}
- Frontend 이미지 빌드 및 Push
  - Tag: latest, {git-sha}
- GitHub Actions Cache 사용 (빌드 속도 향상)
```

#### 2. deploy
```yaml
- AWS Credentials 설정
- EC2 SSH 접속
- Git Pull (최신 docker-compose.yml)
- docker compose pull (최신 이미지)
- docker compose down (기존 컨테이너 중지)
- docker compose up -d (새 컨테이너 시작)
- 오래된 이미지 정리
- Health Check
  - Backend: http://backend:8000/health
  - Frontend: http://frontend:3000
- Slack 알림 (성공/실패)
```

#### 3. rollback
```yaml
- 수동 트리거로 실행
- 이전 버전으로 컨테이너 재시작
```

---

## 🔍 모니터링

### 1. GitHub Actions 대시보드

```
https://github.com/your-username/shoppingmall/actions
```

- 실시간 배포 로그 확인
- 성공/실패 상태 확인
- 이전 배포 히스토리

### 2. EC2 서버 모니터링

```bash
# 컨테이너 상태
docker compose -f docker-compose.prod.yml ps

# 리소스 사용량
docker stats

# 시스템 리소스
htop
df -h
```

### 3. Health Check 엔드포인트

```bash
# Backend
curl http://<EC2_IP>:8000/health

# Frontend
curl http://<EC2_IP>:3000
```

---

## ⚠️ 주의사항

### 1. 환경 변수 보안

- ❌ `.env.production` 파일을 **절대** Git에 커밋하지 마세요
-  `.gitignore`에 이미 추가되어 있음
-  GitHub Secrets 사용

### 2. Docker Hub 이미지 크기

- Backend 이미지: ~2GB (PyTorch, Transformers 포함)
- Frontend 이미지: ~200MB (Next.js Standalone)
- 네트워크 속도에 따라 Pull 시간 5~10분 소요

### 3. EC2 인스턴스 사양

- 최소: t3.small (2GB RAM) - AI 기능 제한적
- 권장: t3.medium (4GB RAM) - 전체 기능 정상 작동

### 4. 비용 관리

- EC2: ~$30/월 (t3.medium, 730시간)
- EBS: ~$3/월 (30GB)
- Elastic IP: 무료 (인스턴스 연결 시)
- **총 예상**: ~$33/월

---

## 🐛 트러블슈팅

### 1. 배포 실패

```bash
# GitHub Actions 로그 확인
# EC2 SSH 접속 후 로그 확인
docker compose -f docker-compose.prod.yml logs --tail=50

# 환경 변수 확인
cat .env.production
```

### 2. Health Check 실패

```bash
# 컨테이너 상태 확인
docker compose -f docker-compose.prod.yml ps

# Backend 로그
docker compose -f docker-compose.prod.yml logs backend

# 포트 확인
sudo netstat -tuln | grep -E '8000|3000'
```

### 3. 메모리 부족

```bash
# Swap 메모리 추가
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 4. 디스크 공간 부족

```bash
# Docker 정리
docker system prune -af
docker volume prune -f
```

---

## 📚 참고 자료

- [GitHub Actions 공식 문서](https://docs.github.com/en/actions)
- [Docker Compose 문서](https://docs.docker.com/compose/)
- [AWS EC2 문서](https://docs.aws.amazon.com/ec2/)
- [EC2 초기 설정 가이드](EC2_SETUP.md)

---

## 🎯 다음 단계

1.  CI/CD 파이프라인 구축 완료
2. ⬜ Nginx 리버스 프록시 설정 (80, 443 포트)
3. ⬜ SSL/TLS 인증서 적용 (Let's Encrypt)
4. ⬜ 도메인 연결
5. ⬜ CloudWatch 로그 수집
6. ⬜ Auto Scaling 설정

---

**작성일**: 2025-12-08
**버전**: 1.0.0
**문의**: wwhow2003@naver.com
