import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Container from '../../components/container';
import {
  WorkflowNode,
  getInitialNode,
  getNextNode,
  ProviderType,
  workflowNodes
} from './util/workflow';
import Button from '../../components/button';
import Quid6Questionnaire, { DiagnosisType, Quid6Result } from './components/Quid6Questionnaire';

interface PathStep {
  node: WorkflowNode;
  selectedOptionIndex?: number;
}

const Scheduling: React.FC = () => {
  const [currentNode, setCurrentNode] = useState<WorkflowNode>(getInitialNode());
  const [path, setPath] = useState<PathStep[]>([{ node: getInitialNode() }]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quid6Result, setQuid6Result] = useState<Quid6Result | null>(null);
  const navigate = useNavigate();

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
        nextNodeId = 'likelySurgical';
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
  };

  const renderProviderInfo = (providerType: ProviderType) => {
    switch (providerType) {
      case 'APP':
        return (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-700">Advanced Practice Provider (APP)</h3>
            <p className="mt-2 text-blue-600">
              Please schedule the patient with an Advanced Practice Provider. They are well-equipped to handle this type of case.
            </p>
          </div>
        );
      case 'Guanzon':
        return (
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-purple-700">Dr. Guanzon</h3>
            <p className="mt-2 text-purple-600">
              Please schedule the patient with Dr. Guanzon for surgical evaluation and treatment options.
            </p>
          </div>
        );
      case 'Stewart':
        return (
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-green-700">Dr. Stewart</h3>
            <p className="mt-2 text-green-600">
              Please schedule the patient with Dr. Stewart for surgical evaluation and treatment options.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Container className="py-8">
      <Link to="/" className="flex items-center self-start gap-4 mb-8">
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