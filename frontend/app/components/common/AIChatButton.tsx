'use client';

import { useState } from 'react';
import LiveChat from '../chat/LiveChat';

type ChatMode = 'select' | 'ai' | 'agent';

export default function AIChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('select');
  const [messages, setMessages] = useState<Array<{role: 'user' | 'ai', content: string}>>([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages([...messages, { role: 'user', content: input }]);
    setInput('');

    // AI 응답 시뮬레이션 (AI 모드일 때만)
    if (chatMode === 'ai') {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'ai',
          content: '안녕하세요! AI 쇼핑 도우미입니다. 어떤 상품을 찾으시나요?'
        }]);
      }, 500);
    }
  };

  const handleModeSelect = (mode: 'ai' | 'agent') => {
    setChatMode(mode);
    setMessages([]);
    if (mode === 'ai') {
      setMessages([{
        role: 'ai',
        content: '안녕하세요! AI 쇼핑 도우미입니다. 무엇을 도와드릴까요?'
      }]);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setChatMode('select');
    setMessages([]);
  };

  return (
    <>
      {/* 고정 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg transition-all hover:bg-gray-800 hover:shadow-xl dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
      >
        {isOpen ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* 채팅 모달 */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[520px] w-[380px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
          {/* 헤더 */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 dark:bg-white">
                  {chatMode === 'agent' ? (
                    <svg className="h-5 w-5 text-white dark:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-white dark:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  )}
                </div>
                {chatMode !== 'select' && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-gray-800"></div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {chatMode === 'select' ? '상담' : chatMode === 'ai' ? 'AI 도우미' : '상담사'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {chatMode === 'agent' ? '연결 중...' : chatMode === 'ai' ? '즉시 응답' : '상담 방식 선택'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 선택 화면 */}
          {chatMode === 'select' && (
            <div className="flex flex-1 flex-col justify-center gap-3 p-6">
              <div className="mb-2 text-center">
                <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
                  무엇을 도와드릴까요?
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  상담 방식을 선택해주세요
                </p>
              </div>

              {/* AI 챗봇 버튼 */}
              <button
                onClick={() => handleModeSelect('ai')}
                className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:border-gray-900 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-white"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                    <svg className="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-0.5 text-sm font-semibold text-gray-900 dark:text-white">
                      AI 챗봇
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      24시간 자동 응답
                    </p>
                  </div>
                  <svg className="h-5 w-5 text-gray-400 transition group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* 상담사 연결 버튼 */}
              <button
                onClick={() => handleModeSelect('agent')}
                className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:border-gray-900 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-white"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                    <svg className="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-0.5 text-sm font-semibold text-gray-900 dark:text-white">
                      상담사 연결
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      실시간 1:1 상담
                    </p>
                  </div>
                  <svg className="h-5 w-5 text-gray-400 transition group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          )}

          {/* 상담사 연결 모드 - WebSocket LiveChat */}
          {chatMode === 'agent' && (
            <LiveChat onBack={() => {
              setChatMode('select');
              setMessages([]);
            }} />
          )}

          {/* AI 챗봇 모드 */}
          {chatMode === 'ai' && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                        msg.role === 'user'
                          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                          : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 입력 영역 */}
              <div className="border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setChatMode('select');
                      setMessages([]);
                    }}
                    className="flex items-center justify-center text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="메시지 입력..."
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
            </>
          )}
        </div>
      )}
    </>
  );
}
