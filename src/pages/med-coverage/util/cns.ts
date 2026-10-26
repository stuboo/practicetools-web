// CNS (central nervous system) activity of each OAB product, lowest first.
// The heatmap's default sort is the order of this list, so to move a product
// just move its line. `form` matches the API's drug.form ("ER tablet");
// "IR" is optional ("IR tablet" and "tablet" are the same row).
//
// Levels are a clinical summary for quick sorting, not a dosing rule.

export type CnsLevel = 'Low' | 'Low–Moderate' | 'Moderate' | 'Moderate–High' | 'High'

export const CNS_BADGE: Record<CnsLevel, string> = {
  Low: 'Low',
  'Low–Moderate': 'Low–Mod',
  Moderate: 'Mod',
  'Moderate–High': 'Mod–High',
  High: 'High',
}

export interface CnsEntry {
  ingredient: string
  form: string
  /** Row label on the heatmap. */
  label: string
  level: CnsLevel
}

export const CNS_ORDER: CnsEntry[] = [
  // Beta-3 agonists: no antimuscarinic action, so no anticholinergic CNS effect.
  { ingredient: 'mirabegron', form: 'ER tablet', label: 'mirabegron ER', level: 'Low' },
  { ingredient: 'mirabegron', form: 'ER granules for oral suspension', label: 'mirabegron ER granules', level: 'Low' },
  { ingredient: 'vibegron', form: 'tablet', label: 'vibegron', level: 'Low' },
  // Trospium: quaternary amine, minimal blood-brain barrier penetration.
  { ingredient: 'trospium', form: 'IR tablet', label: 'trospium IR', level: 'Low' },
  { ingredient: 'trospium', form: 'ER capsule', label: 'trospium ER', level: 'Low' },
  // Darifenacin: M3-selective and a P-glycoprotein efflux substrate.
  { ingredient: 'darifenacin', form: 'ER tablet', label: 'darifenacin ER', level: 'Low–Moderate' },
  // Fesoterodine: P-glycoprotein substrate; active metabolite as tolterodine.
  { ingredient: 'fesoterodine', form: 'ER tablet', label: 'fesoterodine ER', level: 'Moderate' },
  // Tolterodine: less lipophilic than oxybutynin; ER before IR.
  { ingredient: 'tolterodine', form: 'ER capsule', label: 'tolterodine ER', level: 'Moderate' },
  { ingredient: 'tolterodine', form: 'IR tablet', label: 'tolterodine IR', level: 'Moderate' },
  // Solifenacin: moderately M3-selective, long half-life.
  { ingredient: 'solifenacin', form: 'tablet', label: 'solifenacin', level: 'Moderate' },
  { ingredient: 'solifenacin', form: 'oral suspension', label: 'solifenacin oral suspension', level: 'Moderate' },
  // Oxybutynin skin forms: bypass first-pass metabolism, less N-desethyloxybutynin.
  { ingredient: 'oxybutynin', form: 'transdermal patch', label: 'oxybutynin patch', level: 'Moderate–High' },
  { ingredient: 'oxybutynin', form: 'topical gel', label: 'oxybutynin gel', level: 'Moderate–High' },
  // Oral oxybutynin: lipophilic tertiary amine; IR has the highest anticholinergic burden.
  { ingredient: 'oxybutynin', form: 'ER tablet', label: 'oxybutynin ER', level: 'High' },
  { ingredient: 'oxybutynin', form: 'IR tablet', label: 'oxybutynin IR', level: 'High' },
  { ingredient: 'oxybutynin', form: 'oral solution', label: 'oxybutynin oral solution', level: 'High' },
]

/** "IR tablet" and "tablet" are the same; case and spacing do not matter. */
export function normalizeForm(form: string | null | undefined): string {
  return (form ?? '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/^ir /, '')
}

export function cnsKey(ingredient: string, form: string | null | undefined): string {
  return `${ingredient.trim().toLowerCase()}|${normalizeForm(form)}`
}

/** Position in CNS_ORDER, or -1 when the product has no entry. */
export function cnsIndex(ingredient: string, form: string | null | undefined): number {
  const key = cnsKey(ingredient, form)
  return CNS_ORDER.findIndex((e) => cnsKey(e.ingredient, e.form) === key)
}

/**
 * Best-effort form from a catalogue label, for drugs that arrive without
 * drug.form (GET /v1/classes does not carry it). Matches every live label.
 */
export function formFromLabel(label: string): string {
  const l = label.toLowerCase()
  if (/granules/.test(l)) return 'ER granules for oral suspension'
  if (/patch/.test(l)) return 'transdermal patch'
  if (/\bgel\b/.test(l)) return 'topical gel'
  if (/oral solution|syrup/.test(l)) return 'oral solution'
  if (/oral suspension/.test(l)) return 'oral suspension'
  const release = /\b(er|la|xl)\b/.test(l) ? 'ER ' : /\bir\b/.test(l) ? 'IR ' : ''
  const dosage = /capsule/.test(l) ? 'capsule' : 'tablet'
  return `${release}${dosage}`
}
