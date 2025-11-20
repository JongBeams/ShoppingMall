interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className="mt-8 flex items-center justify-center gap-1">
      {/* 이전 버튼 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrevious}
        className="h-8 w-8 border border-gray-300 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
      >
        ‹
      </button>

      {/* 페이지 번호 */}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`h-8 w-8 text-sm ${
            currentPage === page
              ? 'border border-gray-900 bg-gray-900 font-bold text-white dark:border-white dark:bg-white dark:text-gray-900'
              : 'border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800'
          }`}
        >
          {page}
        </button>
      ))}

      {/* 다음 버튼 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        className="h-8 w-8 border border-gray-300 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
      >
        ›
      </button>
    </div>
  );
}
