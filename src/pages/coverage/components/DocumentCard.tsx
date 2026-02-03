/**
 * DocumentCard component
 * Displays a coverage document with status, metadata, and action buttons
 */

import type { CoverageDocument } from '../../../types/coverage';
import { DocumentStatusBadge } from './DocumentStatusBadge';

interface DocumentCardProps {
  document: CoverageDocument;
  /** Insurance plan name (resolved from ID) */
  insurancePlanName?: string;
  /** Callback for view action */
  onView?: (document: CoverageDocument) => void;
  /** Callback for delete action */
  onDelete?: (document: CoverageDocument) => void;
  /** Callback for retry action (for failed documents) */
  onRetry?: (document: CoverageDocument) => void;
  /** Whether actions are disabled (e.g., during loading) */
  actionsDisabled?: boolean;
}

export function DocumentCard({
  document,
  insurancePlanName,
  onView,
  onDelete,
  onRetry,
  actionsDisabled = false,
}: DocumentCardProps) {
  const canRetry = document.status === 'failed' && document.source_url;

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      {/* Header: filename and status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate" title={document.filename}>
            {document.filename}
          </h3>
          {document.source_url && (
            <p className="text-xs text-gray-500 truncate mt-0.5" title={document.source_url}>
              Source: {document.source_url}
            </p>
          )}
        </div>
        <DocumentStatusBadge status={document.status} />
      </div>

      {/* Error message for failed documents */}
      {document.status === 'failed' && document.error_message && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {document.error_message}
        </div>
      )}

      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
        <div>
          <span className="text-gray-500">Uploaded:</span>{' '}
          <span className="text-gray-900">{formatDate(document.created_at)}</span>
        </div>
        <div>
          <span className="text-gray-500">Year:</span>{' '}
          <span className="text-gray-900">{document.year}</span>
        </div>
        {insurancePlanName && (
          <div className="col-span-2">
            <span className="text-gray-500">Plan:</span>{' '}
            <span className="text-gray-900">{insurancePlanName}</span>
          </div>
        )}
        {document.states.length > 0 && (
          <div className="col-span-2">
            <span className="text-gray-500">States:</span>{' '}
            <span className="text-gray-900">{document.states.join(', ')}</span>
          </div>
        )}
        {document.page_count != null && (
          <div>
            <span className="text-gray-500">Pages:</span>{' '}
            <span className="text-gray-900">{document.page_count}</span>
          </div>
        )}
        {document.retry_count > 0 && (
          <div>
            <span className="text-gray-500">Retries:</span>{' '}
            <span className="text-gray-900">{document.retry_count}</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        {onView && document.status === 'ready' && (
          <button
            type="button"
            onClick={() => onView(document)}
            disabled={actionsDisabled}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View
          </button>
        )}

        {onRetry && canRetry && (
          <button
            type="button"
            onClick={() => onRetry(document)}
            disabled={actionsDisabled}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(document)}
            disabled={actionsDisabled}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
