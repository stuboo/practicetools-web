/**
 * useMedications hook
 * React Query hook for fetching medications list
 */

import { useQuery } from '@tanstack/react-query';
import { listMedications } from '../../../api/coverage';
import type { MedicationList, MedicationsParams } from '../../../types/coverage';

interface UseMedicationsResult {
  data: MedicationList | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

/**
 * Hook for fetching medications with optional filtering
 *
 * @param params - Optional filter parameters (category, search query)
 */
export function useMedications(params?: MedicationsParams): UseMedicationsResult {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['medications', params],
    queryFn: () => listMedications(params),
    staleTime: 5 * 60_000, // Cache for 5 minutes (medications don't change often)
    cacheTime: 10 * 60_000, // Keep in cache for 10 minutes
  });

  return {
    data,
    isLoading,
    isError,
    error: error as Error | null,
  };
}
