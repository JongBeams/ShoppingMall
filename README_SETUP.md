

### 설치 스크립트 실행

```bash
# macOS/Linux
python3 setup.py

# Windows
python setup.py
```

### 수동 설치 (setup.py 대신)

#### macOS/Linux:
```bash
# 백엔드 의존성 설치
pip3 install -r requirements.txt

# 프론트엔드 의존성 설치
cd frontend
npm install
```

#### Windows:
```bash
# 백엔드 의존성 설치
pip install -r requirements.txt

# 프론트엔드 의존성 설치
cd frontend
npm install
```


## 프로젝트 구조

```
ShoppingMall/
├── app/                    # Next.js 프론트엔드 (포트 3000)
│   ├── (auth)/            # 인증 페이지
│   ├── products/          # 상품 페이지
│   ├── cart/              # 장바구니
│   └── components/        # 공통 컴포넌트
├── backend/               # FastAPI 백엔드 (포트 8000)
│   ├── app/
│   │   └── main.py       # FastAPI 엔트리포인트
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env              # 백엔드 환경변수
├── docker-compose.yml     # Docker 구성
├── setup.py              # 자동 설치 스크립트
└── .env.local            # 프론트엔드 환경변수
```



