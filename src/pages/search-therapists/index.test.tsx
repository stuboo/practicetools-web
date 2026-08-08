import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SearchTherapists from './index'
import PhysicalTherapistAPI from '../../api/physicaltherapist'
import { SearchMeta, SearchValidationError, TherapistType } from './types'

vi.mock('../../api/physicaltherapist', () => ({
  default: { searchTherapistsByZipCode: vi.fn() },
}))

// Leaflet needs a real layout engine; the map has its own module and is not
// what these tests are about.
vi.mock('./ResultsMap', () => ({
  default: () => <div data-testid="results-map" />,
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

  it('shows a generic banner when the search fails outright (429, network)', async () => {
    search.mockRejectedValue(new Error('HTTP 429'))
    await typeZip('54235')

    await waitFor(
      () =>
        expect(
          screen.getByText('Something went wrong loading results. Please try again.')
        ).toBeInTheDocument(),
      AFTER_DEBOUNCE
    )
    // A rate-limit detail is not something the clinician can act on; the raw
    // error must not leak into the room.
    expect(screen.queryByText(/429/)).not.toBeInTheDocument()
  })

  it('prompts for a ZIP before anything has been typed', () => {
    render(
      <MemoryRouter>
        <SearchTherapists />
      </MemoryRouter>
    )

    expect(
      screen.getByText(/Enter the patient.s 5-digit ZIP code/)
    ).toBeInTheDocument()
    expect(search).not.toHaveBeenCalled()
  })
})

describe('SearchTherapists radius stepper', () => {
  beforeEach(() => {
    search.mockReset()
    search.mockResolvedValue({ therapists: [], meta: null })
  })

  it('clamps at the 5-mile floor and disables the button there', async () => {
    render(
      <MemoryRouter>
        <SearchTherapists />
      </MemoryRouter>
    )
    await userEvent.type(screen.getByLabelText('Patient ZIP code'), '54235')
    await waitFor(() => expect(search).toHaveBeenCalledTimes(1), AFTER_DEBOUNCE)

    const decrease = screen.getByRole('button', { name: /decrease search radius/i })
    // 15 -> 10 -> 5, plus one extra click that must not go below the floor.
    for (let i = 0; i < 3; i++) {
      fireEvent.click(decrease)
    }

    expect(screen.getByText('5 mi')).toBeInTheDocument()
    expect(decrease).toBeDisabled()

    await waitFor(() => expect(search).toHaveBeenCalledTimes(2), AFTER_DEBOUNCE)
    expect(search).toHaveBeenLastCalledWith('54235', 5)
  })

  it('clamps at the 100-mile ceiling and disables the button there', async () => {
    render(
      <MemoryRouter>
        <SearchTherapists />
      </MemoryRouter>
    )
    await userEvent.type(screen.getByLabelText('Patient ZIP code'), '54235')
    await waitFor(() => expect(search).toHaveBeenCalledTimes(1), AFTER_DEBOUNCE)

    const increase = screen.getByRole('button', { name: /increase search radius/i })
    // 15 -> 100 takes 17 steps; the extra clicks must not overshoot.
    for (let i = 0; i < 20; i++) {
      fireEvent.click(increase)
    }

    expect(screen.getByText('100 mi')).toBeInTheDocument()
    expect(increase).toBeDisabled()

    await waitFor(() => expect(search).toHaveBeenCalledTimes(2), AFTER_DEBOUNCE)
    expect(search).toHaveBeenLastCalledWith('54235', 100)
  })
})

describe('SearchTherapists result banners', () => {
  const therapist = (overrides: Partial<TherapistType> = {}): TherapistType => ({
    id: 1,
    name: 'Green Bay PT',
    address: '123 Main St',
    city: 'Green Bay',
    state: 'WI',
    zip: '54301',
    phone: '(920) 555-1234',
    medicare_status: true,
    medicaid_status: true,
    cash_only: false,
    distance: 24.3,
    drive_time_minutes: 28,
    drive_distance_miles: 24.3,
    drive_time_source: 'google',
    ...overrides,
  })

  const meta = (overrides: Partial<SearchMeta> = {}): SearchMeta => ({
    zip: '54235',
    origin: { latitude: 44.5, longitude: -87.9 },
    radius_requested: 15,
    expanded: false,
    degraded: false,
    result_count: 1,
    ...overrides,
  })

  beforeEach(() => {
    search.mockReset()
  })

  it('says the radius was empty when the server expanded past it', async () => {
    search.mockResolvedValue({
      therapists: [therapist({ drive_distance_miles: 24.3 })],
      meta: meta({ expanded: true }),
    })
    await typeZip('54235')

    await waitFor(
      () =>
        expect(
          screen.getByText(/No locations within 15 miles/)
        ).toBeInTheDocument(),
      AFTER_DEBOUNCE
    )
    expect(screen.getByText(/showing the 1 nearest/)).toBeInTheDocument()
  })

  it('counts what is actually in range rather than assuming zero', async () => {
    search.mockResolvedValue({
      therapists: [
        therapist({ id: 1, drive_distance_miles: 0.7 }),
        therapist({ id: 2, name: 'Marinette PT', drive_distance_miles: 40 }),
      ],
      meta: meta({ expanded: true }),
    })
    await typeZip('54235')

    await waitFor(
      () =>
        expect(
          screen.getByText(/Only 1 location within 15 miles/)
        ).toBeInTheDocument(),
      AFTER_DEBOUNCE
    )
  })

  it('flags straight-line distances when drive times are degraded', async () => {
    search.mockResolvedValue({
      therapists: [
        therapist({ drive_time_source: 'estimate', drive_time_minutes: undefined }),
      ],
      meta: meta({ degraded: true }),
    })
    await typeZip('54235')

    await waitFor(
      () =>
        expect(
          screen.getByText(/Drive times unavailable/)
        ).toBeInTheDocument(),
      AFTER_DEBOUNCE
    )
  })

  it('shows the result count in the toolbar once results land', async () => {
    search.mockResolvedValue({
      therapists: [therapist()],
      meta: meta({ result_count: 1 }),
    })
    await typeZip('54235')

    await waitFor(
      () => expect(screen.getByText(/ranked by drive time/)).toBeInTheDocument(),
      AFTER_DEBOUNCE
    )
  })

  it('shows skeleton rows while the clinician is still typing', async () => {
    search.mockResolvedValue({ therapists: [], meta: null })
    await typeZip('54235')

    // Before the debounce settles the page must show placeholders, not stale
    // results or a blank void.
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0)
  })

  it('ignores a slow earlier search that lands after a faster later one', async () => {
    let resolveFirst!: (value: {
      therapists: TherapistType[]
      meta: SearchMeta | null
    }) => void
    search.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve
        })
    )
    search.mockResolvedValueOnce({
      therapists: [therapist({ id: 2, name: 'Second Search PT' })],
      meta: meta(),
    })

    render(
      <MemoryRouter>
        <SearchTherapists />
      </MemoryRouter>
    )
    const input = screen.getByLabelText('Patient ZIP code')
    await userEvent.type(input, '54235')
    await waitFor(() => expect(search).toHaveBeenCalledTimes(1), AFTER_DEBOUNCE)

    await userEvent.clear(input)
    await userEvent.type(input, '54301')
    await waitFor(() => expect(search).toHaveBeenCalledTimes(2), AFTER_DEBOUNCE)
    // The name renders twice: the result row and the print handout.
    await waitFor(() =>
      expect(screen.getAllByText('Second Search PT').length).toBeGreaterThan(0)
    )

    // The first search finally answers -- its results must not overwrite what
    // the clinician is already reading from.
    resolveFirst({
      therapists: [therapist({ id: 1, name: 'First Search PT' })],
      meta: meta(),
    })
    await waitFor(() =>
      expect(screen.queryAllByText('First Search PT')).toHaveLength(0)
    )
    expect(screen.getAllByText('Second Search PT').length).toBeGreaterThan(0)
  })
})
