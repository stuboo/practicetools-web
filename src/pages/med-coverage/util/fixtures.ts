// Test fixtures shaped exactly like the /med-coverage/v1 API contract.

import { MedCovPayerDetail, MedCovRow } from '../../../types/medCoverage'

let nextId = 1

export function row(overrides: Partial<Omit<MedCovRow, 'drug'>> & { drug?: Partial<MedCovRow['drug']> } = {}): MedCovRow {
  const { drug, ...rest } = overrides
  return {
    id: nextId++,
    drug: {
      id: 1,
      name: 'mirabegron',
      product: 'brand',
      label: 'Myrbetriq ER 25 mg',
      class_code: 'oab_beta3',
      ...drug,
    },
    plan_year: 2027,
    status_or_tier: 'Tier 3',
    on_formulary: true,
    pa: 'N',
    st: 'Y',
    ql: 'Y',
    ql_amount: '30',
    ql_days: '30',
    trials_required: '1',
    trial_duration: '>=30-day supply',
    contraindication_pathway: 'GAP',
    approval_initial: 'GAP',
    approval_renewal: 'GAP',
    criteria_summary: null,
    origin: 'seed',
    source: {
      id: 4,
      url: 'https://www.example-plan.com/formulary-2027.pdf',
      doc_date: '2026-10-07',
      retrieved: '2026-10-25',
      last_checked: '2026-10-25',
    },
    ...rest,
  }
}

export const genericMirabegron = { id: 2, name: 'mirabegron', product: 'generic' as const, label: 'mirabegron ER tablet (generic)' }
export const brandMyrbetriq = { id: 1, name: 'mirabegron', product: 'brand' as const, label: 'Myrbetriq ER 25 mg' }
export const brandGemtesa = { id: 3, name: 'vibegron', product: 'brand' as const, label: 'Gemtesa 75 mg' }
export const genericOxybutynin = {
  id: 10,
  name: 'oxybutynin',
  product: 'generic' as const,
  label: 'oxybutynin ER tablet (generic)',
  class_code: 'oab_antimuscarinic',
}

export function medicareDetail(): MedCovPayerDetail {
  return {
    payer: {
      id: 7,
      name: 'Security Health Plan Medicare Advantage',
      kind: 'medicare_plan',
      pbm_name: null,
      plan: {
        id: 3,
        contract_id: 'H5211',
        plan_id: '001',
        segment_id: '000',
        contract_plan: 'H5211-001',
        plan_name: 'Security Advantage Plus',
        org_name: 'Security Health Plan of Wisconsin',
        plan_type: 'MA-PD (local)',
        formulary_id: '00026003',
        plan_year: 2027,
        brown_county: true,
      },
    },
    rows: [
      row({ drug: brandMyrbetriq, plan_year: 2027, status_or_tier: 'Tier 3' }),
      row({ drug: genericMirabegron, plan_year: 2027, on_formulary: false, status_or_tier: 'Not on formulary' }),
      row({ drug: brandGemtesa, plan_year: 2027, status_or_tier: 'Tier 4', pa: 'Y' }),
      row({ drug: brandMyrbetriq, plan_year: 2026, status_or_tier: 'Tier 4' }),
      row({ drug: genericMirabegron, plan_year: 2026, status_or_tier: 'Tier 2' }),
      row({ drug: genericOxybutynin, plan_year: 2027, status_or_tier: 'Tier 1', st: 'N', pa: 'N' }),
    ],
    changes: [
      { id: 1, date: '2026-10-25', payer_id: 7, payer_name: 'Security Advantage Plus', plan_id: 3, kind: 'tier_change', summary: 'Myrbetriq moved to tier 3.', source_url: null, origin: 'cms' },
      { id: 2, date: '2026-10-01', payer_id: 7, payer_name: 'Security Advantage Plus', plan_id: 3, kind: 'product_removed', summary: 'Generic mirabegron removed.', source_url: null, origin: 'cms' },
      { id: 3, date: '2026-09-01', payer_id: 7, payer_name: 'Security Advantage Plus', plan_id: 3, kind: 'brown_county', summary: 'Plan now serves Brown County.', source_url: null, origin: 'cms' },
      { id: 4, date: '2026-08-01', payer_id: 7, payer_name: 'Security Advantage Plus', plan_id: 3, kind: 'tier_change', summary: 'An older change.', source_url: null, origin: 'cms' },
    ],
  }
}

export function commercialDetail(): MedCovPayerDetail {
  return {
    payer: { id: 12, name: 'Security Health Plan', kind: 'commercial', pbm_name: 'Optum Rx', plan: null },
    rows: [
      row({ drug: genericMirabegron, plan_year: null, status_or_tier: 'Tier 2', pa: 'Y', st: 'N', ql: 'GAP', approval_initial: '12 months' }),
      row({ drug: brandGemtesa, plan_year: null, on_formulary: false, status_or_tier: 'Not on formulary', pa: 'GAP', st: 'GAP' }),
    ],
    changes: [],
  }
}
