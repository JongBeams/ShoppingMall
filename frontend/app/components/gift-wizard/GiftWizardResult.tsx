'use client'

import { useState } from 'react'
import Link from 'next/link'

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface GiftWizardResultProps {
  recommendations: any
  answers: any
  onRestart: () => void
  sessionId: string
}

export default function GiftWizardResult({
  recommendations,
  answers,
  onRestart,
  sessionId,
}: GiftWizardResultProps) {
  const [selectedMessage, setSelectedMessage] = useState<{ [key: number]: number }>({})
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null)

  const handleCopyMessage = (message: string, recIndex: number, msgIndex: number) => {
    navigator.clipboard.writeText(message)
    setSelectedMessage({ ...selectedMessage, [recIndex]: msgIndex })
    setCopiedMessage(message)
    setTimeout(() => setCopiedMessage(null), 2000)
  }

  const handleProductClick = (productId: string) => {
    // Analytics: 추천 상품 클릭 기록
    fetch(`${API_BASE_URL}/analytics/gift-wizard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        completed: true,
        recommendations_count: recs.length,
        clicked_recommendation: productId,
        purchased: false
      })
    }).catch(err => console.error('Analytics 기록 실패:', err));
  }

  const recs = recommendations.recommendations || []

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        {/* 헤더 */}
        <div className="border border-gray-200 bg-white mb-6 dark:border-gray-700 dark:bg-gray-900">
          {/* 상단 성공 배너 - 작게 수정 */}
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                추천 완료 · AI 분석 결과 <span className="font-bold text-gray-900 dark:text-white">3개 상품 매칭 성공</span>
              </p>
            </div>
          </div>

          {/* 메인 헤더 - 작게 수정 */}
          <div className="p-6">
            <div className="text-center">
              <div className="mb-3">
                <span className="text-4xl">🎁</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                완벽한 선물 3가지를 찾았어요
              </h1>
              <div className="max-w-2xl mx-auto">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <span className="font-bold text-gray-900 dark:text-white">{answers.relationship}</span>
                  에게
                  <span className="font-bold text-gray-900 dark:text-white"> {answers.occasion}</span>
                  {' '}선물로 추천드려요
                </p>

                {/* 추천 정보 태그 - 작게 수정 */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-900">
                    <span className="text-xs">💰</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {answers.budget_min?.toLocaleString()}원 ~ {answers.budget_max?.toLocaleString()}원
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-900">
                    <span className="text-xs">✨</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      스타일: {answers.style}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-900">
                    <span className="text-xs">🎯</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      연령: {answers.age_range}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 하단 안내 - 작게 수정 */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-2.5 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              💡 각 선물마다 추천 이유와 선물 메시지를 확인하세요
            </p>
          </div>
        </div>

        {/* 추천 상품 카드 */}
        <div className="space-y-6">
          {recs.map((rec: any, index: number) => (
            <div
              key={index}
              className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
            >
              {rec.rank === 1 && (
                <div className="bg-gray-900 text-white text-center py-2 text-sm font-bold dark:bg-white dark:text-gray-900">
                  👑 가장 추천
                </div>
              )}

              <div className="p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* 상품 이미지 */}
                  <div className="lg:w-2/5">
                    <div className="aspect-square relative mb-4">
                      {rec.product_image ? (
                        <img
                          src={rec.product_image}
                          alt={rec.product_name}
                          className="w-full h-full object-cover border border-gray-200 dark:border-gray-700"
                        />
                      ) : (
                        <div className="w-full h-full border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300 text-6xl dark:border-gray-700 dark:bg-gray-800">
                          🎁
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                      <div className="mb-3">
                        <span className="inline-block px-2 py-1 text-xs font-bold text-gray-600 border border-gray-300 dark:text-gray-400 dark:border-gray-600">
                          NO.{rec.rank}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-gray-900 mb-3 leading-tight dark:text-white">
                        {rec.product_name}
                      </h3>
                      <div className="mb-3">
                        <p className="text-2xl font-bold text-gray-900 tracking-tight dark:text-white">
                          {rec.product_price?.toLocaleString()}
                          <span className="text-sm font-normal ml-1">원</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="font-medium">{rec.product_rating?.toFixed(1)}</span>
                        </span>
                        <span className="w-px h-3 bg-gray-300 dark:bg-gray-600"></span>
                        <span>리뷰 {rec.product_review_count}개</span>
                      </div>
                    </div>
                  </div>

                  {/* 추천 이유 */}
                  <div className="lg:w-3/5">
                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-lg">💡</span>
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide dark:text-white">
                          추천 이유
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {rec.reasons?.map((reason: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-900 border border-gray-900 dark:text-white dark:border-white">
                              {idx + 1}
                            </span>
                            <p className="text-sm text-gray-700 leading-relaxed dark:text-gray-300">{reason}</p>
                          </div>
                        ))}
                      </div>

                      {rec.caution && (
                        <div className="mt-4 p-4 border-l-2 border-gray-900 bg-gray-50 dark:border-white dark:bg-gray-800">
                          <p className="text-xs text-gray-700 dark:text-gray-300">
                            <span className="font-bold">⚠️ 주의사항</span>
                            <br />
                            <span className="mt-1 block">{rec.caution}</span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 선물 메시지 */}
                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-lg">💌</span>
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide dark:text-white">
                          선물 메시지
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {rec.gift_messages?.map((message: string, msgIdx: number) => {
                          const isSelected = selectedMessage[index] === msgIdx

                          return (
                            <div
                              key={msgIdx}
                              className={`group relative p-4 border cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-gray-900 bg-gray-50 dark:border-white dark:bg-gray-800'
                                  : 'border-gray-200 bg-white hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-500'
                              }`}
                              onClick={() => handleCopyMessage(message, index, msgIdx)}
                            >
                              <p className="text-sm text-gray-700 leading-relaxed mb-3 dark:text-gray-300">{message}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  클릭하여 복사
                                </span>
                                <span className="text-xs font-bold text-gray-900 dark:text-white">
                                  {isSelected ? '✓ 복사됨' : ''}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="grid grid-cols-2 gap-3">
                      {rec.product_id && (
                        <Link
                          href={`/products/${rec.product_id}`}
                          onClick={() => handleProductClick(rec.product_id)}
                          className="px-6 py-4 bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition text-center tracking-wide dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                        >
                          상품 보기
                        </Link>
                      )}
                      <button className="px-6 py-4 border border-gray-900 text-gray-900 text-sm font-bold hover:bg-gray-900 hover:text-white transition tracking-wide dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-gray-900">
                        장바구니
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 추가 조언 */}
        {(recommendations.packaging_tips || recommendations.delivery_tips) && (
          <div className="border border-gray-200 bg-white p-6 mb-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-xl">🎀</span>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide dark:text-white">추가 팁</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {recommendations.packaging_tips && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider dark:text-white">포장 방법</h4>
                  <p className="text-sm text-gray-600 leading-relaxed dark:text-gray-400">
                    {recommendations.packaging_tips}
                  </p>
                </div>
              )}

              {recommendations.delivery_tips && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider dark:text-white">전달 방법</h4>
                  <p className="text-sm text-gray-600 leading-relaxed dark:text-gray-400">
                    {recommendations.delivery_tips}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 전체 조언 */}
        {recommendations.overall_advice && (
          <div className="border border-gray-200 bg-white p-6 mb-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-xl">💭</span>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide dark:text-white">전문가 조언</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed dark:text-gray-400">
              {recommendations.overall_advice}
            </p>
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <button
            onClick={onRestart}
            className="px-8 py-4 border border-gray-900 text-gray-900 text-sm font-bold hover:bg-gray-900 hover:text-white transition tracking-wide dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-gray-900"
          >
            다시 추천받기
          </button>
          <Link
            href="/"
            className="px-8 py-4 bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition text-center tracking-wide dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            홈으로
          </Link>
        </div>
      </div>

      {/* 복사 알림 */}
      {copiedMessage && (
        <div className="fixed bottom-8 right-8 border border-gray-900 bg-white px-6 py-3 shadow-lg dark:border-white dark:bg-gray-900">
          <p className="text-sm font-bold text-gray-900 dark:text-white">✓ 메시지가 복사되었습니다</p>
        </div>
      )}
    </div>
  )
}
