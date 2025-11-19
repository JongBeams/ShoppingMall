'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CreateProductRequest } from '../../types';
import { productManagementAPI } from '../../lib/api';


export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [lowStock, setlowStock] = useState('10');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const isNewProduct = productId === '-1';

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(user);
      if (userData.user_type !== 'seller') {
        alert('판매자만 접근할 수 있습니다.');
        router.push('/');
        return;
      }

      // 신규 상품이 아니면 상품 정보 로드
      if (!isNewProduct) {
        const fetchProduct = async () => {
          try {
            // 모든 상품 목록 가져오기
            const response = await productManagementAPI.getMyProducts(token);

            // productId로 해당 상품 찾기
            const product = response.products.find(p => p.id === productId);

            if (!product) {
              alert('상품을 찾을 수 없습니다.');
              router.push('/mypage#products');
              return;
            }

            // 폼 필드에 상품 정보 설정
            setName(product.name);
            setDescription(product.description || '');
            setPrice(product.price.toString());
            // category_slug 값을 그대로 사용
            setCategory(product.category_slug);
            setStock(product.stock_quantity.toString());
            setlowStock(product.low_stock_threshold.toString());
            // 기존 이미지 URL 설정 (thumbnail_url 우선, 없으면 images)
            if (product.thumbnail_url) {
              setImagePreviews([product.thumbnail_url]);
            } else if (product.images) {
              setImagePreviews([product.images]);
            }
          } catch (error) {
            console.error('Failed to fetch product:', error);
            alert('상품 정보를 불러오지 못했습니다.');
            router.push('/mypage#products');
          }
        };
        fetchProduct();
      }
    } catch (e) {
      console.error('Failed to parse user data:', e);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router, isNewProduct, productId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 5 - imageFiles.length);

    // 이미지 파일만 허용
    const validFiles = newFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setImageFiles([...imageFiles, ...validFiles]);

    // 이미지 미리보기 생성
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    if (description.trim().length < 20) {
      alert('상품 설명은 최소 20자 이상 입력해주세요.');
      return;
    }

    // 가격 검증 (최대 99,999,999.99)
    const priceValue = Number(price);
    if (priceValue <= 0) {
      alert('가격은 0보다 커야 합니다.');
      return;
    }
    if (priceValue > 99999999.99) {
      alert('가격은 99,999,999.99원을 초과할 수 없습니다.');
      return;
    }

    // 재고 검증 (최대 999,999)
    const stockValue = Number(stock);
    if (stockValue < 0) {
      alert('재고는 0 이상이어야 합니다.');
      return;
    }
    if (stockValue > 999999) {
      alert('재고는 999,999개를 초과할 수 없습니다.');
      return;
    }

    // 재고 부족 알림 수량 검증
    const lowStockValue = Number(lowStock);
    if (lowStockValue < 0) {
      alert('재고 부족 알림 수량은 0 이상이어야 합니다.');
      return;
    }
    if (lowStockValue > stockValue) {
      alert('재고 부족 알림 수량은 재고보다 클 수 없습니다.');
      return;
    }

    try {
      let thumbnailUrl: string | undefined;
      let additionalImageUrls: string[] = [];

      // 이미지 파일들이 있으면 한 번에 업로드
      if (imageFiles.length > 0) {
        try {
          // 상품 ID가 필요하므로, 신규 상품의 경우 임시 ID 사용
          const uploadId = isNewProduct ? 'temp' : productId;

          // 모든 이미지를 한 번에 업로드
          const imageResponse = await productManagementAPI.uploadImages(uploadId, imageFiles, token);

          thumbnailUrl = imageResponse.thumbnail_url;
          additionalImageUrls = imageResponse.image_urls;
        } catch (error: any) {
          console.error('Image upload failed:', error);
          alert('이미지 업로드에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
          return;
        }
      }

      // CreateProductRequest 인터페이스에 맞춰 데이터 구성
      const productData: CreateProductRequest = {
        id: productId,  // -1 (신규) 또는 실제 상품 ID
        name,
        description,
        price: Number(price),
        category,
        stock_quantity: Number(stock),
        low_stock_threshold: Number(lowStock),
      };

      // 대표 이미지(thumbnail)와 추가 이미지들을 설정
      if (thumbnailUrl) {
        productData.image = thumbnailUrl as any; // 첫 번째 이미지를 대표 이미지로 사용
      }

      // 추가 이미지 URLs 설정 (2번째 이미지부터)
      if (additionalImageUrls.length > 1) {
        // TypeScript 타입 에러를 피하기 위해 any로 캐스팅
        (productData as any).image_urls = additionalImageUrls.slice(1);
      }

      if (isNewProduct) {
        // 상품 등록
        const response = await productManagementAPI.create(productData, token);
        console.log('Product created:', response);
        alert('상품이 등록되었습니다.');
      } else {
        // 상품 수정
        const response = await productManagementAPI.update(productId, productData, token);
        console.log('Product updated:', response);
        alert('상품이 수정되었습니다.');
      }
      router.push('/mypage#products');
    } catch (error: any) {
      console.error('Error submitting product:', error);
      alert(error.message || '상품 등록/수정 중 오류가 발생했습니다.');
    }
  };

  const handleCancel = () => {
    router.push('/mypage#products');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isNewProduct ? '상품 등록' : '상품 수정'}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isNewProduct ? '새로운 상품을 등록합니다.' : '상품 정보를 수정합니다.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="space-y-6">
            {/* 상품명 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-900 dark:text-white">
                상품명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400"
                placeholder="상품명을 입력하세요"
              />
            </div>

            {/* 상품 설명 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-900 dark:text-white">
                상품 설명 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                minLength={20}
                className="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400"
                placeholder="상품 설명을 20자 이상 입력하세요"
              />
              <div className="flex justify-end text-sm text-gray-600 dark:text-gray-400">
                <span>{description.length}자 / 최소 10자</span>
              </div>
            </div>

            {/* 카테고리 */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-900 dark:text-white">
                카테고리 <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400"
              >
                <option value="">카테고리를 선택하세요</option>
                <option value="electronics">가전/디지털</option>
                <option value="fashion">패션</option>
                <option value="beauty">뷰티</option>
                <option value="living">생활/건강</option>
                <option value="food">식품</option>
                <option value="sports">스포츠</option>
                <option value="books">도서</option>
                <option value="baby">완구</option>
              </select>
            </div>

            {/* 가격 & 재고 */}
            <div className="grid gap-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-900 dark:text-white">
                  가격 (₩) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  min="0"
                  max="99999999.99"
                  step="0.01"
                  className="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400"
                  placeholder="0"
                />
              </div>
            </div>


            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-900 dark:text-white">
                  재고 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="stock"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                  min="0"
                  max="999999"
                  className="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400"
                  placeholder="0"
                />
              </div>
              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-900 dark:text-white">
                  재고 부족 알림 수량 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="low_stock_threshold"
                  value={lowStock}
                  onChange={(e) => setlowStock(e.target.value)}
                  required
                  min="0"
                  className="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400"
                  placeholder="10"
                />
              </div>

            </div>


            {/* 이미지 파일 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                상품 이미지 (선택)
              </label>
              <div className="mb-3 mt-2">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={imageFiles.length >= 5}
                  className="hidden"
                />
                <label
                  htmlFor="image-upload"
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 ${
                    imageFiles.length >= 5 ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  사진 선택 ({imageFiles.length}/5)
                </label>
              </div>
              <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                이미지 파일만 업로드 가능합니다 (JPG, PNG, GIF 등). 최대 5장까지 업로드 가능합니다.
              </p>

              {/* 이미지 미리보기 */}
              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative h-24 w-24">
                      <img
                        src={preview}
                        alt={`미리보기 ${index + 1}`}
                        className="h-full w-full rounded-lg border border-gray-200 object-cover dark:border-gray-700"
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
          </div>

          {/* 버튼 */}
          <div className="mt-8 flex gap-4">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isNewProduct ? '등록하기' : '수정하기'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
