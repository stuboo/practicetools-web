/**
 * UploadForm component
 * Form for uploading PDF files with metadata
 */

import { useState, useRef, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { uploadDocument } from '../../../api/coverage';
import { FilterCombobox, type FilterOption } from './FilterCombobox';
import { useInsurancePlans } from '../hooks';

interface UploadFormProps {
  /** Called when upload succeeds */
  onSuccess?: (result: {
    document_id: string;
    filename: string;
    extracted_metadata?: {
      plan_name: string;
      plan_type: string;
      confidence: number;
      is_new_plan: boolean;
    };
  }) => void;
  /** Called when upload fails */
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

export function UploadForm({ onSuccess, onError }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [states, setStates] = useState<string[]>([]);
  const [year, setYear] = useState<string>('');  // Empty = auto-detect
  const [insurancePlanId, setInsurancePlanId] = useState<string>();
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: plansData, isLoading: plansLoading } = useInsurancePlans();

  const planOptions: FilterOption[] = useMemo(() => {
    if (!plansData?.insurance_plans) return [];
    return plansData.insurance_plans.map((plan) => ({
      id: plan.id,
      label: plan.name,
      sublabel: plan.states.join(', '),
    }));
  }, [plansData]);

  const uploadMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: (result) => {
      // Reset form
      setFile(null);
      setStates([]);
      setYear('');  // Reset to auto-detect
      setInsurancePlanId(undefined);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onSuccess?.(result);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleStateToggle = (state: string) => {
    setStates((prev) =>
      prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    uploadMutation.mutate({
      file,
      // Only include states/year if user provided them - otherwise API auto-extracts
      states: states.length > 0 ? states : undefined,
      year: year ? parseInt(year) : undefined,
      insurance_plan_id: insurancePlanId,
    });
  };

  // Only file is required - states/year are auto-extracted if not provided
  const isValid = !!file;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File drop zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${file ? 'bg-green-50 border-green-300' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {file ? (
          <div className="flex items-center justify-center gap-3">
            <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="ml-2 p-1 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <>
            <svg className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-600 mb-1">
              Drag and drop a PDF file, or click to select
            </p>
            <p className="text-xs text-gray-400">PDF files only</p>
          </>
        )}
      </div>

      {/* Auto-extraction notice */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Auto-detection enabled:</strong> States, year, and insurance plan will be automatically extracted from the PDF. You can override by selecting values below.
        </p>
      </div>

      {/* States selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Applicable States <span className="text-gray-400 font-normal">(optional - auto-detected)</span>
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
          label="Year"
          placeholder="Auto-detect from PDF"
          options={yearOptions}
          value={year}
          onChange={(v) => setYear(v || '')}
        />
        <FilterCombobox
          label="Insurance Plan"
          placeholder="Auto-detect from PDF"
          options={planOptions}
          value={insurancePlanId}
          onChange={setInsurancePlanId}
          isLoading={plansLoading}
        />
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={!isValid || uploadMutation.isLoading}
        className={`
          w-full py-3 px-4 rounded-lg font-medium transition-colors
          flex items-center justify-center gap-2
          ${isValid && !uploadMutation.isLoading
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
        `}
      >
        {uploadMutation.isLoading ? (
          <>
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Uploading...
          </>
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload Document
          </>
        )}
      </button>

      {/* Error message */}
      {uploadMutation.isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {uploadMutation.error?.message || 'Failed to upload document'}
        </div>
      )}
    </form>
  );
}
