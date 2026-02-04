/**
 * SearchFilters component
 * Filter panel for coverage search with medication and insurance plan filters
 */

import { useMemo } from 'react';
import { FilterCombobox, type FilterOption } from './FilterCombobox';
import { useMedications, useInsurancePlans } from '../hooks';

export interface SearchFiltersState {
  medication?: string;
  insurance_plan_id?: string;
  generate_answer?: boolean;
}

interface SearchFiltersProps {
  /** Current filter values */
  filters: SearchFiltersState;
  /** Callback when filters change */
  onChange: (filters: SearchFiltersState) => void;
  /** Show compact layout for smaller screens */
  compact?: boolean;
}

export function SearchFilters({
  filters,
  onChange,
  compact = false,
}: SearchFiltersProps) {
  // Fetch medications and insurance plans
  const { data: medicationsData, isLoading: medicationsLoading } = useMedications();
  const { data: plansData, isLoading: plansLoading } = useInsurancePlans();

  // Transform medications to filter options
  const medicationOptions: FilterOption[] = useMemo(() => {
    if (!medicationsData?.medications) return [];
    return medicationsData.medications.map((med) => ({
      id: med.name, // Use name for search filter
      label: med.name,
      sublabel: med.generic_name !== med.name ? med.generic_name : undefined,
    }));
  }, [medicationsData]);

  // Transform insurance plans to filter options
  const planOptions: FilterOption[] = useMemo(() => {
    if (!plansData?.insurance_plans) return [];
    return plansData.insurance_plans.map((plan) => ({
      id: plan.id,
      label: plan.name,
      sublabel: plan.states.length > 0 ? plan.states.join(', ') : undefined,
    }));
  }, [plansData]);

  const handleMedicationChange = (value: string | undefined) => {
    onChange({ ...filters, medication: value });
  };

  const handlePlanChange = (value: string | undefined) => {
    onChange({ ...filters, insurance_plan_id: value });
  };

  const handleGenerateAnswerChange = () => {
    onChange({ ...filters, generate_answer: !filters.generate_answer });
  };

  const handleClearAll = () => {
    onChange({ medication: undefined, insurance_plan_id: undefined, generate_answer: true });
  };

  const hasActiveFilters = filters.medication || filters.insurance_plan_id;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${compact ? '' : 'mb-4'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Filters</h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        <FilterCombobox
          label="Medication"
          placeholder="All medications"
          options={medicationOptions}
          value={filters.medication}
          onChange={handleMedicationChange}
          isLoading={medicationsLoading}
        />

        <FilterCombobox
          label="Insurance Plan"
          placeholder="All plans"
          options={planOptions}
          value={filters.insurance_plan_id}
          onChange={handlePlanChange}
          isLoading={plansLoading}
        />
      </div>

      {/* AI Answer Toggle */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="text-sm font-medium text-gray-700">AI Summary</span>
            <p className="text-xs text-gray-500">Generate an AI answer with category comparison</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={filters.generate_answer !== false}
            onClick={handleGenerateAnswerChange}
            className={`
              relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
              transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${filters.generate_answer !== false ? 'bg-blue-600' : 'bg-gray-200'}
            `}
          >
            <span
              className={`
                pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
                transition duration-200 ease-in-out
                ${filters.generate_answer !== false ? 'translate-x-5' : 'translate-x-0'}
              `}
            />
          </button>
        </label>
      </div>
    </div>
  );
}
