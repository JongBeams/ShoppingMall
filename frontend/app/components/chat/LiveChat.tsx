'use client';

import { useEffect, useState, useRef } from 'react';
import { sanitizeChatMessage } from '@/app/lib/sanitize';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000';

interface Message {
  id?: string;
  sender_type: 'user' | 'admin';
  sender_id: string;
  sender_name: string;
  message: string;
  timestamp?: string;
  is_remote_support_request?: boolean; // 원격 지원 요청 메시지 플래그
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
  const [remoteControlActive, setRemoteControlActive] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // WebRTC 화면 공유 시작
  const startScreenShare = async () => {
    try {
      console.log('🖥️ 화면 공유 시작...');

      // 화면 캡처 스트림 가져오기
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser', // 브라우저 탭 공유 선호
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: false,
        preferCurrentTab: true // 현재 탭 공유 선호
      });

      localStream.current = stream;
      const videoTrack = stream.getVideoTracks()[0];
      console.log(' 화면 스트림 획득 완료');
      console.log('📹 비디오 트랙 설정:', videoTrack.getSettings());
      console.log('📹 비디오 트랙 상태:', videoTrack.readyState);
      console.log('📹 비디오 트랙 활성화:', videoTrack.enabled);

      // RTCPeerConnection 생성
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });
      peerConnection.current = pc;

      // 연결 상태 모니터링
      pc.onconnectionstatechange = () => {
        console.log('🔗 WebRTC 연결 상태:', pc.connectionState);
      };

      pc.oniceconnectionstatechange = () => {
        console.log('🧊 ICE 연결 상태:', pc.iceConnectionState);
      };

      // 로컬 스트림을 피어 연결에 추가
      stream.getTracks().forEach(track => {
        const sender = pc.addTrack(track, stream);
        console.log('➕ 트랙 추가됨:', track.kind, track.id);
      });

      // ICE 후보 전송
      pc.onicecandidate = (event) => {
        if (event.candidate && ws.current) {
          ws.current.send(JSON.stringify({
            type: 'webrtc_ice_candidate',
            room_id: roomId,
            candidate: {
              candidate: event.candidate.candidate,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              sdpMid: event.candidate.sdpMid
            }
          }));
        }
      };

      // Offer 생성 및 전송
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (ws.current) {
        const offerMessage = {
          type: 'webrtc_offer',
          room_id: roomId,
          offer: {
            type: pc.localDescription!.type,
            sdp: pc.localDescription!.sdp
          }
        };

        ws.current.send(JSON.stringify(offerMessage));
        console.log(' WebRTC Offer 전송 완료');
      } else {
        console.error('❌ WebSocket이 연결되지 않음!');
      }

      // 스트림이 종료되면 처리
      stream.getVideoTracks()[0].onended = () => {
        console.log('🛑 화면 공유 종료됨');
        stopScreenShare();
      };

    } catch (error) {
      console.error('❌ 화면 공유 시작 실패:', error);
      alert('화면 공유를 시작할 수 없습니다. 권한을 확인해주세요.');
    }
  };

  // WebRTC 화면 공유 중지
  const stopScreenShare = () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    console.log('🛑 화면 공유 중지됨');
  };

  // 원격 지원 승인
  const handleApproveRemoteSupport = async () => {
    if (!ws.current || !roomId) return;

    const userData = localStorage.getItem('user');
    if (!userData) return;

    let user;
    try {
      user = JSON.parse(userData);
    } catch (e) {
      console.error('❌ 사용자 정보 파싱 실패:', e);
      return;
    }

    // 사용자 화면에만 표시될 메시지 전송
    ws.current.send(JSON.stringify({
      type: 'message',
      sender_type: 'user',
      sender_id: user.id,
      sender_name: user.full_name || '고객',
      message: '원격 제어 모드로 변경되었습니다.'
    }));

    // 관리자에게만 표시될 "사용자 화면 보기" 버튼 메시지 전송
    ws.current.send(JSON.stringify({
      type: 'message',
      sender_type: 'user',
      sender_id: user.id,
      sender_name: user.full_name || '고객',
      message: '[REMOTE_CONTROL_APPROVED]', // 특수 메시지
      is_remote_control_approved: true
    }));

    // 관리자에게 승인 알림 전송
    ws.current.send(JSON.stringify({
      type: 'remote_control_start',
      room_id: roomId
    }));

    setRemoteControlActive(true);

    // 화면 공유 안내 후 시작
    alert('⚠️ 중요: 다음 화면에서 반드시 "이 탭 공유" 또는 현재 쇼핑몰 화면을 선택해주세요!\n\n전체 화면이나 다른 창을 선택하면 관리자가 화면을 볼 수 없습니다.');

    // 화면 공유 시작
    await startScreenShare();

    // 주기적으로 스크롤 위치 전송 (관리자와 동기화)
    const syncInterval = setInterval(() => {
      if (ws.current && roomId) {
        ws.current.send(JSON.stringify({
          type: 'scroll_sync',
          room_id: roomId,
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight
        }));
      }
    }, 500); // 0.5초마다 동기화

    // 컴포넌트 언마운트 시 인터벌 정리
    return () => clearInterval(syncInterval);
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

        let user;
        try {
          user = JSON.parse(userData);
        } catch (e) {
          console.error('❌ 사용자 정보 파싱 실패:', e);
          setIsLoading(false);
          return;
        }

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

        // 3. WebSocket 연결 (JWT 토큰 포함)
        const token = localStorage.getItem('access_token');
        if (!token) {
          console.error('❌ 인증 토큰이 없습니다. 로그인이 필요합니다.');
          setIsLoading(false);
          return;
        }

        console.log('🔌 WebSocket 연결 시도:', `${WS_BASE_URL}/chat/ws/${chatRoomId}?token=***`);
        websocket = new WebSocket(`${WS_BASE_URL}/chat/ws/${chatRoomId}?token=${token}`);

        websocket.onopen = () => {
          console.log('✅ WebSocket 연결됨 (인증 완료)');
          setIsLoading(false);
        };

        websocket.onclose = (event) => {
          console.log(`🔌 WebSocket 연결 종료: code=${event.code}, reason=${event.reason}`);
          if (event.code === 4001) {
            console.warn('⚠️ 인증 토큰 만료 또는 유효하지 않음');
            // 필요 시 로그인 페이지로 리다이렉트
          }
        };

        websocket.onmessage = async (event) => {
          let data;
          try {
            data = JSON.parse(event.data);
          } catch (e) {
            console.error('❌ WebSocket 메시지 파싱 실패:', e);
            return;
          }
          console.log('📨 메시지 수신:', data);

          // WebRTC 시그널링 처리
          if (data.type === 'webrtc_answer') {
            if (peerConnection.current) {
              try {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
                console.log(' WebRTC Answer 수신 완료');
              } catch (error) {
                console.error('❌ WebRTC Answer 설정 실패:', error);
              }
            }
            return;
          }

          if (data.type === 'webrtc_ice_candidate') {
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
            return;
          }

          // 원격 제어 이벤트 처리
          if (data.type === 'remote_control_start') {
            setRemoteControlActive(true);
            console.log('🖥️ 원격 제어 시작');
            return;
          }

          if (data.type === 'remote_control_stop') {
            setRemoteControlActive(false);
            stopScreenShare();
            console.log('🖥️ 원격 제어 종료');
            return;
          }

          if (data.type === 'remote_click') {
            // 클릭 이벤트 재현
            let { x, y } = data;

            console.log('🖱️ 원격 클릭 수신:', {
              원본좌표: { x, y },
              windowSize: { width: window.innerWidth, height: window.innerHeight },
              scrollPosition: { x: window.scrollX, y: window.scrollY }
            });

            // 스크롤 위치를 빼서 뷰포트 좌표로 변환
            // 받은 좌표는 이미 뷰포트 기준이므로 그대로 사용
            const viewportX = x;
            const viewportY = y;

            // 뷰포트 좌표로 요소 찾기
            let element = document.elementFromPoint(viewportX, viewportY) as HTMLElement;

            if (element) {
              console.log(' 클릭할 요소 발견:', element.tagName, element.className);

              // 시각적 피드백 (클릭 위치에 빨간 점 표시)
              const marker = document.createElement('div');
              marker.style.cssText = `
                position: fixed;
                left: ${viewportX}px;
                top: ${viewportY}px;
                width: 20px;
                height: 20px;
                background: red;
                border-radius: 50%;
                pointer-events: none;
                z-index: 999999;
              `;
              document.body.appendChild(marker);
              setTimeout(() => marker.remove(), 1000);

              // input/textarea가 아니면 자식 요소 중에서 찾기
              if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
                const inputChild = element.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement | null;
                if (inputChild) {
                  console.log('🔍 자식 요소에서 입력 필드 발견:', inputChild.tagName);
                  element = inputChild;
                }
              }

              // 먼저 mousedown, mouseup 이벤트 발생
              const mouseDownEvent = new MouseEvent('mousedown', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: viewportX,
                clientY: viewportY
              });
              element.dispatchEvent(mouseDownEvent);

              const mouseUpEvent = new MouseEvent('mouseup', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: viewportX,
                clientY: viewportY
              });
              element.dispatchEvent(mouseUpEvent);

              // 클릭 이벤트 발생
              const clickEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: viewportX,
                clientY: viewportY
              });
              element.dispatchEvent(clickEvent);

              // Input/Textarea이면 포커스
              if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                element.focus();
                element.click();
                console.log('📝 입력 필드에 포커스 설정:', element);
              } else if (element instanceof HTMLElement && typeof element.click === 'function') {
                element.click();
              }

              console.log(' 클릭 이벤트 전송 완료');
            } else {
              console.error('❌ 해당 위치에 요소가 없음');
            }
            return;
          }

          if (data.type === 'remote_scroll') {
            // 스크롤 이벤트 재현
            const { deltaY } = data;
            console.log('📜 원격 스크롤:', deltaY);
            window.scrollBy({
              top: deltaY,
              behavior: 'auto'
            });
            return;
          }

          if (data.type === 'remote_keydown') {
            // 키보드 입력 재현
            const { key, code, ctrlKey, shiftKey, altKey } = data;
            console.log('⌨️ 원격 키보드:', key);

            // 현재 포커스된 요소 가져오기
            const activeElement = document.activeElement as HTMLElement;

            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
              // 입력 필드에 직접 입력
              const inputElement = activeElement as HTMLInputElement | HTMLTextAreaElement;

              if (key === 'Backspace') {
                inputElement.value = inputElement.value.slice(0, -1);
              } else if (key === 'Enter') {
                // Enter 키 이벤트 발생
                const enterEvent = new KeyboardEvent('keydown', {
                  key: 'Enter',
                  code: 'Enter',
                  bubbles: true
                });
                inputElement.dispatchEvent(enterEvent);
              } else if (key.length === 1) {
                // 일반 문자 입력
                inputElement.value += key;
              }

              // input 이벤트 발생
              const inputEvent = new Event('input', { bubbles: true });
              inputElement.dispatchEvent(inputEvent);

              // change 이벤트 발생
              const changeEvent = new Event('change', { bubbles: true });
              inputElement.dispatchEvent(changeEvent);
            } else {
              // 포커스된 요소가 없으면 키보드 이벤트만 발생
              const keyEvent = new KeyboardEvent('keydown', {
                key,
                code,
                ctrlKey,
                shiftKey,
                altKey,
                bubbles: true
              });
              document.dispatchEvent(keyEvent);
            }
            return;
          }

          if (data.type === 'remote_input_text') {
            // 텍스트 입력 (한글 포함)
            const { text } = data;
            console.log('📝 원격 텍스트 입력:', text);

            const activeElement = document.activeElement as HTMLElement;

            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
              const inputElement = activeElement as HTMLInputElement | HTMLTextAreaElement;

              // 현재 값에 텍스트 추가
              inputElement.value += text;

              // input 이벤트 발생
              const inputEvent = new Event('input', { bubbles: true });
              inputElement.dispatchEvent(inputEvent);

              // change 이벤트 발생
              const changeEvent = new Event('change', { bubbles: true });
              inputElement.dispatchEvent(changeEvent);

              console.log(' 텍스트 입력 완료:', inputElement.value);
            }
            return;
          }

          if (data.type === 'remote_input') {
            // 입력 이벤트 재현
            const { selector, value } = data;
            const element = document.querySelector(selector) as HTMLInputElement;
            if (element) {
              console.log('⌨️ 원격 입력:', selector, value);
              element.value = value;
              element.dispatchEvent(new Event('input', { bubbles: true }));
            }
            return;
          }

          if (data.type === 'message') {
            console.log('💬 메시지 수신:', data);
            console.log('🔴 is_remote_support_request 값:', data.is_remote_support_request);

            setMessages(prev => [...prev, {
              id: data.id,
              sender_type: data.sender_type,
              sender_id: data.sender_id,
              sender_name: data.sender_name,
              message: data.message,
              is_remote_support_request: data.is_remote_support_request || false,
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
      // 화면 공유 중지
      stopScreenShare();
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

    let user;
    try {
      user = JSON.parse(userData);
    } catch (e) {
      console.error('❌ 사용자 정보 파싱 실패:', e);
      return;
    }

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
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {isConnected ? '상담사 연결됨' : '상담사 연결 대기 중...'}
              </span>
            </div>
            {remoteControlActive && (
              <div className="flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 dark:bg-red-900/30">
                <div className="h-2 w-2 animate-pulse rounded-full bg-red-500"></div>
                <span className="text-xs font-medium text-red-700 dark:text-red-400">
                  원격 제어 중
                </span>
              </div>
            )}
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
          messages
            .filter(msg => msg.message !== '[REMOTE_CONTROL_APPROVED]') // 특수 메시지는 사용자에게 숨김
            .map((msg, idx) => (
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
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {sanitizeChatMessage(msg.message)}
                  </p>

                  {/* 원격 지원 요청 승인 버튼 */}
                  {msg.message.includes('원격지원 승인 버튼') && msg.sender_type === 'admin' && !remoteControlActive && (
                    <button
                      onClick={handleApproveRemoteSupport}
                      className="mt-3 w-full bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                    >
                      원격 지원 승인
                    </button>
                  )}
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
