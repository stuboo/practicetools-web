import { describe, expect, it } from 'vitest'
import {
  criteriaChecklist,
  criterionText,
  flagText,
  nextSmartPhrases,
  planYears,
  quantityLimitText,
  rowsForYear,
} from './format'
import { brandGemtesa, brandMyrbetriq, genericMirabegron, genericOxybutynin, row } from './fixtures'

describe('format helpers', () => {
  it('shows GAP and missing values as "Not published", never a guess', () => {
    expect(flagText('GAP')).toBe('Not published')
    expect(flagText(null)).toBe('Not published')
    expect(criterionText('GAP')).toBe('Not published')
    expect(criterionText(null)).toBe('Not published')
    expect(criterionText('n/a')).toBe('Not applicable')
    expect(criterionText(' 2 ')).toBe('2')
  })

  it('spells out the quantity limit when known', () => {
    expect(quantityLimitText({ ql: 'Y', ql_amount: '30', ql_days: '30' })).toBe('Yes, 30 per 30 days')
    expect(quantityLimitText({ ql: 'Y', ql_amount: 'GAP', ql_days: '30' })).toBe('Yes')
    expect(quantityLimitText({ ql: 'N', ql_amount: null, ql_days: null })).toBe('No')
  })

  it('builds the five-item criteria checklist', () => {
    const items = criteriaChecklist(row({ trials_required: '2', approval_initial: '12 months' }))
    expect(items.map((i) => i.label)).toEqual([
      'Prior trials required',
      'Trial duration',
      'Contraindication pathway',
      'Initial approval length',
      'Renewal approval length',
    ])
    expect(items.find((i) => i.label === 'Contraindication pathway')).toEqual({
      label: 'Contraindication pathway',
      value: 'Not published',
      gap: true,
    })
  })

  it('picks the SmartPhrases for the drug', () => {
    expect(nextSmartPhrases(row({ drug: brandMyrbetriq }))).toEqual(['.OABPAEVIDENCE', '.OABLMNMIRABEGRON'])
    expect(nextSmartPhrases(row({ drug: genericMirabegron, pa: 'N', st: 'N' }))).toEqual(['.OABPAEVIDENCE', '.OABLMNMIRABEGRON'])
    expect(nextSmartPhrases(row({ drug: brandGemtesa }))).toEqual(['.OABPAEVIDENCE', '.OABLMNVIBEGRON'])
    expect(nextSmartPhrases(row({ drug: genericOxybutynin, pa: 'Y', st: 'N' }))).toEqual(['.OABPAEVIDENCE'])
    expect(nextSmartPhrases(row({ drug: genericOxybutynin, pa: 'N', st: 'Y' }))).toEqual(['.OABPAEVIDENCE'])
    expect(nextSmartPhrases(row({ drug: genericOxybutynin, pa: 'N', st: 'N' }))).toEqual([])
    expect(nextSmartPhrases(row({ drug: genericOxybutynin, pa: 'GAP', st: 'GAP' }))).toEqual([])
  })

  it('orders plan years newest first and filters by year', () => {
    const rows = [row({ plan_year: 2026 }), row({ plan_year: 2027 }), row({ plan_year: null })]
    expect(planYears(rows)).toEqual([2027, 2026])
    expect(rowsForYear(rows, 2027)).toHaveLength(2)
    expect(rowsForYear(rows, null)).toHaveLength(3)
  })
})
