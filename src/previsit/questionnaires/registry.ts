import { questions, scoreQuid, type Question } from './quid'

export type LicenseStatus = 'cleared' | 'needs-review'

export type QuestionnaireScore = {
  scores: Record<string, number>
  interpretation: string
}

export type Questionnaire = {
  id: string
  title: string
  questions: Question[]
  score: (answers: number[]) => QuestionnaireScore
  citation: string
  licenseStatus: LicenseStatus
}

// Only 'cleared' instruments may appear in a non-draft packet (spec §7.1).
const REGISTRY: Questionnaire[] = [
  {
    id: 'quid',
    title: 'Questionnaire for Urinary Incontinence Diagnosis (QUID)',
    questions,
    score: scoreQuid,
    citation:
      'Bradley CS, Rahn DD, Nygaard IE, et al. The questionnaire for urinary incontinence diagnosis (QUID): validity and responsiveness to change in women undergoing non-surgical therapies for treatment of stress predominant urinary incontinence. Neurourol Urodyn. 2010;29(5):727-734.',
    licenseStatus: 'cleared',
  },
]

export const listQuestionnaires = (): Questionnaire[] => REGISTRY

export const getQuestionnaire = (id: string): Questionnaire | undefined =>
  REGISTRY.find((q) => q.id === id)
