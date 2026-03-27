import { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import type { Identifier } from 'dnd-core';
import { GripVertical, X, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';
import { Step, Treatment, TreatmentTier } from '../types';
import { PathwayAction } from '../index';

const ITEM_TYPE = 'PATHWAY_STEP';

const DURATION_OPTIONS = [
  '2 weeks',
  '4 weeks',
  '4-6 weeks',
  '6-8 weeks',
  'Ongoing',
];

type DragItem = {
  index: number;
  treatmentId: string;
};

type StepCardProps = {
  step: Step;
  treatment: Treatment;
  index: number;
  dispatch: React.Dispatch<PathwayAction>;
  moveStep: (fromIndex: number, toIndex: number) => void;
  onRemove: (treatmentId: string) => void;
};

const TIER_BORDER: Record<TreatmentTier, string> = {
  'first-line': 'border-l-green-500',
  'second-line': 'border-l-orange-500',
  'third-line': 'border-l-red-500',
  'adjunctive': 'border-l-blue-500',
};

const TIER_BADGE: Record<TreatmentTier, string> = {
  'first-line': 'bg-green-100 text-green-800',
  'second-line': 'bg-orange-100 text-orange-800',
  'third-line': 'bg-red-100 text-red-800',
  'adjunctive': 'bg-blue-100 text-blue-800',
};

const TIER_LABEL: Record<TreatmentTier, string> = {
  'first-line': '1st Line',
  'second-line': '2nd Line',
  'third-line': '3rd Line',
  'adjunctive': 'Adjunctive',
};

export function StepCard({ step, treatment, index, dispatch, moveStep, onRemove }: StepCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [showCustomDuration, setShowCustomDuration] = useState(
    () => !!step.duration && !DURATION_OPTIONS.includes(step.duration),
  );

  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { index, treatmentId: step.treatmentId },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [index, step.treatmentId]);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: Identifier | null }>(() => ({
    accept: ITEM_TYPE,
    collect: (monitor) => ({
      handlerId: monitor.getHandlerId(),
    }),
    hover: (item: DragItem) => {
      if (!ref.current) return;
      if (item.index === index) return;
      moveStep(item.index, index);
      item.index = index;
    },
  }), [index, moveStep]);

  drop(preview(ref));

  function updateField(field: string, value: string) {
    dispatch({
      type: 'updateStep',
      treatmentId: step.treatmentId,
      updates: { [field]: value || undefined },
    });
  }

  const borderColor = treatment.requiresProvider
    ? 'border-l-red-500'
    : treatment.tier === 'second-line'
      ? 'border-l-orange-500'
      : TIER_BORDER[treatment.tier];

  // Inline summary for collapsed view
  const summaryParts: string[] = [];
  if (step.duration) summaryParts.push(step.duration);
  if (step.dose) summaryParts.push(step.dose);
  const summaryText = summaryParts.join(' · ');

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 border-l-4 ${borderColor} transition-opacity ${isDragging ? 'opacity-30' : ''}`}
    >
      {/* Compact header — always visible */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div ref={(node) => { drag(node); }} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 shrink-0">
          <GripVertical className="w-4 h-4" />
        </div>

        <span className="text-sm font-semibold text-gray-400 w-5 shrink-0">
          {step.sequence}
        </span>

        <span className="text-sm font-medium text-gray-900 min-w-0 truncate">
          {treatment.name}
        </span>

        {/* Inline duration/dose summary when collapsed */}
        {!expanded && summaryText && (
          <span className="text-xs text-gray-400 truncate shrink-0 max-w-[200px]">
            {summaryText}
          </span>
        )}

        {treatment.requiresProvider && (
          <span className="flex items-center gap-1 text-xs text-red-600 shrink-0">
            <ShieldAlert className="w-3.5 h-3.5" />
          </span>
        )}

        <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${TIER_BADGE[treatment.tier]}`}>
          {TIER_LABEL[treatment.tier]}
        </span>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
          title={expanded ? 'Collapse' : 'Edit details'}
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={() => onRemove(step.treatmentId)}
          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0"
          title="Remove step"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Expandable detail panel — all editable fields */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-gray-100">
          {/* Duration & Dose */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Duration</label>
              <select
                value={showCustomDuration ? '__custom__' : (step.duration || '')}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setShowCustomDuration(true);
                    updateField('duration', '');
                  } else {
                    setShowCustomDuration(false);
                    updateField('duration', e.target.value);
                  }
                }}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                {DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
                <option value="__custom__">Custom...</option>
              </select>
              {showCustomDuration && (
                <input
                  type="text"
                  value={step.duration || ''}
                  onChange={(e) => updateField('duration', e.target.value.slice(0, 50))}
                  placeholder="e.g., 3 months"
                  maxLength={50}
                  className="w-full mt-1 text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Dose</label>
              <input
                type="text"
                value={step.dose || ''}
                onChange={(e) => updateField('dose', e.target.value.slice(0, 100))}
                placeholder={treatment.doseOptions[0] || 'N/A'}
                maxLength={100}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Notes, Follow-up, Escalation */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Notes <span className="text-gray-400">({(step.notes || '').length}/200)</span>
            </label>
            <textarea
              value={step.notes || ''}
              onChange={(e) => updateField('notes', e.target.value.slice(0, 200))}
              placeholder="Additional notes..."
              maxLength={200}
              rows={2}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Follow-up</label>
            <input
              type="text"
              value={step.followUp || ''}
              onChange={(e) => updateField('followUp', e.target.value.slice(0, 500))}
              placeholder="e.g., Reassess in 4 weeks"
              maxLength={500}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Escalation trigger</label>
            <input
              type="text"
              value={step.escalationTrigger || ''}
              onChange={(e) => updateField('escalationTrigger', e.target.value.slice(0, 500))}
              placeholder="e.g., If symptoms persist after 6 weeks"
              maxLength={500}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
