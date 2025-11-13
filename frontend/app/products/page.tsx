'use client';

import { useState } from 'react';
import ProductGrid from '../components/product/ProductGrid';
import ProductFilter from '../components/product/ProductFilter';
import { Product } from '../types';

// 임시 더미 데이터
const dummyProducts: Product[] = [
  {
    id: '1',
    name: '무선 이어폰',
    description: '고음질 블루투스 무선 이어폰',
    price: 89000,
    category: '전자제품',
    imageUrl: '/placeholder-product.jpg',
    stock: 50,
  },
  {
    id: '2',
    name: '스마트워치',
    description: '다양한 기능을 갖춘 스마트워치',
    price: 250000,
    category: '전자제품',
    imageUrl: '/placeholder-product.jpg',
    stock: 30,
  },
  {
    id: '3',
    name: '백팩',
    description: '심플한 디자인의 데일리 백팩',
    price: 65000,
    category: '패션',
    imageUrl: '/placeholder-product.jpg',
    stock: 20,
  },
  {
    id: '4',
    name: '머그컵 세트',
    description: '모던한 디자인의 머그컵 4개 세트',
    price: 32000,
    category: '생활용품',
    imageUrl: '/placeholder-product.jpg',
    stock: 100,
  },
];

const categories = ['전자제품', '패션', '생활용품'];

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredProducts =
    selectedCategory === 'all'
      ? dummyProducts
      : dummyProducts.filter((p) => p.category === selectedCategory);

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

      <ProductGrid products={filteredProducts} />
    </div>
  );
}
