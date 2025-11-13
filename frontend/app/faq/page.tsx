'use client';

import Link from 'next/link';
import { useState } from 'react';

interface FAQ {
  id: number;
  category: string;
  question: string;
  answer: string;
}

export default function FAQPage() {
  const [openId, setOpenId] = useState<number | null>(null);

  const faqs: FAQ[] = [
    {
      id: 1,
      category: '주문/결제',
      question: '주문을 취소하고 싶어요',
      answer: '주문 취소는 배송 준비 중 상태까지만 가능합니다. 마이페이지 > 주문내역에서 해당 주문의 "주문취소" 버튼을 클릭하시면 됩니다. 이미 배송이 시작된 경우에는 상품 수령 후 반품 신청을 해주셔야 합니다.',
    },
    {
      id: 2,
      category: '주문/결제',
      question: '결제 방법은 어떤 것이 있나요?',
      answer: '신용카드, 체크카드, 계좌이체, 무통장입금, 카카오페이, 네이버페이, 토스페이, PAYCO 등 다양한 결제 수단을 지원합니다. 결제 페이지에서 원하시는 방법을 선택하실 수 있습니다.',
    },
    {
      id: 3,
      category: '배송',
      question: '배송 기간은 얼마나 걸리나요?',
      answer: '일반 배송의 경우 주문 후 2-3일 이내에 배송됩니다. 도서 산간 지역은 1-2일 추가 소요될 수 있습니다. 새벽 배송 상품은 당일 또는 익일 새벽에 배송되며, 주문 마감 시간은 상품 상세 페이지에서 확인하실 수 있습니다.',
    },
    {
      id: 4,
      category: '배송',
      question: '배송지를 변경하고 싶어요',
      answer: '배송 준비 중 상태까지만 배송지 변경이 가능합니다. 마이페이지 > 주문내역에서 해당 주문의 "배송지 변경" 버튼을 클릭하여 변경하실 수 있습니다. 이미 배송이 시작된 경우에는 택배사에 직접 연락하여 변경을 요청하셔야 합니다.',
    },
    {
      id: 5,
      category: '반품/교환',
      question: '반품은 어떻게 하나요?',
      answer: '상품 수령 후 7일 이내에 마이페이지 > 주문내역에서 "반품신청" 버튼을 클릭하여 신청하실 수 있습니다. 단, 상품의 택(tag) 및 라벨이 제거되었거나, 포장이 훼손된 경우, 사용한 흔적이 있는 경우에는 반품이 불가능할 수 있습니다.',
    },
    {
      id: 6,
      category: '반품/교환',
      question: '교환은 어떻게 하나요?',
      answer: '상품 수령 후 7일 이내에 마이페이지 > 주문내역에서 "교환신청" 버튼을 클릭하여 신청하실 수 있습니다. 교환 사유가 단순 변심인 경우 왕복 배송비가 부과될 수 있습니다. 상품 하자나 오배송의 경우에는 무료로 교환이 가능합니다.',
    },
    {
      id: 7,
      category: '회원',
      question: '회원가입은 필수인가요?',
      answer: '비회원으로도 구매가 가능합니다. 다만, 회원으로 가입하시면 주문 내역 조회, 적립금 사용, 쿠폰 발급, 등급별 혜택 등 다양한 서비스를 이용하실 수 있습니다.',
    },
    {
      id: 8,
      category: '회원',
      question: '적립금은 어떻게 사용하나요?',
      answer: '적립금은 1,000원 이상부터 사용 가능하며, 결제 시 "적립금 사용" 항목에서 사용할 금액을 입력하시면 됩니다. 적립금은 구매 확정 후 7일 이내에 지급되며, 유효기간은 적립일로부터 1년입니다.',
    },
    {
      id: 9,
      category: '쿠폰',
      question: '쿠폰은 어디서 받을 수 있나요?',
      answer: '쿠폰은 이벤트 페이지, 상품 상세 페이지, 마이페이지 등에서 다운로드 받으실 수 있습니다. 또한 첫 구매 쿠폰, 생일 쿠폰 등이 자동으로 발급되며, 정기적으로 진행되는 프로모션을 통해서도 받으실 수 있습니다.',
    },
    {
      id: 10,
      category: '쿠폰',
      question: '쿠폰을 여러 개 동시에 사용할 수 있나요?',
      answer: '쿠폰은 한 주문당 1개만 사용 가능합니다. 단, 적립금이나 다른 할인 수단과는 중복 사용이 가능한 경우도 있으니, 결제 페이지에서 확인해 주시기 바랍니다.',
    },
  ];

  const categories = Array.from(new Set(faqs.map((faq) => faq.category)));

  const toggleFAQ = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            홈으로
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">자주 묻는 질문</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            자주 묻는 질문을 확인하세요
          </p>
        </div>

        {/* Category Tabs */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            전체
          </button>
          {categories.map((category) => (
            <button
              key={category}
              className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-2">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
            >
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="inline-block rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {faq.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {faq.question}
                  </h3>
                </div>
                <svg
                  className={`h-5 w-5 flex-shrink-0 text-gray-400 transition-transform ${
                    openId === faq.id ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {/* Answer (Dropdown) */}
              {openId === faq.id && (
                <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
                  <p className="text-gray-700 dark:text-gray-300">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-12 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            찾으시는 답변이 없으신가요?
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            고객센터로 문의하시면 친절하게 답변해 드리겠습니다.
          </p>
          <Link
            href="/support"
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            고객센터 문의하기
            <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}