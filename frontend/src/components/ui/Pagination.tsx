import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import '@/styles/pages/explore.css';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

type PageItem = number | 'left-ellipsis' | 'right-ellipsis';

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (!totalPages || totalPages <= 1) return null;

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  const createPageList = (): PageItem[] => {
    const pages: PageItem[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i += 1) {
        pages.push(i);
      }
      return pages;
    }

    // Immer: 1, aktuelle Seite, letzte Seite + ggf. Nachbarn
    pages.push(1);

    const left = Math.max(currentPage - 1, 2);
    const right = Math.min(currentPage + 1, totalPages - 1);

    if (left > 2) pages.push('left-ellipsis');

    for (let i = left; i <= right; i += 1) {
      pages.push(i);
    }

    if (right < totalPages - 1) pages.push('right-ellipsis');

    pages.push(totalPages);

    return pages;
  };

  const pageList = createPageList();

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="pagination-arrow"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <FiChevronLeft />
      </button>

      {pageList.map((item) => {
        if (item === 'left-ellipsis' || item === 'right-ellipsis') {
          return (
            <span key={item} className="pagination-ellipsis">
              …
            </span>
          );
        }

        const page = item as number;
        const isActive = page === currentPage;

        return (
          <button
            key={page}
            type="button"
            className={`pagination-page ${
              isActive ? 'pagination-page--active' : ''
            }`}
            onClick={() => goToPage(page)}
            aria-current={isActive ? 'page' : undefined}
          >
            {page}
          </button>
        );
      })}

      <button
        type="button"
        className="pagination-arrow"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <FiChevronRight />
      </button>
    </nav>
  );
};

export default Pagination;