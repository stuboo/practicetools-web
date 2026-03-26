import { useState, useMemo } from 'react';
import { ClipboardCopy, Check, Maximize2, Minimize2 } from 'lucide-react';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { formatNurseProtocol } from '../utils/formatNurseProtocol';
import { oabCondition } from '../config/conditions/oab';
import type { PathwayState } from '../index';

type NurseProtocolOutputProps = {
  state: PathwayState;
};

export function NurseProtocolOutput({ state }: NurseProtocolOutputProps) {
  const [, copy] = useCopyToClipboard();
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const disabled = state.steps.length === 0;

  const protocolText = useMemo(() => {
    if (disabled) return '';
    return formatNurseProtocol({
      conditionName: oabCondition.name,
      key: state.key,
      steps: state.steps,
      exclusions: state.exclusions,
      condition: oabCondition,
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
    });
  }, [state.steps, state.exclusions, state.key, state.createdAt, state.updatedAt, disabled]);

  async function handleCopy() {
    const success = await copy(protocolText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  async function handleCopyKey() {
    if (state.key) {
      await copy(state.key);
    }
  }

  return (
    <div className={`flex flex-col ${expanded ? 'fixed inset-0 z-40 bg-white' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-700">Nurse Protocol</h3>
          {state.key && (
            <span className="flex items-center gap-1">
              <span className="text-xs text-gray-500 font-mono">{state.key}</span>
              <button
                onClick={handleCopyKey}
                className="text-xs text-blue-600 hover:text-blue-800"
                title="Copy key"
              >
                Copy Key
              </button>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors ${
              copied
                ? 'bg-green-600 text-white'
                : disabled
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied ✓
              </>
            ) : (
              <>
                <ClipboardCopy className="w-4 h-4" />
                Copy Nurse Protocol
              </>
            )}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-200 transition-colors"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Protocol preview */}
      <div className={`overflow-y-auto bg-white ${expanded ? 'flex-1' : 'max-h-64'}`}>
        {disabled ? (
          <div className="flex items-center justify-center h-32 text-sm text-gray-400">
            Add treatments to generate the nurse protocol
          </div>
        ) : (
          <pre className="p-4 text-xs font-mono text-gray-800 whitespace-pre-wrap print:text-[10px]">
            {protocolText}
          </pre>
        )}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          pre { visibility: visible; position: absolute; left: 0; top: 0; }
        }
      `}</style>
    </div>
  );
}
