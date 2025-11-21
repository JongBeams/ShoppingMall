'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { CreateProductRequest } from '../../types';
import { productManagementAPI } from '../../lib/api';


export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [meta_description, setMeta_Description] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [lowStock, setlowStock] = useState('10');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // 옵션 상태
  interface ProductOptionValue {
    value: string;
    price: string;
    stock: string;
  }

  interface ProductOption {
    customType: string;
    values: ProductOptionValue[];
  }
  const [options, setOptions] = useState<ProductOption[]>([]);

  const isNewProduct = productId === '-1';

  //ProductAccessGuard
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

      if (!isNewProduct) {
        const fetchProduct = async () => {
          try {
            const response = await productManagementAPI.getMyProducts(token);
            const product = response.products.find(p => p.id === productId);

            if (!product) {
              alert('상품을 찾을 수 없습니다.');
              router.push('/mypage#products');
              return;
            }

            setName(product.name);
            setMeta_Description(product.meta_description || '');
            setDescription(product.description || '');
            setPrice(product.price.toString());
            setCategory(product.category_slug);
            setStock(product.stock_quantity.toString());
            setlowStock(product.low_stock_threshold.toString());
            if (product.tags && Array.isArray(product.tags)) {
              setTags(product.tags);
            }
            if (product.options && Array.isArray(product.options)) {
              setOptions(product.options);
            }
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

    const validFiles = newFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setImageFiles([...imageFiles, ...validFiles]);

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

  const addOption = () => {
    if (options.length >= 5) {
      alert('옵션은 최대 5개까지 추가할 수 있습니다.');
      return;
    }
    setOptions([...options, { customType: '', values: [] }]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const addOptionValue = (optionIndex: number) => {
    const newOptions = [...options];
    if (newOptions[optionIndex].values.length >= 5) {
      alert('옵션 내용은 최대 5개까지 추가할 수 있습니다.');
      return;
    }
    newOptions[optionIndex].values.push({ value: '', price: '', stock: '' });
    setOptions(newOptions);
  };

  const removeOptionValue = (optionIndex: number, valueIndex: number) => {
    const newOptions = [...options];
    newOptions[optionIndex].values = newOptions[optionIndex].values.filter((_, i) => i !== valueIndex);
    setOptions(newOptions);
  };

  const updateOptionValue = (optionIndex: number, valueIndex: number, field: 'value' | 'price' | 'stock', newValue: string) => {
    const newOptions = [...options];
    newOptions[optionIndex].values[valueIndex][field] = newValue;
    setOptions(newOptions);
  };

  const updateCustomType = (index: number, customType: string) => {
    const newOptions = [...options];
    newOptions[index].customType = customType;
    setOptions(newOptions);
  };

  const calculateTotalStock = (): number => {
    if (options.length === 0) return 0;

    return options.reduce((total, option) => {
      const optionTotal = option.values.reduce((sum, value) => {
        const stockNum = parseInt(value.stock) || 0;
        return sum + stockNum;
      }, 0);
      return total + optionTotal;
    }, 0);
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

    const priceValue = Number(price);
    if (priceValue <= 0) {
      alert('가격은 0보다 커야 합니다.');
      return;
    }
    if (priceValue > 99999999.99) {
      alert('가격은 99,999,999.99원을 초과할 수 없습니다.');
      return;
    }

    const stockValue = options.length > 0 ? calculateTotalStock() : Number(stock);
    if (stockValue < 0) {
      alert('재고는 0 이상이어야 합니다.');
      return;
    }
    if (stockValue > 999999) {
      alert('재고는 999,999개를 초과할 수 없습니다.');
      return;
    }

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

      if (imageFiles.length > 0) {
        try {
          const uploadId = isNewProduct ? 'temp' : productId;
          const imageResponse = await productManagementAPI.uploadImages(uploadId, imageFiles, token);
          thumbnailUrl = imageResponse.thumbnail_url;
          additionalImageUrls = imageResponse.image_urls;
        } catch (error: any) {
          console.error('Image upload failed:', error);
          alert('이미지 업로드에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
          return;
        }
      }

      const productData: CreateProductRequest = {
        id: productId,
        name,
        meta_description,
        description,
        price: Number(price),
        category,
        stock_quantity: options.length > 0 ? calculateTotalStock() : Number(stock),
        low_stock_threshold: Number(lowStock),
        tags: tags.length > 0 ? tags : undefined,
      };

      if (thumbnailUrl) {
        (productData as any).image_url = thumbnailUrl;
      }

      if (additionalImageUrls.length > 1) {
        (productData as any).image_urls = additionalImageUrls.slice(1);
      }

      if (options.length > 0) {
        (productData as any).options = options.map(option => ({
          ...option,
          values: option.values.map(value => ({
            ...value,
            price: String(value.price),
            stock: String(value.stock)
          }))
        }));
      }

      if (isNewProduct) {
        await productManagementAPI.create(productData, token);
        alert('상품이 등록되었습니다.');
      } else {
        await productManagementAPI.update(productId, productData, token);
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
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/mypage#products"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          상품 관리로 돌아가기
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {isNewProduct ? '상품 등록' : '상품 수정'}
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {isNewProduct ? '새로운 상품을 등록합니다.' : '상품 정보를 수정합니다.'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* 기본 정보 */}
        <div className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">기본 정보</h2>
          </div>
          <div className="space-y-4 p-5">
            {/* 상품명 */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-white">
                상품명 <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
                placeholder="상품명을 입력하세요"
              />
            </div>

            {/* 상품 간단 설명 */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-white">
                상품 간단 설명 <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={meta_description}
                onChange={(e) => setMeta_Description(e.target.value)}
                required
                maxLength={20}
                className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
                placeholder="상품 간단 설명 (20자 이하)"
              />
              <p className="mt-1 text-right text-xs text-gray-500">{meta_description.length}/20자</p>
            </div>

            {/* 상품 상세 설명 */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-white">
                상품 상세 설명 <span className="text-red-600">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                minLength={20}
                className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
                placeholder="상품 상세 설명 (20자 이상)"
              />
              <p className="mt-1 text-right text-xs text-gray-500">{description.length}자 (최소 20자)</p>
            </div>

            {/* 카테고리 */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-white">
                카테고리 <span className="text-red-600">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
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
          </div>
        </div>

        {/* 가격 및 재고 */}
        <div className="mt-4 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">가격 및 재고</h2>
          </div>
          <div className="space-y-4 p-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-white">
                가격 (원) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="0"
                max="99999999.99"
                className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
                placeholder="0"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-white">
                  총 재고 <span className="text-red-600">*</span>
                  {options.length > 0 && <span className="ml-1 text-xs font-normal text-gray-500">(옵션 재고 합계)</span>}
                </label>
                <input
                  type="number"
                  value={options.length > 0 ? calculateTotalStock() : stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                  min="0"
                  max="999999"
                  disabled={options.length > 0}
                  className={`w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:text-white dark:focus:border-white ${
                    options.length > 0 ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'bg-white dark:bg-gray-800'
                  }`}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-white">
                  재고 부족 알림 수량 <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  value={lowStock}
                  onChange={(e) => setlowStock(e.target.value)}
                  required
                  min="0"
                  className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
                  placeholder="10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 해시태그 */}
        <div className="mt-4 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">해시태그</h2>
          </div>
          <div className="p-5">
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">검색에 사용될 태그를 입력하세요 (최대 10개)</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const tag = tagInput.trim();
                    if (tag && tags.length < 10 && !tags.includes(tag)) {
                      setTags([...tags, tag]);
                      setTagInput('');
                    }
                  }
                }}
                className="flex-1 border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
                placeholder="태그 입력 후 Enter"
                disabled={tags.length >= 10}
              />
              <button
                type="button"
                onClick={() => {
                  const tag = tagInput.trim();
                  if (tag && tags.length < 10 && !tags.includes(tag)) {
                    setTags([...tags, tag]);
                    setTagInput('');
                  }
                }}
                disabled={!tagInput.trim() || tags.length >= 10}
                className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                추가
              </button>
            </div>
            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 border border-gray-300 bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((_, i) => i !== index))}
                      className="hover:text-gray-900 dark:hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 상품 이미지 */}
        <div className="mt-4 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">상품 이미지</h2>
          </div>
          <div className="p-5">
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
              className={`inline-flex cursor-pointer items-center gap-2 border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 ${
                imageFiles.length >= 5 ? 'cursor-not-allowed opacity-50' : ''
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              사진 선택 ({imagePreviews.length}/5)
            </label>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              * 첫 번째 이미지가 대표 이미지로 사용됩니다. 최대 5장까지 업로드 가능합니다.
            </p>

            {imagePreviews.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative h-20 w-20">
                    <img
                      src={preview}
                      alt={`미리보기 ${index + 1}`}
                      className="h-full w-full border border-gray-200 object-cover dark:border-gray-700"
                    />
                    {index === 0 && (
                      <span className="absolute left-0 top-0 bg-gray-900 px-1 py-0.5 text-[10px] text-white dark:bg-white dark:text-gray-900">
                        대표
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center bg-red-600 text-white hover:bg-red-700"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 옵션 */}
        <div className="mt-4 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">옵션 설정</h2>
            <button
              type="button"
              onClick={addOption}
              disabled={options.length >= 5}
              className="border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              + 옵션 추가 ({options.length}/5)
            </button>
          </div>
          <div className="p-5">
            {options.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">옵션을 추가하려면 위의 "옵션 추가" 버튼을 클릭하세요.</p>
            ) : (
              <div className="space-y-4">
                {options.map((option, index) => (
                  <div key={index} className="border border-gray-200 p-4 dark:border-gray-700">
                    <div className="mb-3 flex items-center justify-between">
                      <input
                        type="text"
                        value={option.customType}
                        onChange={(e) => updateCustomType(index, e.target.value)}
                        placeholder="옵션 타입 (예: 색상, 사이즈)"
                        className="flex-1 border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="ml-2 text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        삭제
                      </button>
                    </div>

                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">옵션 값</span>
                      <button
                        type="button"
                        onClick={() => addOptionValue(index)}
                        disabled={option.values.length >= 5}
                        className="text-xs text-gray-600 hover:text-gray-900 disabled:opacity-50 dark:text-gray-400 dark:hover:text-white"
                      >
                        + 값 추가 ({option.values.length}/5)
                      </button>
                    </div>

                    <div className="space-y-2">
                      {option.values.map((optionValue, valueIndex) => (
                        <div key={valueIndex} className="flex items-center gap-2 border border-gray-100 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800">
                          <input
                            type="text"
                            value={optionValue.value}
                            onChange={(e) => updateOptionValue(index, valueIndex, 'value', e.target.value)}
                            placeholder="옵션값"
                            className="flex-1 border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                          <input
                            type="number"
                            value={optionValue.price}
                            onChange={(e) => updateOptionValue(index, valueIndex, 'price', e.target.value)}
                            placeholder="추가금액"
                            min="0"
                            className="w-24 border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                          <input
                            type="number"
                            value={optionValue.stock}
                            onChange={(e) => updateOptionValue(index, valueIndex, 'stock', e.target.value)}
                            placeholder="재고"
                            min="0"
                            className="w-20 border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => removeOptionValue(index, valueIndex)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 버튼 */}
        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            className="flex-1 border border-gray-900 bg-gray-900 py-3 text-sm font-bold text-white transition hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            {isNewProduct ? '상품 등록' : '상품 수정'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
