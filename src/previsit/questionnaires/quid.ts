// QUID (Questionnaire for Urinary Incontinence Diagnosis) question definitions and scoring.
// Shared by the /quid6 scheduling page and the pre-visit packet registry.

export type DiagnosisResult = {
  diagnosis: string
  recommendation: string
}

export interface Question {
  id: number
  text: string
  shortText: string
  options: {
    text: string
    value: number
  }[]
  category: 'SUI' | 'UUI'
}

export const questions: Question[] = [
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

export const calculateResults = (answers: Record<number, number>): DiagnosisResult => {
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

export const getScoreString = (answers: Record<number, number>): string => {
  return Array.from({ length: 6 }, (_, i) => answers[i + 1] || 0).join('')
}

export const ANSWER_LABELS = ['None of the time', 'Rarely', 'Sometimes', 'Most of the time', 'All of the time']

// Scores for an ordered array of 6 answers (0-4). Missing answers count as 0.
export const scoreQuid = (answers: number[]): { scores: { SUI: number; UUI: number }; interpretation: string } => {
  const byId: Record<number, number> = {}
  answers.forEach((value, i) => {
    byId[i + 1] = value
  })
  const scores = Array.from({ length: 6 }, (_, i) => byId[i + 1] || 0)
  return {
    scores: {
      SUI: scores.slice(0, 3).reduce((sum, v) => sum + v, 0),
      UUI: scores.slice(3, 6).reduce((sum, v) => sum + v, 0),
    },
    interpretation: calculateResults(byId).diagnosis,
  }
}
