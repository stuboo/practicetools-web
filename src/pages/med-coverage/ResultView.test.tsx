import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import ResultView from './ResultView'
import { commercialDetail, medicareDetail } from './util/fixtures'
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
})
