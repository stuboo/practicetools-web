/**
 * Upload Page
 * Page for uploading documents via file upload or URL fetch
 */

import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { UploadForm, FetchUrlForm } from './components';

type TabType = 'upload' | 'fetch';

export function UploadPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSuccess = useCallback((result: { document_id: string; filename: string }) => {
    setSuccessMessage(`Document "${result.filename}" submitted for processing`);
    // Invalidate documents cache so list refreshes
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    // Clear message after delay and redirect
    setTimeout(() => {
      setSuccessMessage(null);
      navigate('/coverage/documents');
    }, 2000);
  }, [queryClient, navigate]);

  const handleError = useCallback((error: Error) => {
    console.error('Upload error:', error);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Upload Document</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Add a new coverage document
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
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {/* Success message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}

        {/* Back link */}
        <Link
          to="/coverage/documents"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Documents
        </Link>

        {/* Tab toggle */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`
                flex-1 px-4 py-3 text-sm font-medium transition-colors
                flex items-center justify-center gap-2
                ${activeTab === 'upload'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600 -mb-px'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
              `}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload File
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('fetch')}
              className={`
                flex-1 px-4 py-3 text-sm font-medium transition-colors
                flex items-center justify-center gap-2
                ${activeTab === 'fetch'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600 -mb-px'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
              `}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Fetch from URL
            </button>
          </div>

          {/* Tab content */}
          <div className="p-6">
            {activeTab === 'upload' ? (
              <UploadForm onSuccess={handleSuccess} onError={handleError} />
            ) : (
              <FetchUrlForm onSuccess={handleSuccess} onError={handleError} />
            )}
          </div>
        </div>

        {/* Help text */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Tips</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Documents are processed asynchronously after upload</li>
            <li>• Only PDF files are supported</li>
            <li>• Select all states where the coverage applies</li>
            <li>• The year should match the formulary year</li>
          </ul>
        </div>
      </main>

      {/* Footer with nav links */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center justify-center">
            <Link to="/coverage" className="flex-1 sm:flex-none py-4 px-6 text-sm text-gray-500 hover:text-gray-700 text-center">
              Search
            </Link>
            <Link to="/coverage/documents" className="flex-1 sm:flex-none py-4 px-6 text-sm text-gray-500 hover:text-gray-700 text-center">
              Documents
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
