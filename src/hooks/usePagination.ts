import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export const usePagination = (initialPageSize = 10, initialPage = 1, key?: string) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramName = key ? `${key}_page` : 'page';

  // Try to get page from URL, otherwise use initialPage
  const urlPage = parseInt(searchParams.get(paramName) || '0');
  const [currentPage, setCurrentPage] = useState(urlPage > 0 ? urlPage : initialPage);

  // Use key for localStorage persistence of pageSize if provided
  const storageKey = key ? `pageSize-${key}` : null;
  const savedPageSize = storageKey ? localStorage.getItem(storageKey) : null;
  const [pageSize, setPageSize] = useState(savedPageSize ? parseInt(savedPageSize) : initialPageSize);

  // Sync currentPage with URL
  useEffect(() => {
    const page = parseInt(searchParams.get(paramName) || '0');
    if (page > 0) {
      if (page !== currentPage) {
        setCurrentPage(page);
      }
    } else if (currentPage !== initialPage) {
      // If param is missing, and we are not on initial page, reset to initial
      setCurrentPage(initialPage);
    }
  }, [searchParams, paramName, initialPage]);

  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
    const newParams = new URLSearchParams(searchParams);
    if (page === initialPage) {
      newParams.delete(paramName);
    } else {
      newParams.set(paramName, page.toString());
    }
    setSearchParams(newParams);
  }, [searchParams, setSearchParams, paramName, initialPage]);

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
