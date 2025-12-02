'use client'

import { useState } from 'react'
import GiftWizardChat from '../components/gift-wizard/GiftWizardChat'
import GiftWizardResult from '../components/gift-wizard/GiftWizardResult'

export default function GiftWizardPage() {
  const [step, setStep] = useState<'intro' | 'chat' | 'loading' | 'result'>('intro')
  const [answers, setAnswers] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any>(null)

  const handleStart = () => {
    setStep('chat')
  }

  const handleComplete = (userAnswers: any) => {
    setAnswers(userAnswers)
    setStep('loading')

    // API 호출
    fetchRecommendations(userAnswers)
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
      setRecommendations(data)
      setStep('result')
    } catch (error: any) {
      console.error('추천 오류:', error)

      // 에러 상세 정보 표시
      let errorMessage = '추천에 실패했습니다. 다시 시도해주세요.'
      if (error.message) {
        errorMessage += `\n\n상세: ${error.message}`
      }

      alert(errorMessage)
      setStep('intro')
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
          {/* 상단 배너 */}
          <div className="border border-gray-200 bg-white p-8 mb-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="text-center">
              <div className="mb-3">
                <span className="text-4xl">🎁</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                AI 선물 추천 마법사
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                5가지 질문으로 완벽한 선물을 찾아드려요
              </p>
            </div>
          </div>

          {/* 기능 소개 그리드 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {[
              { icon: '💑', title: '연인 선물', desc: '기념일, 생일 선물 추천' },
              { icon: '👨‍👩‍👧', title: '가족 선물', desc: '부모님, 형제 선물' },
              { icon: '👯', title: '친구 선물', desc: '생일, 축하 선물' },
              { icon: '💼', title: '동료 선물', desc: '승진, 퇴사 선물' },
            ].map((item) => (
              <div
                key={item.title}
                className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 시작 버튼 */}
          <div className="border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-900">
            <div className="text-center">
              <button
                onClick={handleStart}
                className="bg-gray-900 px-8 py-3 text-sm font-bold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                선물 추천 시작하기
              </button>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                소요 시간: 약 2분
              </p>
            </div>
          </div>
        </div>
      )}

      {step === 'chat' && (
        <GiftWizardChat onComplete={handleComplete} />
      )}

      {step === 'loading' && (
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-20">
          <div className="border border-gray-200 bg-white p-12 dark:border-gray-700 dark:bg-gray-900">
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-white"></div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                AI가 선물을 찾는 중입니다
              </h2>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>상품 데이터 분석 중...</p>
                <p>받는 분의 취향 파악 중...</p>
                <p>최적의 조합 계산 중...</p>
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
