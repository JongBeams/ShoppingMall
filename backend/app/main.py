from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Routers
from app.routers import auth

load_dotenv()

app = FastAPI(title="ShoppingMall API", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        os.getenv("NEXT_PUBLIC_URL", "http://localhost:3000")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# OPTIONS 요청 전역 핸들러
@app.options("/{full_path:path}")
async def options_handler(request: Request):
    origin = request.headers.get("origin", "http://localhost:3000")
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, Origin, X-Requested-With",
            "Access-Control-Allow-Credentials": "true",
        }
    )

# Routers 등록
app.include_router(auth.router)

@app.get("/")
async def root():
    return {"message": "ShoppingMall API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}