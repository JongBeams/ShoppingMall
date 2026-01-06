'use client';

import { useEffect, useState, useRef } from 'react';
import CRMLayout from '../components/CRMLayout';
import Pagination from '../components/Pagination';

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
  is_remote_control_approved?: boolean; // 원격 제어 승인 메시지인지 여부
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [remoteControlActive, setRemoteControlActive] = useState(false);
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 100, y: 100 });
  const [modalSize, setModalSize] = useState({ width: 900, height: 650 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const ws = useRef<WebSocket | null>(null);
  const roomWs = useRef<WebSocket | null>(null); // 채팅방별 WebSocket
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const userScrollInfo = useRef({ scrollX: 0, scrollY: 0, innerWidth: 0, innerHeight: 0 });

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
    setCurrentPage(1); // 필터 변경 시 페이지를 1로 리셋
  }, [chatRooms, searchQuery, statusFilter]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      console.warn('관리자 토큰이 없습니다. WebSocket 연결을 건너뜁니다.');
      return;
    }

    const websocket = new WebSocket(`${WS_BASE_URL}/chat/ws/admin/monitor?token=${token}`);
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📨 관리자 WebSocket 수신:', data);

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
      } else if (data.type === 'remote_control_start') {
        console.log('🖥️ 원격 제어 시작 이벤트 수신:', data);
        if (!selectedRoom || data.room_id === selectedRoom.id) {
          setRemoteControlActive(true);
          console.log(' 원격 제어 활성화됨');
        }
      } else if (data.type === 'remote_control_stop') {
        if (!selectedRoom || data.room_id === selectedRoom.id) {
          setRemoteControlActive(false);
          console.log('🖥️ 원격 제어 종료됨');
          // WebRTC 연결 종료
          if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
          }
        }
      } else if (data.type === 'webrtc_offer') {
        // WebRTC Offer 수신 (사용자로부터)
        handleWebRTCOffer(data.offer, data.room_id);
      } else if (data.type === 'webrtc_ice_candidate') {
        // ICE Candidate 수신
        if (peerConnection.current && data.candidate) {
          peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          console.log(' ICE Candidate 추가 완료');
        }
      }
    };

    websocket.onerror = (error) => {
      console.error('관리자 모니터 WebSocket 에러:', error);
      console.error('WebSocket URL:', `${WS_BASE_URL}/chat/ws/admin/monitor?token=${token}`);
    };

    websocket.onclose = (event) => {
      console.log(`관리자 모니터 WebSocket 연결 종료 - Code: ${event.code}, Reason: ${event.reason}`);
      if (event.code === 4001) {
        console.error('인증 실패: 관리자 토큰이 유효하지 않습니다.');
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

  // WebRTC Offer 처리 (사용자로부터 받음)
  const handleWebRTCOffer = async (offer: RTCSessionDescriptionInit, roomId: string) => {
    try {
      console.log('📥 WebRTC Offer 수신:', offer);

      // RTCPeerConnection 생성
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });
      peerConnection.current = pc;

      // 원격 스트림 수신
      pc.ontrack = (event) => {
        console.log('📺 원격 스트림 수신!');
        console.log('📺 스트림 정보:', event.streams[0]);
        console.log('📺 트랙 정보:', event.track.kind, event.track.id);
        console.log('📺 트랙 상태:', event.track.readyState);

        // 스트림 저장 (나중에 비디오 요소에 연결)
        const stream = event.streams[0];

        // 모달 자동 열기
        setShowRemoteModal(true);

        // 비디오 요소가 렌더링될 때까지 대기 후 스트림 연결
        setTimeout(() => {
          if (remoteVideoRef.current && stream) {
            remoteVideoRef.current.srcObject = stream;
            console.log(' 비디오 요소에 스트림 설정 완료');

            // 비디오 재생 확인
            remoteVideoRef.current.onloadedmetadata = () => {
              console.log(' 비디오 메타데이터 로드 완료');
              console.log('📺 비디오 크기:', remoteVideoRef.current?.videoWidth, 'x', remoteVideoRef.current?.videoHeight);
            };

            remoteVideoRef.current.onplay = () => {
              console.log('▶️ 비디오 재생 시작됨');
            };
          } else {
            console.error('❌ 비디오 요소가 아직 렌더링되지 않음');
          }
        }, 100);
      };

      // 연결 상태 모니터링
      pc.onconnectionstatechange = () => {
        console.log('🔗 WebRTC 연결 상태:', pc.connectionState);
      };

      pc.oniceconnectionstatechange = () => {
        console.log('🧊 ICE 연결 상태:', pc.iceConnectionState);
      };

      // ICE 후보 전송
      pc.onicecandidate = (event) => {
        if (event.candidate && roomWs.current) {
          roomWs.current.send(JSON.stringify({
            type: 'webrtc_ice_candidate',
            room_id: roomId,
            candidate: event.candidate
          }));
        }
      };

      // Offer 설정 및 Answer 생성
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Answer 전송
      if (roomWs.current) {
        roomWs.current.send(JSON.stringify({
          type: 'webrtc_answer',
          room_id: roomId,
          answer: pc.localDescription
        }));
        console.log('📤 WebRTC Answer 전송 완료');
      }

    } catch (error) {
      console.error('❌ WebRTC Offer 처리 실패:', error);
    }
  };

  const handleSelectRoom = async (room: ChatRoom) => {
    setSelectedRoom(room);
    await fetchMessages(room.id);
    shouldScrollRef.current = true;

    // 기존 채팅방 WebSocket 연결 종료
    if (roomWs.current) {
      roomWs.current.close();
    }

    // 새로운 채팅방 WebSocket 연결 (WebRTC 시그널링용)
    const token = localStorage.getItem('admin_token');
    if (!token) {
      console.error('관리자 토큰이 없습니다. WebSocket 연결을 할 수 없습니다.');
      return;
    }

    const newRoomWs = new WebSocket(`${WS_BASE_URL}/chat/ws/${room.id}?token=${token}`);

    newRoomWs.onopen = () => {
      console.log(` 채팅방 ${room.id} WebSocket 연결됨`);
    };

    newRoomWs.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log('📨 채팅방 WebSocket 수신 - Type:', data.type, '전체 데이터:', data);

      // WebRTC 시그널링 처리
      if (data.type === 'webrtc_offer') {
        console.log('📥 WebRTC Offer 수신!', data.offer);
        handleWebRTCOffer(data.offer, room.id);
      } else if (data.type === 'webrtc_answer') {
        // 관리자는 자신이 보낸 Answer를 무시
        console.log('📥 WebRTC Answer 수신 (무시 - 관리자가 보낸 것)', data.answer);
      } else if (data.type === 'webrtc_ice_candidate') {
        console.log('📥 ICE Candidate 수신', data.candidate);
        if (peerConnection.current && data.candidate) {
          try {
            // remote description이 설정된 후에만 ICE Candidate 추가
            if (peerConnection.current.remoteDescription) {
              await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
              console.log(' ICE Candidate 추가 완료');
            } else {
              console.log('⏳ Remote description 대기 중, ICE Candidate 보류');
            }
          } catch (error) {
            console.error('❌ ICE Candidate 추가 실패:', error);
          }
        }
      } else if (data.type === 'scroll_sync') {
        // 사용자 스크롤 위치 동기화
        userScrollInfo.current = {
          scrollX: data.scrollX,
          scrollY: data.scrollY,
          innerWidth: data.innerWidth,
          innerHeight: data.innerHeight
        };
      } else {
        console.log('⚠️ 처리되지 않은 메시지 타입:', data.type);
      }
    };

    newRoomWs.onerror = (error) => {
      console.error('❌ 채팅방 WebSocket 에러:', error);
      console.error('WebSocket URL:', `${WS_BASE_URL}/chat/ws/${room.id}?token=${token}`);
    };

    newRoomWs.onclose = (event) => {
      console.log(`채팅방 WebSocket 연결 종료 - Code: ${event.code}, Reason: ${event.reason}`);
      if (event.code === 4001) {
        console.error('인증 실패: 토큰이 유효하지 않습니다.');
      } else if (event.code === 4004) {
        console.error('채팅방을 찾을 수 없습니다.');
      }
    };

    roomWs.current = newRoomWs;
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
    if (!input.trim() || !selectedRoom) return;
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

    // WebSocket으로 메시지 전송 (채팅방 WebSocket 사용)
    if (roomWs.current) {
      roomWs.current.send(JSON.stringify({
        type: 'message',
        sender_type: 'admin',
        sender_id: adminUser.id,
        sender_name: adminUser.username || '상담사',
        message: messageText
      }));
    }
  };

  const handleCloseChat = async () => {
    if (!selectedRoom) return;
    await fetch(`${API_BASE_URL}/chat/rooms/${selectedRoom.id}/status?status=closed`, { method: 'PATCH' });
    setSelectedRoom(null);
    setMessages([]);
    fetchChatRooms();
  };

  // 원격 승인 요청 전송
  const handleRequestRemoteSupport = () => {
    if (!roomWs.current || !selectedRoom) return;

    const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');

    // WebSocket으로 원격 지원 요청 메시지 전송
    roomWs.current.send(JSON.stringify({
      type: 'message',
      sender_type: 'admin',
      sender_id: adminUser.id,
      sender_name: adminUser.username || '상담사',
      message: '원격지원 승인 버튼 보내드리오니 희망 시 클릭 바랍니다.',
      is_remote_support_request: true // 원격 지원 요청 플래그
    }));

    alert('원격 지원 요청을 전송했습니다. 사용자가 승인하면 원격 제어가 시작됩니다.');
  };

  // 모달창 드래그 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.modal-header')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - modalPosition.x,
        y: e.clientY - modalPosition.y
      });
    }
  };

  // 모달창 드래그 중
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setModalPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  // 모달창 드래그 종료
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 드래그 이벤트 리스너 등록
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);


  // 원격 제어: 화면 클릭
  const handleScreenClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    if (!roomWs.current || !selectedRoom || !remoteControlActive) {
      return;
    }

    const video = e.currentTarget;
    const rect = video.getBoundingClientRect();

    // 비디오의 실제 표시 영역 계산 (object-contain 고려)
    const videoRatio = video.videoWidth / video.videoHeight;
    const displayRatio = rect.width / rect.height;

    let actualVideoWidth = rect.width;
    let actualVideoHeight = rect.height;
    let offsetX = 0;
    let offsetY = 0;

    if (videoRatio > displayRatio) {
      // 비디오가 더 넓음 -> 위아래에 여백
      actualVideoHeight = rect.width / videoRatio;
      offsetY = (rect.height - actualVideoHeight) / 2;
    } else {
      // 비디오가 더 높음 -> 좌우에 여백
      actualVideoWidth = rect.height * videoRatio;
      offsetX = (rect.width - actualVideoWidth) / 2;
    }

    // 클릭 위치를 실제 비디오 영역 내 좌표로 변환
    const clickX = e.clientX - rect.left - offsetX;
    const clickY = e.clientY - rect.top - offsetY;

    // 사용자 실제 화면 해상도
    const userWidth = userScrollInfo.current.innerWidth || window.innerWidth;
    const userHeight = userScrollInfo.current.innerHeight || window.innerHeight;

    // 비디오 표시 크기 -> 사용자 viewport 크기로 스케일링
    const scaleX = userWidth / actualVideoWidth;
    const scaleY = userHeight / actualVideoHeight;

    let x = clickX * scaleX;
    let y = clickY * scaleY;

    console.log('🎯 클릭 좌표:', {
      클릭위치: { clickX, clickY },
      비디오표시크기: { actualVideoWidth, actualVideoHeight },
      사용자화면크기: { userWidth, userHeight },
      스케일: { scaleX, scaleY },
      스크롤전좌표: { x, y },
      스크롤: { scrollX: userScrollInfo.current.scrollX, scrollY: userScrollInfo.current.scrollY },
    });

    // 원격 클릭 이벤트 전송
    roomWs.current.send(JSON.stringify({
      type: 'remote_click',
      room_id: selectedRoom.id,
      x: x,
      y: y
    }));
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
                    filteredRooms.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((room) => (
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

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredRooms.length / itemsPerPage)}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredRooms.length}
              />
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
                    {remoteControlActive ? (
                      <button
                        onClick={() => setShowRemoteModal(true)}
                        className="border-2 border-red-600 bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-700 dark:border-red-500 dark:bg-red-500 dark:hover:bg-red-600"
                      >
                        🖥️ 사용자 화면 보기
                      </button>
                    ) : (
                      <button
                        onClick={handleRequestRemoteSupport}
                        className="border border-red-300 bg-red-50 px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-100 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                      >
                        원격 승인 요청
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
                  {messages.map((msg, idx) => {
                    // 특수 메시지: 사용자 화면 보기 버튼
                    if (msg.message === '[REMOTE_CONTROL_APPROVED]' || msg.is_remote_control_approved) {
                      return (
                        <div key={idx} className="flex justify-center my-4">
                          <button
                            onClick={() => setShowRemoteModal(true)}
                            className="border-2 border-red-600 bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-red-700"
                          >
                            🖥️ 사용자 화면 보기
                          </button>
                        </div>
                      );
                    }

                    // 일반 메시지
                    return (
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
                    );
                  })}
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

        {/* 원격 제어 모달창 */}
        {showRemoteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div
              ref={modalRef}
              onMouseDown={handleMouseDown}
              onKeyDown={(e) => {
                if (roomWs.current && selectedRoom && remoteControlActive) {
                  roomWs.current.send(JSON.stringify({
                    type: 'remote_keydown',
                    room_id: selectedRoom.id,
                    key: e.key,
                    code: e.code,
                    ctrlKey: e.ctrlKey,
                    shiftKey: e.shiftKey,
                    altKey: e.altKey
                  }));
                }
              }}
              tabIndex={0}
              style={{
                position: 'fixed',
                left: `${modalPosition.x}px`,
                top: `${modalPosition.y}px`,
                width: `${modalSize.width}px`,
                height: `${modalSize.height}px`,
              }}
              className="flex flex-col border-2 border-red-500 bg-white shadow-2xl dark:bg-gray-800 outline-none"
            >
              {/* 헤더 (드래그 가능) */}
              <div className="modal-header flex cursor-move items-center justify-between border-b-2 border-red-500 bg-red-50 p-3 dark:bg-red-900/20">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-red-500"></div>
                  <h3 className="text-sm font-bold text-red-700 dark:text-red-400">원격 제어 중</h3>
                  <span className="text-xs text-gray-500">드래그하여 이동</span>
                </div>
                <button
                  onClick={() => {
                    if (roomWs.current && selectedRoom) {
                      roomWs.current.send(JSON.stringify({
                        type: 'remote_control_stop',
                        room_id: selectedRoom.id
                      }));
                      setRemoteControlActive(false);
                      setShowRemoteModal(false);
                      // WebRTC 연결 종료
                      if (peerConnection.current) {
                        peerConnection.current.close();
                        peerConnection.current = null;
                      }
                    }
                  }}
                  className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-red-700"
                >
                  종료
                </button>
              </div>

              {/* 화면 영역 */}
              <div
                className="flex-1 overflow-auto bg-gray-100 p-4 dark:bg-gray-900"
                onWheel={(e) => {
                  // 스크롤 이벤트 전송
                  if (roomWs.current && selectedRoom && remoteControlActive) {
                    e.preventDefault();
                    roomWs.current.send(JSON.stringify({
                      type: 'remote_scroll',
                      room_id: selectedRoom.id,
                      deltaY: e.deltaY
                    }));
                  }
                }}
              >
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  onClick={handleScreenClick}
                  className="h-full w-full cursor-crosshair border border-red-300 object-contain bg-black outline-none"
                />
              </div>

              {/* 하단 안내 */}
              <div className="border-t border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-700">
                <p className="text-center text-xs text-gray-600 dark:text-gray-400">
                  화면을 클릭하여 사용자 화면을 제어할 수 있습니다
                </p>
              </div>

              {/* 크기 조절 핸들 (우하단) */}
              <div
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const startWidth = modalSize.width;
                  const startHeight = modalSize.height;

                  const handleResize = (moveEvent: MouseEvent) => {
                    setModalSize({
                      width: Math.max(600, startWidth + (moveEvent.clientX - startX)),
                      height: Math.max(400, startHeight + (moveEvent.clientY - startY))
                    });
                  };

                  const handleResizeEnd = () => {
                    window.removeEventListener('mousemove', handleResize);
                    window.removeEventListener('mouseup', handleResizeEnd);
                  };

                  window.addEventListener('mousemove', handleResize);
                  window.addEventListener('mouseup', handleResizeEnd);
                }}
                className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize bg-red-500"
              ></div>
            </div>
          </div>
        )}
      </div>
    </CRMLayout>
  );
}
