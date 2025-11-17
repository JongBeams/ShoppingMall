export default function Sales() {
  // 월별 매출 및 판매 건수 데이터 (최근 6개월)
  const monthlySales = [
    { month: '8월', amount: 1850000, count: 28 },
    { month: '9월', amount: 2100000, count: 32 },
    { month: '10월', amount: 1950000, count: 30 },
    { month: '11월', amount: 2300000, count: 35 },
    { month: '12월', amount: 2800000, count: 42 },
    { month: '1월', amount: 2450000, count: 37 },
  ];

  const maxAmount = Math.max(...monthlySales.map(m => m.amount));
  const maxCount = Math.max(...monthlySales.map(m => m.count));

  return (
    <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">판매 대시보드</h3>
        <div className="flex gap-2">
          <button className="border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
            필터
          </button>
          <button className="border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
            다운로드
          </button>
        </div>
      </div>

      {/* Monthly Sales Chart - Monitoring Dashboard Style */}
      <div className="mb-6 border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">월별 매출 추이</h4>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-600 ring-1 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-green-600 dark:bg-green-400"></span>
              Live
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>최근 6개월</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
        </div>

        {/* Chart with gradient line */}
        <div className="relative mb-4" style={{ height: '240px' }}>
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 600 240">
            <defs>
              <linearGradient id="salesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.2 }} />
                <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0 }} />
              </linearGradient>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#60a5fa' }} />
                <stop offset="50%" style={{ stopColor: '#3b82f6' }} />
                <stop offset="100%" style={{ stopColor: '#2563eb' }} />
              </linearGradient>
            </defs>
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={i}
                x1="0"
                y1={i * 60}
                x2="600"
                y2={i * 60}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.8"
              />
            ))}
            {/* Area under line */}
            <path
              d={`M ${monthlySales.map((data, i) => {
                const x = ((i + 1) / (monthlySales.length + 1)) * 600;
                const y = 240 - (data.amount / maxAmount) * 200;
                return i === 0 ? `${x},${y}` : `L ${x},${y}`;
              }).join(' ')} L ${((monthlySales.length) / (monthlySales.length + 1)) * 600},240 L ${(1 / (monthlySales.length + 1)) * 600},240 Z`}
              fill="url(#salesGradient)"
            />
            {/* Line */}
            <path
              d={`M ${monthlySales.map((data, i) => {
                const x = ((i + 1) / (monthlySales.length + 1)) * 600;
                const y = 240 - (data.amount / maxAmount) * 200;
                return i === 0 ? `${x},${y}` : `L ${x},${y}`;
              }).join(' ')}`}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Data points */}
            {monthlySales.map((data, i) => {
              const x = ((i + 1) / (monthlySales.length + 1)) * 600;
              const y = 240 - (data.amount / maxAmount) * 200;
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="5" fill="#ffffff" stroke="#3b82f6" strokeWidth="2.5" />
                  <circle cx={x} cy={y} r="3" fill="#3b82f6" />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Month labels */}
        <div className="mb-4 flex justify-between px-1">
          {monthlySales.map((data, i) => (
            <span key={i} className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {data.month}
            </span>
          ))}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
          <div className="rounded-lg bg-gray-50 p-3 ring-1 ring-gray-200 dark:bg-gray-800/50 dark:ring-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600 dark:text-gray-400">총 매출</p>
              <svg className="h-4 w-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
            </div>
            <p className="mt-1.5 text-lg font-bold text-gray-900 dark:text-white">
              ₩{(monthlySales.reduce((sum, m) => sum + m.amount, 0) / 1000000).toFixed(1)}M
            </p>
            <p className="mt-0.5 text-xs text-green-600 dark:text-green-400">+12.5%</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 ring-1 ring-gray-200 dark:bg-gray-800/50 dark:ring-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600 dark:text-gray-400">평균</p>
              <svg className="h-4 w-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
              </svg>
            </div>
            <p className="mt-1.5 text-lg font-bold text-gray-900 dark:text-white">
              ₩{((monthlySales.reduce((sum, m) => sum + m.amount, 0) / monthlySales.length) / 1000000).toFixed(1)}M
            </p>
            <p className="mt-0.5 text-xs text-gray-500">월 평균</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 ring-1 ring-gray-200 dark:bg-gray-800/50 dark:ring-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600 dark:text-gray-400">최고</p>
              <svg className="h-4 w-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
              </svg>
            </div>
            <p className="mt-1.5 text-lg font-bold text-gray-900 dark:text-white">
              ₩{(maxAmount / 1000000).toFixed(1)}M
            </p>
            <p className="mt-0.5 text-xs text-gray-500">12월</p>
          </div>
        </div>
      </div>

      {/* Sales Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">총 판매액</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">₩2,450,000</p>
        </div>
        <div className="border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">판매 건수</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">37건</p>
        </div>
        <div className="border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">평균 판매가</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">₩66,216</p>
        </div>
        <div className="border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">반품/교환</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">2건</p>
        </div>
      </div>

      {/* Sales Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="pb-3 text-left text-sm font-semibold text-gray-900 dark:text-white">상품명</th>
              <th className="pb-3 text-left text-sm font-semibold text-gray-900 dark:text-white">주문번호</th>
              <th className="pb-3 text-left text-sm font-semibold text-gray-900 dark:text-white">구매자</th>
              <th className="pb-3 text-left text-sm font-semibold text-gray-900 dark:text-white">판매일</th>
              <th className="pb-3 text-left text-sm font-semibold text-gray-900 dark:text-white">수량</th>
              <th className="pb-3 text-right text-sm font-semibold text-gray-900 dark:text-white">판매액</th>
              <th className="pb-3 text-center text-sm font-semibold text-gray-900 dark:text-white">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                    <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">프리미엄 유기농 토마토 1kg</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SKU: TOM-001</p>
                  </div>
                </div>
              </td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">ORD-2025-001234</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">김**</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">2025.01.12</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">3</td>
              <td className="py-4 text-right text-sm font-medium text-gray-900 dark:text-white">₩45,000</td>
              <td className="py-4 text-center">
                <span className="inline-block border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  배송완료
                </span>
              </td>
            </tr>
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                    <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">GAP 인증 유기농 상추 500g</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SKU: LET-002</p>
                  </div>
                </div>
              </td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">ORD-2025-001198</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">이**</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">2025.01.11</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">5</td>
              <td className="py-4 text-right text-sm font-medium text-gray-900 dark:text-white">₩62,500</td>
              <td className="py-4 text-center">
                <span className="inline-block border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  배송중
                </span>
              </td>
            </tr>
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                    <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">무농약 친환경 딸기 2kg</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SKU: STR-003</p>
                  </div>
                </div>
              </td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">ORD-2025-001165</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">박**</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">2025.01.10</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">2</td>
              <td className="py-4 text-right text-sm font-medium text-gray-900 dark:text-white">₩89,600</td>
              <td className="py-4 text-center">
                <span className="inline-block border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  배송완료
                </span>
              </td>
            </tr>
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                    <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">국내산 유기농 쌀 10kg</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SKU: RIC-004</p>
                  </div>
                </div>
              </td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">ORD-2025-001132</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">최**</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">2025.01.09</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">1</td>
              <td className="py-4 text-right text-sm font-medium text-gray-900 dark:text-white">₩58,000</td>
              <td className="py-4 text-center">
                <span className="inline-block border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  배송준비
                </span>
              </td>
            </tr>
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                    <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">제철 유기농 배추 1통</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SKU: CAB-005</p>
                  </div>
                </div>
              </td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">ORD-2025-001089</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">정**</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">2025.01.08</td>
              <td className="py-4 text-sm text-gray-600 dark:text-gray-400">4</td>
              <td className="py-4 text-right text-sm font-medium text-gray-900 dark:text-white">₩52,000</td>
              <td className="py-4 text-center">
                <span className="inline-block border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  배송완료
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          총 <span className="font-medium text-gray-900 dark:text-white">37</span>건 중 1-5 표시
        </p>
        <div className="flex gap-2">
          <button className="border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" disabled>
            이전
          </button>
          <button className="border border-gray-300 bg-gray-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-gray-900">
            1
          </button>
          <button className="border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
            2
          </button>
          <button className="border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
            3
          </button>
          <button className="border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
