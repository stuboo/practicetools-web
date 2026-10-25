import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MedCoverage from './index'
import MedCoverageAPI from '../../api/medCoverage'
import { commercialDetail, medicareDetail } from './util/fixtures'

vi.mock('../../api/medCoverage', () => ({
  default: {
    getClasses: vi.fn(),
    searchPayers: vi.fn(),
    getPayer: vi.fn(),
    getChanges: vi.fn(),
    getMeta: vi.fn(),
    requestPayer: vi.fn(),
  },
}))

const api = vi.mocked(MedCoverageAPI)

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <MedCoverage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('MedCoverage page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.getClasses.mockResolvedValue([
      { id: 1, code: 'oab_beta3', label: 'Beta-3 agonists', drugs: [] },
      { id: 2, code: 'oab_antimuscarinic', label: 'Antimuscarinics', drugs: [] },
    ])
    api.getMeta.mockResolvedValue({ data_checked: '2026-10-25', cms_release: null })
    api.getChanges.mockResolvedValue([
      { id: 9, date: '2026-10-25', payer_id: 12, payer_name: 'Security Health Plan', plan_id: null, kind: 'tier_change', summary: 'Gemtesa removed.', source_url: 'https://example.com/f.pdf', origin: 'reviewed' },
    ])
  })

  it('asks coverage first: commercial -> payer -> result', async () => {
    api.searchPayers.mockImplementation(async ({ kind } = {}) =>
      kind === 'commercial' ? [commercialDetail().payer] : []
    )
    api.getPayer.mockResolvedValue(commercialDetail())
    renderPage()

    expect(await screen.findByText('Data checked 2026-10-25')).toBeInTheDocument()
    expect(screen.getByText('Gemtesa removed.')).toBeInTheDocument()

    expect(screen.getByText("What is the patient's prescription coverage?")).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Beta-3 agonists/ })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Commercial plan or PBM/ }))
    expect(api.searchPayers).toHaveBeenCalledWith({ kind: 'commercial', limit: 200 })
    expect(api.searchPayers).toHaveBeenCalledWith({ kind: 'pbm', limit: 200 })
    expect(screen.getByText('Payer not listed?')).toBeInTheDocument()

    await userEvent.click(await screen.findByRole('button', { name: /Security Health Plan/ }))
    expect(api.getPayer).toHaveBeenCalledWith(12)
    expect(await screen.findByText('Payer criteria change. Confirm in the payer portal before submitting.')).toBeInTheDocument()
    expect(screen.getAllByTestId('prescribe-this').map((li) => li.textContent)).toEqual([
      'Mirabegron: Generic mirabegron is covered (PA required).',
      'Vibegron: Gemtesa is not covered.',
    ])

    await userEvent.click(screen.getByRole('button', { name: /Back/ }))
    expect(await screen.findByRole('button', { name: /Security Health Plan/ })).toBeInTheDocument()
  })

  it('searches Medicare plans by contract-plan ID after the debounce', async () => {
    api.searchPayers.mockResolvedValue([medicareDetail().payer])
    api.getPayer.mockResolvedValue(medicareDetail())
    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: /Medicare/ }))
    await userEvent.type(screen.getByLabelText('Search Medicare plans'), 'H5216-001')

    await waitFor(() =>
      expect(api.searchPayers).toHaveBeenCalledWith({ kind: 'medicare_plan', q: 'H5216-001' })
    )
    // Debounced: one search for the settled text, not one per keystroke.
    expect(api.searchPayers).toHaveBeenCalledTimes(1)

    await userEvent.click(await screen.findByRole('button', { name: /HumanaChoice H5216-001 \(PPO\)/ }))
    expect(await screen.findByRole('button', { name: '2027' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByTestId('prescribe-this')[0]).toHaveTextContent(/^Mirabegron: send Myrbetriq/)
  })
})
