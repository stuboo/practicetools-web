/**
 * SuggestedQueries component
 * Displays clickable suggested search queries
 */

import type { SuggestedQuery } from '../../../types/coverage';

interface SuggestedQueriesProps {
  /** Suggested queries to display */
  queries: SuggestedQuery[];
  /** Whether queries are loading */
  isLoading: boolean;
  /** Callback when a query is clicked */
  onQueryClick: (query: string) => void;
}

/**
 * Get icon for query category
 */
function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case 'medication':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      );
    case 'coverage':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case 'prior_auth':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    default:
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      );
  }
}

function LoadingState() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">Loading suggestions...</p>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-9 w-48 bg-gray-100 rounded-lg animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

export function SuggestedQueries({
  queries,
  isLoading,
  onQueryClick,
}: SuggestedQueriesProps) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (queries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Try searching for medication coverage information</p>
        <p className="text-sm text-gray-400 mt-2">
          Example: "Is Myrbetriq covered by Anthem in Wisconsin?"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Try one of these searches:
      </p>
      <div className="flex flex-wrap gap-2">
        {queries.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onQueryClick(suggestion.query)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg text-sm text-gray-700 transition-colors group"
            title={suggestion.description}
          >
            <span className="text-gray-400 group-hover:text-gray-600">
              <CategoryIcon category={suggestion.category} />
            </span>
            <span>{suggestion.query}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
