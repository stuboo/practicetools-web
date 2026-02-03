/**
 * useDocumentPolling hook
 * Polls for document status updates when there are processing documents
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { CoverageDocumentList, DocumentStatus } from '../../../types/coverage';

interface UseDocumentPollingOptions {
  /** Polling interval in ms (default: 3000) */
  interval?: number;
  /** Statuses to poll for (default: ['pending', 'processing']) */
  pollStatuses?: DocumentStatus[];
}

/**
 * Hook that automatically polls for document updates when processing documents exist
 *
 * @param documents - Current document list
 * @param options - Polling configuration
 */
export function useDocumentPolling(
  documents: CoverageDocumentList | undefined,
  options?: UseDocumentPollingOptions
): void {
  const queryClient = useQueryClient();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { interval = 3000, pollStatuses = ['pending', 'processing'] } = options ?? {};

  useEffect(() => {
    // Check if we have any documents that need polling
    const needsPolling = documents?.documents.some((doc) =>
      pollStatuses.includes(doc.status)
    );

    if (needsPolling) {
      // Start polling
      intervalRef.current = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['documents'] });
      }, interval);
    } else {
      // Stop polling
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [documents, interval, pollStatuses, queryClient]);
}
