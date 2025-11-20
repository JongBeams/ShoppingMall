interface ProfileProps {
  user: any;
  vendor: any;
}

export default function Profile({ user, vendor }: ProfileProps) {
  return (
    <>
      {/* Profile Info */}
      <div className="mb-4 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 border-b border-gray-200 pb-3 dark:border-gray-700">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">회원 정보</h2>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">이름</span>
            <span className="text-xs text-gray-900 dark:text-white">{user.full_name}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">이메일</span>
            <span className="text-xs text-gray-900 dark:text-white">{user.email}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">전화번호</span>
            <span className="text-xs text-gray-900 dark:text-white">{user.phone || '미등록'}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">회원 유형</span>
            <span className="text-xs text-gray-900 dark:text-white">
              {user.user_type === 'seller' ? '판매자' : '일반 회원'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">추천 ID</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                {user.referral_code || `REF${Math.random().toString(36).substr(2, 8).toUpperCase()}`}
              </span>
              <button
                onClick={() => {
                  const code = user.referral_code || `REF${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
                  navigator.clipboard.writeText(code);
                  alert('추천 ID가 복사되었습니다!');
                }}
                className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                복사
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Info (if seller) */}
      {vendor && (
        <div className="mb-4 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 border-b border-gray-200 pb-3 dark:border-gray-700">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">판매자 정보</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">스토어 이름</span>
              <span className="text-xs text-gray-900 dark:text-white">{vendor.store_name}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">사업자명</span>
              <span className="text-xs text-gray-900 dark:text-white">{vendor.business_name}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">사업자등록번호</span>
              <span className="text-xs text-gray-900 dark:text-white">{vendor.business_number}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">사업장 주소</span>
              <span className="text-xs text-gray-900 dark:text-white">{vendor.business_address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">승인 상태</span>
              <span className={`text-xs font-medium ${vendor.is_verified ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {vendor.is_verified ? '승인 완료' : '승인 대기'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payment & Delivery Management */}
      {user.user_type !== 'seller' && (
        <>
          {/* Payment Methods */}
          <div className="mb-4 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 border-b border-gray-200 pb-3 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">결제 수단</h2>
                <button className="px-3 py-1.5 text-xs text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  + 추가
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between border border-gray-200 p-3 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">신한카드</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">**** **** **** 1234</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    수정
                  </button>
                  <button className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                    삭제
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">등록된 카드가 없습니다. 결제 수단을 추가해주세요.</p>
            </div>
          </div>

          {/* Refund Account */}
          <div className="mb-4 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 border-b border-gray-200 pb-3 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">환불 계좌</h2>
                <button className="px-3 py-1.5 text-xs text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  + 추가
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between border border-gray-200 p-3 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                  </svg>
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">신한은행</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">110-123-456789 (홍길동)</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    수정
                  </button>
                  <button className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                    삭제
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Addresses */}
          <div className="mb-4 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 border-b border-gray-200 pb-3 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">배송지 관리</h2>
                <button className="px-3 py-1.5 text-xs text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  + 추가
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <div className="border border-gray-200 p-3 dark:border-gray-700">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-900 dark:text-white">자택</span>
                    <span className="bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                      기본 배송지
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                      수정
                    </button>
                    <button className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                      삭제
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300">서울시 강남구 테헤란로 123</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">이은지 · 010-1234-5678</p>
              </div>
              <div className="border border-gray-200 p-3 dark:border-gray-700">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-900 dark:text-white">회사</span>
                  <div className="flex gap-2">
                    <button className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                      기본 배송지로 설정
                    </button>
                    <button className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                      수정
                    </button>
                    <button className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                      삭제
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300">서울시 서초구 서초대로 78길 22</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">이은지 · 010-1234-5678</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Quick Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-blue-100 dark:bg-blue-900">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">0</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">주문</p>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-purple-100 dark:bg-purple-900">
              <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">0</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">찜한 상품</p>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-green-100 dark:bg-green-900">
              <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">0</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">포인트</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
