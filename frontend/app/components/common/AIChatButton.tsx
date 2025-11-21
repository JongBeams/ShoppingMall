'use client';

import { useState, useEffect, useRef } from 'react';
import LiveChat from '../chat/LiveChat';

type ChatMode = 'select' | 'ai' | 'agent';

interface Message {
  role: 'user' | 'ai';
  content: string;
  sources?: Array<{document_id: string; filename: string}>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default function AIChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('select');
  const [messages, setMessages] = useState<Array<Message>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDocSearchSuggestion, setShowDocSearchSuggestion] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 메시지가 업데이트될 때마다 스크롤 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 입력값 변경 감지하여 @내 입력 시 제안 표시
  useEffect(() => {
    if (input.startsWith('@내') && !input.startsWith('@내부문서 ')) {
      setShowDocSearchSuggestion(true);
    } else {
      setShowDocSearchSuggestion(false);
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');

    // 사용자 메시지 추가
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // @내부문서 모드 체크 (어디든 포함되어 있으면 검색 모드)
      const isDocSearch = userMessage.includes('@내부문서');
      const actualQuery = isDocSearch ? userMessage.replace('@내부문서', '').trim() : userMessage;

      if (isDocSearch) {
        // 내부 문서 검색 모드 (스트리밍)
        const response = await fetch(`${API_BASE_URL}/documents/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: actualQuery,
            limit: 3,
            use_ollama: true
          })
        });

        if (!response.ok) {
          throw new Error('검색 실패');
        }

        // 스트리밍 응답 처리
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let aiResponse = '';
        let sources: Array<{document_id: string; filename: string}> = [];

        // AI 메시지 placeholder 추가
        setMessages(prev => [...prev, { role: 'ai', content: '' }]);

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.type === 'sources') {
                    // 출처 정보 저장
                    sources = data.sources;
                  } else if (data.type === 'token') {
                    // 토큰 추가
                    aiResponse += data.token;
                    setMessages(prev => {
                      const newMessages = [...prev];
                      newMessages[newMessages.length - 1] = {
                        role: 'ai',
                        content: aiResponse,
                        sources: sources.length > 0 ? sources : undefined
                      };
                      return newMessages;
                    });
                  } else if (data.type === 'error') {
                    // 검색 실패
                    setMessages(prev => {
                      const newMessages = [...prev];
                      newMessages[newMessages.length - 1] = {
                        role: 'ai',
                        content: '죄송합니다. 내부 문서에서 해당 내용을 검색하지 못했습니다.'
                      };
                      return newMessages;
                    });
                  }
                } catch (e) {
                  // JSON 파싱 실패 무시
                }
              }
            }
          }
        }

        if (!aiResponse) {
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              role: 'ai',
              content: '죄송합니다. 답변을 생성할 수 없습니다.'
            };
            return newMessages;
          });
        }
      } else {
        // 일반 대화 모드 - Ollama 스트리밍
        const response = await fetch(`${API_BASE_URL}/chat/general`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage
          })
        });

        if (!response.ok) {
          throw new Error('채팅 실패');
        }

        // 스트리밍 응답 처리
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let aiResponse = '';

        // AI 메시지 placeholder 추가
        setMessages(prev => [...prev, { role: 'ai', content: '' }]);

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.token) {
                    aiResponse += data.token;
                    // 실시간으로 메시지 업데이트
                    setMessages(prev => {
                      const newMessages = [...prev];
                      newMessages[newMessages.length - 1] = {
                        role: 'ai',
                        content: aiResponse
                      };
                      return newMessages;
                    });
                  }
                } catch (e) {
                  // JSON 파싱 실패 무시
                }
              }
            }
          }
        }

        if (!aiResponse) {
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              role: 'ai',
              content: '죄송합니다. 답변을 생성할 수 없습니다.'
            };
            return newMessages;
          });
        }
      }

    } catch (error) {
      console.error('AI chat error:', error);
      // 에러 메시지 표시
      setMessages(prev => [...prev, {
        role: 'ai',
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      }]);
    } finally {
      setIsLoading(false);
      // 응답 완료 후 입력창에 포커스 유지
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleModeSelect = (mode: 'ai' | 'agent') => {
    setChatMode(mode);
    setMessages([]);
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
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center">
                    <div className="space-y-2">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                        <svg className="h-7 w-7 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                        무엇을 도와드릴까요?
                        {'\n'}
                        문의 내용을 입력해주세요.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.filter(msg => msg.content).map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                          msg.role === 'user'
                            ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                            : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>

                      {/* 출처 표시 (AI 메시지에만) */}
                      {msg.role === 'ai' && msg.sources && msg.sources.length > 0 && (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 px-2">
                          <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-xs text-gray-500 dark:text-gray-400">참고:</span>
                          {msg.sources.map((source, sidx) => (
                            <span key={sidx} className="text-xs text-blue-600 dark:text-blue-400">
                              {source.filename}{sidx < msg.sources!.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[75%] rounded-2xl bg-gray-100 px-3.5 py-2.5 dark:bg-gray-700">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500" style={{ animationDelay: '0ms' }}></span>
                        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500" style={{ animationDelay: '150ms' }}></span>
                        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}
                {/* 스크롤 참조점 */}
                <div ref={messagesEndRef} />
              </div>

              {/* 입력 영역 */}
              <div className="border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                {/* @내부문서 제안 */}
                {showDocSearchSuggestion && (
                  <div className="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
                    <button
                      onClick={() => {
                        setInput('@내부문서 ');
                        setShowDocSearchSuggestion(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg bg-white px-3 py-2 text-left text-sm transition hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                      <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-medium text-gray-900 dark:text-white">@내부문서</span>
                      <span className="text-gray-500 dark:text-gray-400">내부 문서에서 검색</span>
                    </button>
                  </div>
                )}

                <div className="flex gap-2 p-4">
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
                  <div className="relative flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSend()}
                      placeholder="메시지 입력..."
                      autoFocus
                      className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
                      style={input.includes('@내부문서') ? {
                        color: 'transparent',
                        caretColor: '#1f2937'
                      } : {}}
                    />
                    {input.includes('@내부문서') && (
                      <div className="pointer-events-none absolute inset-0 flex items-center px-3.5 py-2 text-sm">
                        <span className="font-medium text-blue-600 dark:text-blue-400">@내부문서</span>
                        <span className="text-gray-900 dark:text-white">{input.replace('@내부문서', '')}</span>
                      </div>
                    )}
                  </div>
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
