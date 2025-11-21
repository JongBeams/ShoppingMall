interface UserInfoProps {
  user: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function UserInfo({ user, activeTab, setActiveTab }: UserInfoProps) {
  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    window.history.pushState(null, '', `#${tab}`);
  };

  return (
    <div className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* User Info */}
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-900 dark:text-white">{user.full_name}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {user?.user_type === 'seller' ? '판매자' : '일반회원'}
          </span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">{user.email}</p>
      </div>

      {/* Menu */}
      <nav>
        <button
          onClick={() => handleTabClick('profile')}
          className={`w-full border-b border-gray-200 px-4 py-2.5 text-left text-xs transition dark:border-gray-700 ${
            activeTab === 'profile'
              ? 'border-l-2 border-l-gray-900 bg-gray-50 font-bold text-gray-900 dark:border-l-white dark:bg-gray-800 dark:text-white'
              : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
        >
          내 정보
        </button>
        <button
          onClick={() => handleTabClick('orders')}
          className={`w-full border-b border-gray-200 px-4 py-2.5 text-left text-xs transition dark:border-gray-700 ${
            activeTab === 'orders'
              ? 'border-l-2 border-l-gray-900 bg-gray-50 font-bold text-gray-900 dark:border-l-white dark:bg-gray-800 dark:text-white'
              : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
        >
          {user?.user_type === 'seller' ? '주문 요청 목록' : '주문 내역'}
        </button>
        {user?.user_type === 'seller' && (
          <button
            onClick={() => handleTabClick('sales')}
            className={`w-full border-b border-gray-200 px-4 py-2.5 text-left text-xs transition dark:border-gray-700 ${
              activeTab === 'sales'
                ? 'border-l-2 border-l-gray-900 bg-gray-50 font-bold text-gray-900 dark:border-l-white dark:bg-gray-800 dark:text-white'
                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            판매 내역
          </button>
        )}
        {user?.user_type === 'seller' && (
          <>
            <button
              onClick={() => handleTabClick('store')}
              className={`w-full border-b border-gray-200 px-4 py-2.5 text-left text-xs transition dark:border-gray-700 ${
                activeTab === 'store'
                  ? 'border-l-2 border-l-gray-900 bg-gray-50 font-bold text-gray-900 dark:border-l-white dark:bg-gray-800 dark:text-white'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              스토어 관리
            </button>
            <button
              onClick={() => handleTabClick('products')}
              className={`w-full border-b border-gray-200 px-4 py-2.5 text-left text-xs transition dark:border-gray-700 ${
                activeTab === 'products'
                  ? 'border-l-2 border-l-gray-900 bg-gray-50 font-bold text-gray-900 dark:border-l-white dark:bg-gray-800 dark:text-white'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              상품 관리
            </button>
            <button
              onClick={() => handleTabClick('delivery')}
              className={`w-full border-b border-gray-200 px-4 py-2.5 text-left text-xs transition dark:border-gray-700 ${
                activeTab === 'delivery'
                  ? 'border-l-2 border-l-gray-900 bg-gray-50 font-bold text-gray-900 dark:border-l-white dark:bg-gray-800 dark:text-white'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              배송 관리
            </button>
            <button
              onClick={() => handleTabClick('inquiries')}
              className={`w-full border-b border-gray-200 px-4 py-2.5 text-left text-xs transition dark:border-gray-700 ${
                activeTab === 'inquiries'
                  ? 'border-l-2 border-l-gray-900 bg-gray-50 font-bold text-gray-900 dark:border-l-white dark:bg-gray-800 dark:text-white'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              상품 문의 관리
            </button>
            <button
              onClick={() => handleTabClick('inquiry')}
              className={`w-full border-b border-gray-200 px-4 py-2.5 text-left text-xs transition dark:border-gray-700 ${
                activeTab === 'inquiry'
                  ? 'border-l-2 border-l-gray-900 bg-gray-50 font-bold text-gray-900 dark:border-l-white dark:bg-gray-800 dark:text-white'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              건의하기
            </button>
            <button
              onClick={() => handleTabClick('seller-coupons')}
              className={`w-full border-b border-gray-200 px-4 py-2.5 text-left text-xs transition dark:border-gray-700 ${
                activeTab === 'seller-coupons'
                  ? 'border-l-2 border-l-gray-900 bg-gray-50 font-bold text-gray-900 dark:border-l-white dark:bg-gray-800 dark:text-white'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              쿠폰 발행
            </button>
            <button
              onClick={() => handleTabClick('events')}
              className={`w-full border-b border-gray-200 px-4 py-2.5 text-left text-xs transition dark:border-gray-700 ${
                activeTab === 'events'
                  ? 'border-l-2 border-l-gray-900 bg-gray-50 font-bold text-gray-900 dark:border-l-white dark:bg-gray-800 dark:text-white'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              이벤트/특가 관리
            </button>
          </>
        )}
        {user?.user_type !== 'seller' && (
          <button
            onClick={() => handleTabClick('wishlist')}
            className={`w-full border-b border-gray-200 px-4 py-2.5 text-left text-xs transition dark:border-gray-700 ${
              activeTab === 'wishlist'
                ? 'border-l-2 border-l-gray-900 bg-gray-50 font-bold text-gray-900 dark:border-l-white dark:bg-gray-800 dark:text-white'
                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            찜한 상품
          </button>
        )}
        {user?.user_type !== 'seller' && (
          <button
            onClick={() => handleTabClick('recent')}
            className={`w-full border-b border-gray-200 px-4 py-2.5 text-left text-xs transition dark:border-gray-700 ${
              activeTab === 'recent'
                ? 'border-l-2 border-l-gray-900 bg-gray-50 font-bold text-gray-900 dark:border-l-white dark:bg-gray-800 dark:text-white'
                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            최근 본 상품
          </button>
        )}
        {user?.user_type !== 'seller' && (
          <button
            onClick={() => handleTabClick('inquiry')}
            className={`w-full border-b border-gray-200 px-4 py-2.5 text-left text-xs transition dark:border-gray-700 ${
              activeTab === 'inquiry'
                ? 'border-l-2 border-l-gray-900 bg-gray-50 font-bold text-gray-900 dark:border-l-white dark:bg-gray-800 dark:text-white'
                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            건의하기
          </button>
        )}
        {user?.user_type !== 'seller' && (
          <button
            onClick={() => handleTabClick('subscription')}
            className={`w-full border-b border-gray-200 px-4 py-2.5 text-left text-xs transition dark:border-gray-700 ${
              activeTab === 'subscription'
                ? 'border-l-2 border-l-gray-900 bg-gray-50 font-bold text-gray-900 dark:border-l-white dark:bg-gray-800 dark:text-white'
                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            구독 및 포인트
          </button>
        )}
        {user?.user_type !== 'seller' && (
          <button
            onClick={() => handleTabClick('coupons')}
            className={`w-full border-b border-gray-200 px-4 py-2.5 text-left text-xs transition dark:border-gray-700 ${
              activeTab === 'coupons'
                ? 'border-l-2 border-l-gray-900 bg-gray-50 font-bold text-gray-900 dark:border-l-white dark:bg-gray-800 dark:text-white'
                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            쿠폰함
          </button>
        )}
        {user?.user_type !== 'seller' && (
          <button
            onClick={() => handleTabClick('reviews')}
            className={`w-full border-b border-gray-200 px-4 py-2.5 text-left text-xs transition dark:border-gray-700 ${
              activeTab === 'reviews'
                ? 'border-l-2 border-l-gray-900 bg-gray-50 font-bold text-gray-900 dark:border-l-white dark:bg-gray-800 dark:text-white'
                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            리뷰 관리
          </button>
        )}
      </nav>
    </div>
  );
}
