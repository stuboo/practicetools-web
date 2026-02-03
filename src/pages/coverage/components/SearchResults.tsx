/**
 * SearchResults component
 * Container for displaying search results with loading and empty states
 */

import type { SearchResponse } from '../../../types/coverage';
import { SearchResultCard } from './SearchResultCard';

interface SearchResultsProps {
  /** Search response data */
  data: SearchResponse | undefined;
  /** Whether results are loading */
  isLoading: boolean;
  /** Whether there was an error */
  isError: boolean;
  /** Error message if any */
  error: Error | null;
  /** The search query (for highlighting) */
  query: string;
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="h-5 w-20 bg-gray-200 rounded" />
            <div className="h-4 w-16 bg-gray-100 rounded" />
          </div>
          <div className="space-y-2 mb-3">
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-5/6" />
            <div className="h-4 bg-gray-100 rounded w-4/6" />
          </div>
          <div className="pt-2 border-t border-gray-100">
            <div className="h-3 bg-gray-100 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <svg
          className="h-5 w-5 text-red-500 mt-0.5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div>
          <h3 className="text-sm font-medium text-red-800">Search failed</h3>
          <p className="text-sm text-red-700 mt-1">
            {error.message || 'An unexpected error occurred. Please try again.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="text-center py-12">
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h3 className="mt-4 text-sm font-medium text-gray-900">No results found</h3>
      <p className="mt-1 text-sm text-gray-500">
        No coverage documents matched your search for "{query}"
      </p>
      <p className="mt-3 text-xs text-gray-400">
        Try using different keywords or broadening your search
      </p>
    </div>
  );
}

export function SearchResults({
  data,
  isLoading,
  isError,
  error,
  query,
}: SearchResultsProps) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (isError && error) {
    return <ErrorState error={error} />;
  }

  if (!data || data.results.length === 0) {
    return <EmptyState query={query} />;
  }

  return (
    <div className="space-y-4">
      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Found {data.total} result{data.total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Results list */}
      <div className="space-y-3">
        {data.results.map((result) => (
          <SearchResultCard
            key={result.chunk_id}
            result={result}
            query={query}
          />
        ))}
      </div>

      {/* Show if there are more results */}
      {data.results.length < data.total && (
        <p className="text-center text-sm text-gray-500 pt-2">
          Showing {data.results.length} of {data.total} results
        </p>
      )}
    </div>
  );
}
