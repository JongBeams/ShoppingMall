'use client'

import { useState } from 'react'
import Link from 'next/link'

interface GiftWizardResultProps {
  recommendations: any
  answers: any
  onRestart: () => void
}

export default function GiftWizardResult({
  recommendations,
  answers,
  onRestart,
}: GiftWizardResultProps) {
  const [selectedMessage, setSelectedMessage] = useState<{ [key: number]: number }>({})
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null)

  const handleCopyMessage = (message: string, recIndex: number, msgIndex: number) => {
    navigator.clipboard.writeText(message)
    setSelectedMessage({ ...selectedMessage, [recIndex]: msgIndex })
    setCopiedMessage(message)
    setTimeout(() => setCopiedMessage(null), 2000)
  }

  const recs = recommendations.recommendations || []

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        {/* 헤더 */}
        <div className="border border-gray-200 bg-white p-8 mb-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="text-center">
            <div className="mb-3">
              <span className="text-4xl">🎁</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              완벽한 선물 3가지를 찾았어요
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {answers.relationship}에게 {answers.occasion} 선물로 추천드려요
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

              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* 상품 이미지 */}
                  <div className="lg:w-1/3">
                    {rec.product_image ? (
                      <img
                        src={rec.product_image}
                        alt={rec.product_name}
                        className="w-full h-64 object-cover border border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <div className="w-full h-64 border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-400 text-6xl dark:border-gray-700 dark:bg-gray-800">
                        🎁
                      </div>
                    )}

                    <div className="mt-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 dark:text-white">
                        {rec.product_name}
                      </h3>
                      <p className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">
                        {rec.product_price?.toLocaleString()}원
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          ⭐ {rec.product_rating?.toFixed(1)}
                        </span>
                        <span>•</span>
                        <span>리뷰 {rec.product_review_count}개</span>
                      </div>
                    </div>
                  </div>

                  {/* 추천 이유 */}
                  <div className="lg:w-2/3">
                    <div className="mb-6">
                      <h4 className="text-base font-bold text-gray-900 mb-3 dark:text-white">
                        💡 추천 이유
                      </h4>
                      <div className="space-y-2">
                        {rec.reasons?.map((reason: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="text-gray-900 font-bold text-sm dark:text-white">{idx + 1}.</span>
                            <p className="text-sm text-gray-600 leading-relaxed dark:text-gray-400">{reason}</p>
                          </div>
                        ))}
                      </div>

                      {rec.caution && (
                        <div className="mt-4 p-3 border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            ⚠️ <span className="font-semibold">주의:</span> {rec.caution}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 선물 메시지 */}
                    <div className="mb-6">
                      <h4 className="text-base font-bold text-gray-900 mb-3 dark:text-white">
                        💌 선물 메시지 제안
                      </h4>
                      <div className="space-y-2">
                        {rec.gift_messages?.map((message: string, msgIdx: number) => {
                          const isSelected = selectedMessage[index] === msgIdx

                          return (
                            <div
                              key={msgIdx}
                              className={`p-3 border cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-gray-900 bg-gray-50 dark:border-white dark:bg-gray-800'
                                  : 'border-gray-200 bg-white hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-500'
                              }`}
                              onClick={() => handleCopyMessage(message, index, msgIdx)}
                            >
                              <p className="text-sm text-gray-700 leading-relaxed mb-2 dark:text-gray-300">{message}</p>
                              <button className="text-xs text-gray-600 font-semibold hover:underline dark:text-gray-400">
                                {isSelected ? '✓ 복사됨' : '이 메시지 복사'}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex gap-3">
                      {rec.product_id && (
                        <Link
                          href={`/products/${rec.product_id}`}
                          className="flex-1 px-6 py-3 bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition text-center dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                        >
                          상품 보러가기
                        </Link>
                      )}
                      <button className="px-6 py-3 border border-gray-900 text-gray-900 text-sm font-bold hover:bg-gray-50 transition dark:border-white dark:text-white dark:hover:bg-gray-800">
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
            <h3 className="text-lg font-bold text-gray-900 mb-4 dark:text-white">🎀 추가 팁</h3>

            {recommendations.packaging_tips && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2 dark:text-white">포장 TIP</h4>
                <p className="text-sm text-gray-600 leading-relaxed dark:text-gray-400">
                  {recommendations.packaging_tips}
                </p>
              </div>
            )}

            {recommendations.delivery_tips && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2 dark:text-white">전달 방법</h4>
                <p className="text-sm text-gray-600 leading-relaxed dark:text-gray-400">{recommendations.delivery_tips}</p>
              </div>
            )}
          </div>
        )}

        {/* 전체 조언 */}
        {recommendations.overall_advice && (
          <div className="border border-gray-200 bg-white p-6 mb-6 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="text-lg font-bold text-gray-900 mb-3 dark:text-white">💭 전문가의 조언</h3>
            <p className="text-sm text-gray-600 leading-relaxed dark:text-gray-400">
              {recommendations.overall_advice}
            </p>
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="flex justify-center gap-4">
          <button
            onClick={onRestart}
            className="px-8 py-3 border border-gray-300 bg-white text-gray-700 text-sm font-bold hover:bg-gray-50 transition dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            다시 추천받기
          </button>
          <Link
            href="/"
            className="px-8 py-3 bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            홈으로 돌아가기
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
