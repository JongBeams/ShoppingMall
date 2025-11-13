'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [menuHeight, setMenuHeight] = useState(0);
  const [transitionDuration, setTransitionDuration] = useState(0.4);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userType, setUserType] = useState('');

  // 로그인 상태 확인
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');

    if (token && user) {
      setIsLoggedIn(true);
      try {
        const userData = JSON.parse(user);
        setUserName(userData.full_name || '사용자');
        setUserType(userData.user_type || '');
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('vendor');
    setIsLoggedIn(false);
    setUserName('');
    router.push('/');
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

  const menuItems = [
    {
      name: '홈',
      href: '/',
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
            <Link href="/" className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              SHOP
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

          {/* Auth & Cart/Product-Management Links */}
          <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-end lg:gap-x-6">
            <Link
              href={isLoggedIn && userType === 'seller' ? '/product-management' : '/cart'}
              className="flex items-center text-gray-700 transition hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              {isLoggedIn && userType === 'seller' ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              )}
            </Link>

            {isLoggedIn ? (
              <>
                <Link
                  href="/mypage"
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
