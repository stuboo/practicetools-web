import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Step, Treatment } from '../types';
import { PathwayAction } from '../index';

const TRANSITION_PRESETS = [
  'Then →',
  'Concurrent with above →',
  'If previous insufficient →',
  'ESCALATE TO PROVIDER →',
];

type StepConnectorProps = {
  currentStep: Step;
  currentTreatment: Treatment;
  nextTreatment: Treatment;
  dispatch: React.Dispatch<PathwayAction>;
};

function getDefaultTransition(currentTreatment: Treatment, nextTreatment: Treatment): string {
  // Tier escalation → provider
  if (nextTreatment.requiresProvider && !currentTreatment.requiresProvider) {
    return 'ESCALATE TO PROVIDER →';
  }
  // Different tiers → insufficient
  if (currentTreatment.tier !== nextTreatment.tier) {
    return 'If previous insufficient →';
  }
  // Same tier
  return 'Then →';
}

export function StepConnector({
  currentStep,
  currentTreatment,
  nextTreatment,
  dispatch,
}: StepConnectorProps) {
  const [showPresets, setShowPresets] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const defaultText = getDefaultTransition(currentTreatment, nextTreatment);
  const displayText = currentStep.transitionText || defaultText;

  function handleSelect(text: string) {
    dispatch({
      type: 'updateStep',
      treatmentId: currentStep.treatmentId,
      updates: { transitionText: text },
    });
    setShowPresets(false);
    setIsEditing(false);
  }

  function handleCustomChange(text: string) {
    dispatch({
      type: 'updateStep',
      treatmentId: currentStep.treatmentId,
      updates: { transitionText: text.slice(0, 200) || undefined },
    });
  }

  return (
    <div className="flex items-center justify-center py-1.5 relative">
      <div className="flex items-center gap-1 relative">
        {isEditing ? (
          <input
            type="text"
            value={currentStep.transitionText || ''}
            onChange={(e) => handleCustomChange(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') setIsEditing(false);
            }}
            maxLength={200}
            autoFocus
            className="text-xs text-center border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 w-56"
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded px-2 py-1 transition-colors"
            title="Click to edit transition text"
          >
            {displayText}
          </button>
        )}
        <div className="relative">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="p-0.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
            title="Choose preset"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {showPresets && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowPresets(false)} />
              <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[200px]">
                {TRANSITION_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleSelect(preset)}
                    className={`block w-full text-left text-xs px-3 py-1.5 hover:bg-gray-100 ${
                      displayText === preset ? 'text-blue-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setShowPresets(false);
                      setIsEditing(true);
                    }}
                    className="block w-full text-left text-xs px-3 py-1.5 hover:bg-gray-100 text-gray-500"
                  >
                    Custom...
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
