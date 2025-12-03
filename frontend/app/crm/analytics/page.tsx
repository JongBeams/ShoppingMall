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
  const [usersTrend, setUsersTrend] = useState<{date: string; count: number}[]>([]);
  const [productsTrend, setProductsTrend] = useState<{date: string; count: number}[]>([]);
  const [ordersTrend, setOrdersTrend] = useState<{date: string; count: number}[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [usersTooltip, setUsersTooltip] = useState<{x: number; y: number; content: string} | null>(null);
  const [productsTooltip, setProductsTooltip] = useState<{x: number; y: number; content: string} | null>(null);
  const [ordersTooltip, setOrdersTooltip] = useState<{x: number; y: number; content: string} | null>(null);
  const [rcTooltip, setRcTooltip] = useState<{x: number; y: number; content: string} | null>(null);
  const [ragTooltip, setRagTooltip] = useState<{x: number; y: number; content: string} | null>(null);
  const [giftTooltip, setGiftTooltip] = useState<{x: number; y: number; content: string} | null>(null);

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

      // 회원 추세
      const usersRes = await fetch(`${API_BASE_URL}/analytics/users/trend?days=${days}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const usersData = await usersRes.json();
      setUsersTrend(usersData.trend || []);

      // 상품 추세
      const productsRes = await fetch(`${API_BASE_URL}/analytics/products/trend?days=${days}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const productsData = await productsRes.json();
      setProductsTrend(productsData.trend || []);

      // 주문 추세
      const ordersRes = await fetch(`${API_BASE_URL}/analytics/orders/trend?days=${days}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const ordersData = await ordersRes.json();
      setOrdersTrend(ordersData.trend || []);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-4 pb-4">
      {/* Grafana 스타일 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">
            Real-time AI Performance Analytics & Monitoring
          </h1>
          <span className="flex items-center gap-1.5">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
            <span className="text-xs font-medium text-green-400">LIVE</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* 기간 선택 */}
          <div className="rounded-lg bg-gray-900/50 p-3 ring-1 ring-white/10 backdrop-blur-sm">
            <div className="mb-2 text-xs text-gray-400">Time Range</div>
            <div className="flex gap-1">
              {[7, 30, 90].map(days => (
                <button
                  key={days}
                  onClick={() => setSelectedPeriod(days)}
                  className={`rounded px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedPeriod === days
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          {/* 새로고침 버튼 */}
          <button
            onClick={() => fetchAnalytics(selectedPeriod)}
            className="rounded-lg bg-gray-900/50 p-3 ring-1 ring-white/10 backdrop-blur-sm transition-all hover:bg-gray-800/50"
          >
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* 핵심 지표 + 실시간 활동 */}
      <section className="mb-4 grid gap-4 lg:grid-cols-4">
        {/* 원격 제어 */}
        <div className="group relative overflow-hidden rounded-lg bg-gray-900/50 p-5 ring-1 ring-white/10 backdrop-blur-sm transition-all hover:ring-purple-500/50">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-400">원격 제어</h3>
                <p className="text-xs text-gray-500">WebRTC P2P</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex items-end justify-between">
                <span className="text-xs text-gray-400">세션</span>
                <span className="text-2xl font-bold text-white">{summary.remote_control_sessions}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-gray-800">
                <div className="h-full bg-purple-500" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-end justify-between">
                <span className="text-xs text-gray-400">성공률</span>
                <span className="text-lg font-semibold text-purple-400">{summary.remote_control_success_rate}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* RAG 챗봇 */}
        <div className="group relative overflow-hidden rounded-lg bg-gray-900/50 p-5 ring-1 ring-white/10 backdrop-blur-sm transition-all hover:ring-blue-500/50">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-400">RAG 챗봇</h3>
                <p className="text-xs text-gray-500">벡터 검색 AI</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex items-end justify-between">
                <span className="text-xs text-gray-400">질문</span>
                <span className="text-2xl font-bold text-white">{summary.rag_queries || 0}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-gray-800">
                <div className="h-full bg-blue-500" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-end justify-between">
                <span className="text-xs text-gray-400">정확도</span>
                <span className="text-lg font-semibold text-blue-400">{(summary.rag_accuracy || 0).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 선물 마법사 */}
        <div className="group relative overflow-hidden rounded-lg bg-gray-900/50 p-5 ring-1 ring-white/10 backdrop-blur-sm transition-all hover:ring-emerald-500/50">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-400">선물 마법사</h3>
                <p className="text-xs text-gray-500">LLM 추천</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex items-end justify-between">
                <span className="text-xs text-gray-400">세션</span>
                <span className="text-2xl font-bold text-white">{summary.gift_wizard_sessions || 0}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-gray-800">
                <div className="h-full bg-emerald-500" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-end justify-between">
                <span className="text-xs text-gray-400">완료율</span>
                <span className="text-lg font-semibold text-emerald-400">{(summary.gift_wizard_completion_rate || 0).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 전체 통계 */}
        <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-5 ring-1 ring-indigo-500/30 backdrop-blur-sm transition-all hover:ring-indigo-500/50">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/30">
                <svg className="h-5 w-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xs font-medium text-indigo-300">전체 통계</h3>
                <p className="text-xs text-indigo-400/70">종합 현황</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex items-end justify-between">
                <span className="text-xs text-indigo-300/70">총 활동</span>
                <span className="text-2xl font-bold text-white">{(summary.remote_control_sessions || 0) + (summary.rag_queries || 0) + (summary.gift_wizard_sessions || 0)}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-indigo-900/50">
                <div className="h-full bg-indigo-400" style={{ width: '90%' }}></div>
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-end justify-between">
                <span className="text-xs text-indigo-300/70">만족도</span>
                <span className="text-lg font-semibold text-amber-400">{(((summary.remote_control_satisfaction || 0) + (summary.gift_wizard_satisfaction || 0)) / 2).toFixed(1)} ★</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 차트 - 3열 한줄 */}
      <section className="mb-4 grid gap-4 lg:grid-cols-3">
        {/* 원격 제어 추세 */}
        <div className="relative overflow-hidden rounded-xl border border-gray-200/50 bg-gradient-to-br from-gray-900 to-gray-800 p-5 shadow-lg dark:border-gray-700/50">
          {/* Grafana 스타일 배경 그리드 */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'linear-gradient(rgba(147, 51, 234, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(147, 51, 234, 0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>

          <div className="relative mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">원격 제어 세션</h3>
              <p className="mt-1 text-xs text-gray-400">총 세션 수</p>
            </div>
            <div className="rounded-lg bg-purple-600/20 px-3 py-1.5 text-xl font-bold text-purple-400 shadow-inner">
              {rcTrend.reduce((sum, item) => sum + (item.sessions || 0), 0)}
            </div>
          </div>

          {/* 차트 */}
          <div className="relative h-48 rounded-lg bg-gray-950/50 p-4 ring-1 ring-white/5">
            <svg
              className="h-full w-full"
              viewBox="0 0 500 200"
              preserveAspectRatio="none"
              onMouseMove={(e) => {
                const svg = e.currentTarget;
                const rect = svg.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 500;

                if (x >= 40 && x <= 495 && rcTrend.length > 0) {
                  let closestIndex = 0;
                  let minDistance = Infinity;

                  rcTrend.forEach((item, i) => {
                    const pointX = 40 + (i / (rcTrend.length - 1 || 1)) * 455;
                    const distance = Math.abs(x - pointX);
                    if (distance < minDistance) {
                      minDistance = distance;
                      closestIndex = i;
                    }
                  });

                  const item = rcTrend[closestIndex];
                  const pointX = 40 + (closestIndex / (rcTrend.length - 1 || 1)) * 455;
                  const pointY = 180 - ((item.sessions || 0) / maxRcSessions) * 160;

                  setRcTooltip({
                    x: pointX,
                    y: pointY,
                    content: `${item.date}: ${item.sessions}회`
                  });
                }
              }}
              onMouseLeave={() => setRcTooltip(null)}
            >
              <defs>
                {/* 그라데이션 영역 */}
                <linearGradient id="rcGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(147, 51, 234)" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="rgb(147, 51, 234)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="rgb(147, 51, 234)" stopOpacity="0.05" />
                </linearGradient>
                {/* 라인 글로우 효과 */}
                <filter id="rcGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* 툴팁 */}
              {rcTooltip && (
                <g>
                  <rect
                    x={rcTooltip.x - 40}
                    y={rcTooltip.y - 35}
                    width="80"
                    height="30"
                    fill="rgba(0, 0, 0, 0.9)"
                    stroke="rgb(168, 85, 247)"
                    strokeWidth="1"
                    rx="4"
                  />
                  <text
                    x={rcTooltip.x}
                    y={rcTooltip.y - 20}
                    textAnchor="middle"
                    className="fill-white text-[10px] font-medium"
                  >
                    {rcTooltip.content}
                  </text>
                  <line
                    x1={rcTooltip.x}
                    y1="20"
                    x2={rcTooltip.x}
                    y2="180"
                    stroke="rgb(168, 85, 247)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.5"
                  />
                </g>
              )}

              {/* 수평 그리드 라인 */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="40"
                  y1={20 + i * 40}
                  x2="495"
                  y2={20 + i * 40}
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeWidth="1"
                />
              ))}

              {/* 수직 그리드 라인 */}
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <line
                  key={i}
                  x1={40 + i * 65}
                  y1="20"
                  x2={40 + i * 65}
                  y2="180"
                  stroke="rgba(255, 255, 255, 0.04)"
                  strokeWidth="1"
                />
              ))}

              {/* Y축 레이블 */}
              {[0, 1, 2, 3, 4].map((i) => {
                const value = Math.round(maxRcSessions * (1 - i / 4));
                return (
                  <text
                    key={i}
                    x="35"
                    y={23 + i * 40}
                    textAnchor="end"
                    className="fill-gray-500 text-[10px] font-medium"
                  >
                    {value}
                  </text>
                );
              })}

              {/* 그라데이션 영역 */}
              <polygon
                points={`40,180 ${rcTrend.map((item, i) => {
                  const x = 40 + (i / (rcTrend.length - 1 || 1)) * 455;
                  const y = 180 - ((item.sessions || 0) / maxRcSessions) * 160;
                  return `${x},${y}`;
                }).join(' ')} 495,180`}
                fill="url(#rcGradient)"
              />

              {/* 선 그래프 */}
              <polyline
                points={rcTrend.map((item, i) => {
                  const x = 40 + (i / (rcTrend.length - 1 || 1)) * 455;
                  const y = 180 - ((item.sessions || 0) / maxRcSessions) * 160;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="rgb(168, 85, 247)"
                strokeWidth="2.5"
                filter="url(#rcGlow)"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* 데이터 포인트 */}
              {rcTrend.map((item, i) => {
                const x = 40 + (i / (rcTrend.length - 1 || 1)) * 455;
                const y = 180 - ((item.sessions || 0) / maxRcSessions) * 160;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="4" fill="rgb(168, 85, 247)" opacity="0.5" />
                    <circle cx={x} cy={y} r="2.5" fill="rgb(216, 180, 254)" />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* 통계 */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-950/50 p-2.5 ring-1 ring-white/5">
              <div className="text-[10px] text-gray-500">평균</div>
              <div className="mt-1 text-sm font-bold text-purple-400">
                {rcTrend.length > 0 ? Math.round(rcTrend.reduce((sum, item) => sum + (item.sessions || 0), 0) / rcTrend.length) : 0}
              </div>
            </div>
            <div className="rounded-lg bg-gray-950/50 p-2.5 ring-1 ring-white/5">
              <div className="text-[10px] text-gray-500">최대</div>
              <div className="mt-1 text-sm font-bold text-purple-400">{maxRcSessions}</div>
            </div>
          </div>
        </div>

        {/* RAG 챗봇 추세 */}
        <div className="relative overflow-hidden rounded-xl border border-gray-200/50 bg-gradient-to-br from-gray-900 to-gray-800 p-5 shadow-lg dark:border-gray-700/50">
          {/* Grafana 스타일 배경 그리드 */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'linear-gradient(rgba(37, 99, 235, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(37, 99, 235, 0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>

          <div className="relative mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">RAG AI 챗봇</h3>
              <p className="mt-1 text-xs text-gray-400">총 질문 수</p>
            </div>
            <div className="rounded-lg bg-blue-600/20 px-3 py-1.5 text-xl font-bold text-blue-400 shadow-inner">
              {ragTrend.reduce((sum, item) => sum + (item.queries || 0), 0)}
            </div>
          </div>

          {/* 차트 */}
          <div className="relative h-48 rounded-lg bg-gray-950/50 p-4 ring-1 ring-white/5">
            <svg
              className="h-full w-full"
              viewBox="0 0 500 200"
              preserveAspectRatio="none"
              onMouseMove={(e) => {
                const svg = e.currentTarget;
                const rect = svg.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 500;

                if (x >= 40 && x <= 495 && ragTrend.length > 0) {
                  let closestIndex = 0;
                  let minDistance = Infinity;

                  ragTrend.forEach((item, i) => {
                    const pointX = 40 + (i / (ragTrend.length - 1 || 1)) * 455;
                    const distance = Math.abs(x - pointX);
                    if (distance < minDistance) {
                      minDistance = distance;
                      closestIndex = i;
                    }
                  });

                  const item = ragTrend[closestIndex];
                  const pointX = 40 + (closestIndex / (ragTrend.length - 1 || 1)) * 455;
                  const pointY = 180 - ((item.queries || 0) / maxRagQueries) * 160;

                  setRagTooltip({
                    x: pointX,
                    y: pointY,
                    content: `${item.date}: ${item.queries}개`
                  });
                }
              }}
              onMouseLeave={() => setRagTooltip(null)}
            >
              <defs>
                <linearGradient id="ragGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(37, 99, 235)" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="rgb(37, 99, 235)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="rgb(37, 99, 235)" stopOpacity="0.05" />
                </linearGradient>
                <filter id="ragGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* 툴팁 */}
              {ragTooltip && (
                <g>
                  <rect
                    x={ragTooltip.x - 40}
                    y={ragTooltip.y - 35}
                    width="80"
                    height="30"
                    fill="rgba(0, 0, 0, 0.9)"
                    stroke="rgb(37, 99, 235)"
                    strokeWidth="1"
                    rx="4"
                  />
                  <text
                    x={ragTooltip.x}
                    y={ragTooltip.y - 20}
                    textAnchor="middle"
                    className="fill-white text-[10px] font-medium"
                  >
                    {ragTooltip.content}
                  </text>
                  <line
                    x1={ragTooltip.x}
                    y1="20"
                    x2={ragTooltip.x}
                    y2="180"
                    stroke="rgb(37, 99, 235)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.5"
                  />
                </g>
              )}

              {/* 수평 그리드 라인 */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="40"
                  y1={20 + i * 40}
                  x2="495"
                  y2={20 + i * 40}
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeWidth="1"
                />
              ))}

              {/* 수직 그리드 라인 */}
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <line
                  key={i}
                  x1={40 + i * 65}
                  y1="20"
                  x2={40 + i * 65}
                  y2="180"
                  stroke="rgba(255, 255, 255, 0.04)"
                  strokeWidth="1"
                />
              ))}

              {/* Y축 레이블 */}
              {[0, 1, 2, 3, 4].map((i) => {
                const value = Math.round(maxRagQueries * (1 - i / 4));
                return (
                  <text
                    key={i}
                    x="35"
                    y={23 + i * 40}
                    textAnchor="end"
                    className="fill-gray-500 text-[10px] font-medium"
                  >
                    {value}
                  </text>
                );
              })}

              {/* 그라데이션 영역 */}
              <polygon
                points={`40,180 ${ragTrend.map((item, i) => {
                  const x = 40 + (i / (ragTrend.length - 1 || 1)) * 455;
                  const y = 180 - ((item.queries || 0) / maxRagQueries) * 160;
                  return `${x},${y}`;
                }).join(' ')} 495,180`}
                fill="url(#ragGradient)"
              />

              {/* 선 그래프 */}
              <polyline
                points={ragTrend.map((item, i) => {
                  const x = 40 + (i / (ragTrend.length - 1 || 1)) * 455;
                  const y = 180 - ((item.queries || 0) / maxRagQueries) * 160;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="rgb(59, 130, 246)"
                strokeWidth="2.5"
                filter="url(#ragGlow)"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* 데이터 포인트 */}
              {ragTrend.map((item, i) => {
                const x = 40 + (i / (ragTrend.length - 1 || 1)) * 455;
                const y = 180 - ((item.queries || 0) / maxRagQueries) * 160;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="4" fill="rgb(59, 130, 246)" opacity="0.5" />
                    <circle cx={x} cy={y} r="2.5" fill="rgb(147, 197, 253)" />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* 통계 */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-950/50 p-2.5 ring-1 ring-white/5">
              <div className="text-[10px] text-gray-500">평균</div>
              <div className="mt-1 text-sm font-bold text-blue-400">
                {ragTrend.length > 0 ? Math.round(ragTrend.reduce((sum, item) => sum + (item.queries || 0), 0) / ragTrend.length) : 0}
              </div>
            </div>
            <div className="rounded-lg bg-gray-950/50 p-2.5 ring-1 ring-white/5">
              <div className="text-[10px] text-gray-500">최대</div>
              <div className="mt-1 text-sm font-bold text-blue-400">{maxRagQueries}</div>
            </div>
          </div>
        </div>

        {/* 선물 마법사 추세 */}
        <div className="relative overflow-hidden rounded-xl border border-gray-200/50 bg-gradient-to-br from-gray-900 to-gray-800 p-5 shadow-lg dark:border-gray-700/50">
          {/* Grafana 스타일 배경 그리드 */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>

          <div className="relative mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">AI 선물 마법사</h3>
              <p className="mt-1 text-xs text-gray-400">총 세션 수</p>
            </div>
            <div className="rounded-lg bg-emerald-600/20 px-3 py-1.5 text-xl font-bold text-emerald-400 shadow-inner">
              {giftTrend.reduce((sum, item) => sum + (item.sessions || 0), 0)}
            </div>
          </div>

          {/* 차트 */}
          <div className="relative h-48 rounded-lg bg-gray-950/50 p-4 ring-1 ring-white/5">
            <svg
              className="h-full w-full"
              viewBox="0 0 500 200"
              preserveAspectRatio="none"
              onMouseMove={(e) => {
                const svg = e.currentTarget;
                const rect = svg.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 500;

                if (x >= 40 && x <= 495 && giftTrend.length > 0) {
                  let closestIndex = 0;
                  let minDistance = Infinity;

                  giftTrend.forEach((item, i) => {
                    const pointX = 40 + (i / (giftTrend.length - 1 || 1)) * 455;
                    const distance = Math.abs(x - pointX);
                    if (distance < minDistance) {
                      minDistance = distance;
                      closestIndex = i;
                    }
                  });

                  const item = giftTrend[closestIndex];
                  const pointX = 40 + (closestIndex / (giftTrend.length - 1 || 1)) * 455;
                  const pointY = 180 - ((item.sessions || 0) / maxGiftSessions) * 160;

                  setGiftTooltip({
                    x: pointX,
                    y: pointY,
                    content: `${item.date}: ${item.sessions}회`
                  });
                }
              }}
              onMouseLeave={() => setGiftTooltip(null)}
            >
              <defs>
                <linearGradient id="giftGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="rgb(16, 185, 129)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.05" />
                </linearGradient>
                <filter id="giftGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* 툴팁 */}
              {giftTooltip && (
                <g>
                  <rect
                    x={giftTooltip.x - 40}
                    y={giftTooltip.y - 35}
                    width="80"
                    height="30"
                    fill="rgba(0, 0, 0, 0.9)"
                    stroke="rgb(16, 185, 129)"
                    strokeWidth="1"
                    rx="4"
                  />
                  <text
                    x={giftTooltip.x}
                    y={giftTooltip.y - 20}
                    textAnchor="middle"
                    className="fill-white text-[10px] font-medium"
                  >
                    {giftTooltip.content}
                  </text>
                  <line
                    x1={giftTooltip.x}
                    y1="20"
                    x2={giftTooltip.x}
                    y2="180"
                    stroke="rgb(16, 185, 129)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.5"
                  />
                </g>
              )}

              {/* 수평 그리드 라인 */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="40"
                  y1={20 + i * 40}
                  x2="495"
                  y2={20 + i * 40}
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeWidth="1"
                />
              ))}

              {/* 수직 그리드 라인 */}
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <line
                  key={i}
                  x1={40 + i * 65}
                  y1="20"
                  x2={40 + i * 65}
                  y2="180"
                  stroke="rgba(255, 255, 255, 0.04)"
                  strokeWidth="1"
                />
              ))}

              {/* Y축 레이블 */}
              {[0, 1, 2, 3, 4].map((i) => {
                const value = Math.round(maxGiftSessions * (1 - i / 4));
                return (
                  <text
                    key={i}
                    x="35"
                    y={23 + i * 40}
                    textAnchor="end"
                    className="fill-gray-500 text-[10px] font-medium"
                  >
                    {value}
                  </text>
                );
              })}

              {/* 그라데이션 영역 */}
              <polygon
                points={`40,180 ${giftTrend.map((item, i) => {
                  const x = 40 + (i / (giftTrend.length - 1 || 1)) * 455;
                  const y = 180 - ((item.sessions || 0) / maxGiftSessions) * 160;
                  return `${x},${y}`;
                }).join(' ')} 495,180`}
                fill="url(#giftGradient)"
              />

              {/* 선 그래프 */}
              <polyline
                points={giftTrend.map((item, i) => {
                  const x = 40 + (i / (giftTrend.length - 1 || 1)) * 455;
                  const y = 180 - ((item.sessions || 0) / maxGiftSessions) * 160;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="rgb(52, 211, 153)"
                strokeWidth="2.5"
                filter="url(#giftGlow)"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* 데이터 포인트 */}
              {giftTrend.map((item, i) => {
                const x = 40 + (i / (giftTrend.length - 1 || 1)) * 455;
                const y = 180 - ((item.sessions || 0) / maxGiftSessions) * 160;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="4" fill="rgb(52, 211, 153)" opacity="0.5" />
                    <circle cx={x} cy={y} r="2.5" fill="rgb(167, 243, 208)" />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* 통계 */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-950/50 p-2.5 ring-1 ring-white/5">
              <div className="text-[10px] text-gray-500">평균</div>
              <div className="mt-1 text-sm font-bold text-emerald-400">
                {giftTrend.length > 0 ? Math.round(giftTrend.reduce((sum, item) => sum + (item.sessions || 0), 0) / giftTrend.length) : 0}
              </div>
            </div>
            <div className="rounded-lg bg-gray-950/50 p-2.5 ring-1 ring-white/5">
              <div className="text-[10px] text-gray-500">최대</div>
              <div className="mt-1 text-sm font-bold text-emerald-400">{maxGiftSessions}</div>
            </div>
          </div>
        </div>
      </section>


      {/* 전체 통계 차트 */}
      <section className="mb-4 grid gap-4 lg:grid-cols-3">
        {/* 총 회원 */}
        <div className="relative overflow-hidden rounded-xl border border-gray-200/50 bg-gradient-to-br from-gray-900 to-gray-800 p-5 shadow-lg dark:border-gray-700/50">
          {/* Grafana 스타일 배경 그리드 */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>

          <div className="relative mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">총 회원</h3>
              <p className="mt-1 text-xs text-gray-400">Total Users</p>
            </div>
            <div className="rounded-lg bg-blue-600/20 px-3 py-1.5 text-xl font-bold text-blue-400 shadow-inner">
              {(summary.total_users || 0).toLocaleString()}
            </div>
          </div>

          {/* 차트 */}
          <div className="relative h-48 rounded-lg bg-gray-950/50 p-4 ring-1 ring-white/5">
            <svg
              className="h-full w-full"
              viewBox="0 0 500 200"
              preserveAspectRatio="none"
              onMouseMove={(e) => {
                const svg = e.currentTarget;
                const rect = svg.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 500;

                if (x >= 40 && x <= 495 && usersTrend.length > 0) {
                  // 가장 가까운 데이터 포인트 찾기
                  let closestIndex = 0;
                  let minDistance = Infinity;

                  usersTrend.forEach((item, i) => {
                    const pointX = 40 + (i / (usersTrend.length - 1 || 1)) * 455;
                    const distance = Math.abs(x - pointX);
                    if (distance < minDistance) {
                      minDistance = distance;
                      closestIndex = i;
                    }
                  });

                  const item = usersTrend[closestIndex];
                  const pointX = 40 + (closestIndex / (usersTrend.length - 1 || 1)) * 455;
                  const maxCount = Math.max(...usersTrend.map(t => t.count), 1);
                  const pointY = 180 - ((item.count || 0) / maxCount) * 160;

                  setUsersTooltip({
                    x: pointX,
                    y: pointY,
                    content: `${item.date}: ${item.count}명`
                  });
                }
              }}
              onMouseLeave={() => setUsersTooltip(null)}
            >
              <defs>
                <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="rgb(59, 130, 246)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.05" />
                </linearGradient>
                <filter id="userGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* 툴팁 */}
              {usersTooltip && (
                <g>
                  <rect
                    x={usersTooltip.x - 40}
                    y={usersTooltip.y - 35}
                    width="80"
                    height="30"
                    fill="rgba(0, 0, 0, 0.9)"
                    stroke="rgb(59, 130, 246)"
                    strokeWidth="1"
                    rx="4"
                  />
                  <text
                    x={usersTooltip.x}
                    y={usersTooltip.y - 20}
                    textAnchor="middle"
                    className="fill-white text-[10px] font-medium"
                  >
                    {usersTooltip.content}
                  </text>
                  {/* 세로 가이드 라인 */}
                  <line
                    x1={usersTooltip.x}
                    y1="20"
                    x2={usersTooltip.x}
                    y2="180"
                    stroke="rgb(59, 130, 246)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.5"
                  />
                </g>
              )}

              {/* 수평 그리드 라인 */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="40"
                  y1={20 + i * 40}
                  x2="495"
                  y2={20 + i * 40}
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeWidth="1"
                />
              ))}

              {/* 수직 그리드 라인 */}
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <line
                  key={i}
                  x1={40 + i * 65}
                  y1="20"
                  x2={40 + i * 65}
                  y2="180"
                  stroke="rgba(255, 255, 255, 0.04)"
                  strokeWidth="1"
                />
              ))}

              {/* Y축 레이블 */}
              {[0, 1, 2, 3, 4].map((i) => {
                const counts = usersTrend.map(t => t.count);
                const maxCount = counts.length > 0 ? Math.max(...counts) : 1;
                const value = Math.round(maxCount * (1 - i / 4));
                return (
                  <text
                    key={i}
                    x="35"
                    y={23 + i * 40}
                    textAnchor="end"
                    className="fill-gray-500 text-[10px] font-medium"
                  >
                    {value}
                  </text>
                );
              })}

              {/* 그라데이션 영역 */}
              <polygon
                points={usersTrend.length > 0
                  ? `40,180 ${usersTrend.map((item, i) => {
                      const x = 40 + (i / (usersTrend.length - 1 || 1)) * 455;
                      const maxCount = Math.max(...usersTrend.map(t => t.count), 1);
                      const y = 180 - ((item.count || 0) / maxCount) * 160;
                      return `${x},${y}`;
                    }).join(' ')} 495,180`
                  : "40,180 495,180"
                }
                fill="url(#userGradient)"
              />

              {/* 선 그래프 */}
              <polyline
                points={usersTrend.length > 0
                  ? usersTrend.map((item, i) => {
                      const x = 40 + (i / (usersTrend.length - 1 || 1)) * 455;
                      const maxCount = Math.max(...usersTrend.map(t => t.count), 1);
                      const y = 180 - ((item.count || 0) / maxCount) * 160;
                      return `${x},${y}`;
                    }).join(' ')
                  : "40,180 495,180"
                }
                fill="none"
                stroke="rgb(59, 130, 246)"
                strokeWidth="2.5"
                filter="url(#userGlow)"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* 데이터 포인트 */}
              {usersTrend.map((item, i) => {
                const x = 40 + (i / (usersTrend.length - 1 || 1)) * 455;
                const maxCount = Math.max(...usersTrend.map(t => t.count), 1);
                const y = 180 - ((item.count || 0) / maxCount) * 160;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="4" fill="rgb(59, 130, 246)" opacity="0.5" />
                    <circle cx={x} cy={y} r="2.5" fill="rgb(147, 197, 253)" />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* 통계 */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-950/50 p-2.5 ring-1 ring-white/5">
              <div className="text-[10px] text-gray-500">증가율</div>
              <div className="mt-1 flex items-center gap-1 text-sm font-bold text-green-400">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                12%
              </div>
            </div>
            <div className="rounded-lg bg-gray-950/50 p-2.5 ring-1 ring-white/5">
              <div className="text-[10px] text-gray-500">이번 달</div>
              <div className="mt-1 text-sm font-bold text-blue-400">+{Math.round((summary.total_users || 0) * 0.12)}</div>
            </div>
          </div>
        </div>

        {/* 총 상품 */}
        <div className="relative overflow-hidden rounded-xl border border-gray-200/50 bg-gradient-to-br from-gray-900 to-gray-800 p-5 shadow-lg dark:border-gray-700/50">
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>

          <div className="relative mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">총 상품</h3>
              <p className="mt-1 text-xs text-gray-400">Total Products</p>
            </div>
            <div className="rounded-lg bg-purple-600/20 px-3 py-1.5 text-xl font-bold text-purple-400 shadow-inner">
              {(summary.total_products || 0).toLocaleString()}
            </div>
          </div>

          <div className="relative h-48 rounded-lg bg-gray-950/50 p-4 ring-1 ring-white/5">
            <svg
              className="h-full w-full"
              viewBox="0 0 500 200"
              preserveAspectRatio="none"
              onMouseMove={(e) => {
                const svg = e.currentTarget;
                const rect = svg.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 500;

                if (x >= 40 && x <= 495 && productsTrend.length > 0) {
                  let closestIndex = 0;
                  let minDistance = Infinity;

                  productsTrend.forEach((item, i) => {
                    const pointX = 40 + (i / (productsTrend.length - 1 || 1)) * 455;
                    const distance = Math.abs(x - pointX);
                    if (distance < minDistance) {
                      minDistance = distance;
                      closestIndex = i;
                    }
                  });

                  const item = productsTrend[closestIndex];
                  const pointX = 40 + (closestIndex / (productsTrend.length - 1 || 1)) * 455;
                  const maxCount = Math.max(...productsTrend.map(t => t.count), 1);
                  const pointY = 180 - ((item.count || 0) / maxCount) * 160;

                  setProductsTooltip({
                    x: pointX,
                    y: pointY,
                    content: `${item.date}: ${item.count}개`
                  });
                }
              }}
              onMouseLeave={() => setProductsTooltip(null)}
            >
              <defs>
                <linearGradient id="productGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(168, 85, 247)" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="rgb(168, 85, 247)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="rgb(168, 85, 247)" stopOpacity="0.05" />
                </linearGradient>
                <filter id="productGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* 툴팁 */}
              {productsTooltip && (
                <g>
                  <rect
                    x={productsTooltip.x - 40}
                    y={productsTooltip.y - 35}
                    width="80"
                    height="30"
                    fill="rgba(0, 0, 0, 0.9)"
                    stroke="rgb(168, 85, 247)"
                    strokeWidth="1"
                    rx="4"
                  />
                  <text
                    x={productsTooltip.x}
                    y={productsTooltip.y - 20}
                    textAnchor="middle"
                    className="fill-white text-[10px] font-medium"
                  >
                    {productsTooltip.content}
                  </text>
                  <line
                    x1={productsTooltip.x}
                    y1="20"
                    x2={productsTooltip.x}
                    y2="180"
                    stroke="rgb(168, 85, 247)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.5"
                  />
                </g>
              )}

              {[0, 1, 2, 3, 4].map((i) => (
                <line key={i} x1="40" y1={20 + i * 40} x2="495" y2={20 + i * 40} stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" />
              ))}
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <line key={i} x1={40 + i * 65} y1="20" x2={40 + i * 65} y2="180" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
              ))}

              {[0, 1, 2, 3, 4].map((i) => {
                const counts = productsTrend.map(t => t.count);
                const maxCount = counts.length > 0 ? Math.max(...counts) : 1;
                const value = Math.round(maxCount * (1 - i / 4));
                return (
                  <text key={i} x="35" y={23 + i * 40} textAnchor="end" className="fill-gray-500 text-[10px] font-medium">
                    {value}
                  </text>
                );
              })}

              <polygon
                points={productsTrend.length > 0
                  ? `40,180 ${productsTrend.map((item, i) => {
                      const x = 40 + (i / (productsTrend.length - 1 || 1)) * 455;
                      const maxCount = Math.max(...productsTrend.map(t => t.count), 1);
                      const y = 180 - ((item.count || 0) / maxCount) * 160;
                      return `${x},${y}`;
                    }).join(' ')} 495,180`
                  : "40,180 495,180"
                }
                fill="url(#productGradient)"
              />

              <polyline
                points={productsTrend.length > 0
                  ? productsTrend.map((item, i) => {
                      const x = 40 + (i / (productsTrend.length - 1 || 1)) * 455;
                      const maxCount = Math.max(...productsTrend.map(t => t.count), 1);
                      const y = 180 - ((item.count || 0) / maxCount) * 160;
                      return `${x},${y}`;
                    }).join(' ')
                  : "40,180 495,180"
                }
                fill="none"
                stroke="rgb(168, 85, 247)"
                strokeWidth="2.5"
                filter="url(#productGlow)"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {productsTrend.map((item, i) => {
                const x = 40 + (i / (productsTrend.length - 1 || 1)) * 455;
                const maxCount = Math.max(...productsTrend.map(t => t.count), 1);
                const y = 180 - ((item.count || 0) / maxCount) * 160;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="4" fill="rgb(168, 85, 247)" opacity="0.5" />
                    <circle cx={x} cy={y} r="2.5" fill="rgb(216, 180, 254)" />
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-950/50 p-2.5 ring-1 ring-white/5">
              <div className="text-[10px] text-gray-500">증가율</div>
              <div className="mt-1 flex items-center gap-1 text-sm font-bold text-green-400">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                8%
              </div>
            </div>
            <div className="rounded-lg bg-gray-950/50 p-2.5 ring-1 ring-white/5">
              <div className="text-[10px] text-gray-500">이번 달</div>
              <div className="mt-1 text-sm font-bold text-purple-400">+{Math.round((summary.total_products || 0) * 0.08)}</div>
            </div>
          </div>
        </div>

        {/* 총 주문 */}
        <div className="relative overflow-hidden rounded-xl border border-gray-200/50 bg-gradient-to-br from-gray-900 to-gray-800 p-5 shadow-lg dark:border-gray-700/50">
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'linear-gradient(rgba(52, 211, 153, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(52, 211, 153, 0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>

          <div className="relative mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">총 주문</h3>
              <p className="mt-1 text-xs text-gray-400">Total Orders</p>
            </div>
            <div className="rounded-lg bg-emerald-600/20 px-3 py-1.5 text-xl font-bold text-emerald-400 shadow-inner">
              {(summary.total_orders || 0).toLocaleString()}
            </div>
          </div>

          <div className="relative h-48 rounded-lg bg-gray-950/50 p-4 ring-1 ring-white/5">
            <svg
              className="h-full w-full"
              viewBox="0 0 500 200"
              preserveAspectRatio="none"
              onMouseMove={(e) => {
                const svg = e.currentTarget;
                const rect = svg.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 500;

                if (x >= 40 && x <= 495 && ordersTrend.length > 0) {
                  let closestIndex = 0;
                  let minDistance = Infinity;

                  ordersTrend.forEach((item, i) => {
                    const pointX = 40 + (i / (ordersTrend.length - 1 || 1)) * 455;
                    const distance = Math.abs(x - pointX);
                    if (distance < minDistance) {
                      minDistance = distance;
                      closestIndex = i;
                    }
                  });

                  const item = ordersTrend[closestIndex];
                  const pointX = 40 + (closestIndex / (ordersTrend.length - 1 || 1)) * 455;
                  const maxCount = Math.max(...ordersTrend.map(t => t.count), 1);
                  const pointY = 180 - ((item.count || 0) / maxCount) * 160;

                  setOrdersTooltip({
                    x: pointX,
                    y: pointY,
                    content: `${item.date}: ${item.count}건`
                  });
                }
              }}
              onMouseLeave={() => setOrdersTooltip(null)}
            >
              <defs>
                <linearGradient id="orderGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(52, 211, 153)" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="rgb(52, 211, 153)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="rgb(52, 211, 153)" stopOpacity="0.05" />
                </linearGradient>
                <filter id="orderGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* 툴팁 */}
              {ordersTooltip && (
                <g>
                  <rect
                    x={ordersTooltip.x - 40}
                    y={ordersTooltip.y - 35}
                    width="80"
                    height="30"
                    fill="rgba(0, 0, 0, 0.9)"
                    stroke="rgb(52, 211, 153)"
                    strokeWidth="1"
                    rx="4"
                  />
                  <text
                    x={ordersTooltip.x}
                    y={ordersTooltip.y - 20}
                    textAnchor="middle"
                    className="fill-white text-[10px] font-medium"
                  >
                    {ordersTooltip.content}
                  </text>
                  <line
                    x1={ordersTooltip.x}
                    y1="20"
                    x2={ordersTooltip.x}
                    y2="180"
                    stroke="rgb(52, 211, 153)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.5"
                  />
                </g>
              )}

              {[0, 1, 2, 3, 4].map((i) => (
                <line key={i} x1="40" y1={20 + i * 40} x2="495" y2={20 + i * 40} stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" />
              ))}
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <line key={i} x1={40 + i * 65} y1="20" x2={40 + i * 65} y2="180" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
              ))}

              {[0, 1, 2, 3, 4].map((i) => {
                const counts = ordersTrend.map(t => t.count);
                const maxCount = counts.length > 0 ? Math.max(...counts) : 1;
                const value = Math.round(maxCount * (1 - i / 4));
                return (
                  <text key={i} x="35" y={23 + i * 40} textAnchor="end" className="fill-gray-500 text-[10px] font-medium">
                    {value}
                  </text>
                );
              })}

              <polygon
                points={ordersTrend.length > 0
                  ? `40,180 ${ordersTrend.map((item, i) => {
                      const x = 40 + (i / (ordersTrend.length - 1 || 1)) * 455;
                      const maxCount = Math.max(...ordersTrend.map(t => t.count), 1);
                      const y = 180 - ((item.count || 0) / maxCount) * 160;
                      return `${x},${y}`;
                    }).join(' ')} 495,180`
                  : "40,180 495,180"
                }
                fill="url(#orderGradient)"
              />

              <polyline
                points={ordersTrend.length > 0
                  ? ordersTrend.map((item, i) => {
                      const x = 40 + (i / (ordersTrend.length - 1 || 1)) * 455;
                      const maxCount = Math.max(...ordersTrend.map(t => t.count), 1);
                      const y = 180 - ((item.count || 0) / maxCount) * 160;
                      return `${x},${y}`;
                    }).join(' ')
                  : "40,180 495,180"
                }
                fill="none"
                stroke="rgb(52, 211, 153)"
                strokeWidth="2.5"
                filter="url(#orderGlow)"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {ordersTrend.map((item, i) => {
                const x = 40 + (i / (ordersTrend.length - 1 || 1)) * 455;
                const maxCount = Math.max(...ordersTrend.map(t => t.count), 1);
                const y = 180 - ((item.count || 0) / maxCount) * 160;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="4" fill="rgb(52, 211, 153)" opacity="0.5" />
                    <circle cx={x} cy={y} r="2.5" fill="rgb(167, 243, 208)" />
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-950/50 p-2.5 ring-1 ring-white/5">
              <div className="text-[10px] text-gray-500">증가율</div>
              <div className="mt-1 flex items-center gap-1 text-sm font-bold text-green-400">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                15%
              </div>
            </div>
            <div className="rounded-lg bg-gray-950/50 p-2.5 ring-1 ring-white/5">
              <div className="text-[10px] text-gray-500">이번 달</div>
              <div className="mt-1 text-sm font-bold text-emerald-400">+{Math.round((summary.total_orders || 0) * 0.15)}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
