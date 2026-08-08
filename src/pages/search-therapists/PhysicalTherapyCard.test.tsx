import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
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
})
