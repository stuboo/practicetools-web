import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PrevisitRoute } from './PrevisitRoute'

vi.mock('../pages/not-found', () => ({ default: () => <div>not-found-page</div> }))
vi.mock('./patient/PacketPage', () => ({ default: () => <div>packet-page</div> }))

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/p/:packetId" element={<PrevisitRoute page="packet" />} />
        <Route path="/clinic/previsit" element={<PrevisitRoute page="clinic" />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PrevisitRoute flag gate', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it.each([undefined, '', 'false', '1', 'TRUE'])('renders NotFound when flag is %s', (value) => {
    vi.stubEnv('VITE_PREVISIT_ENABLED', value as string)
    renderAt('/p/new-incontinence')
    expect(screen.getByText('not-found-page')).toBeInTheDocument()
    renderAt('/clinic/previsit')
    expect(screen.getAllByText('not-found-page')).toHaveLength(2)
  })

  it('renders the packet page when flag is "true"', async () => {
    vi.stubEnv('VITE_PREVISIT_ENABLED', 'true')
    renderAt('/p/new-incontinence')
    expect(await screen.findByText('packet-page')).toBeInTheDocument()
  })
})
