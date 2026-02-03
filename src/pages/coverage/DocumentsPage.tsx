/**
 * Coverage Documents Page
 * Lists documents with filtering, status badges, and management actions
 */

import { useState, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { DocumentCard, FilterCombobox, type FilterOption } from './components';
import { useDocuments, useDocumentPolling, useInsurancePlans } from './hooks';
import type { DocumentListParams, DocumentStatus, CoverageDocument } from '../../types/coverage';

const PAGE_SIZE = 10;

const statusOptions: FilterOption[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'processing', label: 'Processing' },
  { id: 'ready', label: 'Ready' },
  { id: 'failed', label: 'Failed' },
];

const yearOptions: FilterOption[] = [
  { id: '2026', label: '2026' },
  { id: '2025', label: '2025' },
  { id: '2024', label: '2024' },
  { id: '2023', label: '2023' },
];

export function DocumentsPage() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter state from URL
  const [filters, setFilters] = useState<{
    status?: DocumentStatus;
    year?: number;
    insurance_plan_id?: string;
  }>(() => ({
    status: (searchParams.get('status') as DocumentStatus) || undefined,
    year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
    insurance_plan_id: searchParams.get('plan') || undefined,
  }));

  const [page, setPage] = useState(() => {
    const p = searchParams.get('page');
    return p ? parseInt(p) : 1;
  });

  // Build query params
  const queryParams = useMemo<DocumentListParams>(() => ({
    ...filters,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  }), [filters, page]);

  // Fetch documents
  const {
    data: documentsData,
    isLoading,
    isError,
    error,
    isFetching,
    deleteDoc,
    retryDoc,
    isMutating,
  } = useDocuments(queryParams);

  // Auto-poll for processing documents
  useDocumentPolling(documentsData);

  // Fetch insurance plans for display names and filter
  const { data: plansData } = useInsurancePlans();

  // Build plan lookup map
  const planMap = useMemo(() => {
    const map = new Map<string, string>();
    plansData?.insurance_plans.forEach((plan) => {
      map.set(plan.id, plan.name);
    });
    return map;
  }, [plansData]);

  // Plan options for filter
  const planOptions: FilterOption[] = useMemo(() => {
    if (!plansData?.insurance_plans) return [];
    return plansData.insurance_plans.map((plan) => ({
      id: plan.id,
      label: plan.name,
    }));
  }, [plansData]);

  // Sync filters to URL
  const updateUrlParams = useCallback((newFilters: typeof filters, newPage: number) => {
    const params = new URLSearchParams();
    if (newFilters.status) params.set('status', newFilters.status);
    if (newFilters.year) params.set('year', String(newFilters.year));
    if (newFilters.insurance_plan_id) params.set('plan', newFilters.insurance_plan_id);
    if (newPage > 1) params.set('page', String(newPage));
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  const handleFilterChange = useCallback((key: keyof typeof filters, value: string | undefined) => {
    const newFilters = { ...filters, [key]: value };
    if (key === 'year' && value) {
      newFilters.year = parseInt(value);
    } else if (key === 'year') {
      newFilters.year = undefined;
    }
    setFilters(newFilters);
    setPage(1);
    updateUrlParams(newFilters, 1);
  }, [filters, updateUrlParams]);

  const handleClearFilters = useCallback(() => {
    const newFilters = { status: undefined, year: undefined, insurance_plan_id: undefined };
    setFilters(newFilters);
    setPage(1);
    updateUrlParams(newFilters, 1);
  }, [updateUrlParams]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    updateUrlParams(filters, newPage);
  }, [filters, updateUrlParams]);

  const handleView = useCallback((doc: CoverageDocument) => {
    // For now, could open a modal or navigate to detail page
    console.log('View document:', doc.id);
  }, []);

  const handleDelete = useCallback(async (doc: CoverageDocument) => {
    if (window.confirm(`Are you sure you want to delete "${doc.filename}"?`)) {
      try {
        await deleteDoc(doc.id);
        addToast(`"${doc.filename}" deleted`, 'success');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete document';
        addToast(message, 'error');
      }
    }
  }, [deleteDoc, addToast]);

  const handleRetry = useCallback(async (doc: CoverageDocument) => {
    try {
      await retryDoc(doc.id);
      addToast(`Reprocessing "${doc.filename}"`, 'info');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to retry processing';
      addToast(message, 'error');
    }
  }, [retryDoc, addToast]);

  const hasActiveFilters = filters.status || filters.year || filters.insurance_plan_id;
  const totalPages = documentsData ? Math.ceil(documentsData.total / PAGE_SIZE) : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Documents</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Manage coverage documents
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
        {/* Actions bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {documentsData && (
              <span className="text-sm text-gray-600">
                {documentsData.total} document{documentsData.total !== 1 ? 's' : ''}
              </span>
            )}
            {isFetching && !isLoading && (
              <svg className="h-4 w-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
          </div>
          <Link
            to="/coverage/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Filters</h3>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FilterCombobox
              label="Status"
              placeholder="All statuses"
              options={statusOptions}
              value={filters.status}
              onChange={(v) => handleFilterChange('status', v)}
            />
            <FilterCombobox
              label="Year"
              placeholder="All years"
              options={yearOptions}
              value={filters.year?.toString()}
              onChange={(v) => handleFilterChange('year', v)}
            />
            <FilterCombobox
              label="Insurance Plan"
              placeholder="All plans"
              options={planOptions}
              value={filters.insurance_plan_id}
              onChange={(v) => handleFilterChange('insurance_plan_id', v)}
            />
          </div>
        </div>

        {/* Document list */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="h-6 w-20 bg-gray-200 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg className="h-8 w-8 text-red-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-red-700 font-medium">Failed to load documents</p>
            <p className="text-sm text-red-600 mt-1">{error?.message || 'An error occurred'}</p>
          </div>
        ) : documentsData?.documents.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <svg className="h-12 w-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 font-medium">No documents found</p>
            <p className="text-sm text-gray-400 mt-1">
              {hasActiveFilters ? 'Try adjusting your filters' : 'Upload a document to get started'}
            </p>
            {!hasActiveFilters && (
              <Link
                to="/coverage/upload"
                className="inline-flex items-center gap-2 px-4 py-2 mt-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upload Document
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {documentsData?.documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                insurancePlanName={doc.insurance_plan_id ? planMap.get(doc.insurance_plan_id) : undefined}
                onView={handleView}
                onDelete={handleDelete}
                onRetry={handleRetry}
                actionsDisabled={isMutating}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </main>

      {/* Footer with nav links */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center justify-center">
            <Link to="/coverage" className="flex-1 sm:flex-none py-4 px-6 text-sm text-gray-500 hover:text-gray-700 text-center">
              Search
            </Link>
            <Link to="/coverage/documents" className="flex-1 sm:flex-none py-4 px-6 text-sm font-medium text-blue-600 text-center">
              Documents
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
