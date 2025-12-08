# EC2 배포 가이드

이 문서는 AWS EC2에 쇼핑몰 애플리케이션을 배포하는 전체 프로세스를 설명합니다.

---

## 📋 목차

1. [EC2 인스턴스 생성](#1-ec2-인스턴스-생성)
2. [초기 서버 설정](#2-초기-서버-설정)
3. [GitHub Secrets 설정](#3-github-secrets-설정)
4. [수동 배포 (첫 배포)](#4-수동-배포-첫-배포)
5. [자동 배포 (CI/CD)](#5-자동-배포-cicd)
6. [모니터링 및 로그](#6-모니터링-및-로그)
7. [트러블슈팅](#7-트러블슈팅)

---

## 1. EC2 인스턴스 생성

### 1.1 인스턴스 사양 권장사항

| 항목 | 권장 사양 | 최소 사양 |
|------|-----------|-----------|
| 인스턴스 타입 | `t3.medium` (2 vCPU, 4GB RAM) | `t3.small` (2 vCPU, 2GB RAM) |
| 스토리지 | 30GB gp3 | 20GB gp3 |
| OS | Ubuntu 22.04 LTS | Ubuntu 20.04 LTS |
| 보안 그룹 | 80, 443, 22, 8000, 3000 | 22, 80, 443 |

### 1.2 AWS Console에서 생성

```bash
# 1. EC2 Dashboard > Launch Instance
# 2. Name: shoppingmall-prod
# 3. OS: Ubuntu Server 22.04 LTS
# 4. Instance type: t3.medium
# 5. Key pair: 새로 생성 (shoppingmall-key.pem 다운로드)
# 6. Network: VPC 기본값
# 7. Storage: 30GB gp3
# 8. Launch Instance
```

### 1.3 보안 그룹 설정

```bash
Inbound Rules:
- SSH (22): My IP (또는 특정 IP)
- HTTP (80): 0.0.0.0/0
- HTTPS (443): 0.0.0.0/0
- Custom TCP (8000): 0.0.0.0/0  # Backend API
- Custom TCP (3000): 0.0.0.0/0  # Frontend (임시, Nginx 설정 후 제거)
```

### 1.4 Elastic IP 할당 (권장)

```bash
# EC2 > Elastic IPs > Allocate Elastic IP address
# 생성된 IP를 인스턴스에 연결
```

---

## 2. 초기 서버 설정

### 2.1 SSH 접속

```bash
# Windows (PowerShell)
ssh -i "shoppingmall-key.pem" ubuntu@<EC2_PUBLIC_IP>

# Mac/Linux
chmod 400 shoppingmall-key.pem
ssh -i "shoppingmall-key.pem" ubuntu@<EC2_PUBLIC_IP>
```

### 2.2 시스템 업데이트

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.3 Docker 설치

```bash
# Docker 공식 스크립트로 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose 설치
sudo apt install docker-compose-plugin -y

# 사용자를 docker 그룹에 추가 (sudo 없이 docker 실행)
sudo usermod -aG docker $USER

# 재로그인 (또는 시스템 재시작)
exit
# SSH 재접속
```

### 2.4 Git 설치 및 프로젝트 클론

```bash
# Git 설치
sudo apt install git -y

# 프로젝트 클론
cd /home/ubuntu
git clone https://github.com/your-username/shoppingmall.git

# 디렉토리 이동
cd shoppingmall
```

### 2.5 환경 변수 파일 생성

```bash
# .env.production 파일 생성
nano .env.production
```

**`.env.production` 내용**:
```bash
# Docker Hub
DOCKER_USERNAME=your-docker-username

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
SECRET_KEY=your-super-secret-key-min-32-chars

# Redis
REDIS_PASSWORD=your-redis-password

# Toss Payments
TOSS_SECRET_KEY=live_sk_your_secret_key
TOSS_CLIENT_KEY=live_ck_your_client_key

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com

# Ollama (로컬 또는 외부 서버)
OLLAMA_HOST=http://localhost:11434

# URLs
BACKEND_URL=http://<EC2_PUBLIC_IP>:8000
FRONTEND_URL=http://<EC2_PUBLIC_IP>:3000
ALLOWED_ORIGINS=http://<EC2_PUBLIC_IP>:3000,https://yourdomain.com
```

**저장**: `Ctrl + O` → `Enter` → `Ctrl + X`

### 2.6 Ollama 설치 (AI 기능 사용 시)

```bash
# Ollama 설치
curl -fsSL https://ollama.com/install.sh | sh

# LLM 모델 다운로드
ollama pull qwen2.5:14b

# Ollama 서비스 시작
sudo systemctl enable ollama
sudo systemctl start ollama
```

---

## 3. GitHub Secrets 설정

GitHub Repository > Settings > Secrets and variables > Actions > New repository secret

### 3.1 필수 Secrets

| Secret Name | 설명 | 예시 |
|-------------|------|------|
| `DOCKER_USERNAME` | Docker Hub 사용자명 | `johndoe` |
| `DOCKER_PASSWORD` | Docker Hub 비밀번호 | `your-docker-password` |
| `EC2_HOST` | EC2 Public IP | `52.78.123.456` |
| `EC2_USERNAME` | SSH 사용자명 | `ubuntu` |
| `EC2_SSH_KEY` | SSH Private Key (`.pem` 파일 내용 전체) | `-----BEGIN RSA PRIVATE KEY-----...` |
| `AWS_ACCESS_KEY_ID` | AWS IAM Access Key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM Secret Key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Anon Key | `eyJxxx...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | `eyJxxx...` |
| `SECRET_KEY` | JWT Secret Key (32자 이상) | `super-secret-key-min-32-chars` |
| `REDIS_PASSWORD` | Redis 비밀번호 | `redis-strong-password` |
| `TOSS_SECRET_KEY` | 토스페이먼츠 Secret Key | `live_sk_xxx` |
| `TOSS_CLIENT_KEY` | 토스페이먼츠 Client Key | `live_ck_xxx` |
| `BACKEND_URL` | Backend URL | `http://52.78.123.456:8000` |
| `FRONTEND_URL` | Frontend URL | `http://52.78.123.456:3000` |
| `ALLOWED_ORIGINS` | CORS 허용 도메인 | `http://52.78.123.456:3000` |
| `SLACK_WEBHOOK_URL` | Slack Webhook URL (선택) | `https://hooks.slack.com/xxx` |

### 3.2 SSH Private Key 설정

```bash
# 로컬에서 shoppingmall-key.pem 내용 복사
cat shoppingmall-key.pem

# GitHub Secrets에 EC2_SSH_KEY로 등록
# -----BEGIN RSA PRIVATE KEY----- 부터 끝까지 전체 복사
```

---

## 4. 수동 배포 (첫 배포)

### 4.1 EC2에서 첫 배포

```bash
# EC2 SSH 접속
ssh -i "shoppingmall-key.pem" ubuntu@<EC2_PUBLIC_IP>

# 프로젝트 디렉토리
cd /home/ubuntu/shoppingmall

# 환경 변수 로드
source .env.production

# Docker Hub 로그인
docker login -u $DOCKER_USERNAME

# 이미지 Pull
docker compose -f docker-compose.prod.yml pull

# 컨테이너 시작
docker compose -f docker-compose.prod.yml up -d

# 로그 확인
docker compose -f docker-compose.prod.yml logs -f
```

### 4.2 배포 스크립트 사용

```bash
# 배포 스크립트 실행 권한 부여
chmod +x scripts/deploy.sh

# 배포 실행
./scripts/deploy.sh
```

### 4.3 Health Check

```bash
# Backend Health Check
curl http://localhost:8000/health

# Frontend Health Check
curl http://localhost:3000

# 컨테이너 상태 확인
docker compose -f docker-compose.prod.yml ps
```

---

## 5. 자동 배포 (CI/CD)

### 5.1 배포 플로우

```
main 브랜치에 Push
  ↓
GitHub Actions CI 실행 (Lint, Build Check)
  ↓
Docker 이미지 빌드 및 Docker Hub에 Push
  ↓
EC2에 SSH 접속
  ↓
docker compose pull (최신 이미지 다운로드)
  ↓
docker compose down (기존 컨테이너 중지)
  ↓
docker compose up -d (새 컨테이너 시작)
  ↓
Health Check
  ↓
Slack 알림 (성공/실패)
```

### 5.2 배포 트리거

```bash
# main 브랜치에 Push하면 자동 배포
git add .
git commit -m "Deploy: Add new feature"
git push origin main
```

### 5.3 수동 배포 트리거

```bash
# GitHub > Actions > CD - Deploy to EC2 > Run workflow
```

### 5.4 배포 모니터링

```bash
# GitHub Actions 페이지에서 실시간 로그 확인
# https://github.com/your-username/shoppingmall/actions

# EC2에서 로그 확인
ssh -i "shoppingmall-key.pem" ubuntu@<EC2_PUBLIC_IP>
cd /home/ubuntu/shoppingmall
docker compose -f docker-compose.prod.yml logs -f
```

---

## 6. 모니터링 및 로그

### 6.1 컨테이너 로그

```bash
# 전체 로그 (실시간)
docker compose -f docker-compose.prod.yml logs -f

# Backend 로그만
docker compose -f docker-compose.prod.yml logs -f backend

# Frontend 로그만
docker compose -f docker-compose.prod.yml logs -f frontend

# 최근 100줄
docker compose -f docker-compose.prod.yml logs --tail=100
```

### 6.2 시스템 리소스 모니터링

```bash
# CPU, 메모리 사용량
docker stats

# 디스크 사용량
df -h

# 프로세스 확인
top
```

### 6.3 자동 재시작 설정

```yaml
# docker-compose.prod.yml에 이미 설정됨
restart: always
```

---

## 7. 트러블슈팅

### 7.1 컨테이너가 시작되지 않음

```bash
# 로그 확인
docker compose -f docker-compose.prod.yml logs

# 환경 변수 확인
cat .env.production

# 포트 충돌 확인
sudo netstat -tuln | grep -E '8000|3000|6379'
```

### 7.2 메모리 부족

```bash
# Swap 메모리 추가 (2GB)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 영구 설정
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 7.3 디스크 공간 부족

```bash
# Docker 정리
docker system prune -af
docker volume prune -f

# 로그 파일 정리
sudo journalctl --vacuum-time=3d
```

### 7.4 롤백

```bash
# 이전 버전으로 롤백
./scripts/rollback.sh

# 특정 버전으로 롤백 (Git Commit SHA)
./scripts/rollback.sh abc1234
```

### 7.5 Ollama 연결 오류

```bash
# Ollama 서비스 상태 확인
sudo systemctl status ollama

# Ollama 재시작
sudo systemctl restart ollama

# 모델 재다운로드
ollama pull qwen2.5:14b
```

---

## 📚 참고 자료

- [Docker Compose 문서](https://docs.docker.com/compose/)
- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [AWS EC2 문서](https://docs.aws.amazon.com/ec2/)
- [Nginx 설정 가이드](https://nginx.org/en/docs/)

---

**작성일**: 2025-12-08
**버전**: 1.0.0
