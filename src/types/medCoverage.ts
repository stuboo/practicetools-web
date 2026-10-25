// Shapes returned by the practicetools API under /med-coverage/v1. They mirror
// the API contract field for field; nothing here is derived or renamed.

/** e.g. "oab_beta3", "oab_antimuscarinic"; more classes can be added server-side. */
export type ClassCode = string
export type ProductKind = 'generic' | 'brand'
export type PayerKind = 'medicare_plan' | 'medicaid' | 'commercial' | 'pbm'

/** "Y" | "N" | "GAP". GAP means the payer has not published the value. */
export type Flag = 'Y' | 'N' | 'GAP'

export interface MedCovDrug {
  id: number
  /** Lowercase ingredient, e.g. "mirabegron". */
  name: string
  product: ProductKind
  label: string
}

export interface MedCovRowDrug extends MedCovDrug {
  class_code: ClassCode
}

export interface MedCovClass {
  id: number
  code: ClassCode
  label: string
  drugs: MedCovDrug[]
}

export interface MedCovPlan {
  id: number
  contract_id: string
  plan_id: string
  segment_id: string
  contract_plan: string
  plan_name: string
  org_name: string
  plan_type: string
  formulary_id: string
  plan_year: number
  brown_county: boolean
}

export interface MedCovPayer {
  id: number
  name: string
  kind: PayerKind
  pbm_name: string | null
  plan: MedCovPlan | null
}

export interface MedCovSource {
  id: number
  url: string
  doc_date: string | null
  retrieved: string | null
  last_checked: string | null
}

export interface MedCovRow {
  id: number
  drug: MedCovRowDrug
  plan_year: number | null
  status_or_tier: string | null
  on_formulary: boolean
  pa: Flag | null
  st: Flag | null
  ql: Flag | null
  ql_amount: string | null
  ql_days: string | null
  trials_required: string | null
  trial_duration: string | null
  contraindication_pathway: string | null
  approval_initial: string | null
  approval_renewal: string | null
  criteria_summary: string | null
  origin: string
  source: MedCovSource | null
}

export type ChangeOrigin = 'cms' | 'reviewed' | 'seed'

export interface MedCovChange {
  id: number
  date: string
  payer_id: number
  payer_name: string
  plan_id: number | null
  kind: string
  summary: string
  source_url: string | null
  origin: ChangeOrigin
}

export interface MedCovPayerDetail {
  payer: MedCovPayer
  rows: MedCovRow[]
  changes: MedCovChange[]
}

export interface MedCovMeta {
  data_checked: string | null
  cms_release: {
    plan_year: number
    period: string
    posted: string
  } | null
}

/** Outcome of POST /v1/requests, flattened so the UI never inspects HTTP. */
export type MedCovRequestResult =
  | { status: 'requested' }
  | { status: 'invalid'; message: string }
  | { status: 'closed' }
  | { status: 'rate_limited' }
  | { status: 'error' }
