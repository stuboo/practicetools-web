import { describe, expect, it } from 'vitest'
import { noteText } from './noteText'
import { summarizeDiary } from './summary'
import { workedExampleEvents } from './__fixtures__/workedExample'

const quid = {
  id: 'quid' as const,
  answers: [2, 2, 2, 3, 3, 3],
  scores: { SUI: 6, UUI: 9 },
  interpretation: 'Urge-predominant mixed incontinence',
}

describe('noteText', () => {
  const summary = summarizeDiary(workedExampleEvents)

  it('produces the exact spec 6.5 output for the worked example', () => {
    const text = noteText(summary, {
      quid,
      patientNote: 'Worse after coffee.',
    })
    expect(text).toBe(
      [
        'PRE-VISIT BLADDER DIARY (patient-entered, 1 complete day, 11/02-11/03/2026)',
        '24h frequency: 7.0 (day 6.0, night 1.0)',
        '24h voided volume: 1850 mL | NUV: 650 mL | NPI: 35% (nocturnal polyuria)',
        'Max voided volume: 400 mL (first morning) | Mean: 281 mL',
        'Leaks/24h: 2.0 (stress 1.0, urge 1.0, other 0.0) | Pads/24h: 1.0',
        'Fluid intake/24h: 1090 mL (caffeinated 1.0, alcohol 0.0)',
        'Data quality: Fewer than 3 complete days',
        'QUID: SUI 6, UUI 9 -> Urge-predominant mixed incontinence',
        'Patient note: "Worse after coffee."',
      ].join('\n')
    )
  })

  it('omits QUID and patient note lines when absent', () => {
    const text = noteText(summary)
    expect(text).not.toContain('QUID')
    expect(text).not.toContain('Patient note')
  })

  it('is ASCII, tab-free and at most 80 chars per line', () => {
    const text = noteText(summary, {
      quid: { ...quid, interpretation: 'Café “mixed” — '.repeat(8) },
      patientNote: 'It’s bad.\n\tVery long note '.repeat(20),
    })
    expect(text).toMatch(/^[\x20-\x7e\n]*$/)
    expect(text).not.toContain('\t')
    for (const line of text.split('\n')) {
      expect(line.length).toBeLessThanOrEqual(80)
    }
  })

  it('says all voids measured when there is nothing to report', () => {
    const t = (d: string, h: string) => `${d}T${h}:00-05:00`
    const events = [0, 1, 2].flatMap((i) => {
      const d = `2026-11-0${2 + i}`
      const n = `2026-11-0${3 + i}`
      return [
        { id: `w${i}`, t: t(d, '06:00'), kind: 'wake' as const },
        {
          id: `v${i}`,
          t: t(d, '06:10'),
          kind: 'void' as const,
          volumeMl: 300,
          urgency: null,
        },
        { id: `b${i}`, t: t(d, '22:00'), kind: 'bed' as const },
        { id: `n${i}`, t: t(n, '06:00'), kind: 'wake' as const },
      ]
    })
    events.push({
      id: 'v9',
      t: t('2026-11-05', '06:10'),
      kind: 'void',
      volumeMl: 300,
      urgency: null,
    })
    const text = noteText(summarizeDiary(events))
    expect(text).toContain('Data quality: all voids measured')
    expect(text.split('\n')[0]).toContain('3 complete days, 11/02-11/05/2026')
  })

  it('reports unmeasured void counts', () => {
    const events = workedExampleEvents.map((e) =>
      e.id === 'e06' && e.kind === 'void' ? { ...e, volumeMl: null } : e
    )
    expect(noteText(summarizeDiary(events))).toContain(
      'Data quality: 1 void not measured; Fewer than 3 complete days'
    )
  })
})
