import { Product } from '@/app/types';

interface WishlistProps {
  dummyWishList: Product[];
}

export default function Wishlist({ dummyWishList }: WishlistProps) {
  return (
    <div className="border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      {/* 헤더 */}
      <div className="mb-4 border-b border-gray-200 pb-3 dark:border-gray-700">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">찜한 상품</h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          총 {dummyWishList.length}개의 상품
        </p>
      </div>

      {dummyWishList.length === 0 ? (
        <div className="p-8 text-center">
          <svg className="mx-auto mb-3 h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <p className="text-xs text-gray-500 dark:text-gray-400">찜한 상품이 없습니다</p>
          <p className="mt-1 text-xs text-gray-400">마음에 드는 상품을 찜해보세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dummyWishList.map((product) => (
            <div key={product.id} className="flex gap-3 border border-gray-200 p-3 transition hover:shadow-sm dark:border-gray-700">
              {/* Product Image */}
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
              </div>

              {/* Product Info */}
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <div className="mb-1 flex items-start justify-between">
                    <h4 className="text-xs font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </h4>
                    <button
                      className="ml-2 text-gray-400 transition hover:text-red-500"
                      onClick={() => {
                        // TODO: Implement remove from wishlist
                        console.log('Remove from wishlist:', product.id);
                      }}
                      title="찜 해제"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                      </svg>
                    </button>
                  </div>
                  <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                    {product.description}
                  </p>
                  <span className="inline-block bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {product.category}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">
                    ₩{product.price.toLocaleString()}
                  </p>
                  <button
                    className="border border-gray-900 bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                    onClick={() => {
                      // TODO: Implement add to cart
                      console.log('Add to cart:', product.id);
                    }}
                  >
                    장바구니 담기
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
