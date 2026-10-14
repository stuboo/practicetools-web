import { describe, it, expect } from 'vitest'
import { scoreQuid } from './quid'
import { getQuestionnaire } from './registry'

describe('scoreQuid', () => {
  it('scores stress-predominant answers', () => {
    expect(scoreQuid([3, 2, 1, 0, 1, 0])).toEqual({
      scores: { SUI: 6, UUI: 1 },
      interpretation: 'Stress Urinary Incontinence',
    })
  })

  it('scores urge-predominant answers', () => {
    const r = scoreQuid([0, 1, 0, 4, 3, 2])
    expect(r.scores).toEqual({ SUI: 1, UUI: 9 })
    expect(r.interpretation).toBe('Urge Urinary Incontinence')
  })

  it('distinguishes mixed predominance', () => {
    expect(scoreQuid([2, 2, 2, 3, 3, 3]).interpretation).toBe('Urge-Predominant Mixed Urinary Incontinence')
    expect(scoreQuid([4, 4, 4, 1, 2, 3]).interpretation).toBe('Stress-Predominant Mixed Urinary Incontinence')
  })

  it('is exposed through the registry as cleared', () => {
    const quid = getQuestionnaire('quid')
    expect(quid?.licenseStatus).toBe('cleared')
    expect(quid?.questions).toHaveLength(6)
    expect(quid?.score([0, 0, 0, 0, 0, 0]).scores).toEqual({ SUI: 0, UUI: 0 })
    expect(getQuestionnaire('nope')).toBeUndefined()
  })
})
