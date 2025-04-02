import React, { useState } from 'react';

interface Question {
  id: number;
  text: string;
  shortText: string;
  options: {
    text: string;
    value: number;
  }[];
  category: 'SUI' | 'UUI';
}

export type DiagnosisType = 'Stress Incontinence' | 'Urge Incontinence' | 'Stress-Predominant Mixed' | 'Urge-Predominant Mixed' | 'Inconclusive';

export interface Quid6Result {
  diagnosis: DiagnosisType;
  SUI_score: number;
  UUI_score: number;
  answers: Record<number, number>;
}

interface Quid6QuestionnaireProps {
  onComplete: (result: Quid6Result) => void;
}

const questions: Question[] = [
  {
    id: 1,
    text: "Do you leak urine (even small drops), wet yourself, or wet your pads or undergarments when you cough or sneeze?",
    shortText: "Leakage with cough/sneeze?",
    category: 'SUI',
    options: [
      { text: "None of the time", value: 0 },
      { text: "Rarely", value: 1 },
      { text: "Sometimes", value: 2 },
      { text: "Most of the time", value: 3 },
      { text: "All of the time", value: 4 }
    ]
  },
  {
    id: 2,
    text: "Do you leak urine (even small drops), wet yourself, or wet your pads or undergarments when you bend down or lift something up?",
    shortText: "Leakage with bending/lifting?",
    category: 'SUI',
    options: [
      { text: "None of the time", value: 0 },
      { text: "Rarely", value: 1 },
      { text: "Sometimes", value: 2 },
      { text: "Most of the time", value: 3 },
      { text: "All of the time", value: 4 }
    ]
  },
  {
    id: 3,
    text: "Do you leak urine (even small drops), wet yourself, or wet your pads or undergarments when you walk quickly, jog or exercise?",
    shortText: "Leakage with activity?",
    category: 'SUI',
    options: [
      { text: "None of the time", value: 0 },
      { text: "Rarely", value: 1 },
      { text: "Sometimes", value: 2 },
      { text: "Most of the time", value: 3 },
      { text: "All of the time", value: 4 }
    ]
  },
  {
    id: 4,
    text: "Do you leak urine (even small drops), wet yourself, or wet your pads or undergarments when you are on your way to the bathroom?",
    shortText: "Leakage on way to bathroom?",
    category: 'UUI',
    options: [
      { text: "None of the time", value: 0 },
      { text: "Rarely", value: 1 },
      { text: "Sometimes", value: 2 },
      { text: "Most of the time", value: 3 },
      { text: "All of the time", value: 4 }
    ]
  },
  {
    id: 5,
    text: "Do you leak urine (even small drops), wet yourself, or wet your pads or undergarments when you get such a strong and uncomfortable need to urinate that you leak urine (even small drops) or wet yourself before reaching the toilet?",
    shortText: "Leakage with strong urge?",
    category: 'UUI',
    options: [
      { text: "None of the time", value: 0 },
      { text: "Rarely", value: 1 },
      { text: "Sometimes", value: 2 },
      { text: "Most of the time", value: 3 },
      { text: "All of the time", value: 4 }
    ]
  },
  {
    id: 6,
    text: "Do you have to rush to the bathroom because you get a sudden, strong need to urinate?",
    shortText: "Rush to bathroom with urge?",
    category: 'UUI',
    options: [
      { text: "None of the time", value: 0 },
      { text: "Rarely", value: 1 },
      { text: "Sometimes", value: 2 },
      { text: "Most of the time", value: 3 },
      { text: "All of the time", value: 4 }
    ]
  }
];

const calculateResults = (answers: Record<number, number>): Quid6Result => {
  // Convert answers object to array of scores in order
  const scores = Array.from({ length: 6 }, (_, i) => answers[i + 1] || 0);
  
  // Calculate SUI and UUI scores
  const SUI_score = scores.slice(0, 3).reduce((sum, score) => sum + score, 0);
  const UUI_score = scores.slice(3, 6).reduce((sum, score) => sum + score, 0);

  // Apply diagnosis criteria
  const has_SUI = SUI_score >= 4;
  const has_UUI = UUI_score >= 6;

  let diagnosis: DiagnosisType = 'Inconclusive';

  if (has_SUI && has_UUI) {
    if (SUI_score > UUI_score) {
      diagnosis = 'Stress-Predominant Mixed';
    } else {
      diagnosis = 'Urge-Predominant Mixed';
    }
  } else if (has_SUI) {
    diagnosis = 'Stress Incontinence';
  } else if (has_UUI) {
    diagnosis = 'Urge Incontinence';
  }

  return {
    diagnosis,
    SUI_score,
    UUI_score,
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
            {currentQuestion.options.map((option, index) => (
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