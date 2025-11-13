from fastapi import FastAPI
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
        os.getenv("NEXT_PUBLIC_URL", "http://localhost:3000")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers 등록
app.include_router(auth.router)

@app.get("/")
async def root():
    return {"message": "ShoppingMall API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}