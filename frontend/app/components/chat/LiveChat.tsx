'use client';

import { useEffect, useState, useRef } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000';

interface Message {
  id?: string;
  sender_type: 'user' | 'admin';
  sender_id: string;
  sender_name: string;
  message: string;
  timestamp?: string;
}

interface LiveChatProps {
  onBack: () => void;
}

export default function LiveChat({ onBack }: LiveChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 채팅방 생성 및 WebSocket 연결
  useEffect(() => {
    // React Strict Mode 중복 실행 방지
    if (initRef.current) return;
    initRef.current = true;

    let websocket: WebSocket | null = null;

    const initChat = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) {
          console.error('사용자 정보가 없습니다.');
          setIsLoading(false);
          return;
        }

        const user = JSON.parse(userData);

        // 1. 채팅방 생성
        const response = await fetch(`${API_BASE_URL}/chat/rooms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            user_name: user.full_name || '고객'
          })
        });

        if (!response.ok) {
          throw new Error('채팅방 생성 실패');
        }

        const data = await response.json();
        const chatRoomId = data.room_id;
        setRoomId(chatRoomId);

        // 2. 기존 메시지 히스토리 로드
        const historyResponse = await fetch(`${API_BASE_URL}/chat/rooms/${chatRoomId}/messages`);
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setMessages(historyData.messages || []);
        }

        // 3. WebSocket 연결
        console.log('🔌 WebSocket 연결 시도:', `${WS_BASE_URL}/chat/ws/${chatRoomId}`);
        websocket = new WebSocket(`${WS_BASE_URL}/chat/ws/${chatRoomId}`);

        websocket.onopen = () => {
          console.log('✅ WebSocket 연결됨');
          setIsLoading(false);
        };

        websocket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('📨 메시지 수신:', data);

          if (data.type === 'message') {
            setMessages(prev => [...prev, {
              id: data.id,
              sender_type: data.sender_type,
              sender_id: data.sender_id,
              sender_name: data.sender_name,
              message: data.message,
              timestamp: data.timestamp
            }]);
          } else if (data.type === 'status_changed') {
            console.log('상태 변경:', data.status);
            if (data.status === 'active') {
              setIsConnected(true);
              setMessages(prev => [...prev, {
                sender_type: 'admin',
                sender_id: 'system',
                sender_name: '시스템',
                message: `${data.admin_name || '상담사'}님이 연결되었습니다.`,
                timestamp: data.timestamp
              }]);
            }
          }
        };

        websocket.onerror = (error) => {
          console.error('❌ WebSocket 에러:', error);
          setIsLoading(false);
        };

        websocket.onclose = (event) => {
          console.log('❌ WebSocket 연결 종료', event.code, event.reason);
          setIsConnected(false);
        };

        ws.current = websocket;

      } catch (error) {
        console.error('채팅 초기화 실패:', error);
        setIsLoading(false);
      }
    };

    initChat();

    // 컴포넌트 언마운트 시 WebSocket 연결 종료 및 채팅방 종료
    return () => {
      if (websocket) {
        websocket.close();
      }
      if (roomId) {
        fetch(`${API_BASE_URL}/chat/rooms/${roomId}/close`, {
          method: 'POST',
        }).catch(err => console.error('채팅방 종료 실패:', err));
      }
    };
  }, []);

  const handleSend = () => {
    if (!input.trim() || !ws.current || !roomId) return;

    const userData = localStorage.getItem('user');
    if (!userData) return;

    const user = JSON.parse(userData);

    const message = {
      sender_type: 'user',
      sender_id: user.id,
      sender_name: user.full_name || '고객',
      message: input.trim()
    };

    // WebSocket으로 메시지 전송
    ws.current.send(JSON.stringify(message));
    setInput('');
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-500"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">연결 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* 상태 표시 */}
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {isConnected ? '상담사 연결됨' : '상담사 연결 대기 중...'}
            </span>
          </div>
          <button
            onClick={onBack}
            className="flex items-center justify-center text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-300"
            title="채팅 종료"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div className="space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                <svg className="h-7 w-7 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                {isConnected
                  ? '상담사와 연결되었습니다.\n궁금하신 점을 말씀해주세요!'
                  : '무엇을 도와드릴까요?\n문의 내용을 입력해주세요.'}
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex max-w-[75%] flex-col gap-1">
                {msg.sender_type === 'admin' && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 px-2">
                    {msg.sender_name}
                  </span>
                )}
                <div
                  className={`rounded-2xl px-3.5 py-2.5 ${
                    msg.sender_type === 'user'
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                </div>
                {msg.timestamp && (
                  <span className="text-xs text-gray-400 px-2">
                    {new Date(msg.timestamp).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isConnected ? "메시지 입력..." : "문의 내용을 입력하세요..."}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-white transition hover:bg-gray-800 disabled:opacity-40 disabled:hover:bg-gray-900 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
