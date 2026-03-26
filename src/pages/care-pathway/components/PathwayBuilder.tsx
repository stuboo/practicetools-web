import { useCallback, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Step, Treatment } from '../types';
import { getTreatmentById } from '../config/treatmentCatalog';
import { oabCondition } from '../config/conditions/oab';
import { PathwayAction } from '../index';
import { StepCard } from './StepCard';
import { StepConnector } from './StepConnector';

type PathwayBuilderProps = {
  steps: Step[];
  dispatch: React.Dispatch<PathwayAction>;
};

export function PathwayBuilder({ steps, dispatch }: PathwayBuilderProps) {
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const moveStep = useCallback(
    (fromIndex: number, toIndex: number) => {
      dispatch({ type: 'reorderStep', fromIndex, toIndex });
    },
    [dispatch],
  );

  function handleRemove(treatmentId: string) {
    const step = steps.find((s) => s.treatmentId === treatmentId);
    if (!step) return;

    // Check if step has edited fields
    const hasEdits = step.notes || step.followUp || step.escalationTrigger;
    const treatment = getTreatmentById(oabCondition, treatmentId);

    // Check if dose differs from default
    const defaultDose = treatment?.doseOptions[0] || undefined;
    const doseEdited = step.dose !== defaultDose && step.dose !== undefined;

    if (hasEdits || doseEdited) {
      setConfirmRemove(treatmentId);
    } else {
      dispatch({ type: 'removeStep', treatmentId });
    }
  }

  function confirmRemoveStep() {
    if (confirmRemove) {
      dispatch({ type: 'removeStep', treatmentId: confirmRemove });
      setConfirmRemove(null);
    }
  }

  // Build step+treatment pairs for rendering
  const stepPairs: { step: Step; treatment: Treatment }[] = [];
  for (const step of steps) {
    const treatment = getTreatmentById(oabCondition, step.treatmentId);
    if (treatment) {
      stepPairs.push({ step, treatment });
    }
  }

  const confirmTreatment = confirmRemove
    ? getTreatmentById(oabCondition, confirmRemove)
    : null;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-0">
        {stepPairs.map(({ step, treatment }, i) => (
          <div key={step.treatmentId}>
            <StepCard
              step={step}
              treatment={treatment}
              index={i}
              dispatch={dispatch}
              moveStep={moveStep}
              onRemove={handleRemove}
            />
            {/* Connector between steps */}
            {i < stepPairs.length - 1 && (
              <StepConnector
                currentStep={step}
                currentTreatment={treatment}
                nextTreatment={stepPairs[i + 1].treatment}
                dispatch={dispatch}
              />
            )}
          </div>
        ))}
      </div>

      {/* Confirmation dialog */}
      {confirmRemove && confirmTreatment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
            <p className="text-sm text-gray-900 font-medium">
              Remove {confirmTreatment.name}?
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Custom settings will be lost.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setConfirmRemove(null)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveStep}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </DndProvider>
  );
}
