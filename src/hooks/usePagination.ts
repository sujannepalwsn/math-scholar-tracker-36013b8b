import { useState, useCallback } from 'react';

export const usePagination = (initialPageSize = 10, initialPage = 1) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const getRange = useCallback(() => {
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;
    return { from, to };
  }, [currentPage, pageSize]);

  return {
    currentPage,
    pageSize,
    setPage,
    setPageSize,
    getRange
  };
};
