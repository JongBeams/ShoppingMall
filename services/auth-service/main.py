"""
인증 서비스 (MSA)
독립적으로 배포 가능한 마이크로서비스
"""
from fastapi import FastAPI
from app.routers import auth

app = FastAPI(title="Auth Service", version="1.0.0")

app.include_router(auth.router)

@app.get("/health")
async def health():
    return {"service": "auth", "status": "healthy"}
