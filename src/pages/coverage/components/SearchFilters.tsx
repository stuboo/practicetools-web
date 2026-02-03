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

  const handleClearAll = () => {
    onChange({ medication: undefined, insurance_plan_id: undefined });
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
    </div>
  );
}
