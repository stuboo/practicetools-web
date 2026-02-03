/**
 * useSuggestedQueries hook
 * React Query hook for fetching suggested search queries
 */

import { useQuery } from '@tanstack/react-query';
import { getSuggestedQueries } from '../../../api/coverage';
import type { SuggestedQueriesParams, SuggestedQueriesResponse } from '../../../types/coverage';

interface UseSuggestedQueriesResult {
  data: SuggestedQueriesResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

/**
 * Hook for fetching suggested search queries
 *
 * @param params - Optional filter params for contextual suggestions
 */
export function useSuggestedQueries(
  params?: SuggestedQueriesParams
): UseSuggestedQueriesResult {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['suggested-queries', params],
    queryFn: () => getSuggestedQueries(params),
    staleTime: 5 * 60_000, // Cache for 5 minutes
    cacheTime: 10 * 60_000, // Keep in cache for 10 minutes
  });

  return {
    data,
    isLoading,
    isError,
    error: error as Error | null,
  };
}
