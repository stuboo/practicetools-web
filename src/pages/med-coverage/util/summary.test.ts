import { describe, expect, it } from 'vitest'
import { availabilityOf, beta3Highlights, displayName, highlightLine, restrictionNote, summarize, summaryItems } from './summary'
import { brandGemtesa, brandMyrbetriq, brandMyrbetriq50, genericMirabegron, genericOxybutynin, row } from './fixtures'

describe('availabilityOf', () => {
  it.each([
    [{ on_formulary: true, pa: 'N', st: 'N' }, 'open'],
    [{ on_formulary: true, pa: 'Y', st: 'N' }, 'restricted'],
    [{ on_formulary: true, pa: 'N', st: 'Y' }, 'restricted'],
    // Unpublished edits stay in "no PA or step" but the badge shows "?".
    [{ on_formulary: true, pa: 'N', st: 'GAP' }, 'open'],
    [{ on_formulary: true, pa: 'GAP', st: 'Y' }, 'restricted'],
    [{ on_formulary: false, pa: 'N', st: 'N' }, 'not_covered'],
    [{ on_formulary: null, pa: 'N', st: 'N' }, 'unknown'],
  ] as const)('%o -> %s', (r, expected) => {
    expect(availabilityOf(r)).toBe(expected)
  })
})

describe('displayName', () => {
  it('reads generics as "Generic ..." and keeps brand labels', () => {
    expect(displayName('oxybutynin ER tablet (generic)', 'generic')).toBe('Generic oxybutynin ER tablet')
    expect(displayName('Myrbetriq ER tablet', 'brand')).toBe('Myrbetriq ER tablet')
  })
})

describe('summarize', () => {
  it('buckets in fixed order with beta-3s before antimuscarinics', () => {
    const rows = [
      row({ drug: genericOxybutynin, pa: 'Y', st: 'N' }),
      row({ drug: brandGemtesa, pa: 'N', st: 'N' }),
      row({ drug: brandMyrbetriq, pa: 'N', st: 'Y' }),
      row({ drug: genericMirabegron, on_formulary: null }),
      row({ drug: { ...genericOxybutynin, id: 11, label: 'oxybutynin IR 5 mg tablet (generic)' }, on_formulary: false }),
    ]
    const buckets = summarize(rows)
    expect(buckets.map((b) => [b.label, b.items.map((i) => i.name)])).toEqual([
      ['Covered, no PA or step', ['Gemtesa (vibegron) tablet']],
      ['Covered with PA or step therapy', ['Myrbetriq ER tablet', 'Generic oxybutynin ER tablet']],
      ['Not covered', ['Generic oxybutynin IR tablet']],
      ['Coverage not published', ['Generic mirabegron ER tablet']],
    ])
  })

  it('collapses strengths with the same coverage into one line', () => {
    const items = summaryItems([row({ drug: brandMyrbetriq }), row({ drug: brandMyrbetriq50 })])
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ name: 'Myrbetriq ER tablet', strengths: ['25 mg', '50 mg'], tier: 'Tier 3' })
  })

  it('splits strengths whose coverage differs', () => {
    const items = summaryItems([row({ drug: brandMyrbetriq }), row({ drug: brandMyrbetriq50, on_formulary: false })])
    expect(items.map((i) => [i.name, i.availability])).toEqual([
      ['Myrbetriq ER 25 mg tablet', 'restricted'],
      ['Myrbetriq ER 50 mg tablet', 'not_covered'],
    ])
  })

  it('shows no tier for products that are not covered or not published', () => {
    const items = summaryItems([row({ drug: brandGemtesa, on_formulary: false, status_or_tier: 'Not on formulary' })])
    expect(items[0].tier).toBeNull()
  })
})

describe('beta3Highlights', () => {
  it('gives one line per beta-3 ingredient, preferring the tablet form', () => {
    const rows = [
      row({ drug: { ...brandMyrbetriq, form: 'ER tablet' } }),
      row({ drug: { ...genericMirabegron, form: 'ER tablet' }, on_formulary: false }),
      row({ drug: { id: 23, name: 'mirabegron', product: 'brand', label: 'Myrbetriq ER granules for suspension 8 mg/mL', form: 'ER granules for oral suspension' }, on_formulary: false }),
      row({ drug: { ...brandGemtesa, form: 'tablet' } }),
      row({ drug: genericOxybutynin }),
    ]
    expect(beta3Highlights(rows).map((a) => a.text)).toEqual([
      'Mirabegron: send Myrbetriq (step therapy required; quantity limit). Generic mirabegron is not covered.',
      'Vibegron: Gemtesa is covered (step therapy required; quantity limit).',
    ])
  })
})

describe('highlightLine', () => {
  const open = { pa: 'N', st: 'N', ql: 'N' } as const

  it('single product (no generic): covered, with the key restriction', () => {
    expect(highlightLine('vibegron', [row({ drug: brandGemtesa, pa: 'Y', st: 'N', ql: 'N' })])).toBe(
      'Vibegron: Gemtesa is covered (PA required).'
    )
    expect(highlightLine('vibegron', [row({ drug: brandGemtesa, ...open })])).toBe('Vibegron: Gemtesa is covered.')
  })

  it('single product (no generic): not covered, or not published', () => {
    expect(highlightLine('vibegron', [row({ drug: brandGemtesa, on_formulary: false })])).toBe('Vibegron: Gemtesa is not covered.')
    expect(highlightLine('vibegron', [row({ drug: brandGemtesa, on_formulary: null })])).toBe(
      'Vibegron: Gemtesa coverage not published.'
    )
  })

  it('single generic product', () => {
    expect(highlightLine('oxybutynin', [row({ drug: genericOxybutynin, ...open })])).toBe('Oxybutynin: Generic oxybutynin is covered.')
  })

  it('says which to send when only one of brand/generic is covered', () => {
    expect(
      highlightLine('mirabegron', [row({ drug: genericMirabegron, ...open }), row({ drug: brandMyrbetriq, on_formulary: false })])
    ).toBe('Mirabegron: send generic. Myrbetriq is not covered.')
    expect(
      highlightLine('mirabegron', [row({ drug: brandMyrbetriq, ...open, ql: 'Y' }), row({ drug: genericMirabegron, on_formulary: null })])
    ).toBe('Mirabegron: send Myrbetriq (quantity limit). Generic mirabegron coverage not published.')
  })

  it('says which to send when both are covered', () => {
    expect(
      highlightLine('mirabegron', [
        row({ drug: brandMyrbetriq, ...open, status_or_tier: 'Tier 3' }),
        row({ drug: genericMirabegron, ...open, status_or_tier: 'Tier 2' }),
      ])
    ).toBe('Mirabegron: send generic. Myrbetriq is also covered.')
  })

  it('handles nothing covered', () => {
    expect(
      highlightLine('mirabegron', [row({ drug: brandMyrbetriq, on_formulary: false }), row({ drug: genericMirabegron, on_formulary: false })])
    ).toBe('Mirabegron: neither generic mirabegron nor Myrbetriq is covered.')
    expect(
      highlightLine('mirabegron', [row({ drug: brandMyrbetriq, on_formulary: null }), row({ drug: genericMirabegron, on_formulary: null })])
    ).toBe('Mirabegron: coverage not published.')
    expect(
      highlightLine('mirabegron', [row({ drug: brandMyrbetriq, on_formulary: null }), row({ drug: genericMirabegron, on_formulary: false })])
    ).toBe('Mirabegron: generic mirabegron is not covered, and Myrbetriq coverage not published.')
  })

  it('names restrictions plainly and never invents one from GAP', () => {
    expect(restrictionNote({ pa: 'Y', st: 'Y', ql: 'Y' })).toBe(' (PA and step therapy required; quantity limit)')
    expect(restrictionNote({ pa: 'GAP', st: 'GAP', ql: 'GAP' })).toBe('')
  })
})
