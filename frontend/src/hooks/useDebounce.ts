import { useEffect, useState } from 'react';

/**
 * Custom hook untuk debounce value
 * Berguna untuk mengurangi API calls saat user mengetik di search input
 * 
 * @param value - Value yang akan di-debounce
 * @param delay - Delay dalam milliseconds (default: 300ms)
 * @returns Debounced value
 * 
 * @example
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedSearch = useDebounce(searchQuery, 300);
 * 
 * useEffect(() => {
 *   // API call hanya akan trigger setelah user berhenti mengetik selama 300ms
 *   fetchUsers(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set timeout untuk update debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup timeout jika value berubah sebelum delay selesai
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

