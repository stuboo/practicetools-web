/**
 * useCoverageSearch hook
 * React Query hook for coverage search with debounce support
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { search } from '../../../api/coverage';
import type { SearchQuery, SearchResponse } from '../../../types/coverage';

interface UseCoverageSearchOptions {
  /** Debounce delay already handled by caller - this hook executes immediately */
  enabled?: boolean;
}

interface UseCoverageSearchResult {
  data: SearchResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isFetching: boolean;
}

/**
 * Hook for performing coverage search with React Query
 *
 * @param query - Search query text (empty string disables query)
 * @param filters - Optional search filters
 * @param options - Query options
 */
export function useCoverageSearch(
  query: string,
  filters?: Omit<SearchQuery, 'query'>,
  options?: UseCoverageSearchOptions
): UseCoverageSearchResult {
  const { enabled = true } = options ?? {};

  // Build the complete search query
  const searchQuery = useMemo<SearchQuery | null>(() => {
    if (!query.trim()) {
      return null;
    }
    return {
      query: query.trim(),
      ...filters,
    };
  }, [query, filters]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['coverage-search', searchQuery],
    queryFn: () => search(searchQuery!),
    enabled: enabled && !!searchQuery,
    staleTime: 30_000, // Cache results for 30 seconds
    cacheTime: 5 * 60_000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't auto-refresh when user returns to tab
    refetchOnMount: false, // Don't auto-refresh on component mount (use cache)
  });

  return {
    data,
    isLoading: isLoading && !!searchQuery,
    isError,
    error: error as Error | null,
    isFetching,
  };
}
