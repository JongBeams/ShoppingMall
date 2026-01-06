from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Query
from typing import Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel
import json
import requests
import logging


logger = logging.getLogger(__name__)

from app.services.supabase import supabase
from app.services.jwt_auth import decode_token
from app.config import get_settings
from app.config.constants import RECOMMENDATION_KEYWORDS

settings = get_settings()

router = APIRouter(prefix="/chat", tags=["chat"])


# ============================================================
# Pydantic 모델 (입력 검증 강화)
# ============================================================

from pydantic import Field, validator

class GeneralChatRequest(BaseModel):
    """일반 채팅 요청"""
    message: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="채팅 메시지 (1~1000자)"
    )

    @validator('message')
    def validate_message(cls, v):
        # ✅ XSS 방어: HTML 태그 제거
        if '<script' in v.lower() or '<iframe' in v.lower():
            raise ValueError('Potentially malicious content detected')

        # ✅ 공백만 있는 메시지 방지
        if not v.strip():
            raise ValueError('Message cannot be empty or whitespace only')

        return v.strip()

# WebSocket 연결 관리자
class ConnectionManager:
    def __init__(self):
        # {chat_room_id: [websocket1, websocket2, ...]}
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # {websocket: user_info}
        self.user_info: Dict[WebSocket, dict] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_info: dict):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
        self.user_info[websocket] = user_info
        logger.info(f"User {user_info.get('user_id')} connected to room {room_id}")

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
                user_info = self.user_info.get(websocket, {})
                logger.info(f"User {user_info.get('user_id')} disconnected from room {room_id}")
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
        if websocket in self.user_info:
            del self.user_info[websocket]

    async def send_message(self, message: dict, room_id: str):
        """특정 채팅방의 모든 연결된 클라이언트에게 메시지 전송"""
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.info(f"Error sending message: {e}")

    async def notify_admin(self, message: dict):
        """모든 관리자에게 새 채팅 알림"""
        # 관리자 채팅방 (admin_room)에 연결된 모든 관리자에게 전송
        if "admin_room" in self.active_connections:
            for connection in self.active_connections["admin_room"]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.info(f"Error notifying admin: {e}")

manager = ConnectionManager()


class ChatRoomCreate(BaseModel):
    """채팅방 생성 요청"""
    user_id: str = Field(..., min_length=36, max_length=36, description="UUID 형식 사용자 ID")
    user_name: str = Field(..., min_length=1, max_length=50, description="사용자 이름 (1~50자)")

    @validator('user_id')
    def validate_user_id(cls, v):
        # ✅ UUID 형식 검증
        import uuid
        try:
            uuid.UUID(v)
        except ValueError:
            raise ValueError('Invalid UUID format for user_id')
        return v

    @validator('user_name')
    def validate_user_name(cls, v):
        # ✅ XSS 방어
        if '<' in v or '>' in v:
            raise ValueError('Invalid characters in user_name')
        return v.strip()


# 채팅방 생성 API
@router.post("/rooms")
async def create_chat_room(room_data: ChatRoomCreate):
    """사용자가 상담사 연결 버튼 클릭 시 채팅방 생성 - 항상 새로운 방 생성 (waiting 상태)"""
    try:
        # 항상 새로운 채팅방 생성 (waiting 상태로 시작)
        new_room = supabase.table('chat_rooms').insert({
            'user_id': room_data.user_id,
            'user_name': room_data.user_name,
            'status': 'waiting',
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }).execute()

        room_id = new_room.data[0]['id']

        # 관리자에게 새 채팅 알림
        await manager.notify_admin({
            'type': 'new_chat',
            'room_id': room_id,
            'user_name': room_data.user_name,
            'timestamp': datetime.utcnow().isoformat()
        })

        return {"room_id": room_id, "message": "채팅방이 생성되었습니다."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"채팅방 생성 실패: {str(e)}")


# 채팅방 목록 조회 (관리자용)
@router.get("/rooms")
async def get_chat_rooms(status: Optional[str] = None):
    """관리자가 채팅방 목록 조회 - 사용자당 최신 1개만"""
    try:
        query = supabase.table('chat_rooms').select('*').order('created_at', desc=True)

        if status:
            query = query.eq('status', status)

        result = query.execute()

        # 사용자별로 최신 채팅방 1개씩만 필터링
        user_rooms = {}
        for room in result.data:
            user_id = room['user_id']
            if user_id not in user_rooms:
                user_rooms[user_id] = room

        filtered_rooms = list(user_rooms.values())
        # 최신순 정렬
        filtered_rooms.sort(key=lambda x: x['created_at'], reverse=True)

        return {"rooms": filtered_rooms}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"채팅방 목록 조회 실패: {str(e)}")


