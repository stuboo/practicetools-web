import { describe, expect, it } from 'vitest'
import {
  answersToScores,
  formatScoreString,
  generateDetailedReport,
  parseScoreString,
  QUID6_OPTIONS,
  scoreQuid6,
} from './quid6'

describe('QUID6_OPTIONS', () => {
  it('uses the validated six-point 0-5 scale', () => {
    expect(QUID6_OPTIONS.map((o) => o.value)).toEqual([0, 1, 2, 3, 4, 5])
    expect(QUID6_OPTIONS.map((o) => o.text)).toEqual([
      'None of the time',
      'Rarely',
      'Once in a while',
      'Often',
      'Most of the time',
      'All of the time',
    ])
  })
})

describe('scoreQuid6', () => {
  it('sums items 1-3 as stress and 4-6 as urge', () => {
    expect(scoreQuid6([1, 2, 3, 4, 5, 0])).toMatchObject({ stressScore: 6, urgeScore: 9 })
  })

  it('applies the stress cutoff at 4', () => {
    expect(scoreQuid6([3, 0, 0, 0, 0, 0]).diagnosis).toBe('Inconclusive')
    expect(scoreQuid6([4, 0, 0, 0, 0, 0]).diagnosis).toBe('Stress Incontinence')
  })

  it('applies the urge cutoff at 6', () => {
    expect(scoreQuid6([0, 0, 0, 5, 0, 0]).diagnosis).toBe('Inconclusive')
    expect(scoreQuid6([0, 0, 0, 0, 4, 2]).diagnosis).toBe('Urge Incontinence')
  })

  // Both of these were missed on the old 0-4 scale.
  it('flags stress from a single "Most of the time" answer', () => {
    expect(scoreQuid6([4, 0, 0, 0, 0, 0]).diagnosis).toBe('Stress Incontinence')
  })

  it('flags urge from "Most of the time" plus "Once in a while"', () => {
    expect(scoreQuid6([0, 0, 0, 0, 4, 2]).diagnosis).toBe('Urge Incontinence')
  })

  it('calls mixed stress-predominant when stress is higher', () => {
    expect(scoreQuid6([5, 5, 0, 3, 3, 0]).diagnosis).toBe('Stress-Predominant Mixed')
  })

  it('calls mixed urge-predominant when urge is higher', () => {
    expect(scoreQuid6([2, 2, 0, 3, 3, 3]).diagnosis).toBe('Urge-Predominant Mixed')
  })

  it('sends a mixed tie to urge-predominant', () => {
    expect(scoreQuid6([4, 4, 4, 4, 4, 4]).diagnosis).toBe('Urge-Predominant Mixed')
  })

  it('rejects out-of-range or missing items', () => {
    expect(() => scoreQuid6([6, 0, 0, 0, 0, 0])).toThrow()
    expect(() => scoreQuid6([0, 0, 0, 0, 0])).toThrow()
  })
})

describe('answersToScores', () => {
  it('orders answers by question id', () => {
    expect(answersToScores({ 6: 5, 1: 1, 2: 2, 3: 3, 4: 4, 5: 0 })).toEqual([1, 2, 3, 4, 0, 5])
  })

  it('throws instead of scoring an unanswered item as zero', () => {
    expect(() => answersToScores({ 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 })).toThrow()
  })
})

describe('score strings', () => {
  it('round-trips a v2 string', () => {
    const str = formatScoreString([0, 1, 3, 4, 5, 0])
    expect(str).toBe('QUID-6v2: 013450')
    expect(parseScoreString(`Note: ${str} per pt`)).toEqual({ ok: true, scores: [0, 1, 3, 4, 5, 0] })
  })

  it('rejects old unversioned strings as legacy', () => {
    expect(parseScoreString('QUID-6: 012340')).toEqual({ ok: false, reason: 'legacy' })
    expect(parseScoreString('012340')).toEqual({ ok: false, reason: 'legacy' })
  })

  it('rejects garbage as invalid', () => {
    expect(parseScoreString('hello')).toEqual({ ok: false, reason: 'invalid' })
    expect(parseScoreString('QUID-6v2: 0167')).toEqual({ ok: false, reason: 'invalid' })
  })
})

describe('generateDetailedReport', () => {
  it('lists each answer label and the subscale totals', () => {
    const report = generateDetailedReport([5, 3, 2, 0, 4, 1])
    expect(report).toContain('Leakage with cough/sneeze? -> All of the time')
    expect(report).toContain('Leakage with bending/lifting? -> Often')
    expect(report).toContain('SUI Score: 10')
    expect(report).toContain('UUI Score: 5')
  })
})
