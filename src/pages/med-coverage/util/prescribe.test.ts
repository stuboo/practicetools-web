import { describe, expect, it } from 'vitest'
import { brandName, ingredientsOf, prescribeThis } from './prescribe'
import { brandGemtesa, brandMyrbetriq, genericMirabegron, genericOxybutynin, row } from './fixtures'

describe('prescribeThis', () => {
  it('says brand, not generic, when only the brand is on formulary', () => {
    const advice = prescribeThis('mirabegron', [
      row({ drug: brandMyrbetriq }),
      row({ drug: genericMirabegron, on_formulary: false, status_or_tier: 'Not on formulary' }),
    ])
    expect(advice).toEqual({ ingredient: 'mirabegron', kind: 'brand', text: 'Myrbetriq, not generic mirabegron' })
  })

  it('says generic, not brand, when only the generic is on formulary', () => {
    const advice = prescribeThis('mirabegron', [
      row({ drug: brandMyrbetriq, on_formulary: false }),
      row({ drug: genericMirabegron, status_or_tier: 'Tier 2' }),
    ])
    expect(advice.kind).toBe('generic')
    expect(advice.text).toBe('Generic mirabegron, not Myrbetriq')
  })

  it('prefers the lower tier when both products are covered', () => {
    const brandCheaper = prescribeThis('mirabegron', [
      row({ drug: brandMyrbetriq, status_or_tier: 'Tier 3' }),
      row({ drug: genericMirabegron, status_or_tier: 'Tier 4' }),
    ])
    expect(brandCheaper.kind).toBe('brand')
    expect(brandCheaper.text).toMatch(/^Myrbetriq\. Generic mirabegron is also covered/)

    const genericCheaper = prescribeThis('mirabegron', [
      row({ drug: brandMyrbetriq, status_or_tier: 'Tier 3' }),
      row({ drug: genericMirabegron, status_or_tier: 'Tier 2' }),
    ])
    expect(genericCheaper.kind).toBe('generic')
    expect(genericCheaper.text).toBe('Generic mirabegron. Myrbetriq is also covered.')
  })

  it('breaks a tier tie on fewer PA/ST edits, then on generic', () => {
    const fewerEditsOnBrand = prescribeThis('mirabegron', [
      row({ drug: brandMyrbetriq, status_or_tier: 'Tier 3', pa: 'N', st: 'N' }),
      row({ drug: genericMirabegron, status_or_tier: 'Tier 3', pa: 'Y', st: 'N' }),
    ])
    expect(fewerEditsOnBrand.kind).toBe('brand')

    const fullTie = prescribeThis('mirabegron', [
      row({ drug: brandMyrbetriq, status_or_tier: 'Tier 3', pa: 'N', st: 'Y' }),
      row({ drug: genericMirabegron, status_or_tier: 'Tier 3', pa: 'N', st: 'Y' }),
    ])
    expect(fullTie.kind).toBe('generic')
  })

  it('names a brand-only ingredient plainly', () => {
    expect(prescribeThis('vibegron', [row({ drug: brandGemtesa })]).text).toBe('Gemtesa')
  })

  it('names a generic-only ingredient plainly', () => {
    expect(prescribeThis('oxybutynin', [row({ drug: genericOxybutynin })]).text).toBe('Generic oxybutynin')
  })

  it('says not covered when nothing is on formulary', () => {
    expect(
      prescribeThis('mirabegron', [
        row({ drug: brandMyrbetriq, on_formulary: false }),
        row({ drug: genericMirabegron, on_formulary: false }),
      ])
    ).toEqual({
      ingredient: 'mirabegron',
      kind: 'none',
      text: 'Not on this formulary: neither generic mirabegron nor Myrbetriq is covered.',
    })
    expect(prescribeThis('vibegron', [row({ drug: brandGemtesa, on_formulary: false })]).text).toBe(
      'Not on this formulary: Gemtesa is not covered.'
    )
  })

  it('treats any covered strength as the product being covered', () => {
    const advice = prescribeThis('mirabegron', [
      row({ drug: { ...brandMyrbetriq, id: 1, label: 'Myrbetriq ER 25 mg' }, on_formulary: false }),
      row({ drug: { ...brandMyrbetriq, id: 5, label: 'Myrbetriq ER 50 mg' } }),
      row({ drug: genericMirabegron, on_formulary: false }),
    ])
    expect(advice.text).toBe('Myrbetriq, not generic mirabegron')
  })

  it('only looks at rows for the asked ingredient', () => {
    const advice = prescribeThis('vibegron', [row({ drug: brandMyrbetriq }), row({ drug: brandGemtesa, on_formulary: false })])
    expect(advice.kind).toBe('none')
  })
})

describe('helpers', () => {
  it('takes the brand name from the label', () => {
    expect(brandName({ label: 'Myrbetriq ER 25 mg tablet', name: 'mirabegron' })).toBe('Myrbetriq')
    expect(brandName({ label: 'Gemtesa (vibegron) 75 mg tablet', name: 'vibegron' })).toBe('Gemtesa')
    expect(brandName({ label: '', name: 'vibegron' })).toBe('vibegron')
  })

  it('lists ingredients in first-seen order', () => {
    expect(ingredientsOf([row({ drug: brandGemtesa }), row({ drug: brandMyrbetriq }), row({ drug: genericMirabegron })])).toEqual([
      'vibegron',
      'mirabegron',
    ])
  })
})

describe('prescribeThis with unpublished coverage (on_formulary null)', () => {
  it('does not claim the other product is excluded when its coverage is unknown', () => {
    const advice = prescribeThis('mirabegron', [
      row({ drug: brandMyrbetriq }),
      row({ drug: genericMirabegron, on_formulary: null, status_or_tier: 'GAP' }),
    ])
    expect(advice).toEqual({
      ingredient: 'mirabegron',
      kind: 'brand',
      text: 'Myrbetriq. Coverage of generic mirabegron is not published.',
    })
  })

  it('reports unknown, not "not covered", when nothing is known to be covered', () => {
    const allUnknown = prescribeThis('vibegron', [row({ drug: brandGemtesa, on_formulary: null })])
    expect(allUnknown.kind).toBe('unknown')
    expect(allUnknown.text).toBe("Coverage not published for Gemtesa. Check the payer's formulary.")

    const mixed = prescribeThis('mirabegron', [
      row({ drug: brandMyrbetriq, on_formulary: false }),
      row({ drug: genericMirabegron, on_formulary: null }),
    ])
    expect(mixed.kind).toBe('unknown')
    expect(mixed.text).not.toMatch(/Not on this formulary/)
  })
})
