import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { webcrypto } from 'node:crypto'
import {
  buildTestEnvelope,
  TEST_ONLY_CODE,
  TEST_ONLY_PRIVATE_JWK,
} from '../crypto/__fixtures__/testKeys'
import { importPracticePrivateKey } from '../crypto/envelope'
import { generateCode, lookupFor } from '../crypto/code'
import { workedExampleEvents } from '../diary/__fixtures__/workedExample'
import { noteText } from '../diary/noteText'
import { summarizeDiary } from '../diary/summary'
import type { QuestionnaireResult, SubmissionPayload } from '../types'

vi.mock('./keystore', () => ({
  getPracticeKey: vi.fn(),
  importKeyFromJwkText: vi.fn(),
  removePracticeKey: vi.fn(),
  savePracticeKey: vi.fn(),
}))
vi.mock('./api', () => ({ redeem: vi.fn(), deleteSubmission: vi.fn() }))

import ClinicViewerPage from './ClinicViewerPage'
import * as keystore from './keystore'
import * as api from './api'

const quid: QuestionnaireResult = {
  id: 'quid',
  answers: [1, 1, 1, 1, 1, 1],
  scores: { SUI: 6, UUI: 9 },
  interpretation: 'Mixed incontinence',
}
const payload: SubmissionPayload = {
  schema: 'previsit-submission/v1',
  packetId: 'new-incontinence',
  packetVersion: 1,
  createdAt: '2026-11-04T10:00:00-05:00',
  diary: { events: workedExampleEvents, unit: 'ml' },
  questionnaires: [quid],
  patientNote: '<b>hello</b> note',
}

const writeText = vi.fn().mockResolvedValue(undefined)

beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  })
})

beforeEach(async () => {
  vi.clearAllMocks()
  writeText.mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  })
  const key = await importPracticePrivateKey(TEST_ONLY_PRIVATE_JWK)
  vi.mocked(keystore.getPracticeKey).mockResolvedValue(key)
  const env = await buildTestEnvelope(payload, TEST_ONLY_CODE)
  vi.mocked(api.redeem).mockResolvedValue({
    envelope: JSON.stringify(env),
    created_at: '2026-11-04T15:00:00Z',
    expires_at: '2026-12-04T15:00:00Z',
  })
})

function renderPage() {
  return render(
    <MemoryRouter>
      <ClinicViewerPage />
    </MemoryRouter>,
  )
}

async function enter(code: string) {
  const user = userEvent.setup()
  // userEvent.setup installs its own clipboard stub; replace it with ours.
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  })
  await user.type(await screen.findByLabelText(/share code/i), code)
  return user
}

describe('ClinicViewerPage', () => {
  it('prompts for setup when no key is present', async () => {
    vi.mocked(keystore.getPracticeKey).mockResolvedValue(null)
    renderPage()
    expect(await screen.findByText(/set up the practice key/i)).toBeInTheDocument()
  })

  it('decrypts and renders the worked example values', async () => {
    renderPage()
    const user = await enter('abcdefghjj')
    expect(screen.getByLabelText(/share code/i)).toHaveValue('ABCDE-FGHJJ')
    await user.click(screen.getByRole('button', { name: 'Open' }))
    const card = await screen.findByLabelText('Diary summary')
    const text = card.textContent ?? ''
    expect(text).toContain('7.0')
    expect(text).toContain('1850 mL')
    expect(text).toContain('650 mL')
    expect(text).toContain('35% (nocturnal polyuria)')
    expect(text).toContain('400 mL (first morning)')
    expect(text).toContain('281 mL')
    expect(text).toContain('1090 mL')
    expect(text).toMatch(/fewer than 3/i)
    expect(screen.getByText(/SUI 6, UUI 9/)).toBeInTheDocument()
    expect(screen.getByText('<b>hello</b> note')).toBeInTheDocument()
    expect(api.redeem).toHaveBeenCalledWith(await lookupFor(TEST_ONLY_CODE))
  })

  it('shows one generic message when the code does not open the envelope', async () => {
    // Checksum-valid code that differs from the one the envelope was sealed with.
    let other = generateCode()
    while (other === TEST_ONLY_CODE) other = generateCode()
    renderPage()
    const user = await enter(other)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    expect(await screen.findByText('Code not found or could not be opened')).toBeInTheDocument()
    expect(screen.queryByLabelText('Diary summary')).not.toBeInTheDocument()
  })

  it('shows the generic message on a 404', async () => {
    vi.mocked(api.redeem).mockRejectedValue({ response: { status: 404 } })
    renderPage()
    const user = await enter(TEST_ONLY_CODE)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    expect(await screen.findByText('Code not found or could not be opened')).toBeInTheDocument()
    expect(screen.queryByLabelText('Diary summary')).not.toBeInTheDocument()
  })

  it('shows the generic message when the envelope is not JSON', async () => {
    vi.mocked(api.redeem).mockResolvedValue({ envelope: 'nope', created_at: '', expires_at: '' })
    renderPage()
    const user = await enter(TEST_ONLY_CODE)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    expect(await screen.findByText('Code not found or could not be opened')).toBeInTheDocument()
  })

  it('shows an inline error for an invalid character and keeps submit disabled', async () => {
    renderPage()
    await enter('ABCDU')
    expect(await screen.findByText(/"U" is not used in codes/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open' })).toBeDisabled()
  })

  it('shows a checksum error', async () => {
    renderPage()
    await enter('ABCDEFGHJK')
    expect(await screen.findByText(/typo/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open' })).toBeDisabled()
  })

  it('copies the note text', async () => {
    renderPage()
    const user = await enter(TEST_ONLY_CODE)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    await user.click(await screen.findByRole('button', { name: 'Copy for note' }))
    const expected = noteText(summarizeDiary(workedExampleEvents), {
      quid,
      patientNote: payload.patientNote,
    })
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(expected))
  })

  it('deletes from the server after confirmation, and clears', async () => {
    vi.mocked(api.deleteSubmission).mockResolvedValue(undefined)
    renderPage()
    const user = await enter(TEST_ONLY_CODE)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    await user.click(await screen.findByRole('button', { name: 'Delete from server' }))
    expect(api.deleteSubmission).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }))
    expect(api.deleteSubmission).toHaveBeenCalledWith(await lookupFor(TEST_ONLY_CODE))
    expect(await screen.findByText('Deleted from the server.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.queryByLabelText('Diary summary')).not.toBeInTheDocument()
  })
})
