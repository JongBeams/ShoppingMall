'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Button from '@/app/components/common/Button';
import { Product } from '@/app/types';
import { productAPI, cartAPI } from '@/app/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface Review {
  id: string;
  user_id: string;
  user_name?: string;
  product_id: string;
  order_id: string;
  rating: number;
  content: string;
  created_at: string;
}


type DetailedProduct = Product & {
  meta_description?: string;
  images?: string[] | string;
};

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const productId = params?.id;
  const [product, setProduct] = useState<DetailedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);
  const [quantity, setQuantity] = useState(1);
  // 옵션 선택 state: { optionId: valueId }
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  // 리뷰 state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // 옵션 선택 핸들러
  const handleOptionChange = (optionId: string, valueId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionId]: valueId
    }));
  };

  // 장바구니 담기
  const handleAddToCart = async () => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      alert('로그인이 필요한 서비스입니다.');
      router.push('/login');
      return;
    }

    if (!productId) {
      alert('상품 정보를 불러올 수 없습니다.');
      return;
    }

    // 옵션이 있는 경우 모든 옵션이 선택되었는지 확인
    if (product?.options && product.options.length > 0) {
      const unselectedOptions = product.options.filter(
        option => !selectedOptions[option.id] || selectedOptions[option.id] === ''
      );

      if (unselectedOptions.length > 0) {
        alert('모든 옵션을 선택해주세요.');
        return;
      }
    }

    try {
      // 선택된 옵션을 배열로 변환 (빈 값은 제외)
      const optionsArray = Object.entries(selectedOptions)
        .filter(([_, valueId]) => valueId !== '')
        .map(([optionId, valueId]) => ({
          option_id: optionId,
          value_id: valueId
        }));

      const response = await cartAPI.add(
        productId,
        quantity,
        token,
        optionsArray.length > 0 ? optionsArray : undefined
      );
      alert(response.message || '장바구니에 담겼습니다.');

      // 장바구니 업데이트 이벤트 발생
      window.dispatchEvent(new Event('cartUpdated'));

      // 장바구니로 이동할지 물어보기
      if (confirm('장바구니로 이동하시겠습니까?')) {
        router.push('/cart');
      }
    } catch (error: any) {
      alert(error.message || '장바구니에 담는 중 오류가 발생했습니다.');
    }
  };


  // 최근 본 상품 저장 함수
  const saveToRecentProducts = (productData: DetailedProduct) => {
    try {
      const recentProducts = JSON.parse(localStorage.getItem('recentProducts') || '[]');

      // 이미 있는 상품이면 제거
      const filtered = recentProducts.filter((p: any) => p.id !== productData.id);

      // 새 상품을 맨 앞에 추가
      const newProduct = {
        id: productData.id,
        name: productData.name,
        price: productData.price,
        image: productData.thumbnail_url || productData.imageUrl || '/placeholder-product.jpg',
        brand: productData.vendor_name || '',
        category: productData.category || productData.category_name || '기타',
        viewedAt: (() => {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const hour = String(now.getHours()).padStart(2, '0');
          const minute = String(now.getMinutes()).padStart(2, '0');
          return `${year}.${month}.${day} ${hour}:${minute}`;
        })()
      };

      filtered.unshift(newProduct);

      // 최대 20개까지만 저장
      const limited = filtered.slice(0, 20);

      localStorage.setItem('recentProducts', JSON.stringify(limited));
    } catch (e) {
      console.error('최근 본 상품 저장 실패:', e);
    }
  };

  useEffect(() => {
    let mounted = true;

    const fetchProduct = async () => {
      if (!productId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await productAPI.getById(productId);
        const productData = (response?.product ?? response) as DetailedProduct;
        if (mounted) {
          setProduct(productData);
          // 최근 본 상품에 저장
          saveToRecentProducts(productData);
        }
      } catch (err: any) {
        console.error('Failed to load product:', err);
        if (mounted) {
          setError(err.message || '상품 정보를 불러오지 못했습니다.');
          setProduct(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchProduct();
    return () => {
      mounted = false;
    };
  }, [productId]);

  // 리뷰 데이터 가져오기
  useEffect(() => {
    const fetchReviews = async () => {
      if (!productId) return;

      setReviewsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/reviews/product/${productId}`);
        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews || []);
          setAvgRating(data.avg_rating || 0);
        }
      } catch (err) {
        console.error('리뷰 로딩 실패:', err);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [productId]);

  const displayProduct = useMemo(() => {
    if (product) {
      console.log('Product data:', product);
      console.log('Vendor name:', product.vendor_name);
    }
    return product;
  }, [product]);

  // 이미지 갤러리 처리
  const allImages = useMemo(() => {
    if (!displayProduct) return [];
    const images: string[] = [];

    // 썸네일 이미지 추가
    const thumbnail = displayProduct.thumbnail_url || displayProduct.imageUrl;
    if (thumbnail) images.push(thumbnail);

    // 추가 이미지들
    if (displayProduct.images) {
      const additionalImages = Array.isArray(displayProduct.images)
        ? displayProduct.images
        : [displayProduct.images];
      additionalImages.forEach(img => {
        if (img && !images.includes(img)) {
          images.push(img);
        }
      });
    }

    return images.length > 0 ? images : ['/placeholder-product.jpg'];
  }, [displayProduct]);

  // 마우스 이동 핸들러
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-gray-600 dark:text-gray-300">
        상품 정보를 불러오는 중입니다...
      </div>
    );
  }

  if (error || !displayProduct) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center text-gray-600 dark:text-gray-300">
        <p>{error || '상품 정보를 찾을 수 없습니다.'}</p>
        <Button onClick={() => window.location.reload()}>다시 시도</Button>
      </div>
    );
  }

  const stock =
    typeof displayProduct.stock === 'number'
      ? displayProduct.stock
      : displayProduct.stock_quantity ?? 0;
  const categoryLabel =
    displayProduct.category ||
    displayProduct.category_name ||
    displayProduct.category_slug ||
    '기타';
  const imageList = Array.isArray(displayProduct.images)
    ? displayProduct.images
    : displayProduct.images
      ? [displayProduct.images]
      : [];

  return (
    <div className="space-y-4">
      {/* 상품 기본 정보 */}
      <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <div className="grid gap-5 md:grid-cols-[350px_1fr]">
          {/* 상품 이미지 갤러리 */}
          <div className="flex gap-2">
            {/* 썸네일 목록 */}
            {allImages.length > 1 && (
              <div className="flex flex-col gap-2">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative h-12 w-12 flex-shrink-0 border bg-gray-50 transition ${
                      selectedImageIndex === index
                        ? 'border-gray-900 dark:border-white'
                        : 'border-gray-200 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-500'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${displayProduct.name} 이미지 ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* 메인 이미지 */}
            <div
              ref={imageRef}
              className="relative flex-1 overflow-hidden border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
              style={{ aspectRatio: '1', maxWidth: '350px' }}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              <Image
                src={allImages[selectedImageIndex]}
                alt={displayProduct.name}
                fill
                className={`object-contain transition-transform ${isZoomed ? 'scale-150' : 'scale-100'}`}
                style={
                  isZoomed
                    ? {
                      transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                    }
                    : undefined
                }
                sizes="350px"
              />
              {isZoomed && (
                <div className="pointer-events-none absolute right-2 top-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
                  🔍 확대중
                </div>
              )}
            </div>
          </div>

          {/* 상품 정보 */}
          <div className="flex flex-col">
            <div className="mb-2 flex items-center gap-2 text-xs">
              <span className="text-gray-500 dark:text-gray-400">{categoryLabel}</span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">
                {displayProduct.vendor_name || 'null (스토어명 없음)'}
              </span>
            </div>
            <h1 className="mb-2 text-base font-bold text-gray-900 dark:text-white">
              {displayProduct.name}
            </h1>
            <p className="mb-4 text-xs text-gray-600 dark:text-gray-300">
              {displayProduct.meta_description || displayProduct.description}
            </p>

            {/* 별점 */}
            <div className="mb-4 flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className="h-4 w-4 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs font-medium text-gray-900 dark:text-white">{avgRating || 0}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">({reviews.length})</span>
            </div>

            {/* 구매 섹션 (구매 및 옵션추가) */}
            <div className="mt-4 grid gap-6 md:grid-cols-2 md:items-start border-t border-gray-200 pt-4 dark:border-gray-700">

              {/* 기존 가격·수량·버튼 섹션 */}
              <div className="space-y-4">
                {/* 가격 정보 */}
                <div className="mb-4 ">
                  <div className="mb-2 text-xl font-bold text-red-600 dark:text-red-500">
                    {Number(displayProduct.price || 0).toLocaleString()}원
                  </div>
                </div>

            {/* 수량 선택 */}
            <div className="mb-4 flex items-center gap-2">
              <input
                type="number"
                value={quantity}
                min="1"
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="h-8 w-14 border border-gray-300 bg-white text-center text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <div className="flex flex-col">
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="h-4 w-6 border border-gray-300 bg-white text-[10px] leading-none text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  ▲
                </button>
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="h-4 w-6 border border-t-0 border-gray-300 bg-white text-[10px] leading-none text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  ▼
                </button>
              </div>
            </div>

            {/* 구매 버튼 */}
            <div className="mb-4 flex gap-2">
              <Button
                onClick={handleAddToCart}
                variant="outline"
                className="text-xs px-6"
              >
                장바구니 담기
              </Button>
              <Button
                onClick={() => alert('구매 기능은 개발 중입니다')}
                className="text-xs px-8"
              >
                바로 구매
              </Button>
            </div>

            {/* 상품 정보 */}
            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  <span>배송비: 무료배송</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  <span>배송 예정일: 주문 후 1~2일</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  <span>재고: {stock}개</span>
                </div>
              </div>

                  <button className="mt-3 flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    상품정보에 문제가 있나요?
                  </button>
                </div>
              </div>

              {/* 옵션 섹션 - 상품에 옵션이 있을 때만 표시 */}
              {displayProduct.options && displayProduct.options.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">옵션 선택</h3>

                  {/* 옵션 항목들 - 실제 상품 옵션 데이터 매핑 */}
                  <div className="space-y-2">
                    {displayProduct.options.map((option) => (
                      <div key={option.id}>
                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                          {option.customType}
                        </label>
                        <select
                          value={selectedOptions[option.id] || ''}
                          onChange={(e) => handleOptionChange(option.id, e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">옵션을 선택하세요</option>
                          {option.values.map((val) => (
                            <option key={val.id} value={val.id}>
                              {val.value}
                              {val.price && val.price !== '0' && ` (+${Number(val.price).toLocaleString()}원)`}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
            </div>
          </div>
        </div>
      </div>

      {/* 상품 상세 정보 */}
      <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 text-sm font-bold text-gray-900 dark:text-white">상품 상세 정보</h2>

        {/* 상세 이미지들 */}
        {imageList.length > 0 && (
          <div className="mb-4 space-y-2">
            {imageList.map((imgUrl, index) => (
              <div key={index} className="relative w-full max-w-md mx-auto">
                <img
                  src={imgUrl}
                  alt={`${displayProduct.name} 상세 이미지 ${index + 1}`}
                  className="w-full h-auto border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {/* 상세 설명 */}
        <div className="border-t border-gray-200 pt-4 text-xs leading-relaxed text-gray-700 dark:border-gray-700 dark:text-gray-300">
          {displayProduct.description}
        </div>

        {/* 사업장 주소 */}
        {displayProduct.vendor_address && (
          <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
            <h3 className="mb-2 text-xs font-bold text-gray-900 dark:text-white">사업장 주소</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {displayProduct.vendor_address}
            </p>
          </div>
        )}
      </div>

      {/* 상품 리뷰 */}
      <div className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            상품 리뷰 <span className="text-xs font-normal text-gray-500 dark:text-gray-400">({reviews.length})</span>
          </h2>
          <div className="flex gap-1">
            <button className="border border-gray-900 bg-gray-900 px-3 py-1 text-xs font-bold text-white dark:border-white dark:bg-white dark:text-gray-900">
              최신순
            </button>
            <button className="border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800">
              별점순
            </button>
          </div>
        </div>

        {/* 평점 요약 */}
        <div className="mb-4 grid grid-cols-3 gap-4">
          {/* 평균 평점 */}
          <div className="flex flex-col items-center justify-center border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{avgRating || 0}</div>
            <div className="my-1 flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className={`h-3.5 w-3.5 ${star <= Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{reviews.length}개 리뷰</p>
          </div>

          {/* 별점 분포 */}
          <div className="flex flex-col justify-center border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            <p className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">별점 분포</p>
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = reviews.filter(r => r.rating === rating).length;
                const percentage = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                return (
                  <div key={rating} className="flex items-center gap-1.5">
                    <span className="w-4 text-[10px] text-gray-500 dark:text-gray-400">{rating}</span>
                    <div className="h-1 w-16 bg-gray-200 dark:bg-gray-700">
                      <div className="h-1 bg-yellow-400" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-400">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 추천 정보 */}
          <div className="flex flex-col items-center justify-center border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {reviews.length > 0 ? Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100) : 0}%
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">구매자 추천</p>
          </div>
        </div>

        {/* 리뷰 목록 */}
        <div className="space-y-3">
          {reviewsLoading ? (
            <p className="text-center text-xs text-gray-500 dark:text-gray-400">리뷰 로딩 중...</p>
          ) : reviews.length === 0 ? (
            <p className="text-center text-xs text-gray-500 dark:text-gray-400">아직 리뷰가 없습니다.</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-100 pb-3 last:border-b-0 dark:border-gray-800">
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-900 dark:text-white">{review.user_name || '익명'}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`h-3 w-3 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(review.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">{review.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
