import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import ResultView from './ResultView'
import { brandGemtesa, brandMyrbetriq, brandMyrbetriq50, commercialDetail, genericMirabegron, medicareDetail, row } from './util/fixtures'
import { MedCovPayerDetail } from '../../types/medCoverage'

const FOOTER = 'Payer criteria change. Confirm in the payer portal before submitting.'

function expectEveryResultSourced() {
  const cards = screen.getAllByTestId('drug-result')
  expect(cards.length).toBeGreaterThan(0)
  for (const card of cards) {
    const line = within(card).getByTestId('source-line')
    expect(line).toHaveTextContent(/Source:/)
    expect(line).toHaveTextContent(/Document date:/)
    expect(line).toHaveTextContent(/Last checked:/)
  }
}

describe('ResultView', () => {
  it.each([
    ['Medicare plan', medicareDetail(), 'oab_beta3'],
    ['Medicare plan, antimuscarinics', medicareDetail(), 'oab_antimuscarinic'],
    ['commercial payer', commercialDetail(), 'oab_beta3'],
  ] as [string, MedCovPayerDetail, string][])(
    'shows the portal footer and a source/date line on every drug (%s)',
    (_label, detail, classCode) => {
      render(<ResultView detail={detail} classCode={classCode} />)
      expect(screen.getByText(FOOTER)).toBeInTheDocument()
      expectEveryResultSourced()
    }
  )

  it('still shows the footer when no rows are published for the class', () => {
    render(<ResultView detail={{ ...commercialDetail(), rows: [] }} classCode="oab_beta3" />)
    expect(screen.getByText(FOOTER)).toBeInTheDocument()
    expect(screen.getByText(/No coverage rows are published/)).toBeInTheDocument()
  })

  it('says when a source is missing instead of hiding the line', () => {
    const detail = commercialDetail()
    detail.rows = [{ ...detail.rows[0], source: null }]
    render(<ResultView detail={detail} classCode="oab_beta3" />)
    expect(screen.getByTestId('source-line')).toHaveTextContent('Source: not recorded')
  })

  it('shows the source document date and last-checked date', () => {
    render(<ResultView detail={commercialDetail()} classCode="oab_beta3" />)
    const line = screen.getAllByTestId('source-line')[0]
    expect(line).toHaveTextContent('Document date: 2026-10-07')
    expect(line).toHaveTextContent('Last checked: 2026-10-25')
    expect(within(line).getByRole('link')).toHaveAttribute('href', 'https://www.example-plan.com/formulary-2027.pdf')
  })

  it('defaults Medicare to the newest plan year and toggles to the older one', async () => {
    render(<ResultView detail={medicareDetail()} classCode="oab_beta3" />)
    expect(screen.getByRole('button', { name: '2027' })).toHaveAttribute('aria-pressed', 'true')
    const mirabegron = () => screen.getAllByTestId('prescribe-this')[0]
    expect(mirabegron()).toHaveTextContent('Myrbetriq, not generic mirabegron')

    await userEvent.click(screen.getByRole('button', { name: '2026' }))
    expect(screen.getByRole('button', { name: '2026' })).toHaveAttribute('aria-pressed', 'true')
    expect(mirabegron()).toHaveTextContent('Generic mirabegron. Myrbetriq is also covered.')
    expect(screen.getByText(FOOTER)).toBeInTheDocument()
    expectEveryResultSourced()
  })

  it('has no year toggle when there is only one year', () => {
    render(<ResultView detail={commercialDetail()} classCode="oab_beta3" />)
    expect(screen.queryByRole('group', { name: 'Plan year' })).not.toBeInTheDocument()
  })

  it('shows only the chosen class', () => {
    render(<ResultView detail={medicareDetail()} classCode="oab_antimuscarinic" />)
    expect(screen.getAllByTestId('drug-result')).toHaveLength(1)
    expect(screen.getByText('oxybutynin ER tablet (generic)')).toBeInTheDocument()
  })

  it('renders GAP criteria as "Not published" and the next-step SmartPhrases', () => {
    render(<ResultView detail={commercialDetail()} classCode="oab_beta3" />)
    const card = screen.getAllByTestId('drug-result')[0]
    expect(within(card).getAllByText('Not published').length).toBeGreaterThan(0)
    expect(within(card).getByText('.OABPAEVIDENCE')).toBeInTheDocument()
    expect(within(card).getByText('.OABLMNMIRABEGRON')).toBeInTheDocument()
  })

  it('shows at most the last 3 changes for the payer', () => {
    render(<ResultView detail={medicareDetail()} classCode="oab_beta3" />)
    expect(screen.getByText('Myrbetriq moved to tier 3.')).toBeInTheDocument()
    expect(screen.getByText('Plan now serves Brown County.')).toBeInTheDocument()
    expect(screen.queryByText('An older change.')).not.toBeInTheDocument()
  })

  it('shows strengths with identical coverage as one card', () => {
    render(<ResultView detail={medicareDetail()} classCode="oab_beta3" />)
    const card = screen.getByRole('article', { name: 'Myrbetriq ER tablet' })
    expect(card).toHaveTextContent('Strengths: 25 mg, 50 mg')
    expect(screen.getByRole('article', { name: 'mirabegron ER tablet (generic)' })).toHaveTextContent('Not on formulary')
    // Myrbetriq, generic mirabegron, Gemtesa
    expect(screen.getAllByTestId('drug-result')).toHaveLength(3)
  })

  it('splits strengths apart when their coverage differs', () => {
    const detail = commercialDetail()
    detail.rows = [row({ drug: brandMyrbetriq, plan_year: null, status_or_tier: 'Tier 3' }), row({ drug: brandMyrbetriq50, plan_year: null, status_or_tier: 'Tier 4' })]
    render(<ResultView detail={detail} classCode="oab_beta3" />)
    expect(screen.getByText('Myrbetriq ER tablet: coverage differs by strength')).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Myrbetriq ER 25 mg tablet' })).toHaveTextContent('Tier 3')
    expect(screen.getByRole('article', { name: 'Myrbetriq ER 50 mg tablet' })).toHaveTextContent('Tier 4')
    expectEveryResultSourced()
  })

  it('shows unknown coverage as "Coverage not published", never "Not covered"', () => {
    const detail = commercialDetail()
    detail.rows = [row({ drug: brandGemtesa, plan_year: null, on_formulary: null, status_or_tier: 'Suppressed by CMS (no formulary data)', pa: 'GAP', st: 'GAP', ql: 'GAP' })]
    render(<ResultView detail={detail} classCode="oab_beta3" />)
    const card = screen.getByTestId('drug-result')
    expect(card).toHaveTextContent('Coverage not published')
    expect(card).toHaveTextContent('Payer listing: Suppressed by CMS (no formulary data)')
    expect(card).not.toHaveTextContent(/Not on formulary|Not covered/)
    expect(screen.getByTestId('prescribe-this')).toHaveTextContent('Coverage not published for Gemtesa')
  })

  it('splits a payer with several product lines and filters by line', async () => {
    const detail = commercialDetail()
    detail.payer = { id: 30, name: 'Cigna', kind: 'commercial', pbm_name: 'Express Scripts', plan: null }
    detail.rows = ['Standard', 'Performance', 'Advantage', 'Value'].map((line, i) =>
      row({ drug: brandGemtesa, plan_year: null, product_line: line, status_or_tier: `Tier ${i + 2}`, formulary_name: `${line} Drug List` })
    )
    render(<ResultView detail={detail} classCode="oab_beta3" />)
    expect(screen.getAllByTestId('product-line')).toHaveLength(4)
    expect(screen.getByRole('heading', { name: 'Performance' })).toBeInTheDocument()
    expect(screen.getAllByTestId('source-line')[0]).toHaveTextContent('Formulary: Standard Drug List')

    await userEvent.click(within(screen.getByRole('group', { name: 'Product line' })).getByRole('button', { name: 'Value' }))
    expect(screen.getAllByTestId('product-line')).toHaveLength(1)
    expect(screen.getByTestId('drug-result')).toHaveTextContent('Tier 5')
    expect(screen.getByText(FOOTER)).toBeInTheDocument()
  })

  it('has no product line filter when the payer has one line', () => {
    render(<ResultView detail={commercialDetail()} classCode="oab_beta3" />)
    expect(screen.queryByRole('group', { name: 'Product line' })).not.toBeInTheDocument()
  })

  it('links every additional source and shows the CMS contract name', () => {
    const detail = medicareDetail()
    detail.rows = [
      row({
        drug: brandGemtesa,
        source: {
          id: 9,
          url: 'https://www.cms.gov/a.zip',
          doc_date: '2026-10-08',
          retrieved: '2026-10-25',
          last_checked: '2026-10-25',
          urls: ['https://www.cms.gov/a.zip', 'https://docushare-web.apps.external.pioneer.humana.com/criteria.pdf'],
        },
      }),
    ]
    render(<ResultView detail={detail} classCode="oab_beta3" />)
    const links = within(screen.getByTestId('source-line')).getAllByRole('link')
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      'https://www.cms.gov/a.zip',
      'https://docushare-web.apps.external.pioneer.humana.com/criteria.pdf',
    ])
    expect(screen.getByText(/HUMANA INSURANCE COMPANY/)).toBeInTheDocument()
  })

  it('reads well when the payer has no changes yet', () => {
    render(<ResultView detail={{ ...commercialDetail(), changes: [] }} classCode="oab_beta3" />)
    expect(screen.getByText('No changes recorded yet.')).toBeInTheDocument()
  })

  it('gives a separate "Prescribe this" per form when an ingredient has several', () => {
    const detail = commercialDetail()
    detail.rows = [
      row({ drug: { ...brandMyrbetriq, form: 'ER tablet', strength: '25 mg' }, plan_year: null }),
      row({ drug: { ...genericMirabegron, form: 'ER tablet', strength: '25 mg' }, plan_year: null, on_formulary: false }),
      row({ drug: { id: 23, name: 'mirabegron', product: 'brand', label: 'Myrbetriq ER granules for suspension 8 mg/mL', form: 'ER granules for oral suspension', strength: '8 mg/mL' }, plan_year: null }),
    ]
    render(<ResultView detail={detail} classCode="oab_beta3" />)
    expect(screen.getByText('ER tablet')).toBeInTheDocument()
    expect(screen.getByText('ER granules for oral suspension')).toBeInTheDocument()
    expect(screen.getAllByTestId('prescribe-this').map((e) => e.textContent)).toEqual([
      'Myrbetriq, not generic mirabegron',
      'Myrbetriq',
    ])
    expectEveryResultSourced()
  })
})
