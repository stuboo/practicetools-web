// Per-packet storage keys (values live in storage.ts under `${packetId}::${key}`).
// Shared by the patient app modules so they agree on where things are kept.
export const KEYS = {
  visitDate: 'visitDate', // 'YYYY-MM-DD'
  diary: 'diary', // { events: DiaryEvent[]; unit: DiaryUnit }
  diaryFinished: 'diaryFinished', // boolean
  teachingSeen: 'teachingSeen', // boolean
  quid: 'quid', // QuestionnaireResult
  completedModules: 'completedModules', // string[] of module ids
  patientNote: 'patientNote', // string, ≤500 chars
  submission: 'submission', // { code: string; expiresAt: string; createdAt: string }
  eventsSent: 'eventsSent', // string[] of analytics events already sent from this device
} as const
