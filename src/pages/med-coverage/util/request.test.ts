import { describe, expect, it } from 'vitest'
import { validateRequestName } from './request'

describe('validateRequestName', () => {
  it.each(['Trilogy Health Plan', 'Navitus', 'Quartz H5216-001', 'Group Health Cooperative of Eau Claire'])(
    'accepts a plan or PBM name: %s',
    (name) => {
      expect(validateRequestName(name)).toBeNull()
    }
  )

  it('rejects empty and blank input', () => {
    expect(validateRequestName('')).toMatch(/Enter a plan/)
    expect(validateRequestName('   ')).toMatch(/Enter a plan/)
  })

  it('rejects more than 60 characters', () => {
    expect(validateRequestName('x'.repeat(60))).toBeNull()
    expect(validateRequestName('x'.repeat(61))).toMatch(/60 characters/)
  })

  it.each([
    ['member ID', 'Quartz 123456789'],
    ['slash date', 'Trilogy 3/14/1956'],
    ['ISO date', 'Trilogy 1956-03-14'],
    ['phone', 'Trilogy 920-555-1234'],
    ['phone in parentheses', 'Trilogy (920) 555-1234'],
  ])('rejects something that looks like patient data (%s)', (_label, text) => {
    expect(validateRequestName(text)).toMatch(/Plan or PBM name only/)
  })
})
