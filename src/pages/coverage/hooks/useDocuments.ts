/**
 * useDocuments hook
 * React Query hook for fetching and managing coverage documents
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listDocuments,
  deleteDocument,
  retryDocument,
} from '../../../api/coverage';
import type { CoverageDocumentList, DocumentListParams, CoverageDocument } from '../../../types/coverage';

interface UseDocumentsOptions {
  /** Poll interval in ms for refetching (0 to disable) */
  pollInterval?: number;
}

interface UseDocumentsResult {
  data: CoverageDocumentList | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isFetching: boolean;
  /** Refetch the documents list */
  refetch: () => void;
  /** Delete a document */
  deleteDoc: (documentId: string) => Promise<void>;
  /** Retry processing a failed document */
  retryDoc: (documentId: string) => Promise<void>;
  /** Whether a delete or retry is in progress */
  isMutating: boolean;
}

/**
 * Hook for fetching and managing coverage documents
 *
 * @param params - Optional filter parameters
 * @param options - Hook options including poll interval
 */
export function useDocuments(
  params?: DocumentListParams,
  options?: UseDocumentsOptions
): UseDocumentsResult {
  const queryClient = useQueryClient();
  const { pollInterval = 0 } = options ?? {};

  const queryKey = ['documents', params];

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey,
    queryFn: () => listDocuments(params),
    staleTime: 10_000, // Cache for 10 seconds
    cacheTime: 5 * 60_000, // Keep in cache for 5 minutes
    refetchInterval: pollInterval > 0 ? pollInterval : false,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  // Retry mutation
  const retryMutation = useMutation({
    mutationFn: retryDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const deleteDoc = async (documentId: string) => {
    await deleteMutation.mutateAsync(documentId);
  };

  const retryDoc = async (documentId: string) => {
    await retryMutation.mutateAsync(documentId);
  };

  return {
    data,
    isLoading,
    isError,
    error: error as Error | null,
    isFetching,
    refetch,
    deleteDoc,
    retryDoc,
    isMutating: deleteMutation.isLoading || retryMutation.isLoading,
  };
}

/**
 * Hook for getting a single document by ID
 */
export function useDocument(documentId: string | undefined) {
  return useQuery({
    queryKey: ['document', documentId],
    queryFn: async () => {
      if (!documentId) throw new Error('Document ID required');
      const response = await listDocuments();
      return response.documents.find((d: CoverageDocument) => d.id === documentId);
    },
    enabled: !!documentId,
    staleTime: 10_000,
  });
}