# 채팅 메시지 히스토리 조회
@router.get("/rooms/{room_id}/messages")
async def get_chat_messages(room_id: str):
    """특정 채팅방의 메시지 히스토리 조회"""
    try:
        result = supabase.table('chat_messages').select('*').eq('room_id', room_id).order('created_at', desc=False).execute()
        return {"messages": result.data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"메시지 조회 실패: {str(e)}")


# 채팅방 상태 변경
@router.patch("/rooms/{room_id}/status")
async def update_room_status(room_id: str, status: str, admin_id: Optional[str] = None, admin_name: Optional[str] = None):
    """채팅방 상태 변경 (waiting, active, closed)"""
    try:
        update_data = {
            'status': status,
            'updated_at': datetime.utcnow().isoformat()
        }

        # active로 변경 시 관리자 정보 저장
        if status == 'active' and admin_id and admin_name:
            update_data['admin_id'] = admin_id
            update_data['admin_name'] = admin_name

        result = supabase.table('chat_rooms').update(update_data).eq('id', room_id).execute()

        # 상태 변경을 해당 채팅방에 알림
        await manager.send_message({
            'type': 'status_changed',
            'status': status,
            'admin_name': admin_name,
            'timestamp': datetime.utcnow().isoformat()
        }, room_id)

        return {"message": f"채팅방 상태가 {status}로 변경되었습니다."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"상태 변경 실패: {str(e)}")


# 채팅방 종료 API
@router.post("/rooms/{room_id}/close")
async def close_chat_room(room_id: str):
    """사용자가 X 버튼 클릭 시 채팅방 종료"""
    try:
        supabase.table('chat_rooms').update({
            'status': 'closed',
            'updated_at': datetime.utcnow().isoformat()
        }).eq('id', room_id).execute()

        # 관리자에게 알림
        await manager.notify_admin({
            'type': 'chat_closed',
            'room_id': room_id,
            'timestamp': datetime.utcnow().isoformat()
        })

        return {"message": "채팅방이 종료되었습니다."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"채팅방 종료 실패: {str(e)}")


