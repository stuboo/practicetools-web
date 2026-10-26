import { describe, expect, it } from 'vitest'
import { availabilityOf, brandName, displayName, summarize, summaryItems } from './summary'
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
  it.each([
    ['oxybutynin ER tablet (generic)', 'generic', 'oxybutynin', 'oxybutynin ER tablet'],
    ['mirabegron ER 25 mg tablet (generic)', 'generic', 'mirabegron', 'mirabegron ER 25 mg tablet'],
    ['Myrbetriq ER tablet', 'brand', 'mirabegron', 'Myrbetriq (mirabegron) ER tablet'],
    ['Detrol tablet', 'brand', 'tolterodine', 'Detrol (tolterodine) tablet'],
    ['Detrol LA capsule', 'brand', 'tolterodine', 'Detrol LA (tolterodine) capsule'],
    ['Gemtesa (vibegron) tablet', 'brand', 'vibegron', 'Gemtesa (vibegron) tablet'],
    ['Gelnique (oxybutynin) gel', 'brand', 'oxybutynin', 'Gelnique (oxybutynin) gel'],
    ['Vesicare LS oral suspension', 'brand', 'solifenacin', 'Vesicare LS (solifenacin) oral suspension'],
  ])('%s (%s) -> %s', (label, product, ingredient, expected) => {
    expect(displayName(label, product, ingredient)).toBe(expected)
  })

  it('never uses the word "Generic"', () => {
    expect(displayName('trospium ER capsule (generic)', 'generic', 'trospium')).not.toMatch(/generic/i)
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
      ['Covered with PA or step therapy', ['Myrbetriq (mirabegron) ER tablet', 'oxybutynin ER tablet']],
      ['Not covered', ['oxybutynin IR tablet']],
      ['Coverage not published', ['mirabegron ER tablet']],
    ])
  })

  it('collapses strengths with the same coverage into one line', () => {
    const items = summaryItems([row({ drug: brandMyrbetriq }), row({ drug: brandMyrbetriq50 })])
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ name: 'Myrbetriq (mirabegron) ER tablet', strengths: ['25 mg', '50 mg'], tier: 'Tier 3' })
  })

  it('splits strengths whose coverage differs', () => {
    const items = summaryItems([row({ drug: brandMyrbetriq }), row({ drug: brandMyrbetriq50, on_formulary: false })])
    expect(items.map((i) => [i.name, i.availability])).toEqual([
      ['Myrbetriq (mirabegron) ER 25 mg tablet', 'restricted'],
      ['Myrbetriq (mirabegron) ER 50 mg tablet', 'not_covered'],
    ])
  })

  it('shows no tier for products that are not covered or not published', () => {
    const items = summaryItems([row({ drug: brandGemtesa, on_formulary: false, status_or_tier: 'Not on formulary' })])
    expect(items[0].tier).toBeNull()
  })
})

describe('brandName', () => {
  it.each([
    ['Myrbetriq ER 25 mg tablet', 'Myrbetriq'],
    ['Gemtesa (vibegron) 75 mg tablet', 'Gemtesa'],
    ['Detrol LA capsule', 'Detrol LA'],
    ['Detrol tablet', 'Detrol'],
    ['Vesicare LS oral suspension', 'Vesicare LS'],
    ['Oxytrol for Women patch (OTC)', 'Oxytrol'],
    ['Gelnique (oxybutynin) gel', 'Gelnique'],
    ['Enablex ER tablet', 'Enablex'],
    ['', 'x'],
  ])('brand name of "%s" is %s', (label, name) => {
    expect(brandName({ label, name: 'x' })).toBe(name)
  })
})
