import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ResultView from './ResultView'
import { brandGemtesa, brandMyrbetriq, brandMyrbetriq50, commercialDetail, medicareDetail, row } from './util/fixtures'
import { MedCovPayerDetail } from '../../types/medCoverage'
import { LIVE_CATALOGUE } from './util/catalogue.fixture'

const FOOTER = 'Payer criteria change. Confirm in the payer portal before submitting.'

/** Every product line carries its detail, and every detail has a source/date line. */
function expectEveryProductSourced() {
  const items = screen.getAllByTestId('product-line-item')
  expect(items.length).toBeGreaterThan(0)
  for (const item of items) {
    const line = within(item).getByTestId('source-line')
    expect(line).toHaveTextContent(/Source:/)
    expect(line).toHaveTextContent(/Document date:/)
    expect(line).toHaveTextContent(/Last checked:/)
  }
}

function bucket(availability: string) {
  return screen.getByTestId(`bucket-${availability}`)
}


function must<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('expected a value')
  return value
}

describe('ResultView', () => {
  it.each([
    ['Medicare plan', medicareDetail()],
    ['commercial payer', commercialDetail()],
  ] as [string, MedCovPayerDetail][])('shows the portal footer and a source/date line for every product (%s)', (_l, detail) => {
    render(<ResultView detail={detail} />)
    expect(screen.getByText(FOOTER)).toBeInTheDocument()
    expectEveryProductSourced()
  })

  it('still shows the footer when no rows are published', () => {
    render(<ResultView detail={{ ...commercialDetail(), rows: [] }} />)
    expect(screen.getByText(FOOTER)).toBeInTheDocument()
    expect(screen.getByText(/No coverage rows are published/)).toBeInTheDocument()
  })

  it('leads with every OAB med, both classes, bucketed at a glance', () => {
    render(<ResultView detail={medicareDetail()} />)
    expect(within(bucket('open')).getByText('oxybutynin ER tablet')).toBeInTheDocument()
    const restricted = within(bucket('restricted')).getAllByTestId('product-line-item').map((li) => li.querySelector('summary')?.textContent)
    expect(restricted[0]).toMatch(/^Myrbetriq \(mirabegron\) ER tablet 25 mg, 50 mgTier 3ST/)
    expect(restricted[1]).toMatch(/^Gemtesa \(vibegron\) tablet 75 mgTier 4PASTQL/)
    expect(within(bucket('not_covered')).getByText('mirabegron ER tablet')).toBeInTheDocument()
    // The heatmap replaced the "Prescribe this" box.
    expect(screen.queryByText(/Prescribe this/)).not.toBeInTheDocument()
  })

  it('keeps detail collapsed until the product is tapped', async () => {
    render(<ResultView detail={medicareDetail()} />)
    const item = within(bucket('open')).getByTestId('product-line-item')
    const details = item.querySelector('details') as HTMLDetailsElement
    expect(details.open).toBe(false)
    await userEvent.click(within(item).getByText('oxybutynin ER tablet'))
    expect(details.open).toBe(true)
    expect(within(item).getByText('PA criteria')).toBeVisible()
  })

  it('puts the criteria checklist, SmartPhrases and source in the detail', () => {
    render(<ResultView detail={commercialDetail()} />)
    const item = within(bucket('restricted')).getByTestId('product-line-item')
    expect(within(item).getAllByText('Not published').length).toBeGreaterThan(0)
    expect(within(item).getByText('.OABPAEVIDENCE')).toBeInTheDocument()
    expect(within(item).getByText('.OABLMNMIRABEGRON')).toBeInTheDocument()
    const line = within(item).getByTestId('source-line')
    expect(line).toHaveTextContent('Document date: 2026-10-07')
    expect(line).toHaveTextContent('Last checked: 2026-10-25')
    expect(within(line).getByRole('link')).toHaveAttribute('href', 'https://www.example-plan.com/formulary-2027.pdf')
  })

  it('says when a source is missing instead of hiding the line', () => {
    const detail = commercialDetail()
    detail.rows = [{ ...detail.rows[0], source: null }]
    render(<ResultView detail={detail} />)
    expect(screen.getByTestId('source-line')).toHaveTextContent('Source: not recorded')
  })

  it('defaults Medicare to the newest plan year and toggles to the older one', async () => {
    render(<ResultView detail={medicareDetail()} />)
    expect(screen.getByRole('button', { name: '2027' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: '2026' }))
    expect(screen.getByRole('button', { name: '2026' })).toHaveAttribute('aria-pressed', 'true')
    // 2026: generic mirabegron is covered (with step therapy), not "not covered".
    expect(within(bucket('restricted')).getByText('mirabegron ER tablet')).toBeInTheDocument()
    expect(screen.queryByTestId('bucket-not_covered')).not.toBeInTheDocument()
    expect(screen.getByText(FOOTER)).toBeInTheDocument()
    expectEveryProductSourced()
  })

  it('has no year toggle or line filter for a single-year, single-line payer', () => {
    render(<ResultView detail={commercialDetail()} />)
    expect(screen.queryByRole('group', { name: 'Plan year' })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Product line' })).not.toBeInTheDocument()
  })

  it('shows unknown coverage as "Coverage not published", never "Not covered"', () => {
    const detail = commercialDetail()
    detail.rows = [row({ drug: brandGemtesa, plan_year: null, on_formulary: null, status_or_tier: 'Suppressed by CMS (no formulary data)', pa: 'GAP', st: 'GAP', ql: 'GAP' })]
    render(<ResultView detail={detail} />)
    expect(bucket('unknown')).toHaveTextContent('Coverage not published')
    expect(screen.queryByTestId('bucket-not_covered')).not.toBeInTheDocument()
    expect(screen.getByTestId('drug-result')).toHaveTextContent('Payer listing: Suppressed by CMS (no formulary data)')
    expect(within(screen.getByTestId('heatmap')).getByTestId('heat-chip')).toHaveTextContent('GemtesaNot published')
  })

  it('collapses strengths with identical coverage and splits them when they differ', () => {
    const detail = commercialDetail()
    detail.rows = [row({ drug: brandMyrbetriq, plan_year: null }), row({ drug: brandMyrbetriq50, plan_year: null, on_formulary: false })]
    render(<ResultView detail={detail} />)
    expect(within(bucket('restricted')).getByText('Myrbetriq (mirabegron) ER 25 mg tablet')).toBeInTheDocument()
    expect(within(bucket('not_covered')).getByText('Myrbetriq (mirabegron) ER 50 mg tablet')).toBeInTheDocument()
  })

  it('filters a payer with several product lines to one line at a time', async () => {
    const detail = commercialDetail()
    detail.payer = { id: 30, name: 'Cigna', kind: 'commercial', pbm_name: 'Express Scripts', plan: null }
    detail.rows = ['Standard', 'Performance', 'Advantage', 'Value'].map((line, i) =>
      row({ drug: brandGemtesa, plan_year: null, product_line: line, status_or_tier: `Tier ${i + 2}`, formulary_name: `${line} Drug List` })
    )
    render(<ResultView detail={detail} />)
    expect(screen.getAllByTestId('product-line-item')).toHaveLength(1)
    expect(screen.getByText('Tier 2')).toBeInTheDocument()
    expect(screen.getByTestId('source-line')).toHaveTextContent('Formulary: Standard Drug List')

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Product line' }), 'Value')
    expect(screen.getByText('Tier 5')).toBeInTheDocument()
    expect(screen.getByText(FOOTER)).toBeInTheDocument()
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
    render(<ResultView detail={detail} />)
    const links = within(screen.getByTestId('source-line')).getAllByRole('link')
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      'https://www.cms.gov/a.zip',
      'https://docushare-web.apps.external.pioneer.humana.com/criteria.pdf',
    ])
    expect(screen.getByText(/HUMANA INSURANCE COMPANY/)).toBeInTheDocument()
  })

  it('collapses recent changes to one disclosure with a count, at most 3', () => {
    render(<ResultView detail={medicareDetail()} />)
    expect(screen.getByText('Recent changes (3)')).toBeInTheDocument()
    expect(screen.getByText('Myrbetriq moved to tier 3.')).not.toBeVisible()
    expect(screen.queryByText('An older change.')).not.toBeInTheDocument()
  })

  it('reads well when the payer has no changes yet', () => {
    render(<ResultView detail={{ ...commercialDetail(), changes: [] }} />)
    expect(screen.getByText('Recent changes: no changes recorded yet.')).toBeInTheDocument()
  })

  it('notes when a Medicare plan has no version for the newest CMS year', () => {
    const detail = medicareDetail()
    detail.rows = detail.rows.filter((r) => r.plan_year === 2026)
    render(<ResultView detail={detail} currentPlanYear={2027} />)
    expect(screen.getByTestId('stale-plan-year')).toHaveTextContent('This plan has no 2027 version in CMS data. Showing 2026.')
  })

  it('shows no plan-year notice when the plan has the current year', () => {
    render(<ResultView detail={medicareDetail()} currentPlanYear={2027} />)
    expect(screen.queryByTestId('stale-plan-year')).not.toBeInTheDocument()
  })

  it('shows no plan-year notice for non-Medicare payers or without a CMS release', () => {
    const { unmount } = render(<ResultView detail={commercialDetail()} currentPlanYear={2027} />)
    expect(screen.queryByTestId('stale-plan-year')).not.toBeInTheDocument()
    unmount()
    const detail = medicareDetail()
    detail.rows = detail.rows.filter((r) => r.plan_year === 2026)
    render(<ResultView detail={detail} currentPlanYear={null} />)
    expect(screen.queryByTestId('stale-plan-year')).not.toBeInTheDocument()
  })

  it('puts the heatmap at the top, above the grouped list', () => {
    render(<ResultView detail={medicareDetail()} catalogue={LIVE_CATALOGUE} />)
    const heatmap = screen.getByTestId('heatmap')
    const firstBucket = screen.getByTestId('bucket-open')
    expect(heatmap.compareDocumentPosition(firstBucket) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // 16 ingredient + form rows from the catalogue, CNS order by default.
    const rows = within(heatmap).getAllByTestId('heat-row')
    expect(rows).toHaveLength(16)
    expect(rows[0]).toHaveTextContent(/^mirabegron ERCNS Low/)
    expect(rows[rows.length - 1]).toHaveTextContent(/^oxybutynin oral solutionCNS High/)
    expect(within(heatmap).getByRole('button', { name: 'CNS activity (low → high)' })).toHaveAttribute('aria-pressed', 'true')
    // Every cell has words, not just colour.
    for (const chip of within(heatmap).getAllByTestId('heat-chip')) {
      expect(chip).toHaveTextContent(/Covered|PA|ST|Not covered|Not published|No data/)
    }
    expect(within(rows[0]).getAllByTestId('heat-chip').map((c) => c.getAttribute('data-tone'))).toEqual(['red', 'amber'])
  })

  it('re-sorts the heatmap by coverage', async () => {
    render(<ResultView detail={medicareDetail()} catalogue={LIVE_CATALOGUE} />)
    await userEvent.click(screen.getByRole('button', { name: 'Coverage (best first)' }))
    const rows = within(screen.getByTestId('heatmap')).getAllByTestId('heat-row')
    // oxybutynin ER is the only all-green row in the fixture.
    expect(rows[0]).toHaveTextContent(/^oxybutynin ER/)
  })

  it('tapping a heatmap cell opens that product in the list', async () => {
    render(<ResultView detail={medicareDetail()} catalogue={LIVE_CATALOGUE} />)
    const chip = must(within(screen.getByTestId('heatmap')).getAllByTestId('heat-chip').find((c) => c.textContent?.startsWith('Gemtesa')))
    const item = within(bucket('restricted')).getAllByTestId('product-line-item')[1]
    expect(item.querySelector('details')?.open).toBe(false)
    await userEvent.click(chip)
    expect(item.querySelector('details')?.open).toBe(true)
  })

  describe('yellow fade on the opened detail', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('applies the highlight on tap, restarts it on a repeat tap, and clears it after the fade', () => {
      vi.useFakeTimers()
      render(<ResultView detail={medicareDetail()} catalogue={LIVE_CATALOGUE} />)
      const chip = must(within(screen.getByTestId('heatmap')).getAllByTestId('heat-chip').find((c) => c.textContent?.startsWith('Gemtesa')))
      const pane = within(within(bucket('restricted')).getAllByTestId('product-line-item')[1]).getByTestId('drug-result')
      expect(pane).not.toHaveClass('medcov-yft')

      fireEvent.click(chip)
      expect(pane).toHaveClass('medcov-yft')

      vi.advanceTimersByTime(1500)
      const remove = vi.spyOn(pane.classList, 'remove')
      fireEvent.click(chip)
      // Restarted: the class was taken off and put back, and the timer reset.
      expect(remove).toHaveBeenCalledWith('medcov-yft')
      expect(pane).toHaveClass('medcov-yft')
      vi.advanceTimersByTime(1500)
      expect(pane).toHaveClass('medcov-yft')
      vi.advanceTimersByTime(600)
      expect(pane).not.toHaveClass('medcov-yft')
    })

    it('highlights only the tapped product', () => {
      render(<ResultView detail={medicareDetail()} catalogue={LIVE_CATALOGUE} />)
      const chip = must(within(screen.getByTestId('heatmap')).getAllByTestId('heat-chip').find((c) => c.textContent?.startsWith('Gemtesa')))
      fireEvent.click(chip)
      expect(document.querySelectorAll('.medcov-yft')).toHaveLength(1)
    })
  })
})
