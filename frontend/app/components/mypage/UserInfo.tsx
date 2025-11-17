interface UserInfoProps {
  user: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function UserInfo({ user, activeTab, setActiveTab }: UserInfoProps) {
  return (
    <div className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* User Info */}
      <div className="border-b border-gray-100 p-6 dark:border-gray-800">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <svg className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">{user.full_name}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
        </div>
        <button className="w-full border border-gray-200 bg-white py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
          일반 회원
        </button>
      </div>

      {/* Menu */}
      <nav>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex w-full items-center gap-3 border-b border-gray-100 px-5 py-3.5 text-sm transition dark:border-gray-800 ${
            activeTab === 'profile'
              ? 'font-medium text-gray-900 dark:text-white'
              : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
          }`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          내 정보
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex w-full items-center gap-3 border-b border-gray-100 px-5 py-3.5 text-sm transition dark:border-gray-800 ${
            activeTab === 'orders'
              ? 'font-medium text-gray-900 dark:text-white'
              : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
          }`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          {user?.user_type === 'seller' ? '주문 요청 목록' : '주문 내역'}
        </button>
        {user?.user_type === 'seller' && (
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex w-full items-center gap-3 border-b border-gray-100 px-5 py-3.5 text-sm transition dark:border-gray-800 ${
              activeTab === 'sales'
                ? 'font-medium text-gray-900 dark:text-white'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
            </svg>
            판매 내역
          </button>
        )}
        {user?.user_type !== 'seller' && (
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`flex w-full items-center gap-3 border-b border-gray-100 px-5 py-3.5 text-sm transition dark:border-gray-800 ${
              activeTab === 'wishlist'
                ? 'font-medium text-gray-900 dark:text-white'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            찜한 상품
          </button>
        )}
        {user?.user_type !== 'seller' && (
          <button
            onClick={() => setActiveTab('inquiry')}
            className={`flex w-full items-center gap-3 border-b border-gray-100 px-5 py-3.5 text-sm transition dark:border-gray-800 ${
              activeTab === 'inquiry'
                ? 'font-medium text-gray-900 dark:text-white'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            1:1 문의
          </button>
        )}
      </nav>
    </div>
  );
}
