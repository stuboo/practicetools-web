/**
 * SearchResultCard component
 * Displays a single search result with text snippet, score, and document metadata
 */

import type { SearchResultItem } from '../../../types/coverage';

interface SearchResultCardProps {
  result: SearchResultItem;
  /** Search query for highlighting (optional) */
  query?: string;
}

/**
 * Highlight matching text in the result
 */
function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) {
    return text;
  }

  // Split query into words for highlighting
  const words = query.trim().split(/\s+/).filter(w => w.length > 2);
  if (words.length === 0) {
    return text;
  }

  // Create regex pattern for all words (case insensitive)
  const pattern = new RegExp(`(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');

  const parts = text.split(pattern);

  return parts.map((part, index) => {
    if (words.some(word => part.toLowerCase() === word.toLowerCase())) {
      return (
        <mark key={index} className="bg-yellow-200 text-gray-900 rounded px-0.5">
          {part}
        </mark>
      );
    }
    return part;
  });
}

/**
 * Format score as percentage with color coding
 */
function ScoreBadge({ score }: { score: number }) {
  const percentage = Math.round(score * 100);

  // Color based on score
  let colorClasses = 'bg-gray-100 text-gray-700';
  if (percentage >= 80) {
    colorClasses = 'bg-green-100 text-green-800';
  } else if (percentage >= 60) {
    colorClasses = 'bg-blue-100 text-blue-800';
  } else if (percentage >= 40) {
    colorClasses = 'bg-yellow-100 text-yellow-800';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClasses}`}>
      {percentage}% match
    </span>
  );
}

export function SearchResultCard({ result, query = '' }: SearchResultCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all">
      {/* Header: Score and document info */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <ScoreBadge score={result.score} />
          {result.page_number && (
            <span className="text-xs text-gray-500">
              Page {result.page_number}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500 flex-shrink-0">
          {result.year}
        </span>
      </div>

      {/* Text snippet */}
      <p className="text-sm text-gray-700 leading-relaxed mb-3 line-clamp-4">
        {highlightText(result.text, query)}
      </p>

      {/* Footer: Document and plan info */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2 min-w-0">
          {/* Document icon */}
          <svg
            className="h-4 w-4 text-gray-400 flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="text-xs text-gray-600 truncate" title={result.document_filename}>
            {result.document_filename}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {result.insurance_plan_name && (
            <span className="text-xs text-gray-500 truncate max-w-[150px]" title={result.insurance_plan_name}>
              {result.insurance_plan_name}
            </span>
          )}
          {result.states.length > 0 && (
            <span className="text-xs text-gray-400">
              {result.states.slice(0, 3).join(', ')}
              {result.states.length > 3 && ` +${result.states.length - 3}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
