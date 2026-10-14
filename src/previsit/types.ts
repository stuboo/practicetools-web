// Shared types for pre-visit packets (spec: docs/previsit-packets-spec.md §4.2, §6.1).
// DiaryEvent kinds and enum values are stable codes; never rename them (§6.1).

export type Packet = {
  id: string
  version: number
  title: string
  visitLabel: string
  modules: Module[]
}

export type ModuleBase = {
  id: string
  title: string
  startOffsetDays: number
  estMinutes?: number
}

export type Module =
  | (ModuleBase & { kind: 'info'; blocks: Block[] })
  | (ModuleBase & { kind: 'questionnaire'; questionnaireId: 'quid' })
  | (ModuleBase & { kind: 'diary'; days: 3 })
  | (ModuleBase & { kind: 'share' })

export type Block =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | { type: 'callout'; tone: 'info' | 'warning'; text: string }
  | { type: 'video'; youtubeId: string; caption?: string }
  | { type: 'image'; src: string; alt: string }
  | { type: 'link'; href: string; text: string }

export type Urgency = 0 | 1 | 2 | 3 | 4
export type LeakAmount = 'drops' | 'moderate' | 'soaked'
export type LeakTrigger = 'cough_sneeze_laugh' | 'activity' | 'urgency' | 'no_reason' | 'other'
export type Beverage = 'water' | 'coffee' | 'tea' | 'soda' | 'alcohol' | 'juice' | 'milk' | 'other'

// t = local ISO-8601 with offset, e.g. "2026-11-01T06:00:00-05:00"
export type DiaryEvent =
  | { id: string; t: string; kind: 'void'; volumeMl: number | null; urgency: Urgency | null }
  | { id: string; t: string; kind: 'leak'; amount: LeakAmount; trigger: LeakTrigger; padChanged: boolean }
  | { id: string; t: string; kind: 'intake'; volumeMl: number; beverage: Beverage; caffeinated: boolean }
  | { id: string; t: string; kind: 'bed' }
  | { id: string; t: string; kind: 'wake' }

export type DiaryUnit = 'ml' | 'oz'

export type QuestionnaireResult = {
  id: 'quid'
  answers: number[]
  scores: Record<string, number>
  interpretation: string
}

export type SubmissionPayload = {
  schema: 'previsit-submission/v1'
  packetId: string
  packetVersion: number
  createdAt: string
  diary?: { events: DiaryEvent[]; unit: DiaryUnit }
  questionnaires?: QuestionnaireResult[]
  patientNote?: string // ≤500 chars
}
