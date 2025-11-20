import Link from 'next/link';
import Image from 'next/image';

export default function RecentProducts() {
  const recentProducts = [
    {
      id: '1',
      name: 'AirPods Pro',
      brand: 'Apple',
      price: 359000,
      image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&q=80',
      viewedAt: '2025.01.17 14:30',
      category: '전자제품'
    },
    {
      id: '2',
      name: 'Smart Watch Ultra',
      brand: 'Apple',
      price: 1099000,
      image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&q=80',
      viewedAt: '2025.01.17 12:15',
      category: '전자제품'
    },
    {
      id: '3',
      name: 'Leather Crossbag',
      brand: 'Minimal',
      price: 189000,
      image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80',
      viewedAt: '2025.01.16 18:45',
      category: '패션'
    },
    {
      id: '4',
      name: 'Premium Wallet',
      brand: 'Bellroy',
      price: 125000,
      image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&q=80',
      viewedAt: '2025.01.16 15:20',
      category: '패션'
    },
    {
      id: '5',
      name: 'Wireless Keyboard',
      brand: 'Logitech',
      price: 89000,
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80',
      viewedAt: '2025.01.15 10:30',
      category: '전자제품'
    },
  ];

  return (
    <div className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="border-b border-gray-100 p-4 dark:border-gray-800">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">최근 본 상품</h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          최근 30일 이내에 본 상품 목록입니다
        </p>
      </div>

      <div className="p-4">
        {recentProducts.length > 0 ? (
          <div className="space-y-3">
            {recentProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group flex gap-3 border-b border-gray-100 pb-3 last:border-b-0 dark:border-gray-800"
              >
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden border border-gray-200 dark:border-gray-700">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition group-hover:scale-105"
                    sizes="64px"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                      {product.brand} · {product.category}
                    </p>
                    <h3 className="mb-1 text-xs font-medium text-gray-900 transition group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                      {product.name}
                    </h3>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      {product.price.toLocaleString()}원
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {product.viewedAt}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    // TODO: 장바구니 추가 기능
                    alert('장바구니에 추가되었습니다');
                  }}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center self-start border border-gray-300 text-gray-600 transition hover:border-gray-900 hover:text-gray-900 dark:border-gray-600 dark:text-gray-400 dark:hover:border-white dark:hover:text-white"
                  title="장바구니에 추가"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </button>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <svg className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
              최근 본 상품이 없습니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
