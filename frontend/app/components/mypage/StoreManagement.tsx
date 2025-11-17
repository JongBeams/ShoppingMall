'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function StoreManagement() {
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
    <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">스토어 관리</h3>

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
    </div>
  );
}
