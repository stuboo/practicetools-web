// The at-a-glance answer to "what OAB meds are available to this patient?".
// Products (ingredient + form, strengths collapsed) are sorted into four
// availability buckets, beta-3 agonists before antimuscarinics. Pure so the
// bucketing can be tested without rendering.

import { Flag, MedCovRow, MedCovRowDrug } from '../../../types/medCoverage'
import { groupByProduct } from './group'
import { isGap } from './format'

export type Availability = 'open' | 'restricted' | 'not_covered' | 'unknown'

export const AVAILABILITY_ORDER: Availability[] = ['open', 'restricted', 'not_covered', 'unknown']

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  open: 'Covered, no PA or step',
  restricted: 'Covered with PA or step therapy',
  not_covered: 'Not covered',
  unknown: 'Coverage not published',
}

/**
 * Brand name from the drug label: the leading capitalised words, stopping at
 * a release designator (ER/IR), a number, a parenthesis or a lowercase word.
 * "Myrbetriq ER 25 mg tablet" -> "Myrbetriq", "Detrol LA capsule" -> "Detrol LA",
 * "Vesicare LS oral suspension" -> "Vesicare LS", "Gemtesa (vibegron) ..." -> "Gemtesa".
 */
export function brandName(drug: Pick<MedCovRowDrug, 'label' | 'name'>): string {
  const words: string[] = []
  for (const word of drug.label.trim().split(/\s+/)) {
    if (!word) break
    if (words.length > 0 && (/^(ER|IR)$/.test(word) || /^[\d(]/.test(word) || /^[a-z]/.test(word))) break
    words.push(word)
  }
  return words.join(' ') || drug.name
}

export const DEFAULT_CLASS_ORDER = ['oab_beta3', 'oab_antimuscarinic']

/**
 * A covered drug goes under "with PA or step therapy" when the payer
 * publishes PA or ST as Y. When PA or ST is unpublished (GAP) and neither is
 * Y, it stays under "no PA or step", but its badge reads "PA?"/"ST?" so the
 * unknown is visible rather than promised away. (WI Medicaid publishes no ST
 * column at all; treating GAP as restricted would put every preferred drug
 * under "with PA".)
 */
export function availabilityOf(row: Pick<MedCovRow, 'on_formulary' | 'pa' | 'st'>): Availability {
  if (row.on_formulary === false) return 'not_covered'
  if (row.on_formulary == null) return 'unknown'
  return row.pa === 'Y' || row.st === 'Y' ? 'restricted' : 'open'
}

/**
 * Card naming: a bare lowercase ingredient means generic, and a brand reads
 * "Brand (ingredient)" with the form after it.
 * "mirabegron ER tablet (generic)" -> "mirabegron ER tablet";
 * "Myrbetriq ER tablet" -> "Myrbetriq (mirabegron) ER tablet";
 * "Detrol LA capsule" -> "Detrol LA (tolterodine) capsule".
 */
export function displayName(label: string, product: string, ingredient: string): string {
  if (product === 'generic') return label.replace(/\s*\(generic\)\s*/i, ' ').replace(/\s{2,}/g, ' ').trim()
  const brand = brandName({ label, name: ingredient })
  const escaped = ingredient.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const rest = label
    .trim()
    .slice(brand.length)
    .replace(new RegExp(`\\(\\s*${escaped}\\s*\\)`, 'i'), ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return `${brand} (${ingredient})${rest ? ` ${rest}` : ''}`
}

export interface SummaryItem {
  key: string
  name: string
  ingredient: string
  availability: Availability
  /** Tier or status to show; null when not covered or not published. */
  tier: string | null
  pa: Flag | null
  st: Flag | null
  ql: Flag | null
  strengths: string[]
  /** The row whose detail the item expands to. */
  row: MedCovRow
}

export interface SummaryBucket {
  availability: Availability
  label: string
  items: SummaryItem[]
}

function itemFor(row: MedCovRow, name: string, strengths: string[], key: string): SummaryItem {
  const availability = availabilityOf(row)
  return {
    key,
    name,
    ingredient: row.drug.name,
    availability,
    tier: availability === 'open' || availability === 'restricted'
      ? (isGap(row.status_or_tier) ? null : row.status_or_tier)
      : null,
    pa: row.pa,
    st: row.st,
    ql: row.ql,
    strengths,
    row,
  }
}

/** One item per product; a product whose strengths differ is split per strength. */
export function summaryItems(rows: MedCovRow[]): SummaryItem[] {
  const items: SummaryItem[] = []
  for (const group of groupByProduct(rows)) {
    if (group.uniform) {
      items.push(itemFor(group.rows[0], displayName(group.label, group.rows[0].drug.product, group.rows[0].drug.name), group.strengths, group.key))
    } else {
      for (const row of group.rows) {
        items.push(itemFor(row, displayName(row.drug.label, row.drug.product, row.drug.name), [], `${group.key}|${row.id}`))
      }
    }
  }
  return items
}

/** Non-empty buckets in fixed order; within each, classes in `classOrder`, then first-seen order. */
export function summarize(rows: MedCovRow[], classOrder: string[] = DEFAULT_CLASS_ORDER): SummaryBucket[] {
  const rank = (code: string) => {
    const i = classOrder.indexOf(code)
    return i === -1 ? classOrder.length : i
  }
  const items = summaryItems(rows)
    .map((item, index) => ({ item, index }))
    .sort((a, b) => rank(a.item.row.drug.class_code) - rank(b.item.row.drug.class_code) || a.index - b.index)
    .map(({ item }) => item)
  return AVAILABILITY_ORDER.map((availability) => ({
    availability,
    label: AVAILABILITY_LABEL[availability],
    items: items.filter((i) => i.availability === availability),
  })).filter((b) => b.items.length > 0)
}
