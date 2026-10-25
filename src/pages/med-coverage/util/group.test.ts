import { describe, expect, it } from 'vitest'
import { ALL_LINES, groupByProduct, productLabel, productLines, rowsForLine, strengthOf } from './group'
import { brandGemtesa, brandMyrbetriq, brandMyrbetriq50, brandMyrbetriqGranules, genericMirabegron, genericMirabegron50, row } from './fixtures'

describe('strength and product labels', () => {
  it.each([
    ['Myrbetriq ER 25 mg tablet', 'Myrbetriq ER tablet', '25 mg'],
    ['mirabegron ER 50 mg tablet (generic)', 'mirabegron ER tablet (generic)', '50 mg'],
    ['Myrbetriq ER granules for suspension 8 mg/mL', 'Myrbetriq ER granules for suspension', '8 mg/mL'],
    ['Gemtesa (vibegron) 75 mg tablet', 'Gemtesa (vibegron) tablet', '75 mg'],
    ['oxybutynin IR 2.5 mg tablet (generic)', 'oxybutynin IR tablet (generic)', '2.5 mg'],
    ['oxybutynin oral solution/syrup (generic)', 'oxybutynin oral solution/syrup (generic)', null],
  ])('%s', (label, product, strength) => {
    expect(productLabel(label)).toBe(product)
    expect(strengthOf(label)).toBe(strength)
  })
})

describe('groupByProduct', () => {
  it('merges strengths with identical coverage into one group', () => {
    const groups = groupByProduct([row({ drug: brandMyrbetriq }), row({ drug: brandMyrbetriq50 })])
    expect(groups).toHaveLength(1)
    expect(groups[0]).toMatchObject({ label: 'Myrbetriq ER tablet', strengths: ['25 mg', '50 mg'], uniform: true })
  })

  it('flags a group whose strengths differ in coverage', () => {
    const groups = groupByProduct([
      row({ drug: brandMyrbetriq, status_or_tier: 'Tier 3' }),
      row({ drug: brandMyrbetriq50, status_or_tier: 'Tier 4' }),
    ])
    expect(groups).toHaveLength(1)
    expect(groups[0].uniform).toBe(false)
  })

  it('keeps brand, generic, and different forms apart', () => {
    const groups = groupByProduct([
      row({ drug: brandMyrbetriq }),
      row({ drug: genericMirabegron }),
      row({ drug: genericMirabegron50 }),
      row({ drug: brandMyrbetriqGranules }),
      row({ drug: brandGemtesa }),
    ])
    expect(groups.map((g) => g.label)).toEqual([
      'Myrbetriq ER tablet',
      'mirabegron ER tablet (generic)',
      'Myrbetriq ER granules for suspension',
      'Gemtesa (vibegron) tablet',
    ])
  })
})

describe('product lines', () => {
  it('lists distinct lines and filters by them', () => {
    const rows = [
      row({ drug: brandGemtesa, product_line: 'Standard' }),
      row({ drug: brandGemtesa, product_line: 'Performance' }),
      row({ drug: brandGemtesa, product_line: 'Standard' }),
      row({ drug: brandGemtesa, product_line: null }),
    ]
    expect(productLines(rows)).toEqual(['Standard', 'Performance', ''])
    expect(rowsForLine(rows, 'Standard')).toHaveLength(2)
    expect(rowsForLine(rows, '')).toHaveLength(1)
    expect(rowsForLine(rows, ALL_LINES)).toHaveLength(4)
  })
})
