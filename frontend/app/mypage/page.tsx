'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CartItem as CartItemType, Product } from '../types';
import UserInfo from '../components/mypage/UserInfo';
import Profile from '../components/mypage/Profile';
import Orders from '../components/mypage/Orders';
import Sales from '../components/mypage/Sales';
import Wishlist from '../components/mypage/Wishlist';
import Inquiry from '../components/mypage/Inquiry';

// 임시 더미 데이터(주문 내역)
const dummyOrders: CartItemType[] = [
  {
    product: {
      id: '1',
      name: '무선 이어폰',
      description: '고음질 블루투스 무선 이어폰',
      price: 89000,
      category: '전자제품',
      imageUrl: '/placeholder-product.jpg',
      stock: 50,
    },
    quantity: 50,
  },
  {
    product: {
      id: '3',
      name: '백팩',
      description: '심플한 디자인의 데일리 백팩',
      price: 65000,
      category: '패션',
      imageUrl: '/placeholder-product.jpg',
      stock: 20,
    },
    quantity: 2,
  },
];

// 임시 더미 데이터 (찜목록)
const dummyWishList: Product[] = [
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
    id: '4',
    name: '머그컵 세트',
    description: '모던한 디자인의 머그컵 4개 세트',
    price: 32000,
    category: '생활용품',
    imageUrl: '/placeholder-product.jpg',
    stock: 100,
  },
];

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    const vendorData = localStorage.getItem('vendor');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      setUser(JSON.parse(userData));
      if (vendorData) {
        setVendor(JSON.parse(vendorData));
      }
    } catch (e) {
      console.error('Failed to parse user data:', e);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // URL 해시에 따라 활성 섹션 설정
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setActiveTab(hash);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">마이페이지</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <UserInfo user={user} activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'profile' && <Profile user={user} vendor={vendor} />}
            {activeTab === 'orders' && <Orders user={user} dummyOrders={dummyOrders} />}
            {activeTab === 'sales' && user?.user_type === 'seller' && <Sales />}
            {activeTab === 'wishlist' && <Wishlist dummyWishList={dummyWishList} />}
            {activeTab === 'inquiry' && <Inquiry />}
          </div>
        </div>
      </div>
    </div>
  );
}
