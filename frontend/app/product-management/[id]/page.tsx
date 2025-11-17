'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CartItem, Product } from '../../types';



// 임시 더미 데이터 (동일한 데이터 사용)
const dummySaleProducts: CartItem[] = [
  {
    product: {
      id: '1',
      name: '프리미엄 유기농 토마토 1kg',
      description: '뒷 밭에서 기른 프리미엄 유기농 토마토 1kg',
      price: 15000,
      category: '농산물',
      imageUrl: '/placeholder-product.jpg',
      stock: 50,
      createdAt: '2025-11-10T09:00:00Z',
    },
    quantity: 100,
  },
  {
    product: {
      id: '2',
      name: '백팩',
      description: '심플한 디자인의 데일리 백팩 (노트북 수납 가능)',
      price: 65000,
      category: '패션',
      imageUrl: '/placeholder-product.jpg',
      stock: 20,
      createdAt: '2025-11-11T12:30:00Z',
    },
    quantity: 200,
  },
  {
    product: {
      id: '3',
      name: '프로그래머를 위한 자바스크립트 입문서',
      description: '기초 문법부터 실전 예제까지 다루는 자바스크립트 입문 도서',
      price: 32000,
      category: '도서',
      imageUrl: '/placeholder-product.jpg',
      stock: 30,
      createdAt: '2025-11-12T15:00:00Z',
    },
    quantity: 300,
  },
];

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
  const [quantity, setQuantity] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

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

      // 신규 상품이 아니면 더미 데이터에서 첫 번째 상품 정보 로드
      if (!isNewProduct) {
        const dummyProduct = dummySaleProducts[0]; // 임시로 첫 번째 상품 사용
        setName(dummyProduct.product.name);
        setDescription(dummyProduct.product.description);
        setPrice(dummyProduct.product.price.toString());
        setCategory(dummyProduct.product.category);
        setStock(dummyProduct.product.stock.toString());
        setQuantity(dummyProduct.quantity.toString());
        setImagePreview(dummyProduct.product.imageUrl || '');
      }
    } catch (e) {
      console.error('Failed to parse user data:', e);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router, isNewProduct]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 이미지 파일만 허용
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        e.target.value = '';
        return;
      }

      setImageFile(file);

      // 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: API 호출로 상품 등록/수정
    const formData = new FormData();
    formData.append('id', productId);
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('category', category);
    formData.append('stock', stock);
    formData.append('quantity', quantity);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    console.log('Submit product:', {
      id: productId,
      name,
      description,
      price: Number(price),
      category,
      stock: Number(stock),
      quantity: Number(quantity),
      imageFile: imageFile?.name,
    });

    alert(isNewProduct ? '상품이 등록되었습니다.' : '상품이 수정되었습니다.');
    router.push('/product-management');
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
                className="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400"
                placeholder="상품 설명을 입력하세요"
              />
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
            <div className="grid gap-6 sm:grid-cols-2">
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
                  className="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400"
                  placeholder="0"
                />
              </div>

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
                  className="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400"
                  placeholder="0"
                />
              </div>
            </div>


            {/* 이미지 파일 */}
            <div>
              <label htmlFor="imageFile" className="block text-sm font-medium text-gray-900 dark:text-white">
                상품 이미지
              </label>
              <input
                type="file"
                id="imageFile"
                accept="image/*"
                onChange={handleImageChange}
                className="mt-2 block w-full text-sm text-gray-900 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 dark:text-gray-400 dark:file:bg-blue-900 dark:file:text-blue-300 dark:hover:file:bg-blue-800"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                선택사항: 이미지 파일만 업로드 가능합니다 (JPG, PNG, GIF 등)
              </p>

              {/* 이미지 미리보기 */}
              {imagePreview && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium text-gray-900 dark:text-white">미리보기:</p>
                  <div className="relative h-48 w-48 overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
                    <img
                      src={imagePreview}
                      alt="상품 이미지 미리보기"
                      className="h-full w-full object-cover"
                    />
                  </div>
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
