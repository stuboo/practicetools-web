import { useState } from 'react';
import { saveAs } from 'file-saver';
import { FileText, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { oabCondition } from '../config/conditions/oab';
import { getTreatmentById } from '../config/treatmentCatalog';
import { buildPatientPacket } from '../utils/buildPatientPacket';
import type { PathwayState } from '../index';

type PatientEducationOutputProps = {
  state: PathwayState;
};

export function PatientEducationOutput({ state }: PatientEducationOutputProps) {
  const [building, setBuilding] = useState(false);

  const disabled = state.steps.length === 0;
  const key = state.key || 'draft';

  async function handleBuild() {
    setBuilding(true);
    try {
      const pdfBytes = await buildPatientPacket(state.steps, state.key);
      saveAs(
        new Blob([pdfBytes], { type: 'application/pdf' }),
        `patient-education-${key}.pdf`,
      );
    } catch (err) {
      console.error('Failed to build patient packet:', err);
      toast.error('Failed to build patient packet. Please try again.');
    } finally {
      setBuilding(false);
    }
  }

  // Treatment list for display
  const treatments = state.steps
    .map((step) => getTreatmentById(oabCondition, step.treatmentId))
    .filter(Boolean);

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-700">Patient Education</h3>
          {!disabled && (
            <span className="text-xs text-gray-400">
              {treatments.length} handout{treatments.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          onClick={handleBuild}
          disabled={disabled || building}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors ${
            disabled || building
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {building ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Building...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Build Patient Packet
            </>
          )}
        </button>
      </div>
    </div>
  );
}
