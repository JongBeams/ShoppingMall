'use client';

import { useEffect, useMemo, useState } from 'react';
import ProductGrid from '../components/product/ProductGrid';
import ProductFilter from '../components/product/ProductFilter';
import { Product } from '../types';
import { productAPI } from '../lib/api';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await productAPI.getAll();
        setProducts(response.products || []);
      } catch (err: any) {
        console.error('Failed to load products:', err);
        setError(err.message || '상품 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    products.forEach((product) => {
      const categoryLabel =
        product.category ||
        product.category_name ||
        product.category_slug ||
        '기타';
      categorySet.add(categoryLabel);
    });
    return Array.from(categorySet);
  }, [products]);

  const filteredProducts =
    selectedCategory === 'all'
      ? products
      : products.filter((product) => {
          const categoryLabel =
            product.category ||
            product.category_name ||
            product.category_slug ||
            '기타';
          return categoryLabel === selectedCategory;
        });

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
        전체 상품
      </h1>

      <ProductFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-600 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center text-gray-500 dark:text-gray-400">
          상품을 불러오는 중입니다...
        </div>
      ) : (
        <ProductGrid products={filteredProducts} />
      )}
    </div>
  );
}
