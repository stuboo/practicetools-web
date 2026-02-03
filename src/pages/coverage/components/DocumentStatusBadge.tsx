/**
 * DocumentStatusBadge component
 * Displays document processing status with appropriate styling
 */

import type { DocumentStatus } from '../../../types/coverage';

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  /** Show compact version without text */
  compact?: boolean;
}

const statusConfig: Record<DocumentStatus, { label: string; className: string; icon: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', // clock
  },
  processing: {
    label: 'Processing',
    className: 'bg-blue-100 text-blue-700 border-blue-300',
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', // refresh
  },
  ready: {
    label: 'Ready',
    className: 'bg-green-100 text-green-700 border-green-300',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', // check-circle
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-100 text-red-700 border-red-300',
    icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', // x-circle
  },
};

export function DocumentStatusBadge({ status, compact = false }: DocumentStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`
        inline-flex items-center gap-1 border rounded-full font-medium
        ${compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'}
        ${config.className}
      `}
      title={config.label}
    >
      <svg
        className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} ${status === 'processing' ? 'animate-spin' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
      </svg>
      {!compact && <span>{config.label}</span>}
    </span>
  );
}
