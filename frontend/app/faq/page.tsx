'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  is_published: boolean;
  views: number;
  created_at: string;
  updated_at: string;
  author_name: string;
}

export default function FAQPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/faqs?limit=100`);
        if (response.ok) {
          const data = await response.json();
          // 공개된 FAQ만 필터링
          setFaqs(data.filter((faq: FAQ) => faq.is_published));
        }
      } catch (error) {
        console.error('FAQ 로딩 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  const categories = Array.from(new Set(faqs.map((faq) => faq.category).filter(Boolean)));
  const filteredFaqs = selectedCategory === '전체'
    ? faqs
    : faqs.filter(faq => faq.category === selectedCategory);

  const toggleFAQ = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="p-6">
        {/* Header */}
        <section className="mb-4 border-b border-gray-200 bg-white pb-4 dark:border-gray-700 dark:bg-gray-800">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            홈으로
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">자주 묻는 질문</h1>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">자주 묻는 질문을 확인하세요</p>
        </section>

        {/* Loading */}
        {isLoading && (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-gray-600 dark:text-gray-400">로딩 중...</div>
          </div>
        )}

        {/* Category Tabs */}
        {!isLoading && (
          <section className="mb-4 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('전체')}
                className={`border px-3 py-1.5 text-xs font-medium transition ${
                  selectedCategory === '전체'
                    ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                전체
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category as string)}
                  className={`border px-3 py-1.5 text-xs font-medium transition ${
                    selectedCategory === category
                      ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* FAQ List */}
        {!isLoading && (
          <section className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            {filteredFaqs.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">FAQ가 없습니다.</div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredFaqs.map((faq) => (
                  <div key={faq.id}>
                    <button
                      onClick={() => toggleFAQ(faq.id)}
                      className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          {faq.category && (
                            <span className="rounded bg-gray-900 px-2 py-0.5 text-xs font-medium text-white dark:bg-white dark:text-gray-900">
                              {faq.category}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {faq.question}
                        </h3>
                      </div>
                      <svg
                        className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${
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
                      <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-700/50">
                        <p className="whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}