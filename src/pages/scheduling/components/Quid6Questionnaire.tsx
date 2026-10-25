import React, { useState } from 'react';
import {
  answersToScores,
  DiagnosisType,
  QUID6_OPTIONS,
  QUID6_QUESTIONS,
  scoreQuid6
} from '../../../lib/quid6';

export type { DiagnosisType };

export interface Quid6Result {
  diagnosis: DiagnosisType;
  SUI_score: number;
  UUI_score: number;
  answers: Record<number, number>;
}

interface Quid6QuestionnaireProps {
  onComplete: (result: Quid6Result) => void;
}

const questions = QUID6_QUESTIONS;

const calculateResults = (answers: Record<number, number>): Quid6Result => {
  const { stressScore, urgeScore, diagnosis } = scoreQuid6(answersToScores(answers));
  return {
    diagnosis,
    SUI_score: stressScore,
    UUI_score: urgeScore,
    answers
  };
};

const Quid6Questionnaire: React.FC<Quid6QuestionnaireProps> = ({ onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  
  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = (value: number) => {
    const updatedAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(updatedAnswers);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      // Calculate results and pass to parent
      const result = calculateResults(updatedAnswers);
      setIsCompleted(true);
      onComplete(result);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
    }
  };

  // Progress indicator
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-medium">QUID-6 Assessment</h3>
        <div className="h-2 bg-gray-200 rounded-full mt-2">
          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {!isCompleted ? (
        <div>
          <p className="text-lg font-medium mb-4">Question {currentQuestionIndex + 1} of {questions.length}</p>
          <p className="mb-6">{currentQuestion.text}</p>

          <div className="space-y-3">
            {QUID6_OPTIONS.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option.value)}
                className="w-full p-3 text-left rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                {option.text}
              </button>
            ))}
          </div>

          {currentQuestionIndex > 0 && (
            <button 
              onClick={handleBack}
              className="mt-6 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
          )}
        </div>
      ) : (
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-lg font-medium text-green-700">QUID-6 assessment completed!</p>
          <p>Continue to see your recommendation.</p>
        </div>
      )}
    </div>
  );
};

export default Quid6Questionnaire; 