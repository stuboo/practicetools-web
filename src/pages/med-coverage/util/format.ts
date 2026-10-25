// Display helpers for coverage rows. Unknown values are "GAP" in the data and
// must read as "Not published" on screen: the card never fills a gap with a
// guess.

import { Flag, MedCovRow } from '../../../types/medCoverage'

export const NOT_PUBLISHED = 'Not published'

export const PORTAL_DISCLAIMER = 'Payer criteria change. Confirm in the payer portal before submitting.'

export function isGap(value: string | null | undefined): boolean {
  return value == null || value.trim() === '' || value.trim().toUpperCase() === 'GAP'
}

export function flagText(flag: Flag | null | undefined): string {
  if (flag === 'Y') return 'Yes'
  if (flag === 'N') return 'No'
  return NOT_PUBLISHED
}

export function quantityLimitText(row: Pick<MedCovRow, 'ql' | 'ql_amount' | 'ql_days'>): string {
  if (row.ql === 'Y' && !isGap(row.ql_amount) && !isGap(row.ql_days)) {
    return `Yes, ${row.ql_amount} per ${row.ql_days} days`
  }
  return flagText(row.ql)
}

export function criterionText(value: string | null | undefined): string {
  if (value == null || isGap(value)) return NOT_PUBLISHED
  if (value.trim().toLowerCase() === 'n/a') return 'Not applicable'
  return value.trim()
}

/** "Not published" for an unknown date; the ISO date otherwise. */
export function dateText(value: string | null | undefined): string {
  return value == null || isGap(value) ? NOT_PUBLISHED : value
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export interface Criterion {
  label: string
  value: string
  gap: boolean
}

export function criteriaChecklist(row: MedCovRow): Criterion[] {
  const items: [string, string | null][] = [
    ['Prior trials required', row.trials_required],
    ['Trial duration', row.trial_duration],
    ['Contraindication pathway', row.contraindication_pathway],
    ['Initial approval length', row.approval_initial],
    ['Renewal approval length', row.approval_renewal],
  ]
  return items.map(([label, value]) => ({ label, value: criterionText(value), gap: isGap(value) }))
}

/**
 * Epic SmartPhrases to run next. Beta-3 agonists always get the evidence
 * phrase then the drug's letter of medical necessity; antimuscarinics get the
 * evidence phrase only when the plan puts a PA or step edit on them.
 */
export function nextSmartPhrases(row: Pick<MedCovRow, 'drug' | 'pa' | 'st'>): string[] {
  const name = row.drug.name.toLowerCase()
  if (name === 'vibegron') return ['.OABPAEVIDENCE', '.OABLMNVIBEGRON']
  if (name === 'mirabegron') return ['.OABPAEVIDENCE', '.OABLMNMIRABEGRON']
  if (row.pa === 'Y' || row.st === 'Y') return ['.OABPAEVIDENCE']
  return []
}

/** Distinct plan years, newest first. Rows without a year are ignored. */
export function planYears(rows: MedCovRow[]): number[] {
  const years = rows.map((r) => r.plan_year).filter((y): y is number => typeof y === 'number')
  return Array.from(new Set(years)).sort((a, b) => b - a)
}

/** Rows for one plan year; rows with no year apply to every year. */
export function rowsForYear(rows: MedCovRow[], year: number | null): MedCovRow[] {
  if (year == null) return rows
  return rows.filter((r) => r.plan_year == null || r.plan_year === year)
}
