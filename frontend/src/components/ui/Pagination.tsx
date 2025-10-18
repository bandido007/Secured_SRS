import type { Pagination as PaginationMeta } from '../../types';
import { Button } from './Button';

interface PaginationProps {
  page?: PaginationMeta;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function Pagination({ page, onPageChange, isLoading }: PaginationProps) {
  if (!page) {
    return null;
  }

  const { currentPageNumber, numberOfPages, hasPreviousPage, hasNextPage } = page;

  const handlePrev = () => {
    if (!hasPreviousPage || isLoading) {
      return;
    }
    onPageChange(Math.max(1, currentPageNumber - 1));
  };

  const handleNext = () => {
    if (!hasNextPage || isLoading) {
      return;
    }
    onPageChange(Math.min(numberOfPages, currentPageNumber + 1));
  };

  return (
    <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-sm text-gray-600">
      <span>
        Page {currentPageNumber} of {numberOfPages}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handlePrev} disabled={!hasPreviousPage || isLoading}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={handleNext} disabled={!hasNextPage || isLoading}>
          Next
        </Button>
      </div>
    </div>
  );
}