# WebSocket 엔드포인트 - 사용자용
@router.websocket("/ws/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: str,
    token: Optional[str] = Query(None)
):
    """
    사용자/관리자 WebSocket 연결 (JWT 인증 필요)

    Args:
        websocket: WebSocket 연결
        room_id: 채팅방 ID
        token: JWT Access Token (쿼리 파라미터로 전달)

    보안:
        - JWT 토큰 검증
        - room_id 존재 여부 확인
        - Origin 검증 (CORS)
    """
    logger.info(f"WebSocket 연결 요청: room_id={room_id}")
    origin = websocket.headers.get('origin', '')
    logger.info(f"Origin: {origin}")

    try:
        # ✅ 1. JWT 토큰 검증
        if not token:
            logger.warning(f"[WebSocket] Missing token for room {room_id}")
            await websocket.close(code=4001, reason="Missing authentication token")
            return

        try:
            payload = decode_token(token)
            user_id = payload.get('sub')
            # JWT 토큰의 실제 필드명은 'type'이며, 'admin' 또는 일반 사용자
            user_type = payload.get('type', 'user')

            if not user_id:
                logger.warning(f"[WebSocket] Invalid token payload for room {room_id}")
                await websocket.close(code=4001, reason="Invalid token")
                return

            logger.info(f"[WebSocket] Authenticated user: {user_id} (type: {user_type})")

        except Exception as e:
            logger.error(f"[WebSocket] Token verification failed: {e}")
            await websocket.close(code=4001, reason="Invalid or expired token")
            return

        # ✅ 2. room_id 검증 (존재 여부)
        try:
            room = supabase.table('chat_rooms').select('*').eq('id', room_id).execute()
            if not room.data:
                logger.warning(f"[WebSocket] Invalid room_id: {room_id}")
                await websocket.close(code=4004, reason="Room not found")
                return

            # 사용자가 본인의 채팅방만 접근 가능 (관리자는 제외)
            if user_type != 'admin' and room.data[0].get('user_id') != user_id:
                logger.warning(f"[WebSocket] Unauthorized access: user {user_id} trying to access room {room_id}")
                await websocket.close(code=4003, reason="Unauthorized")
                return

        except Exception as e:
            logger.error(f"[WebSocket] Room validation error: {e}")
            await websocket.close(code=4000, reason="Server error")
            return

        # ✅ 3. Origin 검증 (CORS)
        allowed_origins = settings.ALLOWED_ORIGINS.split(',') if hasattr(settings, 'ALLOWED_ORIGINS') else ['http://localhost:3000']
        if origin and origin not in allowed_origins:
            logger.warning(f"[WebSocket] Blocked origin: {origin}")
            await websocket.close(code=4003, reason="Origin not allowed")
            return

        # ✅ 4. WebSocket 연결 수락
        await websocket.accept()
        logger.info(f"[WebSocket] Connection accepted for user {user_id} in room {room_id}")

        # ConnectionManager에 등록
        if room_id not in manager.active_connections:
            manager.active_connections[room_id] = []
        manager.active_connections[room_id].append(websocket)
        manager.user_info[websocket] = {
            "room_id": room_id,
            "user_id": user_id,
            "user_type": user_type
        }

    except Exception as e:
        logger.critical(f"[WebSocket] Connection setup failed: {e}", exc_info=True)
        try:
            await websocket.close(code=4000, reason="Server error")
        except:
            pass
        return

    try:
        while True:
            # 메시지 수신
            data = await websocket.receive_text()
            message_data = json.loads(data)

            message_type = message_data.get('type', 'message')

            # 원격 제어 이벤트 처리 (관리자 ↔ 사용자)
            if message_type in ['remote_click', 'remote_scroll', 'remote_input', 'remote_input_text', 'remote_keydown', 'scroll_sync', 'remote_control_start', 'remote_control_stop']:
                # DB 저장 없이 바로 브로드캐스트
                await manager.send_message(message_data, room_id)

                # 원격 제어 시작/종료는 관리자에게도 알림
                if message_type in ['remote_control_start', 'remote_control_stop']:
                    await manager.notify_admin({
                        'type': message_type,
                        'room_id': room_id
                    })

                continue

            # WebRTC 시그널링 처리
            if message_type in ['webrtc_offer', 'webrtc_answer', 'webrtc_ice_candidate']:
                logger.info(f"🔴 WebRTC 메시지 수신: type={message_type}, room_id={room_id}")
                logger.info(f"🔴 현재 방의 연결 수: {len(manager.active_connections.get(room_id, []))}")
                # DB 저장 없이 바로 브로드캐스트 (관리자 ↔ 사용자)
                await manager.send_message(message_data, room_id)
                logger.info(f" WebRTC 메시지 브로드캐스트 완료")
                continue

            # 일반 채팅 메시지
            # DB에 메시지 저장
            saved_message = supabase.table('chat_messages').insert({
                'room_id': room_id,
                'sender_type': message_data.get('sender_type', 'user'),  # user or admin
                'sender_id': message_data.get('sender_id'),
                'sender_name': message_data.get('sender_name'),
                'message': message_data.get('message'),
                'created_at': datetime.utcnow().isoformat()
            }).execute()

            # 같은 채팅방의 모든 연결에 메시지 브로드캐스트
            broadcast_message = {
                'type': 'message',
                'id': saved_message.data[0]['id'],
                'room_id': room_id,
                'sender_type': message_data.get('sender_type', 'user'),
                'sender_id': message_data.get('sender_id'),
                'sender_name': message_data.get('sender_name'),
                'message': message_data.get('message'),
                'timestamp': saved_message.data[0]['created_at']
            }

            await manager.send_message(broadcast_message, room_id)

            # 관리자에게도 알림 (관리자가 다른 방에 있을 경우)
            if message_data.get('sender_type') == 'user':
                await manager.notify_admin({
                    'type': 'new_message',
                    'room_id': room_id,
                    'sender_name': message_data.get('sender_name'),
                    'message': message_data.get('message'),
                    'timestamp': saved_message.data[0]['created_at']
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
    except Exception as e:
        logger.info(f"WebSocket error: {e}")
        manager.disconnect(websocket, room_id)


# 관리자 전용 WebSocket (모든 채팅방 모니터링)
@router.websocket("/ws/admin/monitor")
async def admin_monitor_websocket(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
):
    """
    관리자가 모든 채팅방을 모니터링하는 WebSocket

    Args:
        websocket: WebSocket 연결
        token: JWT Access Token (쿼리 파라미터로 전달)

    보안:
        - JWT 토큰 검증
        - 관리자 권한 확인
    """
    logger.info("[WebSocket] 관리자 모니터 연결 요청")

    # ✅ 1. JWT 토큰 검증 (연결 수락 전에 검증)
    if not token:
        logger.warning("[WebSocket] Missing admin token")
        # WebSocket을 accept하지 않고 바로 종료하면 프론트엔드에서 에러가 발생함
        # accept 후 close 해야 함
        await websocket.accept()
        await websocket.close(code=4001, reason="Missing authentication token")
        return

    try:
        payload = decode_token(token)
        user_id = payload.get('sub')
        user_type = payload.get('type')  # 'admin' 또는 'user'

        if not user_id:
            logger.warning("[WebSocket] Invalid token payload")
            await websocket.accept()
            await websocket.close(code=4001, reason="Invalid token")
            return

        # 관리자 권한 확인
        if user_type != 'admin':
            logger.warning(f"[WebSocket] Unauthorized access attempt by user {user_id}")
            await websocket.accept()
            await websocket.close(code=4003, reason="Admin access only")
            return

        logger.info(f"[WebSocket] Authenticated admin: {user_id}")

    except Exception as e:
        logger.error(f"[WebSocket] Admin token verification failed: {e}")
        await websocket.accept()
        await websocket.close(code=4001, reason="Invalid or expired token")
        return

    # ✅ 2. ConnectionManager에 연결 (내부에서 websocket.accept() 호출)
    await manager.connect(websocket, "admin_room", {"user_id": user_id, "role": "admin"})
    logger.info(f"[WebSocket] Admin monitor connection accepted for user {user_id}")

    try:
        while True:
            # 관리자로부터 메시지 수신 (특정 방에 대한 응답)
            data = await websocket.receive_text()
            message_data = json.loads(data)

            message_type = message_data.get('type')

            # 원격 제어 이벤트 (관리자 → 사용자)
            if message_type in ['remote_click', 'remote_scroll', 'remote_input', 'remote_control_start', 'remote_control_stop']:
                room_id = message_data.get('room_id')
                # DB 저장 없이 바로 브로드캐스트
                await manager.send_message(message_data, room_id)
                continue

            # 특정 채팅방으로 메시지 전송
            if message_type == 'send_to_room':
                room_id = message_data.get('room_id')

                # DB에 저장
                saved_message = supabase.table('chat_messages').insert({
                    'room_id': room_id,
                    'sender_type': 'admin',
                    'sender_id': message_data.get('sender_id'),
                    'sender_name': message_data.get('sender_name', '상담사'),
                    'message': message_data.get('message'),
                    'created_at': datetime.utcnow().isoformat()
                }).execute()

                # 해당 채팅방에 메시지 전송
                await manager.send_message({
                    'type': 'message',
                    'id': saved_message.data[0]['id'],
                    'room_id': room_id,
                    'sender_type': 'admin',
                    'sender_id': message_data.get('sender_id'),
                    'sender_name': message_data.get('sender_name', '상담사'),
                    'message': message_data.get('message'),
                    'timestamp': saved_message.data[0]['created_at'],
                    'is_remote_support_request': message_data.get('is_remote_support_request', False)
                }, room_id)

    except WebSocketDisconnect:
        manager.disconnect(websocket, "admin_room")
    except Exception as e:
        logger.info(f"Admin WebSocket error: {e}")
        manager.disconnect(websocket, "admin_room")


# 일반 AI 채팅 API (Ollama 직접 호출 - 스트리밍)
@router.post("/general")
async def general_chat(request: GeneralChatRequest):
    """
    일반 대화용 AI 채팅 (스트리밍)
    문서 검색 없이 Ollama로 직접 답변 생성
    """
    from fastapi.responses import StreamingResponse

    try:
        def generate():
            response = requests.post(
                f"{settings.OLLAMA_HOST}/api/generate",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": f"""당신은 친절한 쇼핑몰 AI 어시스턴트입니다. 사용자의 질문에 자연스럽고 도움이 되도록 답변하세요.

사용자 질문: {request.message}

답변:""",
                    "stream": True
                },
                stream=True,
                timeout=settings.OLLAMA_TIMEOUT
            )

            for line in response.iter_lines():
                if line:
                    try:
                        chunk = json.loads(line)
                        if "response" in chunk:
                            yield f"data: {json.dumps({'token': chunk['response']})}\n\n"
                        if chunk.get("done", False):
                            yield f"data: {json.dumps({'done': True})}\n\n"
                    except json.JSONDecodeError:
                        continue

        return StreamingResponse(generate(), media_type="text/event-stream")

    except Exception as e:
        logger.info(f"General chat error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"채팅 중 오류 발생: {str(e)}")


class SmartChatRequest(BaseModel):
    """스마트 챗 요청 (RAG + 개인화)"""
    message: str = Field(..., min_length=1, max_length=500, description="사용자 질문 (1~500자)")
    user_id: Optional[str] = Field(None, min_length=36, max_length=36, description="사용자 ID (UUID)")

    @validator('message')
    def validate_message(cls, v):
        # ✅ XSS 방어
        if '<script' in v.lower() or '<iframe' in v.lower():
            raise ValueError('Potentially malicious content detected')
        if not v.strip():
            raise ValueError('Message cannot be empty')
        return v.strip()

    @validator('user_id')
    def validate_user_id(cls, v):
        if v is None:
            return v
        # ✅ UUID 검증
        import uuid
        try:
            uuid.UUID(v)
        except ValueError:
            raise ValueError('Invalid UUID format for user_id')
        return v

@router.post("/smart")
async def smart_chat(request: SmartChatRequest):
    """
    상품 추천이 통합된 AI 채팅 (RAG + 개인화 추천) - 스트리밍
    사용자 질문에 따라 문서 검색, 구매 패턴 분석, 맞춤 상품 추천
    """
    from app.services.rag_search import search_documents, generate_answer_with_ollama_streaming
    from app.services.product_statistics import (
        get_new_arrivals,
        search_by_tags,
        format_products_for_llm,
        extract_keywords_from_query
    )
    from app.services.personalized_recommendation import (
        get_personalized_recommendations,
        format_personalized_recommendations_for_llm
    )
    from fastapi.responses import StreamingResponse

    try:
        # 1. 문서 검색
        documents = search_documents(request.message, limit=3)

        # 2. 키워드 추출
        keywords = extract_keywords_from_query(request.message)

        # 3. 상품 데이터 가져오기 - 개인화 우선
        products = []
        product_context = ""

        # 추천 관련 키워드 감지
        is_recommendation_query = any(kw in request.message for kw in RECOMMENDATION_KEYWORDS)

        if keywords:
            # 특정 키워드가 있으면 키워드 검색 우선
            products = search_by_tags(keywords, limit=50)
            if products:
                product_context = f"'{', '.join(keywords)}' 관련 상품 목록 (총 {len(products)}개):\n{format_products_for_llm(products, include_reviews=True)}"
        elif request.user_id and is_recommendation_query:
            # ⭐ 개인화 추천: "추천해줘" 같은 질문에 구매 패턴 분석 기반 추천
            personalized = get_personalized_recommendations(request.user_id, limit=50)

            if personalized['recommendations']:
                products = personalized['recommendations']
                product_context = format_personalized_recommendations_for_llm(personalized)
            else:
                # fallback: 베스트셀러
                products = get_new_arrivals(limit=50)
                product_context = f"전체 상품 목록 (총 {len(products)}개):\n{format_products_for_llm(products, include_reviews=True)}"
        else:
            # 기본: 신상품
            products = get_new_arrivals(limit=50)
            product_context = f"전체 상품 목록 (총 {len(products)}개):\n{format_products_for_llm(products, include_reviews=True)}"

        # 4. 스트리밍 생성 함수
        def generate():
            full_answer = ""

            # 상품 정보 먼저 전송
            yield f"data: {json.dumps({'type': 'products', 'products': products})}\n\n"

            # 스트리밍 답변 생성
            for chunk in generate_answer_with_ollama_streaming(request.message, documents, product_context):
                if "token" in chunk:
                    full_answer += chunk["token"]
                    yield f"data: {json.dumps({'type': 'token', 'token': chunk['token']})}\n\n"
                elif "done" in chunk:
                    # 스트리밍 완료 후 LLM이 언급한 상품만 필터링
                    mentioned_products = []
                    for product in products:
                        if product['name'] in full_answer:
                            mentioned_products.append(product)

                    # 최종 상품 목록 전송
                    final_products = mentioned_products[:10] if mentioned_products else products[:5]
                    yield f"data: {json.dumps({'type': 'products_final', 'products': final_products})}\n\n"
                    yield f"data: {json.dumps({'type': 'done', 'done': True})}\n\n"
                elif "error" in chunk:
                    yield f"data: {json.dumps({'type': 'error', 'error': chunk['error']})}\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream")

    except Exception as e:
        logger.info(f"Smart chat error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"채팅 중 오류 발생: {str(e)}")
