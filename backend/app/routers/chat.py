from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from typing import Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel
import json
import requests

from app.services.supabase import supabase

router = APIRouter(prefix="/chat", tags=["chat"])


# 일반 채팅 요청 모델
class GeneralChatRequest(BaseModel):
    message: str

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
        print(f"✅ User {user_info.get('user_id')} connected to room {room_id}")

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
                user_info = self.user_info.get(websocket, {})
                print(f"❌ User {user_info.get('user_id')} disconnected from room {room_id}")
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
                    print(f"Error sending message: {e}")

    async def notify_admin(self, message: dict):
        """모든 관리자에게 새 채팅 알림"""
        # 관리자 채팅방 (admin_room)에 연결된 모든 관리자에게 전송
        if "admin_room" in self.active_connections:
            for connection in self.active_connections["admin_room"]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error notifying admin: {e}")

manager = ConnectionManager()


# 채팅방 생성 모델
class ChatRoomCreate(BaseModel):
    user_id: str
    user_name: str


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
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    """사용자/관리자 WebSocket 연결"""
    print(f"🔌 WebSocket 연결 요청: room_id={room_id}")
    print(f"Origin: {websocket.headers.get('origin')}")

    try:
        # 직접 accept (Origin 검증 없이)
        await websocket.accept()
        print(f"✅ WebSocket accept 성공")

        # ConnectionManager에 수동 등록
        if room_id not in manager.active_connections:
            manager.active_connections[room_id] = []
        manager.active_connections[room_id].append(websocket)
        manager.user_info[websocket] = {"room_id": room_id, "user_id": "user"}
        print(f"✅ ConnectionManager 등록 성공: room_id={room_id}")
    except Exception as e:
        print(f"❌ WebSocket 연결 실패: {e}")
        import traceback
        traceback.print_exc()
        raise

    try:
        while True:
            # 메시지 수신
            data = await websocket.receive_text()
            message_data = json.loads(data)

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
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, room_id)


# 관리자 전용 WebSocket (모든 채팅방 모니터링)
@router.websocket("/ws/admin/monitor")
async def admin_monitor_websocket(websocket: WebSocket):
    """관리자가 모든 채팅방을 모니터링하는 WebSocket"""
    await manager.connect(websocket, "admin_room", {"user_id": "admin", "role": "admin"})

    try:
        while True:
            # 관리자로부터 메시지 수신 (특정 방에 대한 응답)
            data = await websocket.receive_text()
            message_data = json.loads(data)

            # 특정 채팅방으로 메시지 전송
            if message_data.get('type') == 'send_to_room':
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
                    'timestamp': saved_message.data[0]['created_at']
                }, room_id)

    except WebSocketDisconnect:
        manager.disconnect(websocket, "admin_room")
    except Exception as e:
        print(f"Admin WebSocket error: {e}")
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
        ollama_host = "http://localhost:11435"

        def generate():
            response = requests.post(
                f"{ollama_host}/api/generate",
                json={
                    "model": "qwen2.5:14b",
                    "prompt": f"""당신은 친절한 쇼핑몰 AI 어시스턴트입니다. 사용자의 질문에 자연스럽고 도움이 되도록 답변하세요.

사용자 질문: {request.message}

답변:""",
                    "stream": True
                },
                stream=True,
                timeout=60
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
        print(f"General chat error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"채팅 중 오류 발생: {str(e)}")


# 상품 추천 RAG API
class SmartChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = None

@router.post("/smart")
async def smart_chat(request: SmartChatRequest):
    """
    상품 추천이 통합된 AI 채팅 (RAG + 상품 통계) - 스트리밍
    사용자 질문에 따라 문서 검색, 상품 추천, 통계 정보를 활용하여 답변 생성
    """
    from app.services.rag_search import search_documents, generate_answer_with_ollama_streaming
    from app.services.product_statistics import (
        get_new_arrivals,
        search_by_tags,
        get_user_purchase_history,
        format_products_for_llm,
        extract_keywords_from_query
    )
    from fastapi.responses import StreamingResponse

    try:
        # 1. 문서 검색
        documents = search_documents(request.message, limit=3)

        # 2. 키워드 추출
        keywords = extract_keywords_from_query(request.message)

        # 3. 상품 데이터 가져오기
        products = []
        product_context = ""

        if keywords:
            products = search_by_tags(keywords, limit=50)
            if products:
                product_context = f"'{', '.join(keywords)}' 관련 상품 목록 (총 {len(products)}개):\n{format_products_for_llm(products, include_reviews=True)}"
        elif request.user_id:
            purchase_history = get_user_purchase_history(request.user_id, limit=5)
            if purchase_history:
                all_tags = []
                for product in purchase_history:
                    if product.get('tags'):
                        all_tags.extend(product['tags'])
                if all_tags:
                    products = search_by_tags(all_tags, limit=50)
                    product_context = f"고객님의 구매 이력:\n{format_products_for_llm(purchase_history, include_reviews=False)}\n\n비슷한 상품:\n{format_products_for_llm(products, include_reviews=True)}"
            else:
                products = get_new_arrivals(limit=50)
                product_context = f"전체 상품 목록 (총 {len(products)}개):\n{format_products_for_llm(products, include_reviews=True)}"
        else:
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
        print(f"Smart chat error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"채팅 중 오류 발생: {str(e)}")
