/**
 * usePathway hooks
 * React Query hooks for care pathway CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  savePathway,
  getPathway,
  updatePathway,
  type SavePathwayResponse,
} from '../../../api/carePathway';
import type { Pathway } from '../types';

const CREATOR_TOKEN_PREFIX = 'carePathway_creatorToken_';

function getStoredCreatorToken(key: string): string | null {
  return localStorage.getItem(`${CREATOR_TOKEN_PREFIX}${key}`);
}

function storeCreatorToken(key: string, token: string): void {
  localStorage.setItem(`${CREATOR_TOKEN_PREFIX}${key}`, token);
}

/**
 * Fetch a pathway by its anonymous key.
 */
export function useGetPathway(key: string | undefined) {
  return useQuery({
    queryKey: ['carePathway', key],
    queryFn: () => {
      if (!key) throw new Error('Pathway key is required');
      return getPathway(key);
    },
    enabled: !!key,
    staleTime: 30_000,
    cacheTime: 5 * 60_000,
  });
}

/**
 * Save a new pathway. Stores creatorToken in localStorage on success.
 */
export function useSavePathway() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Pick<Pathway, 'conditionId' | 'steps' | 'exclusions'>) =>
      savePathway(data),
    onSuccess: (response: SavePathwayResponse) => {
      storeCreatorToken(response.key, response.creatorToken);
      queryClient.invalidateQueries({ queryKey: ['carePathway'] });
    },
  });
}

/**
 * Update an existing pathway. Reads creatorToken from localStorage.
 */
export function useUpdatePathway() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      key,
      data,
    }: {
      key: string;
      data: Pick<Pathway, 'conditionId' | 'steps' | 'exclusions'>;
    }) => {
      const creatorToken = getStoredCreatorToken(key);
      if (!creatorToken) {
        throw new Error('No creator token found — you may not have permission to edit this pathway.');
      }
      return updatePathway(key, data, creatorToken);
    },
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['carePathway', variables.key] });
    },
  });
}

export { getStoredCreatorToken };
