/**
 * FilterCombobox component
 * Reusable combobox for filtering with search, selection, and clear functionality
 */

import { useState, useRef, useEffect } from 'react';

export interface FilterOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface FilterComboboxProps {
  /** Label displayed above the combobox */
  label: string;
  /** Placeholder text when no selection */
  placeholder?: string;
  /** Available options to select from */
  options: FilterOption[];
  /** Currently selected option ID */
  value?: string;
  /** Callback when selection changes */
  onChange: (value: string | undefined) => void;
  /** Whether options are loading */
  isLoading?: boolean;
  /** Disable the combobox */
  disabled?: boolean;
}

export function FilterCombobox({
  label,
  placeholder = 'Select...',
  options,
  value,
  onChange,
  isLoading = false,
  disabled = false,
}: FilterComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  // Filter options by search term
  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      opt.sublabel?.toLowerCase().includes(search.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setSearch('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          relative w-full bg-white border rounded-lg px-3 py-2 text-left
          transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300'}
        `}
      >
        <span className={`block truncate ${selectedOption ? 'text-gray-900' : 'text-gray-500'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <span className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
          {/* Clear button */}
          {selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          )}

          {/* Dropdown arrow */}
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search..."
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Options list */}
          <ul className="max-h-60 overflow-auto py-1">
            {isLoading ? (
              <li className="px-3 py-2 text-sm text-gray-500">Loading...</li>
            ) : filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">No options found</li>
            ) : (
              filteredOptions.map((option) => (
                <li
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={`
                    px-3 py-2 cursor-pointer transition-colors
                    ${option.id === value ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}
                  `}
                >
                  <div className="text-sm font-medium">{option.label}</div>
                  {option.sublabel && (
                    <div className="text-xs text-gray-500">{option.sublabel}</div>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
