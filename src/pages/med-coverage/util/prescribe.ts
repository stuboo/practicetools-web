// "Prescribe this": which product of an ingredient the plan actually lists.
// The point is the trap where brand Myrbetriq is on formulary but generic
// mirabegron is not (or the reverse); an MA who sends the wrong one gets a
// rejection at the pharmacy. Pure functions so every case is testable.

import { MedCovRow, MedCovRowDrug } from '../../../types/medCoverage'

export type PrescribeKind = 'generic' | 'brand' | 'none' | 'unknown'

export interface PrescribeAdvice {
  ingredient: string
  /** Display form ("ER tablet") when advice is per form; null when the form is unknown. */
  form: string | null
  kind: PrescribeKind
  /** One line for the MA, e.g. "Myrbetriq, not generic mirabegron". */
  text: string
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

/**
 * Form key used to compare brand with generic: brand Myrbetriq tablets are
 * weighed against generic mirabegron tablets, never against granules. When
 * the API gives no form, every such row of the ingredient shares one key.
 */
export function formKey(drug: Pick<MedCovRowDrug, 'form'>): string {
  return drug.form?.trim().toLowerCase() ?? ''
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
export function prescribeThis(ingredient: string, rows: MedCovRow[], form?: string): PrescribeAdvice {
  const mine = rows.filter(
    (r) => r.drug.name === ingredient && (form === undefined || formKey(r.drug) === form.trim().toLowerCase())
  )
  const shownForm = form === undefined ? null : mine.find((r) => r.drug.form?.trim())?.drug.form?.trim() ?? null
  return { ingredient, form: shownForm, ...decide(ingredient, mine) }
}

function decide(ingredient: string, mine: MedCovRow[]): Pick<PrescribeAdvice, 'kind' | 'text'> {
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
        kind: 'brand',
        text: `${brandText(coveredBrand)}. ${capitalize(genericText)} is also covered, with more restrictions.`,
      }
    }
    return {
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
    return { kind: 'brand', text: otherProduct(generics, genericText, brandText(coveredBrand)) }
  }

  if (coveredGeneric.length) {
    return {
      kind: 'generic',
      text: otherProduct(brands, brands.length ? brandText(brands) : '', capitalize(genericText)),
    }
  }

  const products = [generics.length ? genericText : '', brands.length ? brandText(brands) : ''].filter(Boolean)
  if (mine.some((r) => r.on_formulary == null)) {
    return {
      kind: 'unknown',
      text: `Coverage not published for ${products.join(' or ') || ingredient}. Check the payer's formulary.`,
    }
  }
  const what = products.length === 2
    ? `neither ${products[0]} nor ${products[1]} is covered`
    : `${products[0] ?? genericText} is not covered`
  return { kind: 'none', text: `Not on this formulary: ${what}.` }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Advice for each form of an ingredient, forms in first-seen order. */
export function prescribeByForm(ingredient: string, rows: MedCovRow[]): PrescribeAdvice[] {
  const forms = unique(rows.filter((r) => r.drug.name === ingredient).map((r) => formKey(r.drug)))
  return forms.map((form) => prescribeThis(ingredient, rows, form))
}

/** Ingredients in the order their rows first appear. */
export function ingredientsOf(rows: MedCovRow[]): string[] {
  return unique(rows.map((r) => r.drug.name))
}
