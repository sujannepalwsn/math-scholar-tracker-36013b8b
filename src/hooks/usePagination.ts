import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export const usePagination = (initialPageSize = 10, initialPage = 1, key?: string) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Try to get page from URL, otherwise use initialPage
  const urlPage = parseInt(searchParams.get('page') || '0');
  const [currentPage, setCurrentPage] = useState(urlPage > 0 ? urlPage : initialPage);

  // Use key for localStorage persistence of pageSize if provided
  const storageKey = key ? `pageSize-${key}` : null;
  const savedPageSize = storageKey ? localStorage.getItem(storageKey) : null;
  const [pageSize, setPageSize] = useState(savedPageSize ? parseInt(savedPageSize) : initialPageSize);

  // Sync currentPage with URL
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '0');
    if (page > 0 && page !== currentPage) {
      setCurrentPage(page);
    }
  }, [searchParams]);

  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
    const newParams = new URLSearchParams(searchParams);
    if (page === 1) {
      newParams.delete('page');
    } else {
      newParams.set('page', page.toString());
    }
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const updatePageSize = useCallback((size: number) => {
    setPageSize(size);
    if (storageKey) {
      localStorage.setItem(storageKey, size.toString());
    }
    // Reset to page 1 when size changes
    setPage(1);
  }, [storageKey, setPage]);

  const getRange = useCallback(() => {
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;
    return { from, to };
  }, [currentPage, pageSize]);

  return {
    currentPage,
    pageSize,
    setPage,
    setPageSize: updatePageSize,
    getRange
  };
};
