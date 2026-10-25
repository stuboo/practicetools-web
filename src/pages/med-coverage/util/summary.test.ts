import { describe, expect, it } from 'vitest'
import { alternativeSentence, availabilityOf, beta3Highlights, displayName, highlightLine, restrictionNote, summarize, summaryItems } from './summary'
import { statusRank } from './prescribe'
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
      'Mirabegron: send Myrbetriq (step therapy required; quantity limit). mirabegron is not covered.',
      'Vibegron: Gemtesa is covered (step therapy required; quantity limit).',
    ])
  })
})

describe('highlightLine', () => {
  const open = { pa: 'N', st: 'N', ql: 'N' } as const

  it('WI Medicaid: brand Preferred with no PA beats generic Non-preferred (BBG) with PA, and says why', () => {
    const rows = [
      row({ drug: brandMyrbetriq, status_or_tier: 'Preferred', pa: 'N', st: 'GAP', ql: 'GAP' }),
      row({ drug: genericMirabegron, status_or_tier: 'Non-preferred (Brand Before Generic)', pa: 'Y', st: 'GAP', ql: 'GAP' }),
    ]
    expect(highlightLine('mirabegron', rows)).toBe(
      'Mirabegron: send Myrbetriq (preferred, no PA). mirabegron needs PA.'
    )
  })

  it('both covered with no PA or step: says so for the alternative', () => {
    expect(
      highlightLine('mirabegron', [
        row({ drug: brandMyrbetriq, ...open, status_or_tier: 'Tier 3' }),
        row({ drug: genericMirabegron, ...open, status_or_tier: 'Tier 2' }),
      ])
    ).toBe('Mirabegron: send mirabegron (no PA or step). Myrbetriq is also covered, no PA or step.')
  })

  it('alternative with unknown PA says PA is not published', () => {
    expect(
      highlightLine('mirabegron', [
        row({ drug: genericMirabegron, ...open, status_or_tier: 'Tier 1' }),
        row({ drug: brandMyrbetriq, status_or_tier: 'Tier 3', pa: 'GAP', st: 'GAP', ql: 'N' }),
      ])
    ).toBe('Mirabegron: send mirabegron (no PA or step). Myrbetriq is also covered (PA not published).')
  })

  it('alternative that needs step therapy, or PA and step therapy', () => {
    expect(
      highlightLine('mirabegron', [
        row({ drug: genericMirabegron, ...open, status_or_tier: 'Step 1 (no step required)' }),
        row({ drug: brandMyrbetriq, status_or_tier: 'Step 2', pa: 'N', st: 'Y', ql: 'N' }),
      ])
    ).toBe('Mirabegron: send mirabegron (no PA or step). Myrbetriq needs step therapy.')
    expect(
      highlightLine('mirabegron', [
        row({ drug: genericMirabegron, ...open, status_or_tier: 'Tier 1' }),
        row({ drug: brandMyrbetriq, status_or_tier: 'Tier 3 (BP = brand penalty)', pa: 'Y', st: 'Y', ql: 'N' }),
      ])
    ).toBe('Mirabegron: send mirabegron (no PA or step). Myrbetriq needs PA and step therapy.')
  })

  it('single product (no generic): covered, with status and restriction', () => {
    expect(highlightLine('vibegron', [row({ drug: brandGemtesa, status_or_tier: 'Non-preferred', pa: 'Y', st: 'GAP', ql: 'GAP' })])).toBe(
      'Vibegron: Gemtesa is covered (non-preferred, PA required).'
    )
    expect(highlightLine('vibegron', [row({ drug: brandGemtesa, ...open })])).toBe('Vibegron: Gemtesa is covered (no PA or step).')
    expect(highlightLine('vibegron', [row({ drug: brandGemtesa, status_or_tier: 'Covered', pa: 'GAP', st: 'GAP', ql: 'N' })])).toBe(
      'Vibegron: Gemtesa is covered (PA not published).'
    )
  })

  it('single product (no generic): not covered, or not published', () => {
    expect(highlightLine('vibegron', [row({ drug: brandGemtesa, on_formulary: false })])).toBe('Vibegron: Gemtesa is not covered.')
    expect(highlightLine('vibegron', [row({ drug: brandGemtesa, on_formulary: null })])).toBe(
      'Vibegron: Gemtesa coverage not published.'
    )
  })

  it('single generic product', () => {
    expect(highlightLine('oxybutynin', [row({ drug: genericOxybutynin, ...open })])).toBe(
      'Oxybutynin: oxybutynin is covered (no PA or step).'
    )
  })

  it('says which to send when only one of brand/generic is covered', () => {
    expect(
      highlightLine('mirabegron', [row({ drug: genericMirabegron, ...open }), row({ drug: brandMyrbetriq, on_formulary: false })])
    ).toBe('Mirabegron: send mirabegron (no PA or step). Myrbetriq is not covered.')
    expect(
      highlightLine('mirabegron', [row({ drug: brandMyrbetriq, ...open, ql: 'Y' }), row({ drug: genericMirabegron, on_formulary: null })])
    ).toBe('Mirabegron: send Myrbetriq (no PA or step; quantity limit). mirabegron coverage not published.')
  })

  it('handles nothing covered', () => {
    expect(
      highlightLine('mirabegron', [row({ drug: brandMyrbetriq, on_formulary: false }), row({ drug: genericMirabegron, on_formulary: false })])
    ).toBe('Mirabegron: neither mirabegron nor Myrbetriq is covered.')
    expect(
      highlightLine('mirabegron', [row({ drug: brandMyrbetriq, on_formulary: null }), row({ drug: genericMirabegron, on_formulary: null })])
    ).toBe('Mirabegron: coverage not published.')
    expect(
      highlightLine('mirabegron', [row({ drug: brandMyrbetriq, on_formulary: null }), row({ drug: genericMirabegron, on_formulary: false })])
    ).toBe('Mirabegron: mirabegron is not covered, and Myrbetriq coverage not published.')
  })

  it('names restrictions plainly and never invents one from GAP', () => {
    expect(restrictionNote({ pa: 'Y', st: 'Y', ql: 'Y', status_or_tier: 'Tier 3' })).toBe(' (PA and step therapy required; quantity limit)')
    expect(restrictionNote({ pa: 'GAP', st: 'GAP', ql: 'GAP', status_or_tier: 'GAP' })).toBe(' (PA not published)')
    expect(restrictionNote({ pa: 'N', st: 'GAP', ql: 'GAP', status_or_tier: 'Preferred brand (urinary antispasmodics)' })).toBe(' (preferred, no PA)')
  })

  it('never says "also covered" without the restrictions', () => {
    for (const r of [
      { pa: 'Y', st: 'N' }, { pa: 'N', st: 'Y' }, { pa: 'GAP', st: 'GAP' }, { pa: 'N', st: 'GAP' }, { pa: 'N', st: 'N' },
    ] as const) {
      const text = alternativeSentence('Myrbetriq', r)
      expect(text === 'Myrbetriq is also covered.').toBe(false)
      expect(text).toMatch(/needs|no PA|not published/)
    }
  })
})

describe('statusRank', () => {
  it.each([
    ['Tier 1', 1], ['T2', 2], ['Tier 3 (BP = brand penalty)', 3.5], ['Step 1 (both)', 1], ['Step 2 brand', 2],
    ['Preferred', 1], ['Preferred brand (urinary antispasmodics)', 1], ['On formulary (preferred list)', 1],
    ['Non-preferred (Brand Before Generic)', 2], ['Non-preferred', 2],
    ['Tier 3 (moved to higher tier / non-preferred 5/1/2026)', 3],
    ['Covered', Infinity], ['GAP', Infinity],
  ])('%s -> %s', (status, rank) => {
    expect(statusRank(status)).toBe(rank)
  })
})
