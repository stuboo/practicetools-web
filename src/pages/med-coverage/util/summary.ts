// The at-a-glance answer to "what OAB meds are available to this patient?".
// Products (ingredient + form, strengths collapsed) are sorted into four
// availability buckets, beta-3 agonists before antimuscarinics. Pure so the
// bucketing can be tested without rendering.

import { Flag, MedCovRow } from '../../../types/medCoverage'
import { groupByProduct } from './group'
import { best, brandName, formKey, ingredientsOf, prescribeThis } from './prescribe'
import { isGap } from './format'

export type Availability = 'open' | 'restricted' | 'not_covered' | 'unknown'

export const AVAILABILITY_ORDER: Availability[] = ['open', 'restricted', 'not_covered', 'unknown']

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  open: 'Covered, no PA or step',
  restricted: 'Covered with PA or step therapy',
  not_covered: 'Not covered',
  unknown: 'Coverage not published',
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

/** "mirabegron ER tablet (generic)" -> "Generic mirabegron ER tablet"; brands as labelled. */
export function displayName(label: string, product: string): string {
  if (product !== 'generic') return label
  const bare = label.replace(/\s*\(generic\)\s*/i, ' ').replace(/\s{2,}/g, ' ').trim()
  return `Generic ${bare}`
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
      items.push(itemFor(group.rows[0], displayName(group.label, group.rows[0].drug.product), group.strengths, group.key))
    } else {
      for (const row of group.rows) {
        items.push(itemFor(row, displayName(row.drug.label, row.drug.product), [], `${group.key}|${row.id}`))
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

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** " (PA and step therapy required; quantity limit)" for the row sent, or "". */
export function restrictionNote(row: Pick<MedCovRow, 'pa' | 'st' | 'ql'>): string {
  const required = [row.pa === 'Y' ? 'PA' : '', row.st === 'Y' ? 'step therapy' : ''].filter(Boolean)
  const parts = [required.length ? `${required.join(' and ')} required` : '', row.ql === 'Y' ? 'quantity limit' : '']
    .filter(Boolean)
  return parts.length ? ` (${parts.join('; ')})` : ''
}

/** "is not covered" when every row says so, else "coverage not published". */
function statusPhrase(rows: MedCovRow[]): string {
  return rows.every((r) => r.on_formulary === false) ? 'is not covered' : 'coverage not published'
}

/**
 * One plain sentence for one ingredient, labelled with the ingredient so two
 * drugs never share a line: "Mirabegron: send generic. Myrbetriq is not
 * covered." / "Vibegron: Gemtesa is covered (PA required)."
 */
export function highlightLine(ingredient: string, rows: MedCovRow[]): string {
  const mine = rows.filter((r) => r.drug.name === ingredient)
  const generics = mine.filter((r) => r.drug.product === 'generic')
  const brands = mine.filter((r) => r.drug.product === 'brand')
  const coveredG = generics.filter((r) => r.on_formulary === true)
  const coveredB = brands.filter((r) => r.on_formulary === true)
  const name = capitalize(ingredient)
  const brand = Array.from(new Set(brands.map((r) => brandName(r.drug)))).join(' / ')
  const genericLabel = `generic ${ingredient}`

  if (!generics.length || !brands.length) {
    const only = generics.length ? generics : brands
    const label = generics.length ? capitalize(genericLabel) : brand
    const covered = only.filter((r) => r.on_formulary === true)
    if (covered.length) return `${name}: ${label} is covered${restrictionNote(best(covered))}.`
    return `${name}: ${label} ${statusPhrase(only)}.`
  }

  if (coveredG.length && coveredB.length) {
    const sendBrand = prescribeThis(ingredient, mine).kind === 'brand'
    const sent = best(sendBrand ? coveredB : coveredG)
    return sendBrand
      ? `${name}: send ${brand}${restrictionNote(sent)}. ${capitalize(genericLabel)} is also covered.`
      : `${name}: send generic${restrictionNote(sent)}. ${brand} is also covered.`
  }
  if (coveredG.length) {
    return `${name}: send generic${restrictionNote(best(coveredG))}. ${brand} ${statusPhrase(brands)}.`
  }
  if (coveredB.length) {
    return `${name}: send ${brand}${restrictionNote(best(coveredB))}. ${capitalize(genericLabel)} ${statusPhrase(generics)}.`
  }
  if (mine.every((r) => r.on_formulary === false)) {
    return `${name}: neither ${genericLabel} nor ${brand} is covered.`
  }
  if (mine.every((r) => r.on_formulary == null)) return `${name}: coverage not published.`
  return `${name}: ${genericLabel} ${statusPhrase(generics)}, and ${brand} ${statusPhrase(brands)}.`
}

export interface HighlightLine {
  ingredient: string
  text: string
}

/**
 * One "Prescribe this" line per beta-3 ingredient, for the product an MA
 * sends for an adult: the tablet form when there is one (granules for
 * suspension still show in the list below), otherwise the first form.
 */
export function beta3Highlights(rows: MedCovRow[]): HighlightLine[] {
  const beta3 = rows.filter((r) => r.drug.class_code === 'oab_beta3')
  return ingredientsOf(beta3).map((ingredient) => {
    const mine = beta3.filter((r) => r.drug.name === ingredient)
    const forms = Array.from(new Set(mine.map((r) => formKey(r.drug))))
    const form = forms.find((f) => /tablet/.test(f)) ?? forms[0]
    return { ingredient, text: highlightLine(ingredient, mine.filter((r) => formKey(r.drug) === form)) }
  })
}
