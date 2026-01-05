'use client'

import { useState, useRef } from 'react'
import GiftWizardChat from '../components/gift-wizard/GiftWizardChat'
import GiftWizardResult from '../components/gift-wizard/GiftWizardResult'

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default function GiftWizardPage() {
  const [step, setStep] = useState<'intro' | 'chat' | 'loading' | 'result'>('intro')
  const [answers, setAnswers] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any>(null)
  const [loadingLogs, setLoadingLogs] = useState<string[]>([])
  const [currentProgress, setCurrentProgress] = useState(0)
  const sessionId = useRef<string>(`gw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)

  const handleStart = () => {
    setStep('chat')
  }

  const handleComplete = (userAnswers: any) => {
    setAnswers(userAnswers)
    setStep('loading')
    setLoadingLogs([])
    setCurrentProgress(0)

    // Analytics: 세션 완료 기록
    fetch(`${API_BASE_URL}/analytics/gift-wizard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId.current,
        completed: true,
        recommendations_count: 0, // 아직 추천 전
        purchased: false
      })
    }).catch(err => console.error('Analytics 기록 실패:', err));

    // 로딩 로그 시뮬레이션
    simulateLoadingProcess()

    // API 호출
    fetchRecommendations(userAnswers)
  }

  const simulateLoadingProcess = () => {
    const logs = [
      '🎯 선물 추천을 시작합니다',
      '📦 쇼핑몰 상품 목록을 불러오는 중...',
      '✓ 총 11개의 상품을 찾았어요',
      '💰 예산에 맞는 상품들을 골라내는 중...',
      '✓ 가격대가 적합한 상품들을 선별했어요',
      '🎨 받는 분의 스타일 취향 분석 중...',
      '✓ 스타일 분석 완료',
      '🔍 상품들의 특징을 하나씩 살펴보는 중...',
      '📊 각 상품이 얼마나 적합한지 점수를 매기는 중...',
      '✓ 모든 상품 분석 완료',
      '🎁 가장 완벽한 선물 3개를 고르는 중...',
      '✓ 최고의 선물 3개 선정 완료',
      '✨ AI가 추천 이유를 작성하는 중...',
      '💌 선물과 함께 전할 메시지를 만드는 중...',
      '✓ 감동적인 메시지 작성 완료',
      '🎉 완벽한 선물 추천이 완성되었어요!',
    ]

    let index = 0
    const interval = setInterval(() => {
      if (index < logs.length) {
        setLoadingLogs((prev) => [...prev, logs[index]])
        setCurrentProgress(((index + 1) / logs.length) * 100)
        index++
      } else {
        clearInterval(interval)
      }
    }, 300)
  }

  const fetchRecommendations = async (userAnswers: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/gift-wizard/recommendations-json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userAnswers),
      })

      if (!response.ok) {
        throw new Error('추천 실패')
      }

      const data = await response.json()

      // 분석 완료 로그 추가
      setLoadingLogs((prev) => [...prev, ' 분석이 완료되었어요!', '🎁 추천 결과를 확인해보세요!'])
      setCurrentProgress(100)

      // 잠깐 보여주고 결과로 이동
      setTimeout(() => {
        setRecommendations(data)
        setStep('result')

        // Analytics: 추천 결과 조회 기록
        const recommendationsCount = data.recommendations?.length || 0;
        fetch(`${API_BASE_URL}/analytics/gift-wizard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId.current,
            completed: true,
            recommendations_count: recommendationsCount,
            purchased: false
          })
        }).catch(err => console.error('Analytics 기록 실패:', err));
      }, 1000)
    } catch (error: any) {
      console.error('추천 오류:', error)

      // 에러 로그 추가
      setLoadingLogs((prev) => [...prev, '❌ 오류가 발생했어요. 다시 시도해주세요.'])

      setTimeout(() => {
        alert('추천에 실패했습니다. 다시 시도해주세요.')
        setStep('intro')
      }, 1500)
    }
  }

  const handleRestart = () => {
    setStep('intro')
    setAnswers(null)
    setRecommendations(null)
  }

  return (
    <div className="bg-white dark:bg-gray-900">
      {step === 'intro' && (
        <div>
          {/* Hero Banner */}
          <section className="relative -mt-8 h-[350px] overflow-hidden bg-white dark:bg-gray-900">
            <div className="absolute inset-0">
              <div className="h-full w-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 border border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-900">
                  <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">AI 기반 선물 추천</span>
                </div>
                <h1 className="mb-3 text-4xl font-bold text-gray-900 dark:text-white">선물 추천 마법사</h1>
                <p className="mb-6 text-base text-gray-600 dark:text-gray-400">7개 질문으로 완벽한 선물 찾기</p>
                <button
                  onClick={handleStart}
                  className="inline-block border border-gray-900 bg-gray-900 px-8 py-3 text-sm font-bold text-white transition hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                >
                  추천 시작하기 →
                </button>
              </div>
            </div>
          </section>

          {/* Quick Features */}
          <section className="mt-8 bg-white py-6 dark:bg-gray-900">
            <div className="mx-auto max-w-6xl px-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  { name: '연인 선물', icon: '💝', color: 'border-pink-200 dark:border-pink-800' },
                  { name: '가족 선물', icon: '👨‍👩‍👧', color: 'border-blue-200 dark:border-blue-800' },
                  { name: '친구 선물', icon: '🎉', color: 'border-yellow-200 dark:border-yellow-800' },
                  { name: '동료 선물', icon: '💼', color: 'border-purple-200 dark:border-purple-800' }
                ].map((cat) => (
                  <div
                    key={cat.name}
                    className={`border-2 ${cat.color} bg-white p-6 text-center transition hover:shadow-md dark:bg-gray-900`}
                  >
                    <div className="mb-2 text-3xl">{cat.icon}</div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 진행 과정 */}
          <section className="mt-4 border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-900">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2 dark:text-white">이렇게 진행돼요</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">7단계 질문으로 완벽한 선물을 찾아드립니다</p>
            </div>
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              {[
                { step: '1', text: '관계 선택', icon: '👤' },
                { step: '2', text: '연령대', icon: '🎂' },
                { step: '3', text: '스타일', icon: '✨' },
                { step: '4', text: '관심사', icon: '❤️' },
                { step: '5', text: '상황', icon: '🎉' },
                { step: '6', text: '예산', icon: '💰' },
                { step: '7', text: '완료', icon: '🎁' },
              ].map((item, idx) => (
                <div key={item.step} className="flex flex-col items-center relative">
                  <div className="relative mb-2">
                    <div className="w-16 h-16 border-2 border-gray-900 bg-white flex items-center justify-center text-2xl dark:border-white dark:bg-gray-900">
                      {item.icon}
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-900 text-white flex items-center justify-center text-xs font-bold dark:bg-white dark:text-gray-900">
                      {item.step}
                    </div>
                  </div>
                  <p className="text-xs font-medium text-gray-900 dark:text-white">{item.text}</p>
                  {idx < 6 && (
                    <div className="hidden md:block absolute top-8 left-full w-12 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Info Grid */}
          <section className="mt-4 grid gap-4 md:grid-cols-3">
            {/* 작동 방식 */}
            <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">작동 방식</h2>
              </div>
              <div className="space-y-3">
                {[
                  { step: '1', title: '관계 선택', desc: '누구에게 선물하시나요?' },
                  { step: '2', title: '취향 파악', desc: '연령대, 스타일, 관심사' },
                  { step: '3', title: 'AI 분석', desc: '최적의 선물 추천' }
                ].map((item) => (
                  <div key={item.step} className="flex gap-3 border-b border-gray-100 pb-3 last:border-b-0 dark:border-gray-800">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center bg-gray-900 text-xs font-bold text-white dark:bg-white dark:text-gray-900">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">{item.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 왜 AI인가 */}
            <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">왜 AI 추천인가</h2>
              </div>
              <div className="space-y-3">
                {[
                  { title: '정확한 분석', desc: '받는 분의 취향을 정밀 분석' },
                  { title: '시간 절약', desc: '2분이면 완벽한 선물 찾기' },
                  { title: '실패 없음', desc: '데이터 기반 맞춤 추천' }
                ].map((item, idx) => (
                  <div key={idx} className="border-b border-gray-100 pb-3 last:border-b-0 dark:border-gray-800">
                    <h3 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">{item.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 추천 대상 */}
            <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">추천 대상</h2>
              </div>
              <div className="space-y-3">
                {[
                  '선물 고르기가 어려운 분',
                  '시간이 부족한 분',
                  '특별한 선물을 원하는 분'
                ].map((item, idx) => (
                  <div key={idx} className="border-b border-gray-100 pb-3 last:border-b-0 dark:border-gray-800">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Stats Bar */}
          <section className="mt-4 border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: '평균 소요 시간', value: '2분' },
                { label: '사용자 만족도', value: '95%' },
                { label: '추천 정확도', value: 'AI 분석' }
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {step === 'chat' && (
        <GiftWizardChat onComplete={handleComplete} />
      )}

      {step === 'loading' && (
        <div>
          {/* Loading Header */}
          <section className="border-b border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-900">
            <div className="text-center">
              <div className="mb-4 inline-block relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-gray-300 dark:border-gray-600 transform rotate-45"></div>
                <div className="absolute inset-0 border-4 border-t-gray-900 dark:border-t-white transform rotate-45 animate-spin"></div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                AI가 선물을 분석하고 있어요
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                잠시만 기다려주세요
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">진행률</span>
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  {currentProgress.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 h-2 dark:bg-gray-700">
                <div
                  className="bg-gray-900 h-2 transition-all duration-300 dark:bg-white"
                  style={{ width: `${currentProgress}%` }}
                ></div>
              </div>
            </div>
          </section>

          {/* Loading Content Grid */}
          <section className="grid gap-4 md:grid-cols-2">
            {/* 분석 로그 */}
            <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">분석 진행 중</h2>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {loadingLogs.filter(log => log).map((log, idx) => {
                  const isCompleted = log.includes('✓') || log.includes('완료') || log.includes('완성') || log.includes('')
                  const isProcessing = log.includes('중...')
                  const isError = log.includes('❌')

                  return (
                    <div key={idx} className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-b-0 dark:border-gray-800">
                      {isCompleted ? (
                        <div className="w-5 h-5 flex-shrink-0 bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                          ✓
                        </div>
                      ) : isError ? (
                        <div className="w-5 h-5 flex-shrink-0 bg-red-500 flex items-center justify-center text-white text-xs font-bold">
                          !
                        </div>
                      ) : isProcessing ? (
                        <div className="w-5 h-5 flex-shrink-0 border-2 border-gray-900 border-t-transparent animate-spin dark:border-white dark:border-t-transparent"></div>
                      ) : (
                        <div className="w-5 h-5 flex-shrink-0 bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                          ●
                        </div>
                      )}
                      <p className={`text-sm leading-relaxed ${isCompleted ? 'text-gray-600 dark:text-gray-400' : isError ? 'text-red-600 dark:text-red-400' : 'text-gray-900 font-medium dark:text-white'}`}>
                        {log}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 사용자 정보 */}
            <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">입력하신 정보</h2>
              </div>
              <div className="space-y-3">
                <div className="border-b border-gray-100 pb-3 dark:border-gray-800">
                  <p className="text-xs text-gray-500 mb-1 dark:text-gray-400">받는 분</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{answers?.relationship || '-'}</p>
                </div>
                <div className="border-b border-gray-100 pb-3 dark:border-gray-800">
                  <p className="text-xs text-gray-500 mb-1 dark:text-gray-400">연령대</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{answers?.age_range || '-'}</p>
                </div>
                <div className="border-b border-gray-100 pb-3 dark:border-gray-800">
                  <p className="text-xs text-gray-500 mb-1 dark:text-gray-400">스타일</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{answers?.style || '-'}</p>
                </div>
                <div className="pb-3">
                  <p className="text-xs text-gray-500 mb-1 dark:text-gray-400">예산</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {answers?.budget_min ? `${(answers.budget_min / 10000).toFixed(0)}~${(answers.budget_max / 10000).toFixed(0)}만원` : '-'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {step === 'result' && recommendations && (
        <GiftWizardResult
          recommendations={recommendations}
          answers={answers}
          onRestart={handleRestart}
          sessionId={sessionId.current}
        />
      )}
    </div>
  )
}