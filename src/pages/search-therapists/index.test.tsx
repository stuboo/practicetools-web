import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SearchTherapists from './index'
import PhysicalTherapistAPI from '../../api/physicaltherapist'
import { SearchValidationError } from './types'

vi.mock('../../api/physicaltherapist', () => ({
  default: { searchTherapistsByZipCode: vi.fn() },
}))

const search = vi.mocked(PhysicalTherapistAPI.searchTherapistsByZipCode)

// The page debounces the ZIP input by a second, so every assertion here has to
// outwait that.
const AFTER_DEBOUNCE = { timeout: 4000 }

async function typeZip(value: string) {
  render(
    <MemoryRouter>
      <SearchTherapists />
    </MemoryRouter>
  )
  await userEvent.type(screen.getByLabelText('Patient ZIP code'), value)
}

describe('SearchTherapists ZIP gating', () => {
  beforeEach(() => {
    search.mockReset()
    search.mockResolvedValue({ therapists: [], meta: null })
  })

  it.each(['1234', 'abcde'])(
    'sends no request for %j -- a search can cost a billable API call',
    async (value) => {
      await typeZip(value)

      await waitFor(
        () => expect(screen.getByText('Enter a 5-digit ZIP code')).toBeInTheDocument(),
        AFTER_DEBOUNCE
      )
      expect(search).not.toHaveBeenCalled()
    }
  )

  it('searches once the input is a complete 5-digit ZIP', async () => {
    await typeZip('54235')

    await waitFor(() => expect(search).toHaveBeenCalledTimes(1), AFTER_DEBOUNCE)
    // Explicit, not undefined-meaning-default: the client and the API must not
    // each carry their own idea of the default radius.
    expect(search).toHaveBeenCalledWith('54235', 15)
  })

  it('debounces the radius stepper instead of searching per click', async () => {
    // A clinician tapping + several times to reach a radius should cost one
    // search when the clicks settle, not one per click.
    render(
      <MemoryRouter>
        <SearchTherapists />
      </MemoryRouter>
    )
    await userEvent.type(screen.getByLabelText('Patient ZIP code'), '54235')
    await waitFor(() => expect(search).toHaveBeenCalledTimes(1), AFTER_DEBOUNCE)

    const increase = screen.getByRole('button', { name: /increase search radius/i })
    // 15 -> 50 in quick succession.
    for (let i = 0; i < 7; i++) {
      fireEvent.click(increase)
    }
    expect(search).toHaveBeenCalledTimes(1)

    await waitFor(() => expect(search).toHaveBeenCalledTimes(2), AFTER_DEBOUNCE)
    expect(search).toHaveBeenLastCalledWith('54235', 50)
  })

  it('shows the API message inline when the ZIP is unknown', async () => {
    search.mockRejectedValue(new SearchValidationError('Unrecognized ZIP code'))
    await typeZip('00000')

    await waitFor(
      () => expect(screen.getByText('Unrecognized ZIP code')).toBeInTheDocument(),
      AFTER_DEBOUNCE
    )
  })
})
