import React from 'react';
import { Copy, Check } from 'lucide-react';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';

interface AuditKeyDisplayProps {
  auditKey: string;
}

export function AuditKeyDisplay({ auditKey }: AuditKeyDisplayProps) {
  const [copiedText, copyToClipboard] = useCopyToClipboard();
  const copied = copiedText === auditKey;

  const handleCopy = () => {
    copyToClipboard(auditKey);
  };

  return (
    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-sm font-medium text-blue-900 mb-2">
        Audit Trail Key
      </h3>
      <p className="text-sm text-blue-700 mb-3">
        Copy this audit key into appointment notes for future reference:
      </p>
      
      <div className="flex items-center gap-2">
        <div 
          className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded font-mono text-lg tracking-wider text-center cursor-pointer hover:bg-blue-50 transition-colors"
          onClick={handleCopy}
          title="Click to copy audit key"
        >
          {auditKey}
        </div>
        
        <button
          onClick={handleCopy}
          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
          title={copied ? "Copied!" : "Copy audit key"}
        >
          {copied ? (
            <Check className="w-5 h-5 text-green-600" />
          ) : (
            <Copy className="w-5 h-5" />
          )}
        </button>
      </div>
      
      {copied && (
        <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
          <Check className="w-4 h-4" />
          Audit key copied to clipboard
        </p>
      )}
    </div>
  );
}