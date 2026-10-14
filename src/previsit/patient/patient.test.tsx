import { webcrypto } from 'node:crypto'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isValidCode } from '../crypto/code'
import { TEST_ONLY_PUBLIC_JWK } from '../crypto/__fixtures__/testKeys'
import { __resetStorageForTests, getItem, setItem } from '../storage'
import { KEYS } from '../storageKeys'
import type { Block } from '../types'

vi.mock('./api', () => ({
  submitEnvelope: vi.fn(),
  sendEvent: vi.fn(() => Promise.resolve()),
  sendEventOnce: vi.fn(() => Promise.resolve()),
}))
vi.mock('./diary/DiaryModule', () => ({ DiaryModule: () => <div>diary stub</div> }))

import { submitEnvelope } from './api'
import { BlockView } from './InfoModule'
import PacketPage from './PacketPage'

const submit = vi.mocked(submitEnvelope)

// jsdom may hide WebCrypto; Node's is real.
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true })
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/p/:packetId" element={<PacketPage />} />
        <Route path="/p/:packetId/m/:moduleId" element={<PacketPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

const PID = 'new-incontinence'

beforeEach(() => {
  __resetStorageForTests()
  submit.mockReset()
  vi.stubEnv('VITE_PREVISIT_PUBLIC_KEY_JWK', JSON.stringify(TEST_ONLY_PUBLIC_JWK))
  window.location.hash = ''
})
afterEach(() => {
  cleanup()
  vi.unstubAllEnvs()
})

describe('packet home', () => {
  it('shows a friendly not-found for an unknown packet', async () => {
    renderAt('/p/nope')
    expect(await screen.findByText(/couldn't find that page/i)).toBeInTheDocument()
  })

  it('takes the visit date from the URL fragment and saves it', async () => {
    window.location.hash = '#d=2030-05-17'
    renderAt(`/p/${PID}`)
    expect(await screen.findByText(/May 17, 2030/)).toBeInTheDocument()
    expect(await getItem(PID, KEYS.visitDate)).toBe('2030-05-17')
    expect(screen.getByText(/Draft content/)).toBeInTheDocument()
  })

  it('ignores an invalid fragment date and asks for one', async () => {
    window.location.hash = '#d=2030-02-31'
    renderAt(`/p/${PID}`)
    expect(await screen.findByLabelText(/when is your visit/i)).toBeInTheDocument()
  })

  it('erase my data clears stored data and resets', async () => {
    await setItem(PID, KEYS.visitDate, '2030-05-17')
    await setItem(PID, KEYS.quid, { id: 'quid', answers: [1], scores: {}, interpretation: '' })
    renderAt(`/p/${PID}`)
    fireEvent.click(await screen.findByRole('button', { name: /erase my data/i }))
    fireEvent.click(screen.getByRole('button', { name: /yes, erase/i }))
    expect(await screen.findByLabelText(/when is your visit/i)).toBeInTheDocument()
    expect(await getItem(PID, KEYS.visitDate)).toBeUndefined()
    expect(await getItem(PID, KEYS.quid)).toBeUndefined()
  })
})

describe('share flow', () => {
  const start = async () => {
    await setItem(PID, KEYS.visitDate, '2030-05-17')
    await setItem(PID, KEYS.quid, { id: 'quid', answers: [1, 1, 1, 1, 1, 1], scores: { SUI: 3, UUI: 3 }, interpretation: 'x' })
    renderAt(`/p/${PID}/m/share`)
    return screen.findByRole('button', { name: /create my code/i })
  }

  it('shows a valid code after a successful upload', async () => {
    submit.mockResolvedValue({ ok: true, expiresAt: '2030-06-01T00:00:00Z' })
    fireEvent.click(await start())
    const el = await screen.findByLabelText('Your share code')
    expect(el.textContent).toMatch(/^[0-9A-Z]{5}-[0-9A-Z]{5}$/)
    expect(isValidCode(el.textContent ?? '')).toBe(true)
    expect(submit).toHaveBeenCalledTimes(1)
    const [lookup, envelope] = submit.mock.calls[0]
    expect(lookup).toHaveLength(43)
    expect(envelope.v).toBe(1)
    expect((await getItem<{ code: string }>(PID, KEYS.submission))?.code).toBe(el.textContent)
  })

  it('regenerates the code and retries once on 409', async () => {
    submit
      .mockResolvedValueOnce({ ok: false, reason: 'conflict' })
      .mockResolvedValueOnce({ ok: true, expiresAt: '2030-06-01T00:00:00Z' })
    fireEvent.click(await start())
    await screen.findByLabelText('Your share code')
    expect(submit).toHaveBeenCalledTimes(2)
    expect(submit.mock.calls[0][0]).not.toBe(submit.mock.calls[1][0])
  })

  it('offline keeps data and says to try again', async () => {
    submit.mockResolvedValue({ ok: false, reason: 'offline' })
    fireEvent.click(await start())
    expect(await screen.findByText(/try again when connected/i)).toBeInTheDocument()
    expect(await getItem(PID, KEYS.quid)).toBeDefined()
    expect(await getItem(PID, KEYS.submission)).toBeUndefined()
  })

  it('shows a config error when the public key is missing', async () => {
    vi.stubEnv('VITE_PREVISIT_PUBLIC_KEY_JWK', '')
    fireEvent.click(await start())
    expect(await screen.findByText(/missing configuration/i)).toBeInTheDocument()
    await waitFor(() => expect(submit).not.toHaveBeenCalled())
  })
})

describe('info block renderer', () => {
  const blocks: Block[] = [
    { type: 'heading', text: 'H1' },
    { type: 'paragraph', text: 'Para' },
    { type: 'list', items: ['a', 'b'] },
    { type: 'list', items: ['c'], ordered: true },
    { type: 'callout', tone: 'warning', text: 'Careful' },
    { type: 'video', youtubeId: 'abc123', caption: 'Vid' },
    { type: 'image', src: '/previsit/x.png', alt: 'Alt text' },
    { type: 'link', href: 'https://example.com', text: 'Out' },
  ]

  it('renders every block type safely', () => {
    const { container } = render(
      <div>
        {blocks.map((b, i) => (
          <BlockView key={i} block={b} />
        ))}
      </div>,
    )
    expect(screen.getByRole('heading', { name: 'H1' })).toBeInTheDocument()
    expect(screen.getByText('Para')).toBeInTheDocument()
    expect(container.querySelectorAll('ul li')).toHaveLength(2)
    expect(container.querySelectorAll('ol li')).toHaveLength(1)
    expect(screen.getByRole('note')).toHaveTextContent('Careful')
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe(
      'https://www.youtube-nocookie.com/embed/abc123',
    )
    expect(screen.getByAltText('Alt text')).toHaveAttribute('src', '/previsit/x.png')
    const a = screen.getByRole('link', { name: 'Out' })
    expect(a).toHaveAttribute('rel', 'noopener noreferrer')
    expect(a).toHaveAttribute('target', '_blank')
  })

  it('does not render a javascript: link as a link', () => {
    render(<BlockView block={{ type: 'link', href: 'javascript:alert(1)', text: 'bad' }} />)
    expect(screen.queryByRole('link')).toBeNull()
  })
})
