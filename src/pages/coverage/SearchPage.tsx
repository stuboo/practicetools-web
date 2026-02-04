/**
 * Coverage Search Page
 * Main search interface for coverage documents with filters and URL sync
 */

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SearchBar, SearchResults, SuggestedQueries, SearchFilters, type SearchFiltersState } from './components';
import { useCoverageSearch, useSuggestedQueries } from './hooks';

export function SearchPage() {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL params
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [filters, setFilters] = useState<SearchFiltersState>(() => ({
    medication: searchParams.get('medication') || undefined,
    insurance_plan_id: searchParams.get('plan') || undefined,
    generate_answer: searchParams.get('ai') !== 'false', // Default true
  }));
  const [showFilters, setShowFilters] = useState(false);

  // Sync state to URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (filters.medication) params.set('medication', filters.medication);
    if (filters.insurance_plan_id) params.set('plan', filters.insurance_plan_id);
    if (filters.generate_answer === false) params.set('ai', 'false');
    setSearchParams(params, { replace: true });
  }, [searchQuery, filters, setSearchParams]);

  // Fetch search results with filters
  const {
    data: searchData,
    isLoading: isSearching,
    isError: isSearchError,
    error: searchError,
    isFetching,
  } = useCoverageSearch(searchQuery, filters);

  // Fetch suggested queries (only when no active search)
  const {
    data: suggestedData,
    isLoading: isSuggestionsLoading,
  } = useSuggestedQueries();

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleSuggestedQueryClick = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleFiltersChange = useCallback((newFilters: SearchFiltersState) => {
    setFilters(newFilters);
  }, []);

  const toggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const showSuggestions = !searchQuery.trim();
  const showResults = searchQuery.trim().length > 0;
  const hasActiveFilters = filters.medication || filters.insurance_plan_id;
  const activeFilterCount = (filters.medication ? 1 : 0) + (filters.insurance_plan_id ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                Coverage Search
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                Search formulary documents for coverage info
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {user && (
                <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">
                  {user.name || user.email}
                </span>
              )}
              <button
                onClick={logout}
                className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 py-1 px-2 -mr-2"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Search bar with filter toggle */}
        <div className="mb-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <SearchBar
                initialValue={searchQuery}
                onSearch={handleSearch}
                isLoading={isFetching}
                autoFocus
                placeholder="Search for medication coverage, prior auth requirements, formulary info..."
              />
            </div>
            <button
              type="button"
              onClick={toggleFilters}
              className={`
                flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors
                ${showFilters || hasActiveFilters
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}
              `}
              aria-expanded={showFilters}
              aria-label="Toggle filters"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-blue-600 text-white rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <SearchFilters
            filters={filters}
            onChange={handleFiltersChange}
          />
        )}

        {/* Suggested queries (when no search) */}
        {showSuggestions && (
          <div className="py-4">
            <SuggestedQueries
              queries={suggestedData?.queries ?? []}
              isLoading={isSuggestionsLoading}
              onQueryClick={handleSuggestedQueryClick}
            />
          </div>
        )}

        {/* Search results */}
        {showResults && (
          <SearchResults
            data={searchData}
            isLoading={isSearching}
            isError={isSearchError}
            error={searchError}
            query={searchQuery}
          />
        )}
      </main>

      {/* Footer with nav links */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center justify-center">
            <a
              href="/coverage"
              className="flex-1 sm:flex-none py-4 px-6 text-sm font-medium text-blue-600 text-center"
            >
              Search
            </a>
            <a
              href="/coverage/documents"
              className="flex-1 sm:flex-none py-4 px-6 text-sm text-gray-500 hover:text-gray-700 text-center"
            >
              Documents
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
