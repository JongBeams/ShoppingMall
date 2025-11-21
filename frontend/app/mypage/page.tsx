'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CartItem as CartItemType, Product } from '../types';
import UserInfo from '../components/mypage/UserInfo';
import Profile from '../components/mypage/Profile';
import Orders from '../components/mypage/Orders';
import Sales from '../components/mypage/Sales';
import Wishlist from '../components/mypage/Wishlist';
import Inquiry from '../components/mypage/Inquiry';
import Subscription from '../components/mypage/Subscription';
import RecentProducts from '../components/mypage/RecentProducts';
import Coupons from '../components/mypage/Coupons';
import Reviews from '../components/mypage/Reviews';
import StoreManagement from '../components/mypage/StoreManagement';
import ProductManagement from '../components/mypage/ProductManagement';
import DeliveryManagement from '../components/mypage/DeliveryManagement';
import InquiryManagement from '../components/mypage/InquiryManagement';
import SellerCoupons from '../components/mypage/SellerCoupons';
import EventManagement from '../components/mypage/EventManagement';

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
    status: 'shipping', // 배송 중
  },
  {
    product: {
      id: '2',
      name: '스마트워치',
      description: '다양한 기능을 갖춘 스마트워치',
      price: 250000,
      category: '전자제품',
      imageUrl: '/placeholder-product.jpg',
      stock: 30,
    },
    quantity: 1,
    status: 'delivered', // 배송 완료
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
    status: 'shipping', // 배송 중
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
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  // 탭 변경 시 URL도 업데이트
  const handleSetActiveTab = (tab: string) => {
    setActiveTab(tab);
    router.replace(`/mypage?tab=${tab}`, { scroll: false });
  };

  useEffect(() => {
    // 페이지 로드 시 스크롤 맨 위로
    window.scrollTo(0, 0);

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

  // URL 쿼리 파라미터에 따라 활성 탭 설정
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <h1 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">마이페이지</h1>

        <div className="flex gap-4">
          {/* Sidebar */}
          <div className="w-56 flex-shrink-0">
            <UserInfo user={user} activeTab={activeTab} setActiveTab={handleSetActiveTab} />
          </div>
          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'profile' && <Profile user={user} vendor={vendor} />}
            {activeTab === 'orders' && <Orders user={user} dummyOrders={dummyOrders} />}
            {activeTab === 'sales' && user?.user_type === 'seller' && <Sales />}
            {activeTab === 'store' && user?.user_type === 'seller' && <StoreManagement />}
            {activeTab === 'products' && user?.user_type === 'seller' && <ProductManagement />}
            {activeTab === 'delivery' && user?.user_type === 'seller' && <DeliveryManagement />}
            {activeTab === 'inquiries' && user?.user_type === 'seller' && <InquiryManagement />}
            {activeTab === 'seller-coupons' && user?.user_type === 'seller' && <SellerCoupons />}
            {activeTab === 'events' && user?.user_type === 'seller' && <EventManagement />}
            {activeTab === 'wishlist' && user?.user_type !== 'seller' && <Wishlist dummyWishList={dummyWishList} />}
            {activeTab === 'recent' && user?.user_type !== 'seller' && <RecentProducts />}
            {activeTab === 'inquiry' && <Inquiry />}
            {activeTab === 'subscription' && user?.user_type !== 'seller' && <Subscription />}
            {activeTab === 'coupons' && user?.user_type !== 'seller' && <Coupons />}
            {activeTab === 'reviews' && user?.user_type !== 'seller' && <Reviews />}
          </div>
        </div>
      </div>
    </div>
  );
}
