from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

# Routers
from app.routers import auth, admin, product, vendor, notice, faq, inquiry, chat, cart, documents, orders, reviews, payment, gift_wizard, subscriptions

app = FastAPI(title="ShoppingMall API", version="1.0.0")

# CORS 설정 - 개발 환경 (WebSocket 포함)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발 환경에서 모든 origin 허용
    allow_credentials=False,  # allow_origins=["*"]일 때는 False여야 함
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
app.include_router(faq.router)
app.include_router(inquiry.router)
app.include_router(chat.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(reviews.router)
app.include_router(documents.router)
app.include_router(payment.router)
app.include_router(gift_wizard.router)
app.include_router(subscriptions.router)

@app.get("/")
async def root():
    return {"message": "ShoppingMall API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# WebSocket 테스트 엔드포인트
from fastapi import WebSocket
@app.websocket("/test-ws")
async def test_websocket(websocket: WebSocket):
    print("테스트 WebSocket 연결 요청!")
    await websocket.accept()
    print("테스트 WebSocket 연결 성공!")
    await websocket.send_text("Hello from WebSocket!")
    await websocket.close()

