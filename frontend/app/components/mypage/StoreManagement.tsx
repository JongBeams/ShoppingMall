'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function StoreManagement() {
  const [activeTab, setActiveTab] = useState<'info' | 'products' | 'delivery' | 'inquiries' | 'coupons'>('info');
  const [storeName, setStoreName] = useState('프리미엄 농산물 직거래');
  const [storeDescription, setStoreDescription] = useState('신선하고 건강한 유기농 농산물을 직접 재배하여 판매합니다.');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    alert('스토어 정보가 저장되었습니다.');
  };

  return (
    <div className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-200 p-6 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">스토어 관리</h3>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-6 dark:border-gray-700">
        <div className="flex gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('info')}
            className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition ${
              activeTab === 'info'
                ? 'border-b-2 border-gray-900 text-gray-900 dark:border-white dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            스토어 정보
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition ${
              activeTab === 'products'
                ? 'border-b-2 border-gray-900 text-gray-900 dark:border-white dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            상품 관리
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition ${
              activeTab === 'delivery'
                ? 'border-b-2 border-gray-900 text-gray-900 dark:border-white dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            배송 관리
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition ${
              activeTab === 'inquiries'
                ? 'border-b-2 border-gray-900 text-gray-900 dark:border-white dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            문의 관리
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition ${
              activeTab === 'coupons'
                ? 'border-b-2 border-gray-900 text-gray-900 dark:border-white dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            쿠폰 발행
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* 스토어 정보 탭 */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* Store Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                스토어 이름
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-white"
                placeholder="스토어 이름을 입력하세요"
              />
            </div>

            {/* Store Description */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                스토어 소개
              </label>
              <textarea
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-white"
                placeholder="스토어 소개를 입력하세요"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                고객에게 보여질 스토어 소개글입니다.
              </p>
            </div>

            {/* Store Logo */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                스토어 로고
              </label>
              <div className="flex items-center gap-4">
                {/* Logo Preview */}
                <div className="relative h-24 w-24 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
                  {logoPreview ? (
                    <Image
                      src={logoPreview}
                      alt="Store logo"
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <div className="flex-1">
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="inline-block cursor-pointer border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    로고 업로드
                  </label>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    권장 크기: 200x200px (정사각형)
                  </p>
                </div>
              </div>
            </div>

            {/* Store Banner */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                스토어 배너
              </label>
              <div className="space-y-3">
                {/* Banner Preview */}
                <div className="relative aspect-[3/1] overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
                  {bannerPreview ? (
                    <Image
                      src={bannerPreview}
                      alt="Store banner"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 800px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <div>
                  <input
                    type="file"
                    id="banner-upload"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="banner-upload"
                    className="inline-block cursor-pointer border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    배너 업로드
                  </label>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    권장 크기: 1200x400px (3:1 비율)
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 border-t border-gray-200 pt-6 dark:border-gray-700">
              <button
                onClick={() => {
                  setStoreName('프리미엄 농산물 직거래');
                  setStoreDescription('신선하고 건강한 유기농 농산물을 직접 재배하여 판매합니다.');
                  setLogoPreview(null);
                  setBannerPreview(null);
                }}
                className="border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="border border-gray-900 bg-gray-900 px-6 py-2 text-sm font-bold text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                저장
              </button>
            </div>
          </div>
        )}

        {/* 상품 관리 탭 */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-gray-900 dark:text-white">등록 상품 목록</h4>
              <button className="border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
                + 상품 등록
              </button>
            </div>

            {/* 상품 목록 */}
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 border border-gray-200 p-4 dark:border-gray-700">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                    <div className="flex h-full items-center justify-center text-gray-400">
                      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 dark:text-white">프리미엄 유기농 토마토 1kg</h5>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">재고: 50개 · 가격: ₩15,000</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">카테고리: 농산물</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">수정</button>
                    <button className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">삭제</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 배송 관리 탭 */}
        {activeTab === 'delivery' && (
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">배송 관리</h4>

            {/* 배송 대기 목록 */}
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="border border-gray-200 p-4 dark:border-gray-700">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">주문번호: ORD-2025-{String(i).padStart(6, '0')}</span>
                      <span className="ml-3 rounded bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                        배송 대기
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">2025.01.15</span>
                  </div>
                  <div className="mb-3 text-sm text-gray-700 dark:text-gray-300">
                    상품: 프리미엄 유기농 토마토 1kg x 3개
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="송장번호 입력"
                      className="flex-1 border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <select className="border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                      <option>CJ대한통운</option>
                      <option>우체국택배</option>
                      <option>한진택배</option>
                      <option>로젠택배</option>
                    </select>
                    <button className="border border-gray-900 bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
                      발송 처리
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 문의 관리 탭 */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">상품 문의 관리</h4>

            {/* 문의 목록 */}
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="border border-gray-200 p-4 dark:border-gray-700">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">프리미엄 유기농 토마토 1kg</span>
                      <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        답변 대기
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">2025.01.15</span>
                  </div>
                  <p className="mb-3 text-sm text-gray-700 dark:text-gray-300">
                    문의: 유기농 인증서가 있나요?
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="답변 입력"
                      className="flex-1 border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <button className="border border-gray-900 bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
                      답변 등록
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 쿠폰 발행 탭 */}
        {activeTab === 'coupons' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-gray-900 dark:text-white">발행한 쿠폰 목록</h4>
              <button className="border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
                + 쿠폰 발행
              </button>
            </div>

            {/* 쿠폰 발행 폼 */}
            <div className="space-y-4 border border-gray-200 p-4 dark:border-gray-700">
              <h5 className="text-sm font-semibold text-gray-900 dark:text-white">새 쿠폰 발행</h5>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">쿠폰 이름</label>
                  <input
                    type="text"
                    placeholder="신규 회원 10% 할인"
                    className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">할인 유형</label>
                  <select className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    <option>정률 할인 (%)</option>
                    <option>정액 할인 (원)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">할인 금액/율</label>
                  <input
                    type="number"
                    placeholder="10"
                    className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">최소 주문 금액</label>
                  <input
                    type="number"
                    placeholder="30000"
                    className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">발행 수량</label>
                  <input
                    type="number"
                    placeholder="100"
                    className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">유효 기간 (일)</label>
                  <input
                    type="number"
                    placeholder="30"
                    className="w-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <button className="w-full border border-gray-900 bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
                쿠폰 발행
              </button>
            </div>

            {/* 발행된 쿠폰 목록 */}
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between border border-gray-200 p-4 dark:border-gray-700">
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white">신규 회원 10% 할인</h5>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      할인: 10% · 최소 주문: ₩30,000 · 유효기간: 30일
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                      발행: 100개 · 사용: 23개 · 남은 수량: 77개
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">중지</button>
                    <button className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">삭제</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
