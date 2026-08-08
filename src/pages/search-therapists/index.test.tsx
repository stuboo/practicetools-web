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

  it('debounces the radius slider instead of searching per drag step', async () => {
    // Regression: `isFilterApplied` was derived from the live filter and was an
    // effect dependency, so the first pixel of a drag flipped it false->true
    // and fired a search with no debounce at all.
    render(
      <MemoryRouter>
        <SearchTherapists />
      </MemoryRouter>
    )
    await userEvent.type(screen.getByLabelText('Patient ZIP code'), '54235')
    await waitFor(() => expect(search).toHaveBeenCalledTimes(1), AFTER_DEBOUNCE)

    await userEvent.click(screen.getByRole('button', { name: /filters/i }))
    const radius = await screen.findByRole('spinbutton')

    // Sweep the radius the way a drag does: many changes in quick succession.
    for (const value of ['10', '20', '30', '40', '50']) {
      fireEvent.change(radius, { target: { value } })
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
