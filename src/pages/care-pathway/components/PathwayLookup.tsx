import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCopy, Check, Printer, Download, Loader2, Search, FileText, AlertTriangle } from 'lucide-react';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { useGetPathway } from '../hooks/usePathway';
import { formatNurseProtocol } from '../utils/formatNurseProtocol';
import { buildPatientPacket } from '../utils/buildPatientPacket';
import { oabCondition } from '../config/conditions/oab';
import { getTreatmentById } from '../config/treatmentCatalog';

type PathwayLookupProps = {
  pathwayKey: string;
};

// ── Skeleton loader ──

function SkeletonLoader({ pathwayKey }: { pathwayKey: string }) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mt-2" />
        </div>
        <span className="font-mono text-sm text-gray-500">{pathwayKey}</span>
      </div>
      <div className="space-y-3">
        {[85, 92, 78, 95, 72, 88, 80, 90].map((w, i) => (
          <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

// ── Error states ──

function NotFoundState({ initialKey }: { initialKey: string }) {
  const [inputKey, setInputKey] = useState(initialKey);
  const navigate = useNavigate();

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputKey.trim();
    if (trimmed) {
      navigate(`/care-pathway/${trimmed}`);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Pathway not found</h2>
        <p className="text-sm text-gray-500 mb-6">
          Check the key and try again.
        </p>
        <form onSubmit={handleLookup} className="flex gap-2">
          <input
            type="text"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder="Enter pathway key"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            <Search className="w-4 h-4" />
            Look up
          </button>
        </form>
      </div>
    </div>
  );
}

function ServerErrorState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Service temporarily unavailable</h2>
        <p className="text-sm text-gray-500">
          Try again in a moment.
        </p>
      </div>
    </div>
  );
}

// ── Main lookup component ──

export function PathwayLookup({ pathwayKey }: PathwayLookupProps) {
  const { data: pathway, isLoading, error } = useGetPathway(pathwayKey);
  const [, copy] = useCopyToClipboard();
  const [copied, setCopied] = useState(false);
  const [building, setBuilding] = useState(false);

  const protocolText = useMemo(() => {
    if (!pathway || pathway.steps.length === 0) return '';
    return formatNurseProtocol({
      conditionName: oabCondition.name,
      key: pathway.key,
      steps: pathway.steps,
      exclusions: pathway.exclusions,
      condition: oabCondition,
      createdAt: pathway.createdAt,
      updatedAt: pathway.updatedAt,
    });
  }, [pathway]);

  // Loading state
  if (isLoading) {
    return <SkeletonLoader pathwayKey={pathwayKey} />;
  }

  // Error states
  if (error) {
    const axiosError = error as { response?: { status?: number } };
    const status = axiosError?.response?.status;
    if (status === 404) {
      return <NotFoundState initialKey={pathwayKey} />;
    }
    return <ServerErrorState />;
  }

  if (!pathway) {
    return <NotFoundState initialKey={pathwayKey} />;
  }

  async function handleCopy() {
    const success = await copy(protocolText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  async function handleCopyKey() {
    await copy(pathwayKey);
  }

  function handlePrint() {
    window.print();
  }

  async function handleDownloadPacket() {
    if (!pathway) return;
    setBuilding(true);
    try {
      const pdfBytes = await buildPatientPacket(pathway.steps, pathwayKey);
      saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), `patient-education-${pathwayKey}.pdf`);
    } catch (err) {
      console.error('Failed to build patient packet:', err);
      toast.error('Failed to build patient packet. Please try again.');
    } finally {
      setBuilding(false);
    }
  }

  const treatments = pathway.steps
    .map((step) => getTreatmentById(oabCondition, step.treatmentId))
    .filter(Boolean);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Care Pathway</h1>
          <p className="text-sm text-gray-500">{oabCondition.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-gray-500">{pathwayKey}</span>
          <button
            onClick={handleCopyKey}
            className="text-xs text-blue-600 hover:text-blue-800"
            title="Copy key"
          >
            Copy Key
          </button>
        </div>
      </div>

      {/* Dates */}
      {(pathway.createdAt || pathway.updatedAt) && (
        <div className="flex gap-4 text-xs text-gray-400 mb-4">
          {pathway.createdAt && (
            <span>Created: {new Date(pathway.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          )}
          {pathway.updatedAt && (
            <span>Updated: {new Date(pathway.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          )}
        </div>
      )}

      {/* Nurse protocol — main content */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <h2 className="text-sm font-medium text-gray-700">Nurse Protocol</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors ${
                copied
                  ? 'bg-green-600 text-white'
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
                  Copy Protocol
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>
        <pre className="p-6 text-xs font-mono text-gray-800 whitespace-pre-wrap print:text-[10px]">
          {protocolText}
        </pre>
      </div>

      {/* Patient education section */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-medium text-gray-700">Patient Education</h2>
            <span className="text-xs text-gray-400">
              {treatments.length} handout{treatments.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={handleDownloadPacket}
            disabled={building}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors ${
              building
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
                Download Patient Packet
              </>
            )}
          </button>
        </div>
        <div className="p-4">
          <ul className="space-y-1.5">
            {treatments.map((treatment) => treatment && (
              <li key={treatment.id} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                {treatment.name}
                {treatment.pdfHandoutPath ? (
                  <span className="text-xs text-green-600">(PDF available)</span>
                ) : (
                  <span className="text-xs text-gray-400">(placeholder)</span>
                )}
              </li>
            ))}
          </ul>
        </div>
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
