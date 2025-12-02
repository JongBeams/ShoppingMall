'use client'

import { useState } from 'react'

interface Message {
  type: 'ai' | 'user'
  text: string
  options?: string[]
}

interface GiftWizardChatProps {
  onComplete: (answers: any) => void
}

export default function GiftWizardChat({ onComplete }: GiftWizardChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'ai',
      text: '안녕하세요! 완벽한 선물을 찾아드릴게요 😊\n누구에게 선물하시나요?',
      options: ['연인 (남)', '연인 (여)', '부모', '형제', '자녀', '친구', '동료'],
    },
  ])
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<any>({})
  const [showOptions, setShowOptions] = useState(true)

  const questions = [
    {
      key: 'relationship',
      text: '누구에게 선물하시나요?',
      options: ['연인_남', '연인_여', '부모', '형제', '자녀', '친구', '동료'],
      displayOptions: ['연인 (남)', '연인 (여)', '부모', '형제', '자녀', '친구', '동료'],
    },
    {
      key: 'age_range',
      text: '받는 분의 연령대는?',
      options: ['10대', '20대', '30대', '40대', '50대+'],
    },
    {
      key: 'style',
      text: '어떤 스타일을 좋아하시나요?',
      options: ['미니멀', '화려한', '빈티지', '모던', '캐주얼'],
    },
    {
      key: 'interests',
      text: '관심사가 있다면? (여러 개 선택 가능, 없으면 "없음")',
      options: ['운동', '독서', '게임', '여행', '요리', '음악', '패션', '없음'],
      multi: true,
    },
    {
      key: 'occasion',
      text: '어떤 목적의 선물인가요?',
      options: ['생일', '기념일', '축하', '위로', '감사', '그냥'],
    },
    {
      key: 'budget',
      text: '예산이 어떻게 되시나요?',
      options: ['~3만원', '3~10만원', '10~30만원', '30만원+'],
    },
    {
      key: 'special_request',
      text: '특별한 요청사항이 있나요?',
      options: ['각인 가능한 것', '실용적인 것', '의미있는 것', '유니크한 것', '없음'],
    },
  ]

  const handleOptionClick = (option: string, displayText?: string) => {
    const currentQuestion = questions[currentStep]
    const actualOption = displayText || option

    // 사용자 메시지 추가
    setMessages((prev) => [
      ...prev,
      { type: 'user', text: actualOption },
    ])

    setShowOptions(false)

    // 답변 저장
    let newAnswers = { ...answers }

    if (currentQuestion.key === 'interests' && currentQuestion.multi) {
      // 멀티 선택
      if (option === '없음') {
        newAnswers[currentQuestion.key] = null
      } else {
        const currentInterests = newAnswers[currentQuestion.key] || []
        if (currentInterests.includes(option)) {
          newAnswers[currentQuestion.key] = currentInterests.filter((i: string) => i !== option)
        } else {
          newAnswers[currentQuestion.key] = [...currentInterests, option]
        }
      }
    } else if (currentQuestion.key === 'budget') {
      // 예산 파싱
      if (option === '~3만원') {
        newAnswers.budget_min = 0
        newAnswers.budget_max = 30000
      } else if (option === '3~10만원') {
        newAnswers.budget_min = 30000
        newAnswers.budget_max = 100000
      } else if (option === '10~30만원') {
        newAnswers.budget_min = 100000
        newAnswers.budget_max = 300000
      } else if (option === '30만원+') {
        newAnswers.budget_min = 300000
        newAnswers.budget_max = 10000000
      }
    } else if (currentQuestion.key === 'special_request' && option === '없음') {
      newAnswers[currentQuestion.key] = null
    } else {
      newAnswers[currentQuestion.key] = option
    }

    setAnswers(newAnswers)

    // 다음 질문으로
    setTimeout(() => {
      if (currentStep < questions.length - 1) {
        const nextQuestion = questions[currentStep + 1]
        setMessages((prev) => [
          ...prev,
          {
            type: 'ai',
            text: nextQuestion.text,
            options: nextQuestion.displayOptions || nextQuestion.options,
          },
        ])
        setCurrentStep(currentStep + 1)
        setShowOptions(true)
      } else {
        // 완료
        setMessages((prev) => [
          ...prev,
          {
            type: 'ai',
            text: '완벽해요! 지금 최고의 선물을 찾아드릴게요 ✨',
          },
        ])
        setTimeout(() => {
          onComplete(newAnswers)
        }, 1500)
      }
    }, 500)
  }

  const currentQuestion = questions[currentStep]
  const selectedInterests = answers.interests || []

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        {/* 진행 바 */}
        <div className="border border-gray-200 bg-white p-6 mb-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider dark:text-gray-400">진행 상황</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {currentStep + 1} / {questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 h-1 dark:bg-gray-700">
            <div
              className="bg-gray-900 h-1 transition-all duration-500 dark:bg-white"
              style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* 채팅 메시지 */}
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'ai' && (
                <div className="flex items-start gap-4 max-w-3xl">
                  <div className="w-10 h-10 border border-gray-900 bg-white flex items-center justify-center text-xl flex-shrink-0 dark:border-white dark:bg-gray-900">
                    🎁
                  </div>
                  <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed dark:text-gray-300">{message.text}</p>
                  </div>
                </div>
              )}

              {message.type === 'user' && (
                <div className="border border-gray-900 bg-gray-900 text-white px-6 py-4 max-w-md dark:border-white dark:bg-white dark:text-gray-900">
                  <p className="text-sm">{message.text}</p>
                </div>
              )}
            </div>
          ))}

          {/* 옵션 버튼 */}
          {showOptions && currentQuestion && (
            <div className="flex justify-start">
              <div className="flex items-start gap-4 max-w-3xl">
                <div className="w-10 h-10 flex-shrink-0"></div>
                <div className="flex flex-wrap gap-3">
                  {(currentQuestion.displayOptions || currentQuestion.options).map(
                    (option, index) => {
                      const actualValue = currentQuestion.options[index]
                      const isSelected =
                        currentQuestion.multi && selectedInterests.includes(actualValue)

                      return (
                        <button
                          key={index}
                          onClick={() => handleOptionClick(actualValue, option)}
                          className={`px-5 py-3 border text-sm font-bold transition-all duration-200 ${
                            isSelected
                              ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-900 hover:text-gray-900 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600 dark:hover:border-white dark:hover:text-white'
                          }`}
                        >
                          {option}
                        </button>
                      )
                    }
                  )}

                  {/* 다중 선택 완료 버튼 */}
                  {currentQuestion.multi && selectedInterests.length > 0 && (
                    <button
                      onClick={() =>
                        handleOptionClick(
                          selectedInterests.join(', '),
                          selectedInterests.join(', ')
                        )
                      }
                      className="px-6 py-3 bg-gray-900 text-white border border-gray-900 text-sm font-bold hover:bg-gray-800 transition-all dark:bg-white dark:text-gray-900 dark:border-white dark:hover:bg-gray-100"
                    >
                      선택 완료 ({selectedInterests.length}개)
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
