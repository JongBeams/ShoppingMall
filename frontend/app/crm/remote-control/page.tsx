'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000';
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default function RemoteControlPage() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('room_id');

  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const screenRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionStartTime = useRef<number>(Date.now());
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    if (!roomId) return;

    // WebSocket 연결
    const websocket = new WebSocket(`${WS_BASE_URL}/chat/ws/${roomId}`);

    websocket.onopen = () => {
      console.log(' 원격 제어 WebSocket 연결됨');
      setIsConnected(true);
      sessionStartTime.current = Date.now();
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'screen_capture') {
        // 사용자 화면 캡처 수신
        setScreenshot(data.screenshot);
      } else if (data.type === 'remote_control_stop') {
        setScreenshot(null);
        alert('원격 제어가 종료되었습니다.');
        window.close();
      }
    };

    websocket.onerror = (error) => {
      console.error('❌ WebSocket 에러:', error);
    };

    websocket.onclose = () => {
      console.log('❌ WebSocket 연결 종료');
      setIsConnected(false);

      // Analytics 기록
      const durationSeconds = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      fetch(`${API_BASE_URL}/analytics/remote-control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration_seconds: durationSeconds,
          success: clickCount > 0, // 클릭이 있었으면 성공으로 간주
          user_satisfaction: 4 // 기본값
        })
      }).catch(err => console.error('Analytics 기록 실패:', err));
    };

    ws.current = websocket;

    return () => {
      websocket.close();
    };
  }, [roomId, clickCount]);

  // 화면 클릭 처리
  const handleScreenClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!ws.current || !roomId) return;

    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();

    // 이미지 내 클릭 위치 계산
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // 원격 클릭 이벤트 전송
    ws.current.send(JSON.stringify({
      type: 'remote_click',
      room_id: roomId,
      x: x,
      y: y
    }));

    setClickCount(prev => prev + 1);
    console.log('🖱️ 원격 클릭 전송:', x, y);
  };

  // 원격 제어 종료
  const handleStopControl = () => {
    if (!ws.current || !roomId) return;

    if (confirm('원격 제어를 종료하시겠습니까?')) {
      ws.current.send(JSON.stringify({
        type: 'remote_control_stop',
        room_id: roomId
      }));
      window.close();
    }
  };

  // 전체화면 토글
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 전체화면 종료 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div ref={containerRef} className="flex h-screen flex-col bg-gray-900">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 p-4">
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${isConnected ? 'animate-pulse bg-red-500' : 'bg-gray-500'}`}></div>
          <h1 className="text-lg font-bold text-white">원격 제어</h1>
          <span className="text-sm text-gray-400">Room: {roomId}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="rounded bg-gray-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-600"
          >
            {isFullscreen ? '전체화면 종료' : '전체화면'}
          </button>
          <button
            onClick={handleStopControl}
            className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            원격 제어 종료
          </button>
        </div>
      </div>

      {/* 화면 영역 */}
      <div className="flex-1 overflow-auto bg-gray-900 p-4">
        {screenshot ? (
          <div className="flex h-full items-center justify-center">
            <img
              ref={screenRef}
              src={screenshot}
              alt="사용자 화면"
              onClick={handleScreenClick}
              className="max-h-full max-w-full cursor-crosshair border-2 border-red-500 shadow-2xl"
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-gray-700 border-t-red-500"></div>
              <p className="mt-6 text-lg font-medium text-gray-400">사용자 화면 수신 중...</p>
              <p className="mt-2 text-sm text-gray-500">사용자가 원격 지원을 승인하면 화면이 표시됩니다.</p>
            </div>
          </div>
        )}
      </div>

      {/* 하단 안내 */}
      {screenshot && (
        <div className="border-t border-gray-700 bg-gray-800 px-4 py-2 text-center">
          <p className="text-xs text-gray-400">
            화면을 클릭하여 사용자 화면을 제어할 수 있습니다. 스크롤과 입력도 지원됩니다.
          </p>
        </div>
      )}
    </div>
  );
}
