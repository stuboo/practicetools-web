/**
 * SearchResults component
 * Container for displaying search results with loading and empty states
 */

import { useState } from 'react';
import type { SearchResponse } from '../../../types/coverage';
import { CoverageTable } from './CoverageTable';
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
  const [showSourceDocuments, setShowSourceDocuments] = useState(false);

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
      {/* AI Answer Card */}
      {data.answer && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-semibold text-blue-900">AI Summary</h3>
                {data.detected_medication && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {data.detected_medication}
                  </span>
                )}
                {data.detected_category && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                    {data.detected_category}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {data.answer}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Coverage Comparison Table */}
      {data.coverage_table && (
        <CoverageTable table={data.coverage_table} />
      )}

      {/* Toggle for source documents */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowSourceDocuments(!showSourceDocuments)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
        >
          {showSourceDocuments ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Hide source documents ({data.total})
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              View source documents ({data.total})
            </>
          )}
        </button>
      </div>

      {/* Results list - only shown when toggled */}
      {showSourceDocuments && (
        <>
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
        </>
      )}
    </div>
  );
}
