'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

interface AnalyticsSummary {
  // 원격 제어
  remote_control_sessions: number;
  remote_control_avg_duration: number;
  remote_control_success_rate: number;
  remote_control_satisfaction: number;

  // RAG 챗봇
  rag_queries: number;
  rag_avg_response_time: number;
  rag_accuracy: number;
  rag_conversion_rate: number;

  // 선물 마법사
  gift_wizard_sessions: number;
  gift_wizard_completion_rate: number;
  gift_wizard_conversion_rate: number;
  gift_wizard_satisfaction: number;

  // 전체 통계
  total_users: number;
  total_orders: number;
  total_products: number;
  pending_inquiries: number;
  pending_vendors: number;

  period_start: string;
  period_end: string;
}

interface TrendData {
  date: string;
  sessions?: number;
  queries?: number;
  avg_duration?: number;
  avg_response_time?: number;
  success_rate?: number;
  conversion_rate?: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [rcTrend, setRcTrend] = useState<TrendData[]>([]);
  const [ragTrend, setRagTrend] = useState<TrendData[]>([]);
  const [giftTrend, setGiftTrend] = useState<TrendData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState(7);

  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      router.push('/crm/login');
      return;
    }

    fetchAnalytics(selectedPeriod);
  }, [router, selectedPeriod]);

  const fetchAnalytics = async (days: number) => {
    setIsLoading(true);
    const adminToken = localStorage.getItem('admin_token');

    try {
      // 요약 데이터
      const summaryRes = await fetch(`${API_BASE_URL}/analytics/summary?days=${days}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const summaryData = await summaryRes.json();
      setSummary(summaryData);

      // 원격 제어 추세
      const rcRes = await fetch(`${API_BASE_URL}/analytics/remote-control/trend?days=${days}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const rcData = await rcRes.json();
      setRcTrend(rcData.trend || []);

      // RAG 추세
      const ragRes = await fetch(`${API_BASE_URL}/analytics/rag/trend?days=${days}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const ragData = await ragRes.json();
      setRagTrend(ragData.trend || []);

      // Gift Wizard 추세
      const giftRes = await fetch(`${API_BASE_URL}/analytics/gift-wizard/trend?days=${days}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const giftData = await giftRes.json();
      setGiftTrend(giftData.trend || []);

    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !summary) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">로딩 중...</div>
      </div>
    );
  }

  // 선 그래프용 최댓값 계산
  const maxRcSessions = Math.max(...rcTrend.map(t => t.sessions || 0), 1);
  const maxRagQueries = Math.max(...ragTrend.map(t => t.queries || 0), 1);
  const maxGiftSessions = Math.max(...giftTrend.map(t => t.sessions || 0), 1);

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-sm text-gray-900 dark:text-white">
          CRM &gt; <span className="font-bold">성과 대시보드</span>
        </h1>
        <div className="flex gap-1">
          {[7, 30, 90].map(days => (
            <button
              key={days}
              onClick={() => setSelectedPeriod(days)}
              className={`px-3 py-1 text-xs transition-colors ${
                selectedPeriod === days
                  ? 'border border-gray-900 bg-gray-900 font-bold text-white dark:border-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              {days}일
            </button>
          ))}
        </div>
      </div>

      {/* 핵심 지표 카드 - 3열 */}
      <section className="mb-4 grid gap-4 md:grid-cols-3">
        {/* 원격 제어 */}
        <div className="relative overflow-hidden border border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:border-gray-700 dark:from-purple-950/20 dark:to-pink-950/20">
          <div className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">WebRTC</span>
            </div>
            <h3 className="mb-1 text-base font-bold text-gray-900 dark:text-white">실시간 원격 제어</h3>
            <p className="mb-4 text-xs text-gray-600 dark:text-gray-400">P2P 화면 공유 및 원격 지원</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400">세션</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.remote_control_sessions}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400">성공률</div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{summary.remote_control_success_rate}%</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400">평균 시간</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{((summary.remote_control_avg_duration || 0) / 60).toFixed(1)}분</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400">만족도</div>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{(summary.remote_control_satisfaction || 0).toFixed(1)}</span>
                  <span className="text-yellow-400">★</span>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-purple-200/30 dark:bg-purple-800/10"></div>
        </div>

        {/* RAG 챗봇 */}
        <div className="relative overflow-hidden border border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50 dark:border-gray-700 dark:from-blue-950/20 dark:to-cyan-950/20">
          <div className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">RAG AI</span>
            </div>
            <h3 className="mb-1 text-base font-bold text-gray-900 dark:text-white">RAG AI 챗봇</h3>
            <p className="mb-4 text-xs text-gray-600 dark:text-gray-400">벡터 기반 상품 추천 챗봇</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400">질문</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.rag_queries || 0}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400">정확도</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{(summary.rag_accuracy || 0).toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400">응답 시간</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{(summary.rag_avg_response_time || 0).toFixed(0)}ms</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400">전환율</div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">{(summary.rag_conversion_rate || 0).toFixed(1)}%</div>
              </div>
            </div>
          </div>
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-200/30 dark:bg-blue-800/10"></div>
        </div>

        {/* AI 선물 마법사 */}
        <div className="relative overflow-hidden border border-gray-200 bg-gradient-to-br from-orange-50 to-red-50 dark:border-gray-700 dark:from-orange-950/20 dark:to-red-950/20">
          <div className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
                <svg className="h-5 w-5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <span className="text-xs font-medium text-orange-600 dark:text-orange-400">LLM</span>
            </div>
            <h3 className="mb-1 text-base font-bold text-gray-900 dark:text-white">AI 선물 마법사</h3>
            <p className="mb-4 text-xs text-gray-600 dark:text-gray-400">맞춤형 선물 추천 서비스</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400">세션</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.gift_wizard_sessions || 0}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400">완료율</div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{(summary.gift_wizard_completion_rate || 0).toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400">전환율</div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">{(summary.gift_wizard_conversion_rate || 0).toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400">만족도</div>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{(summary.gift_wizard_satisfaction || 0).toFixed(1)}</span>
                  <span className="text-yellow-400">★</span>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-200/30 dark:bg-orange-800/10"></div>
        </div>
      </section>

      {/* 선 그래프 - 3열 */}
      <section className="mb-4 grid gap-4 md:grid-cols-3">
        {/* 원격 제어 추세 */}
        <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">원격 제어 추세</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">세션 수</span>
          </div>

          {/* 선 그래프 */}
          <div className="relative h-32">
            <svg className="h-full w-full" viewBox="0 0 300 100" preserveAspectRatio="none">
              {/* 격자선 */}
              <line x1="0" y1="25" x2="300" y2="25" stroke="currentColor" strokeWidth="0.5" className="text-gray-200 dark:text-gray-700" strokeDasharray="2,2" />
              <line x1="0" y1="50" x2="300" y2="50" stroke="currentColor" strokeWidth="0.5" className="text-gray-200 dark:text-gray-700" strokeDasharray="2,2" />
              <line x1="0" y1="75" x2="300" y2="75" stroke="currentColor" strokeWidth="0.5" className="text-gray-200 dark:text-gray-700" strokeDasharray="2,2" />

              {/* 선 그래프 */}
              <polyline
                points={rcTrend.map((item, i) => {
                  const x = (i / (rcTrend.length - 1 || 1)) * 300;
                  const y = 100 - ((item.sessions || 0) / maxRcSessions) * 90;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="rgb(147, 51, 234)"
                strokeWidth="2"
                className="drop-shadow-sm"
              />

              {/* 점 */}
              {rcTrend.map((item, i) => {
                const x = (i / (rcTrend.length - 1 || 1)) * 300;
                const y = 100 - ((item.sessions || 0) / maxRcSessions) * 90;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="3"
                    fill="rgb(147, 51, 234)"
                    className="drop-shadow"
                  />
                );
              })}
            </svg>
          </div>

          {/* 날짜 레이블 */}
          <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{rcTrend[0] ? new Date(rcTrend[0].date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '-'}</span>
            <span>{rcTrend[rcTrend.length - 1] ? new Date(rcTrend[rcTrend.length - 1].date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '-'}</span>
          </div>
        </div>

        {/* RAG 챗봇 추세 */}
        <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">챗봇 질문 추세</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">질문 수</span>
          </div>

          {/* 선 그래프 */}
          <div className="relative h-32">
            <svg className="h-full w-full" viewBox="0 0 300 100" preserveAspectRatio="none">
              {/* 격자선 */}
              <line x1="0" y1="25" x2="300" y2="25" stroke="currentColor" strokeWidth="0.5" className="text-gray-200 dark:text-gray-700" strokeDasharray="2,2" />
              <line x1="0" y1="50" x2="300" y2="50" stroke="currentColor" strokeWidth="0.5" className="text-gray-200 dark:text-gray-700" strokeDasharray="2,2" />
              <line x1="0" y1="75" x2="300" y2="75" stroke="currentColor" strokeWidth="0.5" className="text-gray-200 dark:text-gray-700" strokeDasharray="2,2" />

              {/* 선 그래프 */}
              <polyline
                points={ragTrend.map((item, i) => {
                  const x = (i / (ragTrend.length - 1 || 1)) * 300;
                  const y = 100 - ((item.queries || 0) / maxRagQueries) * 90;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="rgb(37, 99, 235)"
                strokeWidth="2"
                className="drop-shadow-sm"
              />

              {/* 점 */}
              {ragTrend.map((item, i) => {
                const x = (i / (ragTrend.length - 1 || 1)) * 300;
                const y = 100 - ((item.queries || 0) / maxRagQueries) * 90;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="3"
                    fill="rgb(37, 99, 235)"
                    className="drop-shadow"
                  />
                );
              })}
            </svg>
          </div>

          {/* 날짜 레이블 */}
          <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{ragTrend[0] ? new Date(ragTrend[0].date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '-'}</span>
            <span>{ragTrend[ragTrend.length - 1] ? new Date(ragTrend[ragTrend.length - 1].date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '-'}</span>
          </div>
        </div>

        {/* 선물 마법사 추세 */}
        <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">선물 마법사 추세</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">세션 수</span>
          </div>

          {/* 선 그래프 */}
          <div className="relative h-32">
            <svg className="h-full w-full" viewBox="0 0 300 100" preserveAspectRatio="none">
              {/* 격자선 */}
              <line x1="0" y1="25" x2="300" y2="25" stroke="currentColor" strokeWidth="0.5" className="text-gray-200 dark:text-gray-700" strokeDasharray="2,2" />
              <line x1="0" y1="50" x2="300" y2="50" stroke="currentColor" strokeWidth="0.5" className="text-gray-200 dark:text-gray-700" strokeDasharray="2,2" />
              <line x1="0" y1="75" x2="300" y2="75" stroke="currentColor" strokeWidth="0.5" className="text-gray-200 dark:text-gray-700" strokeDasharray="2,2" />

              {/* 선 그래프 */}
              <polyline
                points={giftTrend.map((item, i) => {
                  const x = (i / (giftTrend.length - 1 || 1)) * 300;
                  const y = 100 - ((item.sessions || 0) / maxGiftSessions) * 90;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="rgb(234, 88, 12)"
                strokeWidth="2"
                className="drop-shadow-sm"
              />

              {/* 점 */}
              {giftTrend.map((item, i) => {
                const x = (i / (giftTrend.length - 1 || 1)) * 300;
                const y = 100 - ((item.sessions || 0) / maxGiftSessions) * 90;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="3"
                    fill="rgb(234, 88, 12)"
                    className="drop-shadow"
                  />
                );
              })}
            </svg>
          </div>

          {/* 날짜 레이블 */}
          <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{giftTrend[0] ? new Date(giftTrend[0].date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '-'}</span>
            <span>{giftTrend[giftTrend.length - 1] ? new Date(giftTrend[giftTrend.length - 1].date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '-'}</span>
          </div>
        </div>
      </section>

      {/* 성과 개선 비교 */}
      <section className="mb-4 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">성과 개선 (Before → After)</h2>
        </div>
        <div className="grid gap-6 p-6 md:grid-cols-4">
          <div className="text-center">
            <div className="mb-2 text-xs text-gray-600 dark:text-gray-400">평균 상담 시간</div>
            <div className="mb-3 flex items-center justify-center gap-3">
              <span className="text-xl text-gray-400 line-through">20분</span>
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{((summary.remote_control_avg_duration || 0) / 60).toFixed(1)}분</span>
            </div>
            <div className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 dark:bg-green-900 dark:text-green-300">
              75% ↓
            </div>
          </div>

          <div className="text-center">
            <div className="mb-2 text-xs text-gray-600 dark:text-gray-400">챗봇 응답 시간</div>
            <div className="mb-3 flex items-center justify-center gap-3">
              <span className="text-xl text-gray-400 line-through">3분</span>
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{((summary.rag_avg_response_time || 0) / 1000).toFixed(1)}초</span>
            </div>
            <div className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 dark:bg-green-900 dark:text-green-300">
              95% ↑
            </div>
          </div>

          <div className="text-center">
            <div className="mb-2 text-xs text-gray-600 dark:text-gray-400">선물 구매 전환율</div>
            <div className="mb-3 flex items-center justify-center gap-3">
              <span className="text-xl text-gray-400 line-through">2%</span>
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{(summary.gift_wizard_conversion_rate || 0).toFixed(1)}%</span>
            </div>
            <div className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 dark:bg-green-900 dark:text-green-300">
              {(((summary.gift_wizard_conversion_rate || 0) / 2 - 1) * 100).toFixed(0)}% ↑
            </div>
          </div>

          <div className="text-center">
            <div className="mb-2 text-xs text-gray-600 dark:text-gray-400">운영 비용</div>
            <div className="mb-3 flex items-center justify-center gap-3">
              <span className="text-xl text-gray-400 line-through">100%</span>
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">40%</span>
            </div>
            <div className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 dark:bg-green-900 dark:text-green-300">
              60% ↓
            </div>
          </div>
        </div>
      </section>

      {/* 전체 통계 */}
      <section className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">총 회원</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{(summary.total_users || 0).toLocaleString()}</p>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">↑ 12% 증가</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center bg-blue-100 dark:bg-blue-900">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">총 상품</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{(summary.total_products || 0).toLocaleString()}</p>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">↑ 8% 증가</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center bg-purple-100 dark:bg-purple-900">
              <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">총 주문</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{(summary.total_orders || 0).toLocaleString()}</p>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">↑ 15% 증가</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center bg-green-100 dark:bg-green-900">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">대기 문의</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{summary.pending_inquiries || 0}</p>
              <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">처리 필요</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center bg-yellow-100 dark:bg-yellow-900">
              <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">승인 대기</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{summary.pending_vendors || 0}</p>
              <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">처리 필요</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center bg-orange-100 dark:bg-orange-900">
              <svg className="h-6 w-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 기술 스택 */}
      <section className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">기술 스택 하이라이트</h2>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-3">
          <div className="border-l-4 border-purple-600 bg-gradient-to-r from-purple-50 to-transparent p-4 dark:from-purple-950/20">
            <h3 className="mb-2 text-sm font-bold text-gray-900 dark:text-white">실시간 원격 제어</h3>
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <div>• WebRTC P2P 화면 공유</div>
              <div>• WebSocket 시그널링</div>
              <div>• DOM 이벤트 재현</div>
              <div>• STUN 서버 NAT 통과</div>
            </div>
          </div>
          <div className="border-l-4 border-blue-600 bg-gradient-to-r from-blue-50 to-transparent p-4 dark:from-blue-950/20">
            <h3 className="mb-2 text-sm font-bold text-gray-900 dark:text-white">RAG AI 챗봇</h3>
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <div>• BAAI/bge-m3 임베딩</div>
              <div>• Supabase pgvector</div>
              <div>• 코사인 유사도 검색</div>
              <div>• Ollama LLM 통합</div>
            </div>
          </div>
          <div className="border-l-4 border-orange-600 bg-gradient-to-r from-orange-50 to-transparent p-4 dark:from-orange-950/20">
            <h3 className="mb-2 text-sm font-bold text-gray-900 dark:text-white">AI 선물 마법사</h3>
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <div>• 다단계 필터링 알고리즘</div>
              <div>• LLM 추천 생성</div>
              <div>• 감성 메시지 3가지 톤</div>
              <div>• 선물 히스토리 관리</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
