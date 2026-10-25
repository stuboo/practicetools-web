import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RequestBox from './RequestBox'
import MedCoverageAPI from '../../api/medCoverage'

vi.mock('../../api/medCoverage', () => ({
  default: { requestPayer: vi.fn() },
}))

const requestPayer = vi.mocked(MedCoverageAPI.requestPayer)

function renderBox() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <RequestBox />
    </QueryClientProvider>
  )
  return screen.getByPlaceholderText('Plan or PBM name only. No patient information.')
}

describe('RequestBox', () => {
  beforeEach(() => {
    requestPayer.mockReset()
  })

  it('caps the input at 60 characters', async () => {
    const input = renderBox()
    expect(input).toHaveAttribute('maxLength', '60')
    await userEvent.type(input, 'x'.repeat(70))
    expect(input).toHaveValue('x'.repeat(60))
  })

  it('does not send an empty request', async () => {
    renderBox()
    await userEvent.click(screen.getByRole('button', { name: 'Request' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a plan or PBM name.')
    expect(requestPayer).not.toHaveBeenCalled()
  })

  it('blocks text that looks like patient data before it leaves the browser', async () => {
    const input = renderBox()
    await userEvent.type(input, 'Quartz 3/14/1956')
    await userEvent.click(screen.getByRole('button', { name: 'Request' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/Plan or PBM name only/)
    expect(requestPayer).not.toHaveBeenCalled()
  })

  it('confirms a request and shows the default steps', async () => {
    requestPayer.mockResolvedValue({ status: 'requested' })
    const input = renderBox()
    await userEvent.type(input, '  Trilogy Health Plan ')
    await userEvent.click(screen.getByRole('button', { name: 'Request' }))
    await waitFor(() =>
      expect(
        screen.getByText('Requested. Dr. Stewart reviews requests; results usually appear within a day.')
      ).toBeInTheDocument()
    )
    expect(requestPayer).toHaveBeenCalledWith('Trilogy Health Plan')
    expect(screen.getByText(/run \.OABPAEVIDENCE/)).toBeInTheDocument()
  })

  it("shows the server's 422 detail", async () => {
    requestPayer.mockResolvedValue({ status: 'invalid', message: 'Plan or PBM name only' })
    const input = renderBox()
    await userEvent.type(input, 'Some Plan')
    await userEvent.click(screen.getByRole('button', { name: 'Request' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Plan or PBM name only'))
    expect(input).toBeInTheDocument()
  })

  it("says requests aren't open yet when the endpoint is not there (404)", async () => {
    requestPayer.mockResolvedValue({ status: 'closed' })
    const input = renderBox()
    await userEvent.type(input, 'Some Plan')
    await userEvent.click(screen.getByRole('button', { name: 'Request' }))
    await waitFor(() => expect(screen.getByText("Requests aren't open yet.")).toBeInTheDocument())
    expect(screen.queryByText(/Requested\. Dr\. Stewart/)).not.toBeInTheDocument()
    expect(screen.getByText(/run \.OABPAEVIDENCE/)).toBeInTheDocument()
  })

  it('explains a rate limit', async () => {
    requestPayer.mockResolvedValue({ status: 'rate_limited' })
    const input = renderBox()
    await userEvent.type(input, 'Some Plan')
    await userEvent.click(screen.getByRole('button', { name: 'Request' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/Too many requests/))
  })
})
