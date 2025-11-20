'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Button from '@/app/components/common/Button';
import { Product } from '@/app/types';
import { productAPI, cartAPI } from '@/app/lib/api';

// 임시 더미 데이터
const dummyReviews = [
  {
    id: 1,
    userName: '김철수',
    rating: 5,
    content: '정말 좋아요! 노이즈 캔슬링이 훌륭하고 배터리도 오래가요.',
    photos: [],
    date: '2025.01.15',
    likes: 24
  },
  {
    id: 2,
    userName: '박영희',
    rating: 4,
    content: '가성비 좋습니다. 다만 케이스가 조금 크네요.',
    photos: [
      'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=200&q=80',
      'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=200&q=80',
    ],
    date: '2025.01.12',
    likes: 18
  },
  {
    id: 3,
    userName: '이민수',
    rating: 5,
    content: '음질이 정말 좋아요. 강력 추천합니다!',
    photos: [],
    date: '2025.01.10',
    likes: 31
  },
];
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

    try {
      const response = await cartAPI.add(productId, quantity, token);
      alert(response.message || '장바구니에 담겼습니다.');

      // 장바구니로 이동할지 물어보기
      if (confirm('장바구니로 이동하시겠습니까?')) {
        router.push('/cart');
      }
    } catch (error: any) {
      alert(error.message || '장바구니에 담는 중 오류가 발생했습니다.');
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
              <span className="text-xs font-medium text-gray-900 dark:text-white">4.7</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">({dummyReviews.length})</span>
            </div>

            {/* 가격 정보 */}
            <div className="mb-4 border-t border-gray-200 pt-4 dark:border-gray-700">
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
            상품 리뷰 <span className="text-xs font-normal text-gray-500 dark:text-gray-400">({dummyReviews.length})</span>
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
        <div className="mb-4 border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex gap-6">
            <div className="flex flex-col items-center justify-center border-r border-gray-200 pr-6 dark:border-gray-700">
              <div className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">4.7</div>
              <div className="mb-1.5 flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="h-3 w-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{dummyReviews.length}개 리뷰</p>
            </div>
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="w-8 text-xs text-gray-600 dark:text-gray-400">{rating}점</span>
                  <div className="h-1.5 flex-1 bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-1.5 bg-gray-900 dark:bg-white"
                      style={{ width: `${rating === 5 ? 70 : rating === 4 ? 20 : 10}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs text-gray-500 dark:text-gray-400">
                    {rating === 5 ? 70 : rating === 4 ? 20 : 10}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 리뷰 목록 */}
        <div className="space-y-3">
          {dummyReviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-3 last:border-b-0 dark:border-gray-800">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-900 dark:text-white">{review.userName}</span>
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
                <span className="text-xs text-gray-400 dark:text-gray-500">{review.date}</span>
              </div>
              <p className="mb-2 text-xs leading-relaxed text-gray-700 dark:text-gray-300">{review.content}</p>
              {review.photos.length > 0 && (
                <div className="mb-2 flex gap-2">
                  {review.photos.map((photo, index) => (
                    <div key={index} className="relative h-16 w-16 border border-gray-200 dark:border-gray-700">
                      <Image src={photo} alt={`Review ${index + 1}`} fill className="object-cover" sizes="64px" />
                    </div>
                  ))}
                </div>
              )}
              <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
                </svg>
                도움돼요 {review.likes}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
