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
    } catch (error) {
      console.error('추천 오류:', error)
      alert('추천에 실패했습니다. 다시 시도해주세요.')
      setStep('chat')
    }
  }

  const handleRestart = () => {
    setStep('intro')
    setAnswers(null)
    setRecommendations(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {step === 'intro' && (
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              🎁 AI 선물 추천 마법사
            </h1>
            <p className="text-xl text-gray-700 mb-12">
              고민 끝! AI가 완벽한 선물을 찾아드립니다.<br/>
              <span className="font-semibold">5가지 질문</span>만 답하면 끝!
            </p>

            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">✨ 이런 분들께 추천해요</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💑</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">연인 선물 고민</h3>
                    <p className="text-sm text-gray-600">기념일, 생일 선물 뭘 줘야 할지 모르겠어요</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">👨‍👩‍👧</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">가족 선물</h3>
                    <p className="text-sm text-gray-600">부모님, 형제에게 의미있는 선물</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">👯</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">친구 선물</h3>
                    <p className="text-sm text-gray-600">생일, 결혼, 출산 축하 선물</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💼</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">동료/상사</h3>
                    <p className="text-sm text-gray-600">승진, 퇴사 선물 센스있게</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleStart}
              className="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              시작하기 →
            </button>
          </div>
        </div>
      )}

      {step === 'chat' && (
        <GiftWizardChat onComplete={handleComplete} />
      )}

      {step === 'loading' && (
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="inline-block animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-purple-600"></div>
            </div>
            <h2 className="text-3xl font-bold mb-4 text-gray-800">✨ AI가 선물을 찾는 중...</h2>
            <div className="space-y-3 text-gray-600">
              <p className="animate-pulse">전 세계 선물 데이터 분석 중...</p>
              <p className="animate-pulse delay-100">받는 분의 취향 파악 중...</p>
              <p className="animate-pulse delay-200">완벽한 조합 계산 중...</p>
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
