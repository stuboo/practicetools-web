import { useState, useRef } from 'react';
import { CheckCircle, XCircle, ShieldAlert, MinusCircle } from 'lucide-react';
import { Treatment, TreatmentTier } from '../types';
import { getTreatmentsByTier } from '../config/treatmentCatalog';
import { oabCondition } from '../config/conditions/oab';
import { PathwayAction, PathwayState } from '../index';

type TreatmentMenuProps = {
  state: PathwayState;
  dispatch: React.Dispatch<PathwayAction>;
};

const TIER_CONFIG: { tier: TreatmentTier; label: string; color: string }[] = [
  { tier: 'first-line', label: 'First-Line Behavioral', color: 'bg-green-100 text-green-800' },
  { tier: 'second-line', label: 'Second-Line Pharmacotherapy', color: 'bg-orange-100 text-orange-800' },
  { tier: 'third-line', label: 'Third-Line Procedures', color: 'bg-red-100 text-red-800' },
  { tier: 'adjunctive', label: 'Adjunctive', color: 'bg-blue-100 text-blue-800' },
];

export function TreatmentMenu({ state, dispatch }: TreatmentMenuProps) {
  const [excludingId, setExcludingId] = useState<string | null>(null);
  const [excludeReason, setExcludeReason] = useState('');
  const reasonInputRef = useRef<HTMLInputElement>(null);

  const selectedIds = new Set(state.steps.map((s) => s.treatmentId));
  const excludedIds = new Set(state.exclusions.map((e) => e.treatmentId));

  function handleToggle(treatment: Treatment) {
    if (excludedIds.has(treatment.id)) return;
    if (selectedIds.has(treatment.id)) {
      dispatch({ type: 'removeStep', treatmentId: treatment.id });
    } else {
      dispatch({ type: 'addStep', treatmentId: treatment.id });
    }
  }

  function startExclude(treatmentId: string) {
    setExcludingId(treatmentId);
    setExcludeReason('');
    setTimeout(() => reasonInputRef.current?.focus(), 0);
  }

  function confirmExclude() {
    if (excludingId && excludeReason.trim()) {
      dispatch({ type: 'addExclusion', treatmentId: excludingId, reason: excludeReason.trim() });
      setExcludingId(null);
      setExcludeReason('');
    }
  }

  function cancelExclude() {
    setExcludingId(null);
    setExcludeReason('');
  }

  return (
    <div className="space-y-4">
      {TIER_CONFIG.map(({ tier, label, color }) => {
        const treatments = getTreatmentsByTier(oabCondition, tier);
        if (treatments.length === 0) return null;

        return (
          <div key={tier}>
            <div className={`inline-block px-2.5 py-1 rounded text-xs font-semibold mb-2 ${color}`}>
              {label}
            </div>
            <div className="space-y-1">
              {treatments.map((t) => {
                const isSelected = selectedIds.has(t.id);
                const isExcluded = excludedIds.has(t.id);

                return (
                  <div key={t.id}>
                    <div
                      className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm transition-colors group
                        ${isExcluded ? 'opacity-50 line-through text-gray-400 cursor-not-allowed' : ''}
                        ${isSelected && !isExcluded ? 'bg-green-50 text-green-900' : ''}
                        ${!isSelected && !isExcluded ? 'hover:bg-gray-100 text-gray-700' : ''}
                      `}
                      onClick={() => handleToggle(t)}
                    >
                      {isSelected && !isExcluded ? (
                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                      ) : isExcluded ? (
                        <XCircle className="w-4 h-4 text-gray-400 shrink-0" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
                      )}
                      <span className="flex-1 min-w-0 truncate">{t.name}</span>
                      {t.requiresProvider && !isExcluded && (
                        <span title="Requires provider">
                          <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        </span>
                      )}
                      {!isExcluded && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startExclude(t.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 transition-opacity"
                          title="Exclude treatment"
                        >
                          <MinusCircle className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      )}
                    </div>

                    {excludingId === t.id && (
                      <div className="ml-6 mt-1 mb-2 flex items-center gap-1.5">
                        <input
                          ref={reasonInputRef}
                          type="text"
                          value={excludeReason}
                          onChange={(e) => setExcludeReason(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') confirmExclude();
                            if (e.key === 'Escape') cancelExclude();
                          }}
                          placeholder="Reason for exclusion..."
                          className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          maxLength={200}
                        />
                        <button
                          onClick={confirmExclude}
                          disabled={!excludeReason.trim()}
                          className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Exclude
                        </button>
                        <button
                          onClick={cancelExclude}
                          className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Excluded treatments summary */}
      {state.exclusions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Excluded Treatments
          </div>
          <div className="space-y-1">
            {state.exclusions.map((excl) => {
              const treatment = oabCondition.treatments.find((t) => t.id === excl.treatmentId);
              if (!treatment) return null;
              return (
                <div key={excl.treatmentId} className="flex items-start gap-2 text-sm text-gray-400 px-2 py-1">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="line-through">{treatment.name}</span>
                    <span className="block text-xs text-gray-400">{excl.reason}</span>
                  </div>
                  <button
                    onClick={() => dispatch({ type: 'removeExclusion', treatmentId: excl.treatmentId })}
                    className="ml-auto text-xs text-blue-500 hover:text-blue-700 shrink-0"
                  >
                    Restore
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
