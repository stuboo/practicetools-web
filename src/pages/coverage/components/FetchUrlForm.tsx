/**
 * FetchUrlForm component
 * Form for fetching PDF documents from URLs
 */

import { useState, useMemo, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { fetchDocument } from '../../../api/coverage';
import { FilterCombobox, type FilterOption } from './FilterCombobox';
import { useInsurancePlans } from '../hooks';

interface FetchUrlFormProps {
  /** Called when fetch succeeds */
  onSuccess?: (result: { document_id: string; filename: string; source_url: string }) => void;
  /** Called when fetch fails */
  onError?: (error: Error) => void;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const currentYear = new Date().getFullYear();
const yearOptions: FilterOption[] = Array.from({ length: 5 }, (_, i) => ({
  id: String(currentYear - i),
  label: String(currentYear - i),
}));

export function FetchUrlForm({ onSuccess, onError }: FetchUrlFormProps) {
  const [url, setUrl] = useState('');
  const [filename, setFilename] = useState('');
  const [states, setStates] = useState<string[]>([]);
  const [year, setYear] = useState<string>(String(currentYear));
  const [insurancePlanId, setInsurancePlanId] = useState<string>();

  const { data: plansData, isLoading: plansLoading } = useInsurancePlans();

  const planOptions: FilterOption[] = useMemo(() => {
    if (!plansData?.insurance_plans) return [];
    return plansData.insurance_plans.map((plan) => ({
      id: plan.id,
      label: plan.name,
      sublabel: plan.states.join(', '),
    }));
  }, [plansData]);

  // Auto-generate filename from URL
  useEffect(() => {
    if (url && !filename) {
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart && lastPart.endsWith('.pdf')) {
          setFilename(decodeURIComponent(lastPart));
        }
      } catch {
        // Invalid URL, ignore
      }
    }
  }, [url, filename]);

  const fetchMutation = useMutation({
    mutationFn: fetchDocument,
    onSuccess: (result) => {
      // Reset form
      setUrl('');
      setFilename('');
      setStates([]);
      setYear(String(currentYear));
      setInsurancePlanId(undefined);
      onSuccess?.(result);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  const handleStateToggle = (state: string) => {
    setStates((prev) =>
      prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !filename || states.length === 0 || !year) return;

    fetchMutation.mutate({
      url,
      filename,
      states,
      year: parseInt(year),
      insurance_plan_id: insurancePlanId,
    });
  };

  const isValidUrl = (urlString: string) => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const isValid = isValidUrl(url) && filename && states.length > 0 && year;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* URL input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          PDF URL <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/document.pdf"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter the direct URL to a PDF document
        </p>
      </div>

      {/* Filename input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Filename <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="document.pdf"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          A descriptive name for the document
        </p>
      </div>

      {/* States selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Applicable States <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-300 rounded-lg">
          {US_STATES.map((state) => (
            <button
              key={state}
              type="button"
              onClick={() => handleStateToggle(state)}
              className={`
                px-2 py-1 text-xs font-medium rounded transition-colors
                ${states.includes(state)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
              `}
            >
              {state}
            </button>
          ))}
        </div>
        {states.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Selected: {states.join(', ')}
          </p>
        )}
      </div>

      {/* Year and Insurance Plan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FilterCombobox
          label="Year *"
          placeholder="Select year"
          options={yearOptions}
          value={year}
          onChange={(v) => setYear(v || String(currentYear))}
        />
        <FilterCombobox
          label="Insurance Plan"
          placeholder="Select plan (optional)"
          options={planOptions}
          value={insurancePlanId}
          onChange={setInsurancePlanId}
          isLoading={plansLoading}
        />
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={!isValid || fetchMutation.isLoading}
        className={`
          w-full py-3 px-4 rounded-lg font-medium transition-colors
          flex items-center justify-center gap-2
          ${isValid && !fetchMutation.isLoading
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
        `}
      >
        {fetchMutation.isLoading ? (
          <>
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Fetching...
          </>
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Fetch from URL
          </>
        )}
      </button>

      {/* Error message */}
      {fetchMutation.isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {fetchMutation.error?.message || 'Failed to fetch document'}
        </div>
      )}
    </form>
  );
}
