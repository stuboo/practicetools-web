import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PhysicalTherapyCard from './PhysicalTherapyCard'
import { TherapistType } from './types'

function therapist(overrides: Partial<TherapistType> = {}): TherapistType {
  return {
    id: 7,
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
  }
}

describe('PhysicalTherapyCard', () => {
  it('shows the drive time when Google answered', () => {
    render(<PhysicalTherapyCard therapist={therapist()} position={1} />)

    expect(screen.getByText('28 min · 24.3 mi')).toBeInTheDocument()
  })

  it('shows a straight-line label instead of a fabricated duration', () => {
    render(
      <PhysicalTherapyCard
        therapist={therapist({ drive_time_source: 'estimate', drive_time_minutes: undefined })}
        position={2}
      />
    )

    expect(screen.getByText('~24.3 mi straight line')).toBeInTheDocument()
    expect(screen.queryByText(/\d+ min ·/)).not.toBeInTheDocument()
  })

  it('renders its position so the card and its map pin agree', () => {
    render(<PhysicalTherapyCard therapist={therapist()} position={3} />)

    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows minutes alone when Google answered without a distance', () => {
    render(
      <PhysicalTherapyCard
        therapist={therapist({ drive_distance_miles: undefined, distance: undefined })}
        position={1}
      />
    )

    expect(screen.getByText('28 min')).toBeInTheDocument()
  })

  it('says "Distance unavailable" when there is no number at all', () => {
    render(
      <PhysicalTherapyCard
        therapist={therapist({
          drive_time_source: 'estimate',
          drive_time_minutes: undefined,
          drive_distance_miles: undefined,
          distance: undefined,
        })}
        position={1}
      />
    )

    expect(screen.getByText('Distance unavailable')).toBeInTheDocument()
  })

  it('hides literal "n/a" phone and fax instead of printing them', () => {
    render(
      <PhysicalTherapyCard
        therapist={therapist({ phone: 'n/a', fax: 'N/A' })}
        position={1}
      />
    )

    expect(screen.queryByText(/n\/a/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Fax/)).not.toBeInTheDocument()
  })

  it('shows the website as a bare hostname linking to the full URL', () => {
    render(
      <PhysicalTherapyCard
        therapist={therapist({ website: 'https://greenbaypt.com/contact?utm_source=x' })}
        position={1}
      />
    )

    const link = screen.getByRole('link', { name: 'greenbaypt.com' })
    expect(link).toHaveAttribute('href', 'https://greenbaypt.com/contact?utm_source=x')
  })

  it('links the referral form only when the record has one', () => {
    const { rerender } = render(
      <PhysicalTherapyCard
        therapist={therapist({ referral_form_url: 'https://example.com/form.pdf' })}
        position={1}
      />
    )
    expect(screen.getByRole('link', { name: /referral form/i })).toHaveAttribute(
      'href',
      'https://example.com/form.pdf'
    )

    rerender(<PhysicalTherapyCard therapist={therapist()} position={1} />)
    expect(screen.queryByRole('link', { name: /referral form/i })).not.toBeInTheDocument()
  })

  it('selects from the keyboard: the row is a real button, not a mouse-only div', async () => {
    const onSelect = vi.fn()
    render(<PhysicalTherapyCard therapist={therapist()} position={1} onSelect={onSelect} />)

    const row = screen.getByRole('button', { name: /Green Bay PT/ })
    row.focus()
    await userEvent.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith(7)

    await userEvent.keyboard(' ')
    expect(onSelect).toHaveBeenCalledTimes(2)
  })

  describe('address click', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('opens Google Maps with the full address, suite line included', async () => {
      const open = vi.spyOn(window, 'open').mockImplementation(() => null)
      render(
        <PhysicalTherapyCard
          therapist={therapist({ address_two: 'Suite 200' })}
          position={1}
        />
      )

      await userEvent.click(screen.getByText(/123 Main St/))

      expect(open).toHaveBeenCalledWith(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          '123 Main St, Suite 200, Green Bay, WI, 54301'
        )}`,
        '_blank',
        'noopener,noreferrer'
      )
    })
  })
})
