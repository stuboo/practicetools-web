import { describe, expect, it } from 'vitest'
import { bestToneRank, buildHeatmap, chipLabel, chipStatus, sortHeatmap } from './heatmap'
import { summaryItems } from './summary'
import { LIVE_CATALOGUE } from './catalogue.fixture'
import { brandGemtesa, brandMyrbetriq, brandMyrbetriq50, genericMirabegron, row } from './fixtures'
import { MedCovRow } from '../../../types/medCoverage'

const ox = (id: number, label: string, form: string, product: 'generic' | 'brand' = 'generic') =>
  ({ id, name: 'oxybutynin', product, label, form, class_code: 'oab_antimuscarinic' })


function must<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('expected a value')
  return value
}

describe('chipStatus (colour and words)', () => {
  it.each([
    [{ availability: 'open', pa: 'N', st: 'N', ql: 'N' }, 'green', 'Covered', []],
    [{ availability: 'open', pa: 'N', st: 'N', ql: 'Y' }, 'green', 'Covered', ['QL']],
    [{ availability: 'open', pa: 'N', st: 'GAP', ql: 'N' }, 'green', 'Covered', ['ST?']],
    [{ availability: 'restricted', pa: 'Y', st: 'N', ql: 'N' }, 'amber', 'PA', []],
    [{ availability: 'restricted', pa: 'N', st: 'Y', ql: 'Y' }, 'amber', 'ST', ['QL']],
    [{ availability: 'restricted', pa: 'Y', st: 'Y', ql: 'N' }, 'amber', 'PA + ST', []],
    [{ availability: 'not_covered', pa: 'Y', st: 'N', ql: 'N' }, 'red', 'Not covered', []],
    [{ availability: 'unknown', pa: 'GAP', st: 'GAP', ql: 'GAP' }, 'grey', 'Not published', []],
  ] as const)('%o -> %s %s', (item, tone, status, marks) => {
    expect(chipStatus(item)).toEqual({ tone, status, marks })
  })
})

describe('chipLabel', () => {
  it('uses the ingredient for generics and the brand (with OTC/Rx) for brands', () => {
    expect(chipLabel({ name: 'tolterodine', product: 'generic', label: 'tolterodine ER capsule (generic)' })).toBe('tolterodine')
    expect(chipLabel({ name: 'tolterodine', product: 'brand', label: 'Detrol LA capsule' })).toBe('Detrol LA')
    expect(chipLabel({ name: 'oxybutynin', product: 'brand', label: 'Oxytrol for Women patch (OTC)' })).toBe('Oxytrol (OTC)')
  })
})

describe('buildHeatmap', () => {
  const rows: MedCovRow[] = [
    row({ drug: { ...brandMyrbetriq, form: 'ER tablet' }, pa: 'N', st: 'N', ql: 'Y' }),
    row({ drug: { ...brandMyrbetriq50, form: 'ER tablet' }, pa: 'N', st: 'N', ql: 'Y' }),
    row({ drug: { ...genericMirabegron, form: 'ER tablet' }, on_formulary: false }),
    row({ drug: { ...brandGemtesa, form: 'tablet' }, pa: 'Y', st: 'N' }),
    row({ drug: ox(40, 'oxybutynin IR 5 mg tablet (generic)', 'IR tablet'), pa: 'N', st: 'N' }),
    row({ drug: ox(41, 'oxybutynin oral solution/syrup (generic)', 'oral solution'), on_formulary: null }),
  ]

  it('makes one row per ingredient + form with Generic and Brand cells', () => {
    const map = buildHeatmap(summaryItems(rows), LIVE_CATALOGUE)
    const mira = must(map.find((r) => r.label === 'mirabegron ER'))
    expect(mira.generic?.map((c) => [c.label, c.tone, c.status])).toEqual([['mirabegron', 'red', 'Not covered']])
    expect(mira.brand?.map((c) => [c.label, c.tone, c.marks])).toEqual([['Myrbetriq', 'green', ['QL']]])
    const vib = must(map.find((r) => r.label === 'vibegron'))
    expect(vib.generic).toBeNull() // no generic vibegron exists: "—"
    expect(vib.brand?.[0]).toMatchObject({ label: 'Gemtesa', tone: 'amber', status: 'PA' })
    const oxIr = must(map.find((r) => r.label === 'oxybutynin IR'))
    expect(oxIr.brand).toBeNull()
    expect(oxIr.generic?.[0]).toMatchObject({ tone: 'green' })
  })

  it('shows a catalogue product the payer has no row for as grey "No data", not "—"', () => {
    const map = buildHeatmap(summaryItems(rows), LIVE_CATALOGUE)
    const dari = must(map.find((r) => r.label === 'darifenacin ER'))
    expect(dari.generic?.[0]).toMatchObject({ tone: 'grey', status: 'No data', itemKey: null })
    expect(dari.brand?.[0]).toMatchObject({ label: 'Enablex', status: 'No data' })
    // 16 CNS rows for the 27-drug catalogue.
    expect(map).toHaveLength(16)
  })

  it('without a catalogue, only products with rows appear', () => {
    const map = buildHeatmap(summaryItems(rows))
    expect(map.map((r) => r.label).sort()).toEqual(['mirabegron ER', 'oxybutynin IR', 'oxybutynin oral solution', 'vibegron'])
  })

  it('names the strength on a chip when strengths differ', () => {
    const split = [row({ drug: { ...brandMyrbetriq, form: 'ER tablet', strength: '25 mg' } }), row({ drug: { ...brandMyrbetriq50, form: 'ER tablet', strength: '50 mg' }, on_formulary: false })]
    const mira = buildHeatmap(summaryItems(split))[0]
    expect(mira.brand?.map((c) => [c.label, c.tone])).toEqual([['Myrbetriq 25 mg', 'amber'], ['Myrbetriq 50 mg', 'red']])
  })

  it('sorts by CNS activity by default and by best coverage on request', () => {
    const map = buildHeatmap(summaryItems(rows))
    expect(sortHeatmap(map, 'cns').map((r) => r.label)).toEqual(['mirabegron ER', 'vibegron', 'oxybutynin IR', 'oxybutynin oral solution'])
    // green rows first (mirabegron ER via Myrbetriq, oxybutynin IR), then amber, then grey; CNS breaks ties.
    expect(sortHeatmap(map, 'coverage').map((r) => r.label)).toEqual(['mirabegron ER', 'oxybutynin IR', 'vibegron', 'oxybutynin oral solution'])
  })

  it('ranks red below grey and unknown CNS products last', () => {
    const map = buildHeatmap(
      summaryItems([
        row({ drug: { id: 90, name: 'newamide', product: 'generic', label: 'newamide tablet (generic)', form: 'tablet', class_code: 'oab_antimuscarinic' }, pa: 'N', st: 'N' }),
        row({ drug: { ...brandGemtesa, form: 'tablet' }, on_formulary: false }),
        row({ drug: ox(41, 'oxybutynin oral solution/syrup (generic)', 'oral solution'), on_formulary: null }),
      ])
    )
    const cns = sortHeatmap(map, 'cns')
    expect(cns.map((r) => r.label)).toEqual(['vibegron', 'oxybutynin oral solution', 'newamide'])
    expect(cns[2].level).toBeNull()
    const cov = sortHeatmap(map, 'coverage')
    expect(cov.map((r) => r.label)).toEqual(['newamide', 'oxybutynin oral solution', 'vibegron'])
    expect(cov.map(bestToneRank)).toEqual([0, 2, 3])
  })
})
