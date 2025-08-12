import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Container from '../../components/container';
import Button from '../../components/button';
import { useAuditStorage } from '../../hooks/useAuditStorage';
import { AuditRecord } from './types/audit';
import { workflowNodes } from './util/workflow';

const AuditLookup: React.FC = () => {
  const [searchKey, setSearchKey] = useState('');
  const [auditRecord, setAuditRecord] = useState<AuditRecord | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { lookupAuditRecord, getStats } = useAuditStorage();

  const stats = getStats();

  const handleSearch = () => {
    if (!searchKey.trim()) return;

    setIsSearching(true);
    setNotFound(false);
    setAuditRecord(null);

    setTimeout(() => {
      const record = lookupAuditRecord(searchKey.trim().toUpperCase());
      if (record) {
        setAuditRecord(record);
        setNotFound(false);
      } else {
        setAuditRecord(null);
        setNotFound(true);
      }
      setIsSearching(false);
    }, 300);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const renderDecisionPath = (record: AuditRecord) => {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-3">Complete Decision Path:</h4>
        <ol className="list-decimal list-inside space-y-2">
          {record.path.map((step, index) => (
            <li key={index} className="text-gray-700">
              <span className="font-medium">{step.node.text}</span>
              {step.selectedOptionIndex !== undefined && step.node.options && (
                <div className="ml-6 mt-1 text-blue-600">
                  → Selected: {step.node.options[step.selectedOptionIndex].text}
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    );
  };

  const renderQuid6Results = (record: AuditRecord) => {
    if (!record.quid6Result) return null;

    return (
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-3">QUID-6 Assessment Results:</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-800">Stress Score:</span>
            <span className="ml-2 text-blue-700">{record.quid6Result.stressScore}</span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Urge Score:</span>
            <span className="ml-2 text-blue-700">{record.quid6Result.urgeScore}</span>
          </div>
          <div className="col-span-2">
            <span className="font-medium text-blue-800">Interpretation:</span>
            <span className="ml-2 text-blue-700">{record.quid6Result.interpretation}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Container className="py-8">
      <Link to="/scheduling" className="flex items-center self-start gap-4 mb-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 lg:w-6 lg:h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75"
          />
        </svg>
        <h1 className="text-md lg:text-2xl font-light">
          Back to Scheduling Assistant
        </h1>
      </Link>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Audit Trail Lookup</h2>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4 text-center">
              Enter an audit key to view the complete decision path for a scheduling recommendation.
            </p>
            
            <div className="flex gap-3 max-w-md mx-auto">
              <input
                type="text"
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="Enter 8-character audit key"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-mono text-center tracking-wider uppercase"
                maxLength={8}
              />
              <Button
                title={isSearching ? "Searching..." : "Search"}
                onClick={handleSearch}
                disabled={!searchKey.trim() || isSearching}
                colorScheme="blue"
              />
            </div>
          </div>

          {/* Search Results */}
          {isSearching && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 text-gray-600">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    fill="none"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Searching audit records...
              </div>
            </div>
          )}

          {notFound && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <h3 className="font-semibold text-red-800 mb-2">Audit Key Not Found</h3>
              <p className="text-red-600 text-sm">
                No audit record found for key "{searchKey}". Please check the key and try again.
              </p>
            </div>
          )}

          {auditRecord && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-3">Audit Record Found</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-green-800">Audit Key:</span>
                    <div className="font-mono text-lg text-green-700">{auditRecord.key}</div>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Final Recommendation:</span>
                    <div className="text-green-700 capitalize">{auditRecord.finalRecommendation}</div>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Completed:</span>
                    <div className="text-green-700">{formatDate(auditRecord.timestamp)}</div>
                  </div>
                </div>
              </div>

              {/* Decision Path */}
              {renderDecisionPath(auditRecord)}

              {/* QUID-6 Results */}
              {renderQuid6Results(auditRecord)}
            </div>
          )}
        </div>

        {/* Storage Statistics */}
        <div className="mt-8 bg-gray-50 p-4 rounded-lg text-center text-sm text-gray-600">
          <p>
            Total audit records stored: <span className="font-medium">{stats.recordCount}</span> | 
            Estimated storage used: <span className="font-medium">{stats.estimatedSizeKB} KB</span>
          </p>
        </div>
      </div>
    </Container>
  );
};

export default AuditLookup;