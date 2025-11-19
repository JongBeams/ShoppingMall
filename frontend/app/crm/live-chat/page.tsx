'use client';

import { useEffect, useState, useRef } from 'react';
import CRMLayout from '../components/CRMLayout';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000';

interface ChatRoom {
  id: string;
  user_id: string;
  user_name: string;
  status: 'waiting' | 'active' | 'closed';
  created_at: string;
}

interface Message {
  id: string;
  sender_type: 'user' | 'admin';
  sender_name: string;
  message: string;
  created_at: string;
}

export default function LiveChatPage() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'waiting' | 'active' | 'closed'>('all');
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef<boolean>(false);

  useEffect(() => {
    if (shouldScrollRef.current && messagesContainerRef.current) {
      // 채팅 컨테이너 내부에서만 스크롤 (페이지 전체 스크롤 방지)
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      shouldScrollRef.current = false;
    }
  }, [messages]);

  const fetchChatRooms = async () => {
    try {
      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/chat/rooms`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setChatRooms(data.rooms || []);
      }
    } catch (error) {
      console.error('채팅방 목록 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChatRooms();
    const interval = setInterval(fetchChatRooms, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let result = [...chatRooms];
    if (searchQuery) {
      result = result.filter(room => room.user_name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (statusFilter !== 'all') {
      result = result.filter(room => room.status === statusFilter);
    }
    setFilteredRooms(result);
  }, [chatRooms, searchQuery, statusFilter]);

  useEffect(() => {
    const websocket = new WebSocket(`${WS_BASE_URL}/chat/ws/admin/monitor`);
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_chat') {
        fetchChatRooms();
      } else if (data.type === 'new_message') {
        fetchChatRooms();
        // 현재 선택된 채팅방의 새 메시지면 UI 업데이트 + 스크롤
        if (selectedRoom && data.room_id === selectedRoom.id) {
          fetchMessages(selectedRoom.id);
          shouldScrollRef.current = true;
        }
      } else if (data.type === 'message' && selectedRoom && data.room_id === selectedRoom.id) {
        setMessages(prev => [...prev, data]);
        shouldScrollRef.current = true;
      }
    };
    ws.current = websocket;
    return () => websocket.close();
  }, [selectedRoom]);

  const fetchMessages = async (roomId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('메시지 조회 실패:', error);
    }
  };

  const handleSelectRoom = async (room: ChatRoom) => {
    setSelectedRoom(room);
    await fetchMessages(room.id);
    shouldScrollRef.current = true;
  };

  const handleStartChat = async () => {
    if (!selectedRoom || selectedRoom.status !== 'waiting') return;

    const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
    await fetch(`${API_BASE_URL}/chat/rooms/${selectedRoom.id}/status?status=active&admin_id=${adminUser.id}&admin_name=${adminUser.username || '상담사'}`, {
      method: 'PATCH'
    });

    // 상태 업데이트
    setSelectedRoom({ ...selectedRoom, status: 'active' });
    fetchChatRooms();
  };

  const handleSend = () => {
    if (!input.trim() || !ws.current || !selectedRoom) return;
    const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
    const messageText = input.trim();

    // 즉시 UI 업데이트 (Optimistic Update)
    const newMessage: Message = {
      id: `temp-${Date.now()}`,
      sender_type: 'admin',
      sender_name: adminUser.username || '상담사',
      message: messageText,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    shouldScrollRef.current = true;

    // WebSocket으로 메시지 전송
    ws.current.send(JSON.stringify({
      type: 'send_to_room',
      room_id: selectedRoom.id,
      sender_id: adminUser.id,
      sender_name: adminUser.username || '상담사',
      message: messageText
    }));
  };

  const handleCloseChat = async () => {
    if (!selectedRoom) return;
    await fetch(`${API_BASE_URL}/chat/rooms/${selectedRoom.id}/status?status=closed`, { method: 'PATCH' });
    setSelectedRoom(null);
    setMessages([]);
    fetchChatRooms();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      waiting: <span className="inline-block bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">대기중</span>,
      active: <span className="inline-block bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">진행중</span>,
      closed: <span className="inline-block bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">종료</span>
    };
    return badges[status as keyof typeof badges];
  };

  if (isLoading) {
    return (
      <CRMLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-gray-600 dark:text-gray-400">로딩 중...</div>
        </div>
      </CRMLayout>
    );
  }

  return (
    <CRMLayout>
      <div className="min-h-screen">
        {/* Header */}
        <section className="border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">실시간 채팅 답변</h1>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">고객과 실시간으로 채팅 상담</p>
        </section>

        {/* Controls Section */}
        <section className="mt-3 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">채팅방 목록</h2>
              <span className="rounded-full bg-gray-900 px-2.5 py-0.5 text-xs font-bold text-white dark:bg-white dark:text-gray-900">
                {filteredRooms.length}
              </span>
            </div>
            <div className="flex-1 md:max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="고객 이름 검색"
                className="w-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-white"
              />
            </div>
          </div>
          <div className="flex gap-1">
            {['all', 'waiting', 'active', 'closed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as typeof statusFilter)}
                className={`border px-2.5 py-1 text-xs font-medium transition ${
                  statusFilter === status
                    ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-white'
                }`}
              >
                {status === 'all' ? '전체' : status === 'waiting' ? '대기중' : status === 'active' ? '진행중' : '종료'}
              </button>
            ))}
          </div>
        </section>

        <div className="mt-3 grid gap-3 lg:grid-cols-5">
          {/* 채팅방 리스트 */}
          <div className="lg:col-span-2">
            <div className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">고객명</th>
                    <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">상태</th>
                    <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">시작시간</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRooms.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        채팅방이 없습니다
                      </td>
                    </tr>
                  ) : (
                    filteredRooms.map((room) => (
                      <tr
                        key={room.id}
                        onClick={() => handleSelectRoom(room)}
                        className={`cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          selectedRoom?.id === room.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{room.user_name}</td>
                        <td className="px-4 py-3">{getStatusBadge(room.status)}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatDate(room.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 채팅 영역 */}
          <div className="lg:col-span-3">
            {selectedRoom ? (
              <div className="flex h-[600px] flex-col border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{selectedRoom.user_name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(selectedRoom.created_at)}</p>
                  </div>
                  <div className="flex gap-2">
                    {selectedRoom.status === 'waiting' && (
                      <button
                        onClick={handleStartChat}
                        className="border border-green-600 bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 dark:border-green-500 dark:bg-green-500 dark:hover:bg-green-600"
                      >
                        진행하기
                      </button>
                    )}
                    <button
                      onClick={handleCloseChat}
                      className="border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      채팅 종료
                    </button>
                  </div>
                </div>
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className="flex max-w-[70%] flex-col gap-1">
                        {msg.sender_type === 'user' && (
                          <span className="px-2 text-xs text-gray-500 dark:text-gray-400">{msg.sender_name}</span>
                        )}
                        <div className={`rounded-lg px-3 py-2 ${msg.sender_type === 'admin' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'}`}>
                          <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                        </div>
                        <span className="px-2 text-xs text-gray-400">
                          {new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="border-t border-gray-200 p-4 dark:border-gray-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="메시지 입력..."
                      className="flex-1 border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-white"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim()}
                      className="border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                    >
                      전송
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-[600px] items-center justify-center border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">채팅방을 선택해주세요</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CRMLayout>
  );
}
