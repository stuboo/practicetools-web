import { useReducer, useCallback, useEffect, useState } from 'react';
import {
  useParams,
  useNavigate,
  unstable_useBlocker as useBlocker,
} from 'react-router-dom';
import { Step, Exclusion, Pathway } from './types';
import { oabCondition } from './config/conditions/oab';
import { getTreatmentById } from './config/treatmentCatalog';
import { TreatmentMenu } from './components/TreatmentMenu';
import { PathwayBuilder } from './components/PathwayBuilder';
import { NurseProtocolOutput } from './components/NurseProtocolOutput';
import { PatientEducationOutput } from './components/PatientEducationOutput';
import { SavePathwayControls } from './components/SavePathwayControls';
import { PathwayLookup } from './components/PathwayLookup';

// ── Reducer types ──

export type PathwayAction =
  | { type: 'addStep'; treatmentId: string }
  | { type: 'removeStep'; treatmentId: string }
  | { type: 'reorderStep'; fromIndex: number; toIndex: number }
  | { type: 'updateStep'; treatmentId: string; updates: Partial<Omit<Step, 'treatmentId' | 'sequence'>> }
  | { type: 'addExclusion'; treatmentId: string; reason: string }
  | { type: 'removeExclusion'; treatmentId: string }
  | { type: 'loadPathway'; pathway: Pathway }
  | { type: 'setSaved'; key: string; createdAt?: string; updatedAt?: string };

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
    case 'setSaved': {
      return {
        ...state,
        key: action.key,
        createdAt: action.createdAt ?? state.createdAt,
        updatedAt: action.updatedAt ?? state.updatedAt,
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
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(pathwayReducer, initialState);
  const [lastSaved, setLastSaved] = useState<PathwayState | null>(null);
  const [lookupKey, setLookupKey] = useState('');

  const isTooSmall = useMinViewport(1024);

  const hasUnsavedChanges = useCallback(() => {
    if (!lastSaved) return state.steps.length > 0;
    return JSON.stringify(state.steps) !== JSON.stringify(lastSaved.steps)
      || JSON.stringify(state.exclusions) !== JSON.stringify(lastSaved.exclusions);
  }, [state, lastSaved]);

  // Navigation blocker for unsaved changes (in-app)
  useBlocker(hasUnsavedChanges());

  // Browser close/refresh protection
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

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

  // Read-only lookup view for nurses
  if (isLookupView && key) {
    return <PathwayLookup pathwayKey={key} />;
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Care Pathway Builder</h1>
            <p className="text-sm text-gray-500">{oabCondition.name}</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = lookupKey.trim();
              if (trimmed) navigate(`/care-pathway/${trimmed}`);
            }}
            className="flex items-center gap-1.5"
          >
            <input
              type="text"
              value={lookupKey}
              onChange={(e) => setLookupKey(e.target.value)}
              placeholder="Look up key..."
              className="w-36 px-2 py-1 text-xs font-mono border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!lookupKey.trim()}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              Go
            </button>
          </form>
        </div>
        <SavePathwayControls
          state={state}
          dispatch={dispatch}
          hasUnsavedChanges={hasUnsavedChanges()}
          onSaved={(savedState: PathwayState) => setLastSaved(savedState)}
        />
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-[340px_1fr] h-[calc(100vh-theme(spacing.16)-73px)]">
        {/* Left panel — Treatment menu */}
        <div className="border-r border-gray-200 overflow-y-auto bg-gray-50 p-4">
          <TreatmentMenu state={state} dispatch={dispatch} />
        </div>

        {/* Right panel — Pathway builder + protocol output */}
        <div className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {state.steps.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center max-w-md">
                  <p className="text-gray-500">
                    Select treatments from the menu to build a pathway
                  </p>
                </div>
              </div>
            ) : (
              <PathwayBuilder steps={state.steps} dispatch={dispatch} />
            )}
          </div>

          {/* Bottom panel — Nurse protocol + Patient education */}
          <div className="border-t border-gray-200 shrink-0">
            <NurseProtocolOutput state={state} />
            <div className="border-t border-gray-200">
              <PatientEducationOutput state={state} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { pathwayReducer, initialState, renumberSteps };
export type { PathwayState as CarePathwayState };
