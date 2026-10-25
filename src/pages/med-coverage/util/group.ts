// Grouping for the result page. The API lists drugs per strength
// ("Myrbetriq ER 25 mg tablet", "Myrbetriq ER 50 mg tablet") and commercial
// payers may list one drug once per product line. The card shows one block
// per product (name + brand/generic + form) with its strengths together,
// and splits strengths apart only when their coverage actually differs.

import { MedCovRow } from '../../../types/medCoverage'

const STRENGTH = /\s*\b\d+(?:\.\d+)?\s*(?:mg\/mL|mg|mcg|%)(?![\w/])/gi

/** "Myrbetriq ER 25 mg tablet" -> "25 mg"; null when the label has none. */
export function strengthOf(label: string): string | null {
  const found = label.match(STRENGTH)
  return found ? found.map((s) => s.trim()).join(' / ') : null
}

/** "Myrbetriq ER 25 mg tablet" -> "Myrbetriq ER tablet". Keeps form, drops strength. */
export function productLabel(label: string): string {
  return label.replace(STRENGTH, '').replace(/\s{2,}/g, ' ').trim()
}

export interface ProductGroup {
  key: string
  label: string
  strengths: string[]
  rows: MedCovRow[]
  /** True when every strength has the same coverage, so one card covers all. */
  uniform: boolean
}

function coverageSignature(row: MedCovRow): string {
  return JSON.stringify([
    row.status_or_tier, row.on_formulary, row.pa, row.st, row.ql, row.ql_amount, row.ql_days,
    row.trials_required, row.trial_duration, row.contraindication_pathway, row.approval_initial,
    row.approval_renewal, row.criteria_summary, row.notes, row.formulary_name,
    row.source?.url, row.source?.doc_date, row.source?.last_checked,
  ])
}

/** Product groups in first-seen order. */
export function groupByProduct(rows: MedCovRow[]): ProductGroup[] {
  const groups = new Map<string, ProductGroup>()
  for (const row of rows) {
    const label = productLabel(row.drug.label)
    const key = `${row.drug.name}|${row.drug.product}|${label.toLowerCase()}`
    let group = groups.get(key)
    if (!group) {
      group = { key, label, strengths: [], rows: [], uniform: true }
      groups.set(key, group)
    }
    group.rows.push(row)
    const strength = strengthOf(row.drug.label)
    if (strength && !group.strengths.includes(strength)) group.strengths.push(strength)
  }
  for (const group of groups.values()) {
    group.uniform = new Set(group.rows.map(coverageSignature)).size <= 1
  }
  return Array.from(groups.values())
}

export const ALL_LINES = '__all__'

/** Distinct product lines, in first-seen order; rows without one are "". */
export function productLines(rows: MedCovRow[]): string[] {
  return Array.from(new Set(rows.map((r) => r.product_line?.trim() || '')))
}

export function rowsForLine(rows: MedCovRow[], line: string): MedCovRow[] {
  if (line === ALL_LINES) return rows
  return rows.filter((r) => (r.product_line?.trim() || '') === line)
}
