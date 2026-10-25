import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ChangesPanel from './ChangesPanel'
import MedCoverageAPI from '../../api/medCoverage'

vi.mock('../../api/medCoverage', () => ({
  default: { getChanges: vi.fn(), getMeta: vi.fn() },
}))

const api = vi.mocked(MedCoverageAPI)

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <ChangesPanel />
    </QueryClientProvider>
  )
}

describe('ChangesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.getMeta.mockResolvedValue({ data_checked: '2026-10-25', cms_release: null })
  })

  it('reads well when nothing has changed yet (seed state)', async () => {
    api.getChanges.mockResolvedValue([])
    renderPanel()
    expect(await screen.findByText('No changes recorded yet.')).toBeInTheDocument()
    expect(await screen.findByText('Data checked 2026-10-25')).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('lists changes with a payer filter', async () => {
    api.getChanges.mockResolvedValue([
      { id: 1, date: '2026-10-25', payer_id: 12, payer_name: 'Security Health Plan', plan_id: null, kind: 'tier_change', summary: 'Gemtesa removed.', source_url: null, origin: 'reviewed' },
      { id: 2, date: '2026-10-24', payer_id: null, payer_name: null, plan_id: null, kind: 'source_stale', summary: 'A source may be stale.', source_url: null, origin: 'system' },
    ])
    renderPanel()
    expect(await screen.findByText('Gemtesa removed.')).toBeInTheDocument()
    expect(screen.getByText('A source may be stale.')).toBeInTheDocument()
    expect(screen.getByText('Automated check')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Security Health Plan' })).toBeInTheDocument()
  })

  it('shows the newest 10 and offers the rest', async () => {
    api.getChanges.mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => ({
        id: i + 1, date: '2026-10-25', payer_id: 1, payer_name: 'Quartz', plan_id: null,
        kind: 'tier_change', summary: `Change ${i + 1}.`, source_url: null, origin: 'cms' as const,
      }))
    )
    renderPanel()
    expect(await screen.findByText('Change 10.')).toBeInTheDocument()
    expect(screen.queryByText('Change 11.')).not.toBeInTheDocument()
    screen.getByRole('button', { name: 'Show all 12 changes' }).click()
    expect(await screen.findByText('Change 12.')).toBeInTheDocument()
  })
})
