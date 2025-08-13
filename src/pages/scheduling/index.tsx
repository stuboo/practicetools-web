import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Container from '../../components/container';
import {
  WorkflowNode,
  getInitialNode,
  getNextNode,
  ProviderType,
  workflowNodes,
  PathStep
} from './util/workflow';
import Button from '../../components/button';
import Quid6Questionnaire, { DiagnosisType, Quid6Result } from './components/Quid6Questionnaire';
import { AuditKeyDisplay } from './components/AuditKeyDisplay';
import { useAuditStorage } from '../../hooks/useAuditStorage';

const Scheduling: React.FC = () => {
  const [currentNode, setCurrentNode] = useState<WorkflowNode>(getInitialNode());
  const [path, setPath] = useState<PathStep[]>([{ node: getInitialNode() }]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quid6Result, setQuid6Result] = useState<Quid6Result | null>(null);
  const [auditKey, setAuditKey] = useState<string | null>(null);
  const navigate = useNavigate();
  const { createAuditRecord } = useAuditStorage();

  // Generate audit key when reaching a result node
  useEffect(() => {
    if (currentNode.type === 'result' && currentNode.result && auditKey === null) {
      const generateAuditKey = async () => {
        try {
          // Convert DiagnosisType to our audit format if quid6Result exists
          const auditQuid6Result = quid6Result ? {
            totalScore: quid6Result.SUI_score + quid6Result.UUI_score,
            stressScore: quid6Result.SUI_score,
            urgeScore: quid6Result.UUI_score,
            overallIncontinenceImpact: quid6Result.SUI_score + quid6Result.UUI_score,
            interpretation: quid6Result.diagnosis
          } : undefined;

          const key = await createAuditRecord(
            path,
            currentNode.result as ProviderType,
            auditQuid6Result
          );
          
          // Set the key even if it's null (API failure), so we don't keep retrying
          setAuditKey(key || 'FAILED');
        } catch (error) {
          console.error('Failed to create audit record:', error);
          setAuditKey('FAILED');
        }
      };
      
      generateAuditKey();
    }
  }, [currentNode, path, quid6Result, auditKey, createAuditRecord]);

  const handleOptionSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
  };

  const handleQuid6Complete = (result: Quid6Result) => {
    setQuid6Result(result);
    
    // Determine the next node based on QUID-6 results
    let nextNodeId: string;
    switch (result.diagnosis) {
      case 'Stress Incontinence':
      case 'Stress-Predominant Mixed':
        nextNodeId = 'scheduleWithSurgeon';
        break;
      case 'Urge Incontinence':
      case 'Urge-Predominant Mixed':
      default:
        nextNodeId = 'scheduleWithAPP';
        break;
    }
    
    // Add QUID-6 result information to the path
    const updatedPath = [...path];
    const quid6Node = updatedPath[updatedPath.length - 1].node;
    
    // Create a detailed text summary for the path history
    const resultSummary = 
      `QUID-6 Result: ${result.diagnosis} (SUI: ${result.SUI_score}, UUI: ${result.UUI_score})`;
    
    // Continue to the next node
    const nextNode = { 
      ...quid6Node,
      text: resultSummary
    };
    
    setPath([...updatedPath.slice(0, -1), { node: nextNode }]);
    setCurrentNode(nextNode);
    
    // Wait a moment before proceeding to the next step
    setTimeout(() => {
      const followingNode = workflowNodes[nextNodeId];
      if (followingNode) {
        setCurrentNode(followingNode);
        setPath([...updatedPath.slice(0, -1), { node: nextNode }, { node: followingNode }]);
      }
    }, 1500);
  };

  const handleNext = () => {
    if (selectedOption === null) return;

    // Update the current step with the selected option
    const updatedPath = [...path];
    updatedPath[updatedPath.length - 1].selectedOptionIndex = selectedOption;

    const nextNode = getNextNode(currentNode.id, selectedOption);
    if (nextNode) {
      setCurrentNode(nextNode);
      setPath([...updatedPath, { node: nextNode }]);
      setSelectedOption(null);
    }
  };

  const handleBack = () => {
    if (path.length > 1) {
      const newPath = [...path];
      newPath.pop();
      setPath(newPath);
      setCurrentNode(newPath[newPath.length - 1].node);
      setSelectedOption(newPath[newPath.length - 1].selectedOptionIndex || null);
    }
  };

  const handleRestart = () => {
    const initialNode = getInitialNode();
    setCurrentNode(initialNode);
    setPath([{ node: initialNode }]);
    setSelectedOption(null);
    setQuid6Result(null);
    setAuditKey(null);
  };

  const renderProviderInfo = (result: string) => {
    // Calculate date 90 days from today for APP scheduling note
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90);
    const formattedDate = futureDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    switch (result) {
      case 'Guanzon':
      case 'Stewart':
      case 'Surgeon':
        return (
          <div className="bg-blue-100 p-4 rounded-md my-4">
            <h3 className="text-lg font-semibold mb-2">Surgeon</h3>
            <p>Please schedule the patient with a surgeon for evaluation and treatment options.</p>
          </div>
        )
      case 'APP':
        return (
          <div className="bg-blue-100 p-4 rounded-md my-4">
            <h3 className="text-lg font-semibold mb-2">Advanced Practice Provider (APP)</h3>
            <p>Please schedule the patient with an APP for evaluation and treatment options.</p>
            <p className="mt-2 text-sm italic">
              Note: If the APP is scheduling new patients more than 90 days from today ({formattedDate}), 
              it is okay to schedule this patient with a surgeon.
            </p>
          </div>
        )
      case 'PT':
        return (
          <div className="bg-green-100 p-4 rounded-md my-4">
            <h3 className="text-lg font-semibold mb-2">Physical Therapy</h3>
            <p>Please schedule the patient with a physical therapist for pelvic floor therapy.</p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Container className="py-8">
      <div className="flex items-center justify-between mb-8">
        <Link to="/" className="flex items-center gap-4">
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
            Scheduling Assistant
          </h1>
        </Link>

        <Link 
          to="/scheduling/audit" 
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 6.75V6A2.25 2.25 0 0 0 11.25 3.75H8.25A2.25 2.25 0 0 0 6 6v.75a1.125 1.125 0 0 1-1.125 1.125h-1.5A3.375 3.375 0 0 0 0 12.375V21a.75.75 0 0 0 .75.75h15a.75.75 0 0 0 .75-.75v-8.625M21 12l-3-3m3 3l-3 3m3-3H9"
            />
          </svg>
          Audit Lookup
        </Link>
      </div>

      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${(path.length / 6) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
        {/* Node Content */}
        <div className="mb-6">
          {currentNode.isQuid6 ? (
            <Quid6Questionnaire onComplete={handleQuid6Complete} />
          ) : (
            <>
              <h2 className="text-xl font-bold mb-4">{currentNode.text}</h2>
              
              {currentNode.type === 'result' && currentNode.result && (
                <div className="mt-4">
                  {renderProviderInfo(currentNode.result)}
                  {auditKey && auditKey !== 'FAILED' && <AuditKeyDisplay auditKey={auditKey} />}
                  {auditKey === 'FAILED' && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h3 className="text-sm font-medium text-yellow-900 mb-2">
                        Audit Trail Unavailable
                      </h3>
                      <p className="text-sm text-yellow-700">
                        Unable to generate audit key at this time. The recommendation is still valid.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Options */}
              {currentNode.options && currentNode.options.length > 0 && (
                <div className="flex flex-col gap-3 mt-4">
                  {currentNode.options.map((option, index) => (
                    <button
                      key={index}
                      className={`p-3 rounded-lg text-left ${
                        selectedOption === index
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                      onClick={() => handleOptionSelect(index)}
                    >
                      {option.text}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Navigation Buttons */}
        {!currentNode.isQuid6 && (
          <div className="flex justify-between mt-6">
            {path.length > 1 ? (
              <Button
                title="Back"
                onClick={handleBack}
                variant="outline"
              />
            ) : (
              <div></div>
            )}

            {currentNode.type === 'result' ? (
              <Button
                title="Start Over"
                onClick={handleRestart}
                colorScheme="blue"
              />
            ) : (
              <Button
                title="Next"
                onClick={handleNext}
                disabled={selectedOption === null}
                colorScheme="blue"
              />
            )}
          </div>
        )}
      </div>

      {/* Path History */}
      <div className="mt-8 max-w-2xl mx-auto">
        <h3 className="text-lg font-medium mb-2">Decision Path:</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <ol className="list-decimal list-inside">
            {path.map((step, index) => (
              <li key={index} className="py-1">
                {step.node.text}
                {step.selectedOptionIndex !== undefined && step.node.options && (
                  <span className="text-blue-600"> → {step.node.options[step.selectedOptionIndex].text}</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Container>
  );
};

export default Scheduling; 