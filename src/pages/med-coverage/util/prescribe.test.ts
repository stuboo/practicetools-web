import { describe, expect, it } from 'vitest'
import { brandName, formKey, ingredientsOf, prescribeByForm, prescribeThis } from './prescribe'
import { brandGemtesa, brandMyrbetriq, genericMirabegron, genericOxybutynin, row } from './fixtures'

describe('prescribeThis', () => {
  it('says brand, not generic, when only the brand is on formulary', () => {
    const advice = prescribeThis('mirabegron', [
      row({ drug: brandMyrbetriq }),
      row({ drug: genericMirabegron, on_formulary: false, status_or_tier: 'Not on formulary' }),
    ])
    expect(advice).toEqual({ ingredient: 'mirabegron', form: null, kind: 'brand', text: 'Myrbetriq, not generic mirabegron' })
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
      form: null,
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
      form: null,
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

describe('prescribe per form (drug.form from the API)', () => {
  const tab = (d: object, form: string, strength: string | null = null) => ({ ...d, form, strength })
  const granulesBrand = { id: 23, name: 'mirabegron', product: 'brand' as const, label: 'Myrbetriq ER granules for suspension 8 mg/mL' }
  const granulesGeneric = { id: 24, name: 'mirabegron', product: 'generic' as const, label: 'mirabegron ER granules for suspension 8 mg/mL (generic)' }
  const FORM_GRANULES = 'ER granules for oral suspension'

  it('weighs tablets against tablets and granules against granules', () => {
    const rows = [
      row({ drug: tab(brandMyrbetriq, 'ER tablet', '25 mg') }),
      row({ drug: tab(genericMirabegron, 'ER tablet', '25 mg'), on_formulary: false }),
      row({ drug: tab(granulesBrand, FORM_GRANULES, '8 mg/mL'), on_formulary: false }),
      row({ drug: tab(granulesGeneric, FORM_GRANULES, '8 mg/mL'), status_or_tier: 'Tier 2' }),
    ]
    expect(prescribeByForm('mirabegron', rows)).toEqual([
      { ingredient: 'mirabegron', form: 'ER tablet', kind: 'brand', text: 'Myrbetriq, not generic mirabegron' },
      { ingredient: 'mirabegron', form: FORM_GRANULES, kind: 'generic', text: 'Generic mirabegron, not Myrbetriq' },
    ])
  })

  it('separates Detrol (IR tablet) from Detrol LA (ER capsule)', () => {
    const t = (id: number, product: 'brand' | 'generic', label: string, form: string) =>
      ({ id, name: 'tolterodine', product, label, form, strength: null, class_code: 'oab_antimuscarinic' })
    const rows = [
      row({ drug: t(30, 'generic', 'tolterodine IR tablet (generic)', 'IR tablet'), status_or_tier: 'Tier 1' }),
      row({ drug: t(31, 'generic', 'tolterodine ER capsule (generic)', 'ER capsule'), on_formulary: false }),
      row({ drug: t(32, 'brand', 'Detrol tablet', 'IR tablet'), on_formulary: false }),
      row({ drug: t(33, 'brand', 'Detrol LA capsule', 'ER capsule') }),
    ]
    expect(prescribeByForm('tolterodine', rows).map((a) => [a.form, a.text])).toEqual([
      ['IR tablet', 'Generic tolterodine, not Detrol'],
      ['ER capsule', 'Detrol LA, not generic tolterodine'],
    ])
  })

  it('falls back to one ingredient-wide decision when the form is unknown', () => {
    const rows = [row({ drug: { ...brandMyrbetriq, form: null } }), row({ drug: { ...genericMirabegron, form: null }, on_formulary: false })]
    const advice = prescribeByForm('mirabegron', rows)
    expect(advice).toHaveLength(1)
    expect(advice[0]).toMatchObject({ form: null, text: 'Myrbetriq, not generic mirabegron' })
  })

  it('matches forms without regard to case or spacing', () => {
    expect(formKey({ form: ' ER Tablet ' })).toBe('er tablet')
    expect(formKey({ form: null })).toBe('')
  })

  it.each([
    ['Myrbetriq ER 25 mg tablet', 'Myrbetriq'],
    ['Detrol LA capsule', 'Detrol LA'],
    ['Detrol tablet', 'Detrol'],
    ['Vesicare LS oral suspension', 'Vesicare LS'],
    ['Oxytrol for Women patch (OTC)', 'Oxytrol'],
    ['Gelnique (oxybutynin) gel', 'Gelnique'],
    ['Enablex ER tablet', 'Enablex'],
  ])('brand name of %s is %s', (label, name) => {
    expect(brandName({ label, name: 'x' })).toBe(name)
  })
})
