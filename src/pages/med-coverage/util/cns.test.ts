import { describe, expect, it } from 'vitest'
import { CNS_ORDER, cnsIndex, cnsKey, formFromLabel, normalizeForm } from './cns'
import { LIVE_CATALOGUE, LIVE_FORMS } from './catalogue.fixture'

describe('CNS config', () => {
  it.each(LIVE_CATALOGUE.map((d) => [d.label, d] as const))('has an entry for %s (by API form)', (_label, drug) => {
    expect(cnsIndex(drug.name, LIVE_FORMS[drug.label])).toBeGreaterThanOrEqual(0)
  })

  it.each(LIVE_CATALOGUE.map((d) => [d.label, d] as const))('has an entry for %s (form from label)', (_label, drug) => {
    expect(cnsIndex(drug.name, formFromLabel(drug.label))).toBeGreaterThanOrEqual(0)
  })

  it('derives the same row from the label as from the API form', () => {
    for (const drug of LIVE_CATALOGUE) {
      expect(cnsKey(drug.name, formFromLabel(drug.label))).toBe(cnsKey(drug.name, LIVE_FORMS[drug.label]))
    }
  })

  it('has no duplicate entries', () => {
    const keys = CNS_ORDER.map((e) => cnsKey(e.ingredient, e.form))
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('orders beta-3s lowest, darifenacin in between, oral oxybutynin IR highest', () => {
    const at = (ingredient: string, form: string) => cnsIndex(ingredient, form)
    expect(at('mirabegron', 'ER tablet')).toBe(0)
    expect(at('vibegron', 'tablet')).toBeLessThan(at('darifenacin', 'ER tablet'))
    expect(at('darifenacin', 'ER tablet')).toBeLessThan(at('oxybutynin', 'IR tablet'))
    expect(CNS_ORDER[at('oxybutynin', 'IR tablet')].level).toBe('High')
    expect(CNS_ORDER[at('trospium', 'IR tablet')].level).toBe('Low')
  })

  it('treats "IR tablet" and "tablet" as the same form', () => {
    expect(normalizeForm('IR tablet')).toBe('tablet')
    expect(cnsIndex('tolterodine', 'tablet')).toBe(cnsIndex('tolterodine', 'IR tablet'))
    expect(cnsIndex('unknownamide', 'tablet')).toBe(-1)
  })
})
