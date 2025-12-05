'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cartAPI, notificationAPI } from '@/app/lib/api';
import type { Notification } from '@/app/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [menuHeight, setMenuHeight] = useState(0);
  const [transitionDuration, setTransitionDuration] = useState(0.4);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userType, setUserType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [businessName, setBusinessName] = useState('SHOP');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // CRM 경로 확인
  const isCRMPage = pathname?.startsWith('/crm');

  // 장바구니 개수 조회
  const fetchCartCount = async () => {
    const token = localStorage.getItem('access_token');
    if (!token || isCRMPage) return;

    try {
      const response = await cartAPI.get(token);
      setCartCount(response.items?.length || 0);
    } catch (error) {
      console.error('Failed to fetch cart count:', error);
    }
  };

  // 알림 조회 (최신 3개)
  const fetchNotifications = async () => {
    const token = localStorage.getItem('access_token');
    if (!token || isCRMPage) return;

    try {
      const response = await notificationAPI.getNotifications(token, {
        limit: 3,
        offset: 0,
      });
      setNotifications(response.notifications || []);
      setUnreadCount(response.unread_count || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // 상호명 조회
  const fetchBusinessName = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/settings/public`);
      if (response.ok) {
        const data = await response.json();
        setBusinessName(data.business_name || 'SHOP');
      }
    } catch (error) {
      console.error('상호명 조회 실패:', error);
    }
  };

  // 로그인 상태 확인
  useEffect(() => {
    // 상호명 조회 (모든 페이지에서)
    fetchBusinessName();

    if (isCRMPage) {
      // CRM 페이지: 관리자 인증 확인
      const adminToken = localStorage.getItem('admin_token');
      const adminData = localStorage.getItem('admin_user');

      if (adminToken && adminData) {
        setIsLoggedIn(true);
        try {
          const admin = JSON.parse(adminData);
          setUserName(admin.full_name || '관리자');
          setUserType('admin');
        } catch (e) {
          console.error('Failed to parse admin data:', e);
        }
      }
    } else {
      // 일반 페이지: 일반 사용자 인증 확인
      const token = localStorage.getItem('access_token');
      const user = localStorage.getItem('user');

      if (token && user) {
        setIsLoggedIn(true);
        try {
          const userData = JSON.parse(user);
          setUserName(userData.full_name || '사용자');
          setUserType(userData.user_type || '');

          // 구매자인 경우 장바구니 개수 및 알림 조회
          if (userData.user_type === 'buyer') {
            fetchCartCount();
            fetchNotifications();
          }
        } catch (e) {
          console.error('Failed to parse user data:', e);
        }
      }
    }
  }, [isCRMPage]);

  // 장바구니 업데이트 이벤트 리스너
  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCartCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const handleLogout = () => {
    if (isCRMPage) {
      // CRM 로그아웃
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      setIsLoggedIn(false);
      setUserName('');
      router.push('/crm/login');
    } else {
      // 일반 사용자 로그아웃
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('vendor');
      setIsLoggedIn(false);
      setUserName('');
      router.push('/');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      if (isCRMPage) {
        // 관리자: CRM 통합 검색
        router.push(`/crm?search=${encodeURIComponent(searchQuery)}`);
      } else if (userType === 'seller') {
        // 판매자: 마이페이지 통합 검색
        router.push(`/mypage?search=${encodeURIComponent(searchQuery)}`);
      } else {
        // 구매자: 상품 검색
        router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      }
      // 검색 후 검색어 초기화
      setSearchQuery('');
    } else {
      // 검색어 없이 엔터 시 상품 목록으로 이동 (검색 초기화)
      if (!isCRMPage && userType !== 'seller') {
        router.push('/products');
      }
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleImageSearch = async (file: File) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/products/search-by-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        alert('이미지 검색에 실패했습니다.');
        return;
      }

      const data = await response.json();

      // 🔥 모든 검색 결과 표시 (백엔드에서 유사도순으로 정렬된 결과)
      const products = data.products || [];

      if (products.length === 0) {
        alert('유사한 상품을 찾지 못했습니다.');
        return;
      }

      // 검색 결과를 sessionStorage에 저장
      sessionStorage.setItem('image_search_results', JSON.stringify(products));

      // ✅ 이미 이미지 검색 페이지에 있으면 강제 새로고침
      if (window.location.pathname === '/products' && window.location.search.includes('image_search=true')) {
        window.location.href = '/products?image_search=true';
      } else {
        // products 페이지로 이동 (이미지 검색 모드)
        router.push('/products?image_search=true');
      }
    } catch (error) {
      console.error('Image search error:', error);
      alert('이미지 검색 중 오류가 발생했습니다.');
    } finally {
      setSelectedImage(null);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      handleImageSearch(file); // ✅ 이미지 선택하자마자 바로 검색
    }
    // ✅ 같은 파일을 다시 선택할 수 있도록 input value 초기화
    e.target.value = '';
  };

  // 타입별 한글 이름
  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      order: '주문',
      shipment: '배송',
      coupon: '쿠폰',
      event: '이벤트',
    };
    return typeMap[type] || type;
  };

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;

    return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  };

  const handleMenuEnter = (menuName: string) => {
    const menu = menuItems.find(item => item.name === menuName);
    if (menu && menu.submenu.length > 0) {
      // Base height + dynamic content (5 columns)
      const rows = Math.ceil(menu.submenu.length / 5);
      const calculatedHeight = 220 + (rows * 180);

      console.log('Menu:', menuName, 'Old height:', menuHeight, 'New height:', calculatedHeight);

      // Always use consistent transition duration
      setTransitionDuration(0.4);

      // Update content and height together
      setActiveMenu(menuName);
      setMenuHeight(calculatedHeight);
    } else {
      setMenuHeight(0);
    }
  };

  const handleMenuLeave = () => {
    setActiveMenu(null);
    setMenuHeight(0);
  };

  // 역할별 메뉴 구성
  const buyerMenuItems = [
    {
      name: '홈',
      href: '/',
      submenu: [],
      rightLinks: []
    },
    {
      name: 'AI선물추천',
      href: '/gift-wizard',
      submenu: [],
      rightLinks: []
    },
    {
      name: '상품',
      href: '/products',
      submenu: [
        { name: '전자제품', href: '/products?category=전자제품', image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=200&q=80' },
        { name: '패션', href: '/products?category=패션', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=200&q=80' },
        { name: '뷰티', href: '/products?category=뷰티', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200&q=80' },
        { name: '생활', href: '/products?category=생활', image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=200&q=80' },
        { name: '식품', href: '/products?category=식품', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80' },
        { name: '스포츠', href: '/products?category=스포츠', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=200&q=80' },
        { name: '도서', href: '/products?category=도서', image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=200&q=80' },
        { name: '완구', href: '/products?category=완구', image: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=200&q=80' },
      ],
      rightLinks: [
        { name: '전체 상품 보기', href: '/products' },
        { name: '특가 상품', href: '/deals' },
        { name: '신상품', href: '/new' },
        { name: '베스트 상품', href: '/best' },
        { name: '브랜드관', href: '/brands', divider: true },
      ]
    },
    {
      name: '회사소개',
      href: '/about',
      submenu: [
        { name: '회사 정보', href: '/about/info', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&q=80' },
        { name: '공지사항', href: '/notice', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=200&q=80' },
        { name: 'FAQ', href: '/faq', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&q=80' },
        { name: '고객센터', href: '/support', image: 'https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=200&q=80' },
      ],
      rightLinks: [
        { name: '채용 정보', href: '/careers' },
        { name: '투자자 정보', href: '/investors' },
        { name: '뉴스룸', href: '/news' },
        { name: '파트너십', href: '/partnership' },
        { name: '문의하기', href: '/contact', divider: true },
      ]
    },
  ];

  const sellerMenuItems = [
    {
      name: '홈',
      href: '/',
      submenu: [],
      rightLinks: []
    },
    {
      name: '상품 관리',
      href: '/mypage#products',
      submenu: [
        { name: '상품 등록', href: '/mypage#products', image: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=200&q=80' },
        { name: '상품 목록', href: '/mypage#products', image: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=200&q=80' },
        { name: '재고 관리', href: '/mypage#products', image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&q=80' },
        { name: '품절 상품', href: '/mypage#products', image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200&q=80' },
      ],
      rightLinks: [
        { name: '대량 등록', href: '/mypage#products' },
        { name: '엑셀 업로드', href: '/mypage#products' },
        { name: '상품 통계', href: '/mypage#products', divider: true },
      ]
    },
    {
      name: '판매 관리',
      href: '/mypage#sales',
      submenu: [
        { name: '판매 현황', href: '/mypage#sales', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&q=80' },
        { name: '주문 관리', href: '/mypage#delivery', image: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=200&q=80' },
        { name: '정산 관리', href: '/mypage#settlement', image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=200&q=80' },
        { name: '고객 문의', href: '/mypage#inquiries', image: 'https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=200&q=80' },
      ],
      rightLinks: [
        { name: '매출 통계', href: '/mypage#sales-stats' },
        { name: '정산 내역', href: '/mypage#settlement-history' },
        { name: '문의 답변', href: '/mypage#inquiries', divider: true },
      ]
    },
    {
      name: '스토어 관리',
      href: '/mypage#store',
      submenu: [
        { name: '스토어 정보', href: '/mypage#store', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&q=80' },
        { name: '공지사항', href: '/notice', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=200&q=80' },
        { name: '쿠폰/프로모션', href: '/mypage#seller-coupons', image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=200&q=80' },
      ],
      rightLinks: [
        { name: '스토어 꾸미기', href: '/mypage#store-design' },
        { name: '리뷰 관리', href: '/mypage#reviews' },
        { name: '고객센터', href: '/support', divider: true },
      ]
    },
  ];

  const adminMenuItems = [
    {
      name: '대시보드',
      href: '/crm/analytics',
      submenu: [],
      rightLinks: []
    },
    {
      name: '회원 관리',
      href: '/crm/users',
      submenu: [
        { name: '전체 회원', href: '/crm/users', image: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=200&q=80' },
        { name: '구매자 관리', href: '/crm/users?type=buyer', image: 'https://images.unsplash.com/photo-1556745753-b2904692b3cd?w=200&q=80' },
        { name: '판매자 관리', href: '/crm/users?type=seller', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&q=80' },
        { name: '휴면 회원', href: '/crm/users?status=inactive', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200&q=80' },
      ],
      rightLinks: [
        { name: '회원 통계', href: '/crm/users/stats' },
        { name: '회원 등급', href: '/crm/users/grades' },
      ]
    },
    {
      name: '시스템',
      href: '/crm/settings',
      submenu: [
        { name: '공지사항', href: '/crm/notices', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=200&q=80' },
        { name: 'FAQ 관리', href: '/crm/faq', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&q=80' },
        { name: '배너 관리', href: '/crm/banners', image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=200&q=80' },
        { name: '설정', href: '/crm/settings', image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=200&q=80' },
      ],
      rightLinks: [
        { name: '관리자 계정', href: '/crm/admins' },
        { name: '로그 관리', href: '/crm/logs' },
      ]
    },
  ];

  // 현재 사용자 타입 또는 페이지에 따라 메뉴 선택
  const menuItems = isCRMPage ? adminMenuItems : (userType === 'seller' ? sellerMenuItems : buyerMenuItems);

  return (
    <>
      {/* Overlay */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/30 transition-opacity duration-300"
          onMouseEnter={handleMenuLeave}
        ></div>
      )}

      <header
        className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
        onMouseLeave={handleMenuLeave}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          {/* Logo */}
          <div className="flex lg:flex-1">
            <Link href={isCRMPage ? '/crm' : '/'} className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              {businessName}
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 text-gray-700 dark:text-gray-300"
            >
              <span className="sr-only">메뉴 열기</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:gap-x-8">
            {menuItems.map((item) => (
              <div
                key={item.name}
                className="relative py-2"
                onMouseEnter={() => item.submenu.length > 0 && handleMenuEnter(item.name)}
              >
                <Link
                  href={item.href}
                  className={`flex items-center gap-1 text-sm font-medium transition ${
                    activeMenu === item.name
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                  }`}
                >
                  {item.name}
                  {item.submenu.length > 0 && (
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </Link>
              </div>
            ))}
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex lg:flex-1 lg:justify-center lg:px-8">
            <form onSubmit={handleSearch} className="w-full max-w-md">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isCRMPage ? '판매스토어, 회원 검색' : (userType === 'seller' ? '상품+주문+문의 통합검색' : '상품 검색...')}
                  className="w-full border border-gray-300 bg-white px-4 py-2 pr-24 text-sm text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-white"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="text-gray-400 transition hover:text-gray-900 dark:hover:text-white"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}

                  {/* 🔥 이미지 검색 아이콘 (검색창 안) */}
                  {!isCRMPage && userType !== 'seller' && (
                    <div className="relative group">
                      <input
                        type="file"
                        id="image-search-input"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageSelect}
                      />
                      <label
                        htmlFor="image-search-input"
                        className="cursor-pointer text-gray-400 transition hover:text-gray-900 dark:hover:text-white"
                        title="이미지로 검색"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      </label>
                    </div>
                  )}

                  {/* 텍스트 검색 버튼 */}
                  <button
                    type="submit"
                    className="text-gray-400 transition hover:text-gray-900 dark:hover:text-white"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Auth & Cart/Product-Management Links */}
          <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-end lg:gap-x-6">
            {/* Notification Bell */}
            {isLoggedIn && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) {
                      fetchNotifications(); // 드롭다운 열 때 최신 알림 조회
                    }
                  }}
                  className="relative flex items-center text-gray-700 transition hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <>
                    {/* Overlay to close dropdown */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowNotifications(false)}
                    ></div>
                    <div className="absolute right-0 top-full z-50 mt-4 w-80 border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">알림</h3>
                      </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                          알림이 없습니다
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <Link
                            key={notification.id}
                            href={`/notifications/${notification.id}`}
                            className={`block border-b border-gray-100 p-4 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800 ${
                              !notification.is_read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                            }`}
                            onClick={() => setShowNotifications(false)}
                          >
                            <div className="mb-1 flex items-start justify-between">
                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                {getTypeLabel(notification.type)}
                              </span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {formatTime(notification.created_at)}
                              </span>
                            </div>
                            <h4 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {notification.summary}
                            </p>
                          </Link>
                        ))
                      )}
                    </div>
                      <Link
                        href="/notifications"
                        className="block border-t border-gray-200 p-3 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        onClick={() => setShowNotifications(false)}
                      >
                        전체 보기
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}

            {!(isLoggedIn && userType === 'seller') && !isCRMPage && (
              <Link
                href="/cart"
                className="relative flex items-center text-gray-700 transition hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {isLoggedIn ? (
              <>
                <Link
                  href={isCRMPage ? '/crm/mypage' : '/mypage'}
                  className="text-sm font-medium text-gray-700 transition hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  {userName}님
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-gray-700 transition hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center text-gray-700 transition hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </Link>
            )}
          </div>
        </nav>

        {/* Full Width Mega Menu - Absolute Positioned */}
        <div
          className="absolute left-0 right-0 top-full overflow-hidden border-t border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
          style={{
            height: `${menuHeight}px`,
            transition: `height ${transitionDuration}s cubic-bezier(0.4, 0, 0.2, 1)`,
          }}
        >
          <div className="mx-auto max-w-7xl px-8 py-12 lg:px-8">
            <div className="flex gap-8" key={activeMenu}>
              {/* Left Sidebar - Category List */}
              <div className="w-48 pr-8 border-r border-gray-200 dark:border-gray-700">
                <h3 className="mb-4 text-sm font-bold text-gray-900 dark:text-white">
                  {activeMenu === '상품' ? '카테고리' : '메뉴'}
                </h3>
                <ul className="space-y-2">
                  {menuItems.find(item => item.name === activeMenu)?.submenu.map((subitem) => (
                    <li key={subitem.name}>
                      <Link
                        href={subitem.href}
                        className="block py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:underline dark:text-gray-300 dark:hover:text-white"
                      >
                        {subitem.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Main Content - Image Grid */}
              <div className="flex-1">
                <div className="grid grid-cols-4 gap-6">
                  {menuItems.find(item => item.name === activeMenu)?.submenu.map((subitem) => (
                    subitem.name === 'FAQ' ? (
                      <div
                        key={subitem.name}
                        className="flex flex-col items-center gap-3 cursor-not-allowed opacity-50"
                      >
                        <div className="relative h-28 w-28 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                          <img
                            src={subitem.image}
                            alt={subitem.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <p className="text-center text-sm font-medium text-gray-900 dark:text-white">
                          {subitem.name}
                        </p>
                      </div>
                    ) : (
                      <Link
                        key={subitem.name}
                        href={subitem.href}
                        className="group flex flex-col items-center gap-3"
                      >
                        <div className="relative h-28 w-28 overflow-hidden rounded-lg bg-gray-100 transition-transform group-hover:scale-105 dark:bg-gray-800">
                          <img
                            src={subitem.image}
                            alt={subitem.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <p className="text-center text-sm font-medium text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                          {subitem.name}
                        </p>
                      </Link>
                    )
                  ))}
                </div>
              </div>

              {/* Right Sidebar - Additional Links */}
              <div className="w-48 border-l border-gray-200 pl-8 dark:border-gray-700">
                <h3 className="mb-4 text-sm font-bold text-gray-500 dark:text-gray-400">
                  더 알아보기
                </h3>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="/products"
                      className="block text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                    >
                      전체 상품 보기
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/deals"
                      className="block text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                    >
                      특가 상품
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/new"
                      className="block text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                    >
                      신상품
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/best"
                      className="block text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                    >
                      베스트 상품
                    </Link>
                  </li>
                  <li className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Link
                      href="/support"
                      className="block text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                    >
                      고객 지원
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden">
            <div className="space-y-2 px-4 pb-3 pt-2">
              <Link
                href="/"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                홈
              </Link>
              <Link
                href="/products"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                상품
              </Link>
              <Link
                href="/about"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                회사소개
              </Link>
              <Link
                href="/cart"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                장바구니
              </Link>
              <Link
                href="/login"
                className="block bg-gray-900 px-3 py-2 text-base font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                로그인
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
