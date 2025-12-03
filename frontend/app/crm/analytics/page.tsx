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
      {/* 헤더 - 더 세련되게 */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-gradient-to-r from-purple-50 via-blue-50 to-emerald-50 p-6 dark:border-gray-700 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-emerald-950/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              성과 대시보드
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              실시간 AI 기능 성과 분석 및 모니터링
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">기간 선택</div>
              <div className="flex gap-1">
                {[7, 30, 90].map(days => (
                  <button
                    key={days}
                    onClick={() => setSelectedPeriod(days)}
                    className={`px-4 py-2 text-xs font-medium transition-all ${
                      selectedPeriod === days
                        ? 'border border-gray-900 bg-gray-900 text-white shadow-lg dark:border-white dark:bg-white dark:text-gray-900'
                        : 'border border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800'
                    }`}
                  >
                    {days}일
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3 text-center dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">실시간 업데이트</div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                <span className="text-xs font-medium text-gray-900 dark:text-white">LIVE</span>
              </div>
            </div>
          </div>
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
        <div className="relative overflow-hidden border border-gray-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:border-gray-700 dark:from-emerald-950/20 dark:to-teal-950/20">
          <div className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">LLM</span>
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
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{(summary.gift_wizard_completion_rate || 0).toFixed(1)}%</div>
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
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-200/30 dark:bg-emerald-800/10"></div>
        </div>
      </section>

      {/* Grafana-style 차트 - 2열 */}
      <section className="mb-4 grid gap-4 lg:grid-cols-2">
        {/* 원격 제어 추세 */}
        <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">원격 제어 세션</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">WebRTC 실시간 원격 제어</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {rcTrend.reduce((sum, item) => sum + (item.sessions || 0), 0)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">총 세션</div>
            </div>
          </div>

          {/* Grafana-style 차트 */}
          <div className="relative h-48 p-4">
            <svg className="h-full w-full" viewBox="0 0 500 200" preserveAspectRatio="none">
              {/* 수평 그리드 */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="40"
                  y1={10 + i * 45}
                  x2="500"
                  y2={10 + i * 45}
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-gray-300 dark:text-gray-700"
                  strokeDasharray="3,3"
                />
              ))}

              {/* Y축 레이블 */}
              {[0, 1, 2, 3, 4].map((i) => {
                const value = Math.round(maxRcSessions * (1 - i / 4));
                return (
                  <text
                    key={i}
                    x="35"
                    y={15 + i * 45}
                    textAnchor="end"
                    className="fill-gray-500 text-[8px] dark:fill-gray-400"
                  >
                    {value}
                  </text>
                );
              })}

              {/* 그라데이션 영역 */}
              <defs>
                <linearGradient id="rcGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(147, 51, 234)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="rgb(147, 51, 234)" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              <polygon
                points={`40,190 ${rcTrend.map((item, i) => {
                  const x = 40 + (i / (rcTrend.length - 1 || 1)) * 460;
                  const y = 190 - ((item.sessions || 0) / maxRcSessions) * 170;
                  return `${x},${y}`;
                }).join(' ')} ${40 + 460},190`}
                fill="url(#rcGradient)"
              />

              {/* 선 그래프 */}
              <polyline
                points={rcTrend.map((item, i) => {
                  const x = 40 + (i / (rcTrend.length - 1 || 1)) * 460;
                  const y = 190 - ((item.sessions || 0) / maxRcSessions) * 170;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="rgb(147, 51, 234)"
                strokeWidth="2.5"
              />
            </svg>
          </div>

          {/* 범례 */}
          <div className="mt-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-600"></div>
              <span className="text-gray-600 dark:text-gray-400">세션 수</span>
            </div>
            <div className="flex gap-4 text-gray-500 dark:text-gray-400">
              <span>평균: {Math.round(rcTrend.reduce((sum, item) => sum + (item.sessions || 0), 0) / (rcTrend.length || 1))}</span>
              <span>최대: {maxRcSessions}</span>
            </div>
          </div>
        </div>

        {/* RAG 챗봇 추세 */}
        <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">RAG AI 챗봇</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">벡터 검색 기반 질문 답변</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {ragTrend.reduce((sum, item) => sum + (item.queries || 0), 0)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">총 질문</div>
            </div>
          </div>

          {/* Grafana-style 차트 */}
          <div className="relative h-48 p-4">
            <svg className="h-full w-full" viewBox="0 0 500 200" preserveAspectRatio="none">
              {/* 수평 그리드 */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="40"
                  y1={10 + i * 45}
                  x2="500"
                  y2={10 + i * 45}
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-gray-300 dark:text-gray-700"
                  strokeDasharray="3,3"
                />
              ))}

              {/* Y축 레이블 */}
              {[0, 1, 2, 3, 4].map((i) => {
                const value = Math.round(maxRagQueries * (1 - i / 4));
                return (
                  <text
                    key={i}
                    x="35"
                    y={15 + i * 45}
                    textAnchor="end"
                    className="fill-gray-500 text-[8px] dark:fill-gray-400"
                  >
                    {value}
                  </text>
                );
              })}

              {/* 그라데이션 영역 */}
              <defs>
                <linearGradient id="ragGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(37, 99, 235)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="rgb(37, 99, 235)" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              <polygon
                points={`40,190 ${ragTrend.map((item, i) => {
                  const x = 40 + (i / (ragTrend.length - 1 || 1)) * 460;
                  const y = 190 - ((item.queries || 0) / maxRagQueries) * 170;
                  return `${x},${y}`;
                }).join(' ')} ${40 + 460},190`}
                fill="url(#ragGradient)"
              />

              {/* 선 그래프 */}
              <polyline
                points={ragTrend.map((item, i) => {
                  const x = 40 + (i / (ragTrend.length - 1 || 1)) * 460;
                  const y = 190 - ((item.queries || 0) / maxRagQueries) * 170;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="rgb(37, 99, 235)"
                strokeWidth="2.5"
              />
            </svg>
          </div>

          {/* 범례 */}
          <div className="mt-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-600"></div>
              <span className="text-gray-600 dark:text-gray-400">질문 수</span>
            </div>
            <div className="flex gap-4 text-gray-500 dark:text-gray-400">
              <span>평균: {Math.round(ragTrend.reduce((sum, item) => sum + (item.queries || 0), 0) / (ragTrend.length || 1))}</span>
              <span>최대: {maxRagQueries}</span>
            </div>
          </div>
        </div>

        {/* 선물 마법사 추세 */}
        <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">AI 선물 마법사</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">LLM 기반 맞춤 선물 추천</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {giftTrend.reduce((sum, item) => sum + (item.sessions || 0), 0)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">총 세션</div>
            </div>
          </div>

          {/* Grafana-style 차트 - 더 넓게 */}
          <div className="relative h-48 p-4">
            <svg className="h-full w-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
              {/* 수평 그리드 */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="40"
                  y1={10 + i * 45}
                  x2="1000"
                  y2={10 + i * 45}
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-gray-300 dark:text-gray-700"
                  strokeDasharray="3,3"
                />
              ))}

              {/* Y축 레이블 */}
              {[0, 1, 2, 3, 4].map((i) => {
                const value = Math.round(maxGiftSessions * (1 - i / 4));
                return (
                  <text
                    key={i}
                    x="35"
                    y={15 + i * 45}
                    textAnchor="end"
                    className="fill-gray-500 text-[8px] dark:fill-gray-400"
                  >
                    {value}
                  </text>
                );
              })}

              {/* 그라데이션 영역 */}
              <defs>
                <linearGradient id="giftGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              <polygon
                points={`40,190 ${giftTrend.map((item, i) => {
                  const x = 40 + (i / (giftTrend.length - 1 || 1)) * 960;
                  const y = 190 - ((item.sessions || 0) / maxGiftSessions) * 170;
                  return `${x},${y}`;
                }).join(' ')} ${40 + 960},190`}
                fill="url(#giftGradient)"
              />

              {/* 선 그래프 */}
              <polyline
                points={giftTrend.map((item, i) => {
                  const x = 40 + (i / (giftTrend.length - 1 || 1)) * 960;
                  const y = 190 - ((item.sessions || 0) / maxGiftSessions) * 170;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="rgb(16, 185, 129)"
                strokeWidth="2.5"
              />
            </svg>
          </div>

          {/* 범례 */}
          <div className="mt-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-600"></div>
              <span className="text-gray-600 dark:text-gray-400">세션 수</span>
            </div>
            <div className="flex gap-4 text-gray-500 dark:text-gray-400">
              <span>평균: {Math.round(giftTrend.reduce((sum, item) => sum + (item.sessions || 0), 0) / (giftTrend.length || 1))}</span>
              <span>최대: {maxGiftSessions}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 성능 비교 & 실시간 활동 - 복잡한 레이아웃 */}
      <section className="mb-4 grid gap-4 lg:grid-cols-3">
        {/* 기능별 성능 비교 */}
        <div className="border border-gray-200 bg-white p-6 lg:col-span-2 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">기능별 성능 비교</h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">핵심 지표 요약</p>
            </div>
            <div className="rounded-full border border-green-500 bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
              ↑ 평균 28% 개선
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* 원격 제어 */}
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950/20">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-purple-900 dark:text-purple-300">원격 제어</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">성공률</span>
                  <span className="font-bold text-purple-700 dark:text-purple-300">{(summary.remote_control_success_rate || 0).toFixed(1)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-purple-200 dark:bg-purple-900">
                  <div className="h-full bg-purple-600" style={{ width: `${summary.remote_control_success_rate || 0}%` }}></div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">평균 시간</span>
                  <span className="font-bold text-purple-700 dark:text-purple-300">{((summary.remote_control_avg_duration || 0) / 60).toFixed(1)}분</span>
                </div>
              </div>
            </div>

            {/* RAG 챗봇 */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-blue-900 dark:text-blue-300">RAG 챗봇</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">정확도</span>
                  <span className="font-bold text-blue-700 dark:text-blue-300">{(summary.rag_accuracy || 0).toFixed(1)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-blue-200 dark:bg-blue-900">
                  <div className="h-full bg-blue-600" style={{ width: `${summary.rag_accuracy || 0}%` }}></div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">응답 시간</span>
                  <span className="font-bold text-blue-700 dark:text-blue-300">{((summary.rag_avg_response_time || 0) / 1000).toFixed(2)}초</span>
                </div>
              </div>
            </div>

            {/* 선물 마법사 */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-emerald-900 dark:text-emerald-300">선물 마법사</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">완료율</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">{(summary.gift_wizard_completion_rate || 0).toFixed(1)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-emerald-200 dark:bg-emerald-900">
                  <div className="h-full bg-emerald-600" style={{ width: `${summary.gift_wizard_completion_rate || 0}%` }}></div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">전환율</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">{(summary.gift_wizard_conversion_rate || 0).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 실시간 활동 피드 */}
        <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">실시간 활동</h2>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 animate-pulse rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">LIVE</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-3 rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950/20">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-600">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-900 dark:text-white">원격 제어 세션 시작</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">사용자 #1234</p>
                <p className="mt-1 text-xs text-gray-400">방금 전</p>
              </div>
            </div>

            <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-900 dark:text-white">AI 챗봇 질문</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">"상품 추천 문의"</p>
                <p className="mt-1 text-xs text-gray-400">2분 전</p>
              </div>
            </div>

            <div className="flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-900 dark:text-white">선물 추천 완료</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">3개 추천 생성</p>
                <p className="mt-1 text-xs text-gray-400">5분 전</p>
              </div>
            </div>

            <div className="flex gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-600">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-900 dark:text-white">구매 전환 성공</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">₩45,000</p>
                <p className="mt-1 text-xs text-gray-400">12분 전</p>
              </div>
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
    </div>
  );
}
