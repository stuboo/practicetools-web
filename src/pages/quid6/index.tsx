import React, { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

type Step = 'consent' | 'questions' | 'results'
type DiagnosisResult = {
  diagnosis: string
  recommendation: string
}

interface Question {
  id: number
  text: string
  shortText: string
  options: {
    text: string
    value: number
  }[]
  category: 'SUI' | 'UUI'
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
]

const calculateResults = (answers: Record<number, number>): DiagnosisResult => {
  // Convert answers object to array of scores in order
  const scores = Array.from({ length: 6 }, (_, i) => answers[i + 1] || 0)
  
  // Calculate SUI and UUI scores
  const SUI_score = scores.slice(0, 3).reduce((sum, score) => sum + score, 0)
  const UUI_score = scores.slice(3, 6).reduce((sum, score) => sum + score, 0)

  // Apply diagnosis criteria
  const has_SUI = SUI_score >= 4
  const has_UUI = UUI_score >= 6

  if (has_SUI && has_UUI) {
    if (SUI_score > UUI_score) {
      return {
        diagnosis: "Stress-Predominant Mixed Urinary Incontinence",
        recommendation: "Schedule with surgeon"
      }
    } else {
      return {
        diagnosis: "Urge-Predominant Mixed Urinary Incontinence",
        recommendation: "Schedule with APP"
      }
    }
  } else if (has_SUI) {
    return {
      diagnosis: "Stress Urinary Incontinence",
      recommendation: "Schedule with surgeon"
    }
  } else if (has_UUI) {
    return {
      diagnosis: "Urge Urinary Incontinence",
      recommendation: "Schedule with APP"
    }
  } else {
    return {
      diagnosis: "No clear predominance; further evaluation may be needed",
      recommendation: "Schedule with APP"
    }
  }
}

const getScoreString = (answers: Record<number, number>): string => {
  return Array.from({ length: 6 }, (_, i) => answers[i + 1] || 0).join('')
}

const generateDetailedReport = (scoreString: string): string => {
  const scores = scoreString.split('').map(Number)
  if (scores.length !== 6) return 'Invalid QUID-6 score format'

  const SUI_score = scores.slice(0, 3).reduce((a, b) => a + b, 0)
  const UUI_score = scores.slice(3, 6).reduce((a, b) => a + b, 0)

  const getAnswerText = (value: number) => {
    const answers = ["None of the time", "Rarely", "Sometimes", "Most of the time", "All of the time"]
    return answers[value]
  }

  let report = 'QUID-6 Questionnaire\n'
  report += '==================\n'
  
  // Add questions and answers with short text
  questions.forEach((q, index) => {
    report += `${q.shortText} -> ${getAnswerText(scores[index])}\n`
  })

  report += '==================\n'
  report += `SUI Score: ${SUI_score}\n`
  report += `UUI Score: ${UUI_score}`

  return report
}

export default function Quid6() {
  const [currentStep, setCurrentStep] = useState<Step>('consent')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [isParserOpen, setIsParserOpen] = useState(false)
  const [scoreInput, setScoreInput] = useState('')
  const [detailedReport, setDetailedReport] = useState('')
  const [reportCopySuccess, setReportCopySuccess] = useState(false)

  const handleConsent = (given: boolean) => {
    setConsentGiven(given)
    if (given) {
      setCurrentStep('questions')
    } else {
      setCurrentStep('results')
    }
  }

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      setCurrentStep('results')
    }
  }

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    } else if (currentStep === 'questions') {
      setCurrentStep('consent')
      setConsentGiven(null)
    }
  }

  const handleCopyScore = async () => {
    try {
      await navigator.clipboard.writeText(`QUID-6: ${getScoreString(answers)}`)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy score:', err)
    }
  }

  const handleScoreParse = () => {
    // Find any sequence of 6 digits (0-4) within the input string
    const match = scoreInput.match(/[0-4]{6}/)
    if (match) {
      setDetailedReport(generateDetailedReport(match[0]))
    }
  }

  const handleReportCopy = async () => {
    try {
      await navigator.clipboard.writeText(detailedReport)
      setReportCopySuccess(true)
      setTimeout(() => setReportCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy report:', err)
    }
  }

  const renderConsent = () => (
    <div className="space-y-6">
      <p className="text-lg text-gray-700">
        "I'd like to ask you a few more questions to make sure I get you scheduled appropriately. Would that be okay?"
      </p>
      <div className="flex gap-4 justify-center">
        <button
          onClick={() => handleConsent(true)}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Yes, proceed with questions
        </button>
        <button
          onClick={() => handleConsent(false)}
          className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          No, schedule with APP
        </button>
      </div>
    </div>
  )

  const renderQuestion = () => {
    const question = questions[currentQuestionIndex]
    return (
      <div className="space-y-6">
        <p className="text-lg text-gray-700">{question.text}</p>
        <div className="space-y-3">
          {question.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleAnswer(question.id, option.value)}
              className="w-full px-6 py-3 text-left bg-white border border-gray-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              {option.text}
            </button>
          ))}
        </div>
        {currentQuestionIndex > 0 && (
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 text-blue-500 hover:text-blue-600 transition-colors"
          >
            ← Back
          </button>
        )}
      </div>
    )
  }

  const renderResults = () => (
    <div className="space-y-6">
      {consentGiven === false ? (
        <div>
          <p className="text-lg text-gray-700">Schedule with APP</p>
          <button
            onClick={() => {
              setCurrentStep('consent')
              setConsentGiven(null)
            }}
            className="mt-4 px-4 py-2 text-blue-500 hover:text-blue-600 transition-colors"
          >
            ← Start Over
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Assessment Results</h2>
            {Object.keys(answers).length === 6 && (
              <>
                <div className="mb-4">
                  <p className="text-lg font-medium text-gray-900">
                    {calculateResults(answers).diagnosis}
                  </p>
                  <p className="text-md text-gray-600 mt-2">
                    Recommendation: {calculateResults(answers).recommendation}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  <p>SUI Score: {
                    Object.entries(answers)
                      .filter(([id]) => parseInt(id) <= 3)
                      .reduce((sum, [_, value]) => sum + value, 0)
                  }</p>
                  <p>UUI Score: {
                    Object.entries(answers)
                      .filter(([id]) => parseInt(id) > 3)
                      .reduce((sum, [_, value]) => sum + value, 0)
                  }</p>
                </div>
              </>
            )}
          </div>
          
          {Object.keys(answers).length === 6 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="font-mono text-lg">
                  QUID-6: {getScoreString(answers)}
                </div>
                <button
                  onClick={handleCopyScore}
                  className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                >
                  {copySuccess ? 'Copied!' : 'Copy Score'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Click the button to copy this score to your clipboard for scheduling notes
              </p>
            </div>
          )}

          <button
            onClick={() => {
              setCurrentStep('consent')
              setConsentGiven(null)
              setAnswers({})
              setCurrentQuestionIndex(0)
            }}
            className="mt-4 px-4 py-2 text-blue-500 hover:text-blue-600 transition-colors"
          >
            ← Start Over
          </button>
        </div>
      )}
    </div>
  )

  const renderScoreParser = () => (
    <Dialog.Root open={isParserOpen} onOpenChange={setIsParserOpen}>
      <Dialog.Trigger asChild>
        <button className="fixed bottom-4 right-4 p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-xl font-semibold">
              QUID-6 Score Parser
            </Dialog.Title>
            <Dialog.Close className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </Dialog.Close>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paste QUID-6 Score
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={scoreInput}
                  onChange={(e) => setScoreInput(e.target.value)}
                  placeholder="e.g., QUID-6: 012340"
                  className="flex-1 p-2 border rounded-lg"
                />
                <button
                  onClick={handleScoreParse}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Generate Report
                </button>
              </div>
            </div>

            {detailedReport && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Detailed Report</h3>
                  <button
                    onClick={handleReportCopy}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                  >
                    {reportCopySuccess ? 'Copied!' : 'Copy Report'}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg text-sm font-mono">
                  {detailedReport}
                </pre>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">QUID-6 Assessment</h1>
      <div className="bg-white rounded-lg shadow-md p-8">
        {currentStep === 'consent' && renderConsent()}
        {currentStep === 'questions' && renderQuestion()}
        {currentStep === 'results' && renderResults()}
      </div>
      {renderScoreParser()}
    </div>
  )
} 