import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Container from '../../components/container';
import {
  WorkflowNode,
  getInitialNode,
  getNextNode,
  ProviderType
} from './util/workflow';
import Button from '../../components/button';

const Scheduling: React.FC = () => {
  const [currentNode, setCurrentNode] = useState<WorkflowNode>(getInitialNode());
  const [path, setPath] = useState<WorkflowNode[]>([getInitialNode()]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleOptionSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
  };

  const handleNext = () => {
    if (selectedOption === null) return;

    if (currentNode.redirectToQuid6) {
      // If we need to redirect to QUID-6, navigate there
      navigate('/quid6');
      return;
    }

    const nextNode = getNextNode(currentNode.id, selectedOption);
    if (nextNode) {
      setCurrentNode(nextNode);
      setPath([...path, nextNode]);
      setSelectedOption(null);
    }
  };

  const handleBack = () => {
    if (path.length > 1) {
      const newPath = [...path];
      newPath.pop();
      setPath(newPath);
      setCurrentNode(newPath[newPath.length - 1]);
      setSelectedOption(null);
    }
  };

  const handleRestart = () => {
    const initialNode = getInitialNode();
    setCurrentNode(initialNode);
    setPath([initialNode]);
    setSelectedOption(null);
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
        </div>

        {/* Navigation Buttons */}
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
              title={currentNode.redirectToQuid6 ? "Go to QUID-6" : "Next"}
              onClick={handleNext}
              disabled={selectedOption === null}
              colorScheme="blue"
            />
          )}
        </div>
      </div>

      {/* Path History */}
      <div className="mt-8 max-w-2xl mx-auto">
        <h3 className="text-lg font-medium mb-2">Decision Path:</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <ol className="list-decimal list-inside">
            {path.map((node, index) => (
              <li key={index} className="py-1">
                {node.text}
                {index < path.length - 1 && selectedOption !== null && node.options && (
                  <span className="text-blue-600"> → {node.options[path[index + 1].id === 'patientAge' ? 0 : selectedOption].text}</span>
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