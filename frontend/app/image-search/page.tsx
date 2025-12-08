"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  thumbnail_url: string;
  category_name: string;
  vendor_name: string;
  rating: number;
  review_count: number;
  similarity: number;
}

export default function ImageSearchPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 이전 URL 해제 (메모리 누수 방지)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setProducts([]); // 이전 검색 결과 초기화
      setError(null);
    }
  };

  // 컴포넌트 언마운트 시 URL 해제
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleSearch = async () => {
    if (!selectedImage) {
      setError("이미지를 선택해주세요.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedImage);

      const response = await fetch("http://localhost:8000/products/search-by-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("검색에 실패했습니다.");
      }

      const data = await response.json();
      setProducts(data.products || []);

      if (data.count === 0) {
        setError("유사한 상품을 찾을 수 없습니다.");
      }
    } catch (err) {
      console.error(err);
      setError("검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            🔍 이미지로 상품 찾기
          </h1>
          <p className="text-gray-600 text-lg">
            마음에 드는 상품 사진을 업로드하면 비슷한 상품을 찾아드려요!
          </p>
        </div>

        {/* 이미지 업로드 영역 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* 이미지 업로드 박스 */}
            <div className="flex-1 w-full">
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-4 border-dashed border-purple-300 rounded-xl cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
              >
                {previewUrl ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-contain p-4"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className="w-16 h-16 mb-4 text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="mb-2 text-lg font-semibold text-gray-700">
                      클릭하여 이미지 업로드
                    </p>
                    <p className="text-sm text-gray-500">PNG, JPG (최대 5MB)</p>
                  </div>
                )}
                <input
                  id="image-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageSelect}
                />
              </label>
            </div>

            {/* 검색 버튼 */}
            <div className="flex flex-col gap-4">
              <button
                onClick={handleSearch}
                disabled={!selectedImage || loading}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    검색 중...
                  </span>
                ) : (
                  "🔍 유사 상품 검색"
                )}
              </button>

              {selectedImage && (
                <button
                  onClick={() => {
                    // URL 해제 후 초기화
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                    }
                    setSelectedImage(null);
                    setPreviewUrl(null);
                    setProducts([]);
                    setError(null);
                  }}
                  className="px-8 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all"
                >
                  초기화
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* 검색 결과 */}
        {products.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              🎯 유사한 상품 {products.length}개를 찾았어요!
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <a
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-purple-400 hover:shadow-xl transition-all transform hover:scale-105"
                >
                  {/* 상품 이미지 */}
                  <div className="relative h-48 bg-gray-100">
                    {product.thumbnail_url ? (
                      <Image
                        src={product.thumbnail_url}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        이미지 없음
                      </div>
                    )}
                    {/* 유사도 배지 */}
                    <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {Math.round(product.similarity * 100)}% 유사
                    </div>
                  </div>

                  {/* 상품 정보 */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-purple-600">
                      {product.name}
                    </h3>

                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-sm text-gray-600">
                        {product.rating.toFixed(1)} ({product.review_count})
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-purple-600">
                        {product.price.toLocaleString()}원
                      </span>
                    </div>

                    {product.category_name && (
                      <div className="mt-2 text-xs text-gray-500">
                        {product.category_name}
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
