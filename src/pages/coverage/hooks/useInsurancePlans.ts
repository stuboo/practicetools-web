/**
 * useInsurancePlans hook
 * React Query hook for fetching insurance plans list
 */

import { useQuery } from '@tanstack/react-query';
import { listInsurancePlans } from '../../../api/coverage';
import type { InsurancePlanList, InsurancePlansParams } from '../../../types/coverage';

interface UseInsurancePlansResult {
  data: InsurancePlanList | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

/**
 * Hook for fetching insurance plans with optional filtering
 *
 * @param params - Optional filter parameters (state, search query)
 */
export function useInsurancePlans(params?: InsurancePlansParams): UseInsurancePlansResult {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['insurance-plans', params],
    queryFn: () => listInsurancePlans(params),
    staleTime: 5 * 60_000, // Cache for 5 minutes (plans don't change often)
    cacheTime: 10 * 60_000, // Keep in cache for 10 minutes
  });

  return {
    data,
    isLoading,
    isError,
    error: error as Error | null,
  };
}
