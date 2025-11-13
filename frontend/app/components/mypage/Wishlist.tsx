import { Product } from '@/app/types';

interface WishlistProps {
  dummyWishList: Product[];
}

export default function Wishlist({ dummyWishList }: WishlistProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">찜한 상품</h3>
      {dummyWishList.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">찜한 상품이 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {dummyWishList.map((product) => (
            <div key={product.id} className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg dark:border-gray-700 dark:bg-gray-800">
              {/* Product Image */}
              <div className="aspect-square w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                  <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
              </div>

              {/* Remove from Wishlist Button */}
              <button
                className="absolute right-2 top-2 rounded-full bg-white p-2 shadow-md transition-colors hover:bg-red-50 dark:bg-gray-700 dark:hover:bg-red-900/20"
                onClick={() => {
                  // TODO: Implement remove from wishlist
                  console.log('Remove from wishlist:', product.id);
                }}
              >
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              </button>

              {/* Product Info */}
              <div className="p-4">
                <h4 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
                  {product.name}
                </h4>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  {product.description}
                </p>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    ₩{product.price.toLocaleString()}
                  </p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {product.category}
                  </span>
                </div>

                {/* Add to Cart Button */}
                <button
                  className="w-full rounded-md bg-gray-900 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                  onClick={() => {
                    // TODO: Implement add to cart
                    console.log('Add to cart:', product.id);
                  }}
                >
                  장바구니 담기
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
