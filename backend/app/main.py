from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

# Routers
from app.routers import auth, admin, product, vendor, notice

app = FastAPI(title="ShoppingMall API", version="1.0.0")

# CORS 설정 - 개발 환경
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # 프론트엔드 URL
    allow_credentials=True,  # 쿠키 사용
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Routers 등록
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(product.router)
app.include_router(vendor.router)
app.include_router(notice.router)

@app.get("/")
async def root():
    return {"message": "ShoppingMall API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# OPTIONS 요청 처리 (CORS preflight)
@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str, request: Request, response: Response):
    origin = request.headers.get("origin", "")
    if origin in ["http://localhost:3000", "http://localhost:3001"]:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return {"message": "OK"}