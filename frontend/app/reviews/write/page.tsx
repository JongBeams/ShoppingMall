'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

export default function WriteReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 더미 상품 정보
  const [product] = useState({
    id: productId || '1',
    name: '무선 이어폰',
    description: '고음질 블루투스 무선 이어폰',
    price: 89000,
    imageUrl: '/placeholder-product.jpg',
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 5 - images.length);
    setImages([...images, ...newFiles]);

    // 이미지 미리보기 생성
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      alert('별점을 선택해주세요.');
      return;
    }

    if (reviewText.trim().length < 10) {
      alert('리뷰 내용을 10자 이상 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    // TODO: API 호출
    setTimeout(() => {
      alert('리뷰가 등록되었습니다!');
      router.push('/mypage#reviews');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            돌아가기
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">리뷰 작성</h1>
        </div>

        {/* Product Info */}
        <div className="mb-6 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex gap-4">
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
              <div className="flex h-full items-center justify-center text-gray-400 dark:text-gray-500">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{product.name}</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{product.description}</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {product.price.toLocaleString()}원
              </p>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          {/* Rating */}
          <div className="mb-6">
            <label className="mb-3 block text-sm font-semibold text-gray-900 dark:text-white">
              별점 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <svg
                    className={`h-10 w-10 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {rating > 0 ? `${rating}점` : '별점을 선택해주세요'}
              </span>
            </div>
          </div>

          {/* Review Text */}
          <div className="mb-6">
            <label className="mb-3 block text-sm font-semibold text-gray-900 dark:text-white">
              리뷰 내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="상품에 대한 솔직한 리뷰를 작성해주세요. (최소 10자 이상)"
              rows={8}
              className="w-full border border-gray-300 p-3 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-white"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{reviewText.length}자 / 최소 10자</span>
              {reviewText.length >= 100 && (
                <span className="text-blue-600 dark:text-blue-400">
                  + 포인트 500P (100자 이상 작성)
                </span>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <div className="mb-6">
            <label className="mb-3 block text-sm font-semibold text-gray-900 dark:text-white">
              사진 첨부 (선택)
            </label>
            <div className="mb-3">
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={images.length >= 5}
                className="hidden"
              />
              <label
                htmlFor="image-upload"
                className={`inline-flex cursor-pointer items-center gap-2 border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 ${
                  images.length >= 5 ? 'cursor-not-allowed opacity-50' : ''
                }`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                사진 선택 ({images.length}/5)
              </label>
              {images.length > 0 && (
                <span className="ml-3 text-xs text-blue-600 dark:text-blue-400">
                  + 포인트 1,000P (포토리뷰)
                </span>
              )}
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative h-24 w-24">
                    <img
                      src={preview}
                      alt={`미리보기 ${index + 1}`}
                      className="h-full w-full border border-gray-200 object-cover dark:border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notice */}
          <div className="mb-6 border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-950">
            <h4 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-300">
              리뷰 작성 혜택
            </h4>
            <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-400">
              <li>• 일반 리뷰: 500 포인트</li>
              <li>• 100자 이상 리뷰: 500 포인트</li>
              <li>• 포토 리뷰: 1,000 포인트</li>
            </ul>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 border border-gray-300 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0 || reviewText.trim().length < 10}
              className="flex-1 border border-gray-900 bg-gray-900 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              {isSubmitting ? '등록 중...' : '리뷰 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}