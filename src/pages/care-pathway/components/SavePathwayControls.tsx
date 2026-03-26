import { useState } from 'react';
import { Save, Check, Loader2, ClipboardCopy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { useSavePathway, useUpdatePathway, getStoredCreatorToken } from '../hooks/usePathway';
import { pathwaySchema } from '../types';
import type { PathwayState, PathwayAction } from '../index';

type SavePathwayControlsProps = {
  state: PathwayState;
  dispatch: React.Dispatch<PathwayAction>;
  hasUnsavedChanges: boolean;
  onSaved: (savedState: PathwayState) => void;
};

export function SavePathwayControls({
  state,
  dispatch,
  hasUnsavedChanges,
  onSaved,
}: SavePathwayControlsProps) {
  const saveMutation = useSavePathway();
  const updateMutation = useUpdatePathway();
  const [, copy] = useCopyToClipboard();
  const [showSummary, setShowSummary] = useState(false);

  const isSaving = saveMutation.isLoading || updateMutation.isLoading;
  const disabled = state.steps.length === 0 || isSaving;
  const isExistingPathway = Boolean(state.key);

  async function handleSave() {
    // Validate with Zod
    const result = pathwaySchema.safeParse({
      conditionId: state.conditionId,
      steps: state.steps,
      exclusions: state.exclusions,
    });

    if (!result.success) {
      const firstError = result.error.issues[0];
      toast.error(`Validation error: ${firstError.message}`);
      return;
    }

    const validatedData = result.data;

    try {
      if (isExistingPathway && state.key) {
        // Update existing pathway
        const hasToken = getStoredCreatorToken(state.key);
        if (!hasToken) {
          toast.error('No creator token found — you may not have permission to edit this pathway.');
          return;
        }

        const response = await updateMutation.mutateAsync({
          key: state.key,
          data: validatedData,
        });

        dispatch({
          type: 'setSaved',
          key: state.key,
          updatedAt: response.updatedAt,
        });
        onSaved({ ...state, updatedAt: response.updatedAt });
        toast.success(`Pathway updated.`);
      } else {
        // Save new pathway
        const response = await saveMutation.mutateAsync(validatedData);

        dispatch({
          type: 'setSaved',
          key: response.key,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        onSaved({ ...state, key: response.key });
        setShowSummary(true);
        setTimeout(() => setShowSummary(false), 8000);
      }
    } catch {
      toast.error('Could not save pathway. Your selections are preserved — try again.');
    }
  }

  async function handleCopyKey() {
    if (state.key) {
      const success = await copy(state.key);
      if (success) {
        toast.success('Key copied to clipboard');
      }
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* Existing pathway badge + timestamps */}
      {isExistingPathway && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
            Editing existing pathway
          </span>
          {state.createdAt && (
            <span>Created {new Date(state.createdAt).toLocaleDateString()}</span>
          )}
          {state.updatedAt && (
            <span>· Updated {new Date(state.updatedAt).toLocaleDateString()}</span>
          )}
        </div>
      )}

      {/* Key display + copy */}
      {state.key && (
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-mono text-gray-600">{state.key}</span>
          <button
            onClick={handleCopyKey}
            className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            title="Copy pathway key"
          >
            <ClipboardCopy className="w-3 h-3" />
            Copy Key
          </button>
        </div>
      )}

      {/* Unsaved indicator */}
      {hasUnsavedChanges && (
        <span className="flex items-center gap-1.5 text-sm text-amber-600">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Unsaved
        </span>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded transition-colors ${
          disabled
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Save
          </>
        )}
      </button>

      {/* Completion summary toast */}
      {showSummary && state.key && (
        <div className="absolute top-16 right-6 z-50 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-sm animate-in fade-in">
          <div className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Pathway saved</p>
              <p className="text-sm text-green-700 mt-1">
                Share key <span className="font-mono font-bold">{state.key}</span> with your nurse.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
