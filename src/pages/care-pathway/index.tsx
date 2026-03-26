import { useReducer, useCallback, useEffect, useState } from 'react';
import {
  useParams,
  unstable_useBlocker as useBlocker,
} from 'react-router-dom';
import { Step, Exclusion, Pathway } from './types';
import { oabCondition } from './config/conditions/oab';
import { getTreatmentById } from './config/treatmentCatalog';

// ── Reducer types ──

export type PathwayAction =
  | { type: 'addStep'; treatmentId: string }
  | { type: 'removeStep'; treatmentId: string }
  | { type: 'reorderStep'; fromIndex: number; toIndex: number }
  | { type: 'updateStep'; treatmentId: string; updates: Partial<Omit<Step, 'treatmentId' | 'sequence'>> }
  | { type: 'addExclusion'; treatmentId: string; reason: string }
  | { type: 'removeExclusion'; treatmentId: string }
  | { type: 'loadPathway'; pathway: Pathway };

export type PathwayState = {
  conditionId: string;
  steps: Step[];
  exclusions: Exclusion[];
  key?: string;
  createdAt?: string;
  updatedAt?: string;
};

const initialState: PathwayState = {
  conditionId: oabCondition.id,
  steps: [],
  exclusions: [],
};

function renumberSteps(steps: Step[]): Step[] {
  return steps.map((step, i) => ({ ...step, sequence: i + 1 }));
}

function pathwayReducer(state: PathwayState, action: PathwayAction): PathwayState {
  switch (action.type) {
    case 'addStep': {
      const treatment = getTreatmentById(oabCondition, action.treatmentId);
      if (!treatment) return state;
      if (state.steps.some((s) => s.treatmentId === action.treatmentId)) return state;
      const newStep: Step = {
        treatmentId: action.treatmentId,
        sequence: state.steps.length + 1,
        duration: treatment.defaultDuration,
        dose: treatment.doseOptions[0] || undefined,
      };
      return { ...state, steps: [...state.steps, newStep] };
    }
    case 'removeStep': {
      const filtered = state.steps.filter((s) => s.treatmentId !== action.treatmentId);
      return { ...state, steps: renumberSteps(filtered) };
    }
    case 'reorderStep': {
      const reordered = [...state.steps];
      const [moved] = reordered.splice(action.fromIndex, 1);
      reordered.splice(action.toIndex, 0, moved);
      return { ...state, steps: renumberSteps(reordered) };
    }
    case 'updateStep': {
      return {
        ...state,
        steps: state.steps.map((s) =>
          s.treatmentId === action.treatmentId ? { ...s, ...action.updates } : s,
        ),
      };
    }
    case 'addExclusion': {
      if (state.exclusions.some((e) => e.treatmentId === action.treatmentId)) return state;
      return {
        ...state,
        exclusions: [...state.exclusions, { treatmentId: action.treatmentId, reason: action.reason }],
        steps: renumberSteps(state.steps.filter((s) => s.treatmentId !== action.treatmentId)),
      };
    }
    case 'removeExclusion': {
      return {
        ...state,
        exclusions: state.exclusions.filter((e) => e.treatmentId !== action.treatmentId),
      };
    }
    case 'loadPathway': {
      return {
        conditionId: action.pathway.conditionId,
        steps: action.pathway.steps,
        exclusions: action.pathway.exclusions,
        key: action.pathway.key,
        createdAt: action.pathway.createdAt,
        updatedAt: action.pathway.updatedAt,
      };
    }
    default:
      return state;
  }
}

// ── Viewport guard ──

function useMinViewport(minWidth: number) {
  const [isTooSmall, setIsTooSmall] = useState(false);

  useEffect(() => {
    const check = () => setIsTooSmall(window.innerWidth < minWidth);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [minWidth]);

  return isTooSmall;
}

// ── Page component ──

export default function CarePathway() {
  const { key } = useParams<{ key?: string }>();
  const [state, dispatch] = useReducer(pathwayReducer, initialState);
  const [lastSaved, setLastSaved] = useState<PathwayState | null>(null);

  // dispatch and setLastSaved used by child components in CP-004+
  void dispatch;
  void setLastSaved;
  const isTooSmall = useMinViewport(1024);

  const hasUnsavedChanges = useCallback(() => {
    if (!lastSaved) return state.steps.length > 0;
    return JSON.stringify(state.steps) !== JSON.stringify(lastSaved.steps)
      || JSON.stringify(state.exclusions) !== JSON.stringify(lastSaved.exclusions);
  }, [state, lastSaved]);

  // Navigation blocker for unsaved changes
  useBlocker(hasUnsavedChanges());

  // If key param present, this is a lookup/read-only view
  const isLookupView = Boolean(key);

  if (isTooSmall) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-6">
        <div className="text-center max-w-md">
          <p className="text-lg font-medium text-gray-700">
            This tool is designed for desktop use
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Please use a device with a screen width of at least 1024px.
          </p>
        </div>
      </div>
    );
  }

  // Lookup view will be implemented in CP-009
  if (isLookupView) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Pathway lookup view — coming in CP-009</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Care Pathway Builder</h1>
          <p className="text-sm text-gray-500">{oabCondition.name}</p>
        </div>
        <div className="flex items-center gap-3">
          {hasUnsavedChanges() && (
            <span className="flex items-center gap-1.5 text-sm text-amber-600">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Unsaved
            </span>
          )}
          {/* Save button will be implemented in CP-008 */}
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-[340px_1fr] h-[calc(100vh-theme(spacing.16)-73px)]">
        {/* Left panel — Treatment menu (CP-004) */}
        <div className="border-r border-gray-200 overflow-y-auto bg-gray-50 p-4">
          <p className="text-sm text-gray-400">Treatment menu — coming in CP-004</p>
        </div>

        {/* Right panel — Pathway builder */}
        <div className="overflow-y-auto p-6">
          {state.steps.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center max-w-md">
                <p className="text-gray-500">
                  Select treatments from the menu to build a pathway
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-400">
                Pathway builder with {state.steps.length} step{state.steps.length !== 1 ? 's' : ''} — drag-drop coming in CP-005
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { pathwayReducer, initialState, renumberSteps };
export type { PathwayState as CarePathwayState };
