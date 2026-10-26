// The coverage heatmap: one row per ingredient + form, a Generic and a Brand
// cell, each holding one chip per product (strengths collapsed, as in the
// grouped list). Colours follow the list's buckets exactly.

import { Availability, SummaryItem } from './summary'
import { brandName } from './prescribe'
import { strengthOf } from './group'
import { CNS_ORDER, CnsLevel, cnsIndex, cnsKey, formFromLabel } from './cns'

export type HeatTone = 'green' | 'amber' | 'red' | 'grey'

export const TONE_OF: Record<Availability, HeatTone> = {
  open: 'green',
  restricted: 'amber',
  not_covered: 'red',
  unknown: 'grey',
}

export interface HeatChip {
  key: string
  /** Summary item to open in the list; null when the payer has no row for it. */
  itemKey: string | null
  label: string
  tone: HeatTone
  /** Always-present words so colour is never the only signal. */
  status: string
  /** Secondary marks: "QL", "PA?", "ST?". */
  marks: string[]
}

export interface HeatRow {
  key: string
  label: string
  level: CnsLevel | null
  /** Position in CNS_ORDER; Infinity when the product has no entry. */
  cnsRank: number
  /** null means the catalogue has no such product (shown as "—"). */
  generic: HeatChip[] | null
  brand: HeatChip[] | null
}

export interface CatalogueDrug {
  name: string
  product: string
  label: string
  form?: string | null
}

const unknownFlag = (f: string | null | undefined) => f !== 'Y' && f !== 'N'

/** Words and marks for one product's coverage. */
export function chipStatus(item: Pick<SummaryItem, 'availability' | 'pa' | 'st' | 'ql'>): { tone: HeatTone; status: string; marks: string[] } {
  const tone = TONE_OF[item.availability]
  if (tone === 'red') return { tone, status: 'Not covered', marks: [] }
  if (tone === 'grey') return { tone, status: 'Not published', marks: [] }
  const edits = [item.pa === 'Y' ? 'PA' : '', item.st === 'Y' ? 'ST' : ''].filter(Boolean)
  const marks = [
    item.ql === 'Y' ? 'QL' : '',
    unknownFlag(item.pa) ? 'PA?' : '',
    unknownFlag(item.st) ? 'ST?' : '',
  ].filter(Boolean)
  return { tone, status: tone === 'amber' ? edits.join(' + ') : 'Covered', marks }
}

/** Short product name for a chip: "mirabegron", "Detrol LA", "Oxytrol (OTC)". */
export function chipLabel(drug: { name: string; product: string; label: string }): string {
  if (drug.product === 'generic') return drug.name
  const qualifier = /\((OTC|Rx)\)\s*$/i.exec(drug.label)
  return `${brandName(drug)}${qualifier ? ` (${qualifier[1]})` : ''}`
}

function formOf(drug: { label: string; form?: string | null }): string {
  return drug.form?.trim() || formFromLabel(drug.label)
}

/** "ER capsule" -> "ER", "transdermal patch" -> "patch", "tablet" -> "". */
function shortForm(form: string): string {
  const f = form.toLowerCase()
  if (/granules/.test(f)) return 'ER granules'
  if (/patch/.test(f)) return 'patch'
  if (/gel/.test(f)) return 'gel'
  if (/solution|suspension/.test(f)) return f
  if (/^er\b/.test(f)) return 'ER'
  if (/^ir\b/.test(f)) return 'IR'
  return ''
}

export function buildHeatmap(items: SummaryItem[], catalogue: CatalogueDrug[] = []): HeatRow[] {
  const rows = new Map<string, HeatRow>()
  const rowFor = (ingredient: string, form: string) => {
    const key = cnsKey(ingredient, form)
    let row = rows.get(key)
    if (!row) {
      const index = cnsIndex(ingredient, form)
      const entry = index >= 0 ? CNS_ORDER[index] : null
      row = {
        key,
        label: entry?.label ?? [ingredient, shortForm(form)].filter(Boolean).join(' '),
        level: entry?.level ?? null,
        cnsRank: index >= 0 ? index : Number.POSITIVE_INFINITY,
        generic: null,
        brand: null,
      }
      rows.set(key, row)
    }
    return row
  }
  const cell = (row: HeatRow, product: string): HeatChip[] => {
    const slot = product === 'generic' ? 'generic' : 'brand'
    row[slot] = row[slot] ?? []
    return row[slot] as HeatChip[]
  }

  for (const item of items) {
    const drug = item.row.drug
    const row = rowFor(item.ingredient, formOf(drug))
    // A product split by strength names the strength on its chip.
    const strength = item.strengths.length === 0 ? drug.strength?.trim() || strengthOf(drug.label) : null
    cell(row, drug.product).push({
      key: item.key,
      itemKey: item.key,
      label: [chipLabel(drug), strength].filter(Boolean).join(' '),
      ...chipStatus(item),
    })
  }

  for (const drug of catalogue) {
    const row = rowFor(drug.name, formOf(drug))
    const chips = cell(row, drug.product)
    const label = chipLabel(drug)
    if (!chips.some((c) => c.label === label || c.label.startsWith(`${label} `))) {
      chips.push({ key: `missing|${row.key}|${drug.product}|${label}`, itemKey: null, label, tone: 'grey', status: 'No data', marks: [] })
    }
  }

  return Array.from(rows.values())
}

const TONE_RANK: Record<HeatTone, number> = { green: 0, amber: 1, grey: 2, red: 3 }

/** Best (lowest) tone rank across a row's chips; 4 when it has none. */
export function bestToneRank(row: HeatRow): number {
  const chips = [...(row.generic ?? []), ...(row.brand ?? [])]
  return chips.length ? Math.min(...chips.map((c) => TONE_RANK[c.tone])) : 4
}

export type HeatSort = 'cns' | 'coverage'

export function sortHeatmap(rows: HeatRow[], mode: HeatSort): HeatRow[] {
  const byCns = (a: HeatRow, b: HeatRow) =>
    (a.cnsRank === b.cnsRank ? 0 : a.cnsRank < b.cnsRank ? -1 : 1) || a.label.localeCompare(b.label)
  return [...rows].sort((a, b) => (mode === 'coverage' ? bestToneRank(a) - bestToneRank(b) : 0) || byCns(a, b))
}
