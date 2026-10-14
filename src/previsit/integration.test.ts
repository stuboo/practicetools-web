// @vitest-environment node
// Patient -> clinic integration: build the payload the way ShareModule does,
// seal with the TEST ONLY key, open, and run the clinic-side math on it.
import { describe, expect, it } from 'vitest'
import { generateCode, lookupFor } from './crypto/code'
import { importPracticePrivateKey, openEnvelope, sealEnvelope } from './crypto/envelope'
import { TEST_ONLY_PRIVATE_JWK, TEST_ONLY_PUBLIC_JWK } from './crypto/__fixtures__/testKeys'
import { workedExampleEvents } from './diary/__fixtures__/workedExample'
import { noteText } from './diary/noteText'
import { summarizeDiary } from './diary/summary'
import { scoreQuid } from './questionnaires/quid'
import type { DiaryEvent, QuestionnaireResult, SubmissionPayload } from './types'

describe('patient share payload -> clinic viewer', () => {
  it('survives seal/open (as a JSON string, like the API) and renders', async () => {
    const answers = [2, 2, 2, 3, 3, 3]
    const { scores, interpretation } = scoreQuid(answers)
    const quid: QuestionnaireResult = { id: 'quid', answers, scores, interpretation }
    const payload: SubmissionPayload = {
      schema: 'previsit-submission/v1',
      packetId: 'new-incontinence',
      packetVersion: 1,
      createdAt: new Date().toISOString(),
      diary: { events: workedExampleEvents, unit: 'oz' },
      questionnaires: [quid],
      patientNote: 'Worse when I’m walking the dog – "lots".',
    }
    const code = generateCode()
    const env = await sealEnvelope(payload, code, TEST_ONLY_PUBLIC_JWK)
    // The API stores and returns the envelope as a string.
    const wire = JSON.parse(JSON.stringify({ lookup: await lookupFor(code), envelope: JSON.stringify(env) }))
    expect(wire.lookup).toMatch(/^[A-Za-z0-9_-]{43}$/)
    const key = await importPracticePrivateKey(TEST_ONLY_PRIVATE_JWK)
    const opened = await openEnvelope(JSON.parse(wire.envelope), code, key)

    expect(opened).toEqual(payload)
    const summary = summarizeDiary(opened.diary?.events ?? [])
    expect(summary.overall.voidedVolume24hMl).toBe(1850)
    const q = opened.questionnaires?.find((x) => x.id === 'quid')
    if (!q) throw new Error('quid missing')
    expect(q.scores.SUI).toBe(6)
    expect(q.scores.UUI).toBe(9)
    const text = noteText(summary, { quid: q, patientNote: opened.patientNote })
    expect(text).toContain('24h voided volume: 1850 mL | NUV: 650 mL | NPI: 35% (nocturnal polyuria)')
    expect(text).toContain('QUID: SUI 6, UUI 9 ->')
    expect(text).toContain('Patient note: "Worse when I\'m walking the dog - \'lots\'."')
    expect(text).toMatch(/^[\x20-\x7e\n]+$/)
  })

  it('computes day windows by instant across a DST fall-back (mixed offsets)', () => {
    // US fall-back is 2026-11-01 02:00 EDT -> 01:00 EST.
    const ev: DiaryEvent[] = [
      { id: '1', t: '2026-10-31T06:00:00-04:00', kind: 'wake' },
      { id: '2', t: '2026-10-31T06:05:00-04:00', kind: 'void', volumeMl: 300, urgency: null },
      { id: '3', t: '2026-10-31T22:30:00-04:00', kind: 'bed' },
      { id: '4', t: '2026-11-01T01:30:00-05:00', kind: 'void', volumeMl: 200, urgency: null },
      { id: '5', t: '2026-11-01T06:00:00-05:00', kind: 'wake' },
      { id: '6', t: '2026-11-01T06:10:00-05:00', kind: 'void', volumeMl: 350, urgency: null },
    ]
    const d = summarizeDiary(ev).days[0]
    expect(d.complete).toBe(true)
    expect(d.nocturiaEpisodes).toBe(1)
    expect(d.nuvMl).toBe(550)
    expect(d.voidedVolume24hMl).toBe(550)
  })
})
