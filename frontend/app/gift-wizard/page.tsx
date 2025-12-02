'use client'

import { useState } from 'react'
import GiftWizardChat from '../components/gift-wizard/GiftWizardChat'
import GiftWizardResult from '../components/gift-wizard/GiftWizardResult'

export default function GiftWizardPage() {
  const [step, setStep] = useState<'intro' | 'chat' | 'loading' | 'result'>('intro')
  const [answers, setAnswers] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any>(null)
  const [loadingLogs, setLoadingLogs] = useState<string[]>([])
  const [currentProgress, setCurrentProgress] = useState(0)

  const handleStart = () => {
    setStep('chat')
  }

  const handleComplete = (userAnswers: any) => {
    setAnswers(userAnswers)
    setStep('loading')
    setLoadingLogs([])
    setCurrentProgress(0)

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
      const response = await fetch('http://localhost:8000/gift-wizard/recommendations-json', {
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
      setLoadingLogs((prev) => [...prev, '✅ 분석이 완료되었어요!', '🎁 추천 결과를 확인해보세요!'])
      setCurrentProgress(100)

      // 잠깐 보여주고 결과로 이동
      setTimeout(() => {
        setRecommendations(data)
        setStep('result')
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
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {step === 'intro' && (
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
          {/* 상단 배너 - 간결하게 */}
          <div className="border border-gray-200 bg-white p-6 mb-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="text-center">
              <div className="mb-3">
                <span className="text-5xl">🎁</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                AI 선물 추천 마법사
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                7가지 질문으로 완벽한 선물을 찾아드려요
              </p>

              {/* 시작 버튼 */}
              <div className="mb-4">
                <button
                  onClick={handleStart}
                  className="bg-gray-900 px-10 py-3 text-sm font-bold text-white transition hover:bg-gray-800 tracking-wide shadow-lg hover:shadow-xl transform hover:scale-105 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                >
                  선물 추천 시작하기 →
                </button>
              </div>

              {/* 통계 배지 */}
              <div className="flex items-center justify-center gap-4 flex-wrap text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <span>⏱️</span>
                  <span>평균 2분</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-1">
                  <span>🎯</span>
                  <span>만족도 95%</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-1">
                  <span>🤖</span>
                  <span>AI 분석</span>
                </div>
              </div>
            </div>
          </div>

          {/* 기능 소개 그리드 - 더 입체적으로 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {[
              { icon: '💑', title: '연인 선물', desc: '기념일, 생일 선물 추천', detail: '로맨틱한 아이템', color: 'from-pink-50 to-red-50' },
              { icon: '👨‍👩‍👧', title: '가족 선물', desc: '부모님, 형제 선물', detail: '실용적이고 따뜻한', color: 'from-blue-50 to-cyan-50' },
              { icon: '👯', title: '친구 선물', desc: '생일, 축하 선물', detail: '센스있는 아이템', color: 'from-yellow-50 to-orange-50' },
              { icon: '💼', title: '동료 선물', desc: '승진, 퇴사 선물', detail: '품격있는 선택', color: 'from-purple-50 to-indigo-50' },
            ].map((item) => (
              <div
                key={item.title}
                className="group border border-gray-200 bg-white hover:border-gray-900 transition-all duration-300 overflow-hidden dark:border-gray-700 dark:bg-gray-900 dark:hover:border-white"
              >
                <div className={`bg-gradient-to-br ${item.color} p-6 border-b border-gray-200 dark:border-gray-700 dark:from-gray-800 dark:to-gray-800`}>
                  <div className="text-center">
                    <div className="text-5xl mb-2 transform group-hover:scale-110 transition-transform">{item.icon}</div>
                  </div>
                </div>
                <div className="p-4 text-center">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{item.desc}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 특징 설명 - 더 눈에 띄게 */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {[
              { title: '빠른 추천', desc: '단 2분만에 완벽한 선물 찾기', icon: '⚡', bgColor: 'bg-yellow-50 dark:bg-gray-800' },
              { title: 'AI 분석', desc: '취향과 상황에 맞는 정확한 매칭', icon: '🤖', bgColor: 'bg-blue-50 dark:bg-gray-800' },
              { title: '선물 메시지', desc: '감동적인 메시지까지 제안', icon: '💌', bgColor: 'bg-pink-50 dark:bg-gray-800' },
            ].map((feature) => (
              <div
                key={feature.title}
                className="border border-gray-200 bg-white overflow-hidden dark:border-gray-700 dark:bg-gray-900"
              >
                <div className={`${feature.bgColor} p-4 border-b border-gray-200 dark:border-gray-700`}>
                  <div className="text-center text-4xl">{feature.icon}</div>
                </div>
                <div className="p-5 text-center">
                  <h4 className="text-sm font-bold text-gray-900 mb-2 dark:text-white">
                    {feature.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 추천 받는 방법 */}
          <div className="border border-gray-200 bg-white p-8 mb-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2 dark:text-white">
                이렇게 진행돼요
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                7단계 질문으로 완벽한 선물을 찾아드립니다
              </p>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-6">
              {[
                { step: '1', text: '관계 선택', icon: '👤' },
                { step: '2', text: '연령대', icon: '🎂' },
                { step: '3', text: '스타일', icon: '✨' },
                { step: '4', text: '관심사', icon: '❤️' },
                { step: '5', text: '상황', icon: '🎉' },
                { step: '6', text: '예산', icon: '💰' },
                { step: '7', text: '완료', icon: '🎁' },
              ].map((item, idx) => (
                <div key={item.step} className="text-center">
                  <div className="relative mb-3">
                    <div className="w-14 h-14 mx-auto border-2 border-gray-900 bg-white text-gray-900 flex items-center justify-center text-xl font-bold mb-2 dark:border-white dark:bg-gray-900 dark:text-white">
                      {item.icon}
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-900 text-white flex items-center justify-center text-xs font-bold dark:bg-white dark:text-gray-900">
                      {item.step}
                    </div>
                  </div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">{item.text}</p>
                  {idx < 6 && (
                    <div className="hidden md:block absolute top-1/4 left-full w-full h-0.5 bg-gray-300 dark:bg-gray-600" style={{ width: 'calc(100% - 56px)', marginLeft: '28px' }}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 추가 정보 섹션 */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* 왜 AI 추천인가요? */}
            <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-xl">🤖</span>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide dark:text-white">
                  왜 AI 추천인가요?
                </h3>
              </div>
              <div className="space-y-3">
                {[
                  { title: '데이터 기반 분석', desc: '수많은 상품 데이터를 실시간으로 분석합니다' },
                  { title: '개인화된 추천', desc: '받는 분의 취향과 상황을 고려한 맞춤 추천' },
                  { title: '시간 절약', desc: '고민 시간을 줄이고 최적의 선물을 빠르게 찾기' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 border border-gray-100 dark:border-gray-800">
                    <div className="w-6 h-6 flex-shrink-0 bg-gray-900 text-white flex items-center justify-center text-xs font-bold dark:bg-white dark:text-gray-900">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-1 dark:text-white">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 이런 분들께 추천해요 */}
            <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-xl">👥</span>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide dark:text-white">
                  이런 분들께 추천해요
                </h3>
              </div>
              <div className="space-y-3">
                {[
                  { emoji: '😅', text: '선물 고르기가 항상 어려운 분' },
                  { emoji: '⏰', text: '시간이 부족한 바쁜 분' },
                  { emoji: '💝', text: '특별한 선물을 원하는 분' },
                  { emoji: '🎯', text: '실패 없는 선물을 원하는 분' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 border border-gray-100 dark:border-gray-800">
                    <span className="text-2xl">{item.emoji}</span>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 실제 사용자 후기 */}
          <div className="border border-gray-200 bg-white p-6 mb-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2 dark:text-white">
                실제 사용자들의 후기
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                많은 분들이 만족하고 계세요
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { name: '김OO', review: '정말 딱 맞는 선물을 추천받았어요! 받는 사람이 너무 좋아했습니다.', rating: 5 },
                { name: '이OO', review: '고민하던 시간을 엄청 줄였어요. AI가 생각보다 똑똑하네요!', rating: 5 },
                { name: '박OO', review: '선물 메시지까지 제안해줘서 너무 편했어요. 강추합니다!', rating: 5 },
              ].map((review, idx) => (
                <div key={idx} className="p-5 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-gray-900 text-white flex items-center justify-center text-sm font-bold dark:bg-white dark:text-gray-900">
                      {review.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{review.name}</p>
                      <div className="text-yellow-500 text-xs">{'★'.repeat(review.rating)}</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed dark:text-gray-400">
                    "{review.review}"
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {step === 'chat' && (
        <GiftWizardChat onComplete={handleComplete} />
      )}

      {step === 'loading' && (
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
          {/* 상단 헤더 */}
          <div className="border border-gray-200 bg-white p-8 mb-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="text-center mb-6">
              {/* 다이아몬드 로딩 스피너 */}
              <div className="inline-block relative w-16 h-16 mb-4">
                <div className="absolute inset-0 border-4 border-gray-300 dark:border-gray-600 transform rotate-45"></div>
                <div className="absolute inset-0 border-4 border-t-gray-900 dark:border-t-white transform rotate-45 animate-spin"></div>
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                AI가 선물을 분석하고 있어요
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                완벽한 추천을 위해 최선을 다하고 있습니다
              </p>
            </div>

            {/* 프로그레스 바 */}
            <div className="mb-4">
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
          </div>

          {/* 2단 그리드 레이아웃 */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* 왼쪽: 분석 진행 상황 */}
            <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-lg">⚙️</span>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide dark:text-white">
                  지금 무엇을 하고 있나요?
                </h3>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {loadingLogs.filter(log => log).map((log, idx) => {
                  const isCompleted = log.includes('✓') || log.includes('완료') || log.includes('완성') || log.includes('✅')
                  const isProcessing = log.includes('중...')
                  const isError = log.includes('❌')

                  return (
                    <div key={idx} className="flex items-start gap-3 p-3 border border-gray-100 dark:border-gray-800">
                      {isCompleted ? (
                        <div className="w-6 h-6 flex-shrink-0 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      ) : isError ? (
                        <div className="w-6 h-6 flex-shrink-0 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">!</span>
                        </div>
                      ) : isProcessing ? (
                        <div className="w-6 h-6 flex-shrink-0 border-2 border-gray-900 border-t-transparent rounded-full animate-spin dark:border-white dark:border-t-transparent"></div>
                      ) : (
                        <div className="w-6 h-6 flex-shrink-0 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">●</span>
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

            {/* 오른쪽: 선물 팁 & 통계 */}
            <div className="space-y-6">
              {/* 선물 팁 */}
              <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-lg">💡</span>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide dark:text-white">
                    선물 팁
                  </h3>
                </div>
                <div className="space-y-4">
                  {[
                    { icon: '🎀', title: '포장의 중요성', desc: '정성스러운 포장이 선물의 가치를 2배로 높입니다' },
                    { icon: '📝', title: '메시지 카드', desc: '진심이 담긴 손편지가 가장 감동적입니다' },
                    { icon: '⏰', title: '타이밍', desc: '예상치 못한 순간의 선물이 더 특별합니다' },
                  ].map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{tip.icon}</span>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-1 dark:text-white">
                          {tip.title}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {tip.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI 분석 통계 */}
              <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-lg">📊</span>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide dark:text-white">
                    분석 통계
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: '분석한 상품', value: '11개', icon: '📦' },
                    { label: '매칭 점수', value: currentProgress >= 60 ? '계산완료' : '계산중', icon: '🎯' },
                    { label: 'AI 추천', value: currentProgress >= 80 ? '생성중' : '대기중', icon: '✨' },
                    { label: '메시지', value: currentProgress >= 90 ? '작성중' : '대기중', icon: '💌' },
                  ].map((stat, idx) => (
                    <div key={idx} className="text-center p-4 border border-gray-200 dark:border-gray-700">
                      <div className="text-3xl mb-2">{stat.icon}</div>
                      <p className="text-xs text-gray-600 mb-1 dark:text-gray-400">{stat.label}</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 사용자 입력 정보 요약 */}
          <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-lg">📋</span>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide dark:text-white">
                입력하신 정보
              </h3>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 mb-2 dark:text-gray-400">받는 분</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{answers?.relationship || '-'}</p>
              </div>
              <div className="p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 mb-2 dark:text-gray-400">연령대</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{answers?.age_range || '-'}</p>
              </div>
              <div className="p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 mb-2 dark:text-gray-400">스타일</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{answers?.style || '-'}</p>
              </div>
              <div className="p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 mb-2 dark:text-gray-400">예산</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {answers?.budget_min ? `${(answers.budget_min / 10000).toFixed(0)}~${(answers.budget_max / 10000).toFixed(0)}만원` : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'result' && recommendations && (
        <GiftWizardResult
          recommendations={recommendations}
          answers={answers}
          onRestart={handleRestart}
        />
      )}
    </div>
  )
}
