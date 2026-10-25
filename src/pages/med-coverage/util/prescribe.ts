// "Prescribe this": which product of an ingredient the plan actually lists.
// The point is the trap where brand Myrbetriq is on formulary but generic
// mirabegron is not (or the reverse); an MA who sends the wrong one gets a
// rejection at the pharmacy. Pure functions so every case is testable.

import { MedCovRow, MedCovRowDrug } from '../../../types/medCoverage'

export type PrescribeKind = 'generic' | 'brand' | 'none' | 'unknown'

export interface PrescribeAdvice {
  ingredient: string
  kind: PrescribeKind
  /** One line for the MA, e.g. "Myrbetriq, not generic mirabegron". */
  text: string
}

/** Brand name from the drug label: "Myrbetriq ER 25 mg" -> "Myrbetriq". */
export function brandName(drug: Pick<MedCovRowDrug, 'label' | 'name'>): string {
  const first = drug.label.trim().split(/\s+/)[0]
  return first || drug.name
}

function tierNumber(row: MedCovRow): number {
  const match = /tier\s*(\d+)/i.exec(row.status_or_tier ?? '')
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY
}

function editCount(row: MedCovRow): number {
  return (row.pa === 'Y' ? 1 : 0) + (row.st === 'Y' ? 1 : 0)
}

/** The easiest-to-fill covered row: lowest tier, then fewest PA/ST edits. */
function best(rows: MedCovRow[]): MedCovRow {
  return [...rows].sort((a, b) => tierNumber(a) - tierNumber(b) || editCount(a) - editCount(b))[0]
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values))
}

/**
 * Decide what to prescribe for one ingredient, given that ingredient's rows
 * for a single payer and plan year.
 */
export function prescribeThis(ingredient: string, rows: MedCovRow[]): PrescribeAdvice {
  const mine = rows.filter((r) => r.drug.name === ingredient)
  const generics = mine.filter((r) => r.drug.product === 'generic')
  const brands = mine.filter((r) => r.drug.product === 'brand')
  const coveredGeneric = generics.filter((r) => r.on_formulary === true)
  const coveredBrand = brands.filter((r) => r.on_formulary === true)

  const genericText = `generic ${ingredient}`
  const brandText = (list: MedCovRow[]) => unique(list.map((r) => brandName(r.drug))).join(' / ')

  if (coveredGeneric.length && coveredBrand.length) {
    const g = best(coveredGeneric)
    const b = best(coveredBrand)
    const brandWins = tierNumber(b) < tierNumber(g) ||
      (tierNumber(b) === tierNumber(g) && editCount(b) < editCount(g))
    if (brandWins) {
      return {
        ingredient,
        kind: 'brand',
        text: `${brandText(coveredBrand)}. ${capitalize(genericText)} is also covered, with more restrictions.`,
      }
    }
    return {
      ingredient,
      kind: 'generic',
      text: `${capitalize(genericText)}. ${brandText(coveredBrand)} is also covered.`,
    }
  }

  // on_formulary null means the payer has not published coverage. It is
  // never read as "not covered": the MA is told it is unknown instead.
  const otherProduct = (others: MedCovRow[], othersText: string, chosen: string) => {
    if (!others.length) return chosen
    if (others.every((r) => r.on_formulary === false)) return `${chosen}, not ${othersText}`
    return `${chosen}. Coverage of ${othersText} is not published.`
  }

  if (coveredBrand.length) {
    return { ingredient, kind: 'brand', text: otherProduct(generics, genericText, brandText(coveredBrand)) }
  }

  if (coveredGeneric.length) {
    return {
      ingredient,
      kind: 'generic',
      text: otherProduct(brands, brands.length ? brandText(brands) : '', capitalize(genericText)),
    }
  }

  const products = [generics.length ? genericText : '', brands.length ? brandText(brands) : ''].filter(Boolean)
  if (mine.some((r) => r.on_formulary == null)) {
    return {
      ingredient,
      kind: 'unknown',
      text: `Coverage not published for ${products.join(' or ') || ingredient}. Check the payer's formulary.`,
    }
  }
  const what = products.length === 2
    ? `neither ${products[0]} nor ${products[1]} is covered`
    : `${products[0] ?? genericText} is not covered`
  return { ingredient, kind: 'none', text: `Not on this formulary: ${what}.` }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Ingredients in the order their rows first appear. */
export function ingredientsOf(rows: MedCovRow[]): string[] {
  return unique(rows.map((r) => r.drug.name))
}
