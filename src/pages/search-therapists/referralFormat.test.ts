import { describe, expect, it } from 'vitest'
import {
  bareDomain,
  buildAvsText,
  buildEntries,
  displayDomain,
  formatAddress,
  formatDistanceBadge,
  formatTravel,
  presentValue,
  safeUrl,
} from './referralFormat'
import { TherapistType } from './types'

function therapist(overrides: Partial<TherapistType> = {}): TherapistType {
  return {
    id: 1,
    name: 'Advanced PT & Sports Medicine - Green Bay',
    address: '123 Main St',
    city: 'Green Bay',
    state: 'WI',
    zip: '54301',
    phone: '(920) 555-1234',
    fax: '(920) 555-1235',
    website: 'https://advancedptsm.com/',
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

describe('buildAvsText', () => {
  it('matches the referral template for a Google drive time', () => {
    const text = buildAvsText([therapist()], '54235')

    expect(text).toBe(
      [
        'PELVIC FLOOR PHYSICAL THERAPY - REFERRAL OPTIONS',
        '(nearest options to ZIP 54235, listed closest first)',
        '',
        '1. Advanced PT & Sports Medicine - Green Bay',
        '   123 Main St, Green Bay, WI, 54301',
        '   Phone: (920) 555-1234   Fax: (920) 555-1235',
        '   Website: advancedptsm.com',
        '   About 28 minutes away by car (24 miles)',
        '',
        'Drive times are estimates from your ZIP code. Please call to',
        'confirm scheduling and insurance participation before your visit.',
        '',
      ].join('\n')
    )
  })

  it('says so plainly when the number is a straight-line estimate', () => {
    const text = buildAvsText(
      [therapist({ drive_time_source: 'estimate', drive_time_minutes: undefined })],
      '54235'
    )

    expect(text).toContain('About 24 miles away (straight-line estimate)')
    expect(text).not.toContain('by car')
  })

  it('omits fields the record does not have', () => {
    const text = buildAvsText(
      [therapist({ fax: undefined, website: undefined, address_two: undefined })],
      '54235'
    )

    expect(text).not.toContain('Fax:')
    expect(text).not.toContain('Website:')
    expect(text).toContain('Phone: (920) 555-1234')
  })

  it('numbers entries in the order given, closest first', () => {
    const text = buildAvsText(
      [
        therapist({ id: 1, name: 'Green Bay PT', drive_time_minutes: 28 }),
        therapist({ id: 2, name: 'Marinette PT', drive_time_minutes: 90 }),
      ],
      '54235'
    )

    expect(text.indexOf('1. Green Bay PT')).toBeLessThan(text.indexOf('2. Marinette PT'))
  })

  it('is pure printable ASCII with no tabs', () => {
    // Epic's AVS/SmartText fields mangle anything else, so this is the whole
    // point of having a separate formatter from the on-screen rendering.
    const text = buildAvsText(
      [
        therapist({
          name: 'Riverside PT — “North” Clinic•',
          address: '5 Elm’s Way',
        }),
      ],
      '54235'
    )

    expect(text).not.toMatch(/\t/)
    expect(text).toMatch(/^[\x20-\x7E\n]*$/)
    expect(text).toContain("Elm's Way")
    expect(text).toContain('Riverside PT - "North" Clinic-')
  })

  it('writes newlines, not carriage returns', () => {
    expect(buildAvsText([therapist()], '54235')).not.toContain('\r')
  })
})

describe('formatTravel / formatDistanceBadge', () => {
  it('renders a real drive time', () => {
    expect(formatTravel(therapist())).toBe('About 28 minutes away by car (24 miles)')
    expect(formatDistanceBadge(therapist())).toEqual({
      text: '28 min · 24.3 mi',
      isEstimate: false,
    })
  })

  it('renders an estimate without inventing a duration', () => {
    const estimate = therapist({ drive_time_source: 'estimate', drive_time_minutes: undefined })
    expect(formatTravel(estimate)).toBe('About 24 miles away (straight-line estimate)')
    expect(formatDistanceBadge(estimate)).toEqual({
      text: '~24.3 mi straight line',
      isEstimate: true,
    })
  })

  it('handles a missing drive time as an estimate rather than crashing', () => {
    const bare = therapist({ drive_time_minutes: undefined, drive_time_source: undefined })
    expect(formatDistanceBadge(bare)).toEqual({
      text: '~24.3 mi straight line',
      isEstimate: true,
    })
  })
})

describe('safeUrl', () => {
  it('passes http and https URLs through', () => {
    expect(safeUrl('https://example.com/form.pdf')).toBe('https://example.com/form.pdf')
    expect(safeUrl('http://example.com')).toBe('http://example.com')
  })

  it('prefixes a scheme onto bare-domain records instead of making them relative', () => {
    expect(safeUrl('example.com')).toBe('https://example.com')
    expect(safeUrl('  example.com/contact  ')).toBe('https://example.com/contact')
  })

  it.each(['javascript:alert(1)', 'data:text/html,x', 'mailto:a@b.com', 'n/a', '', undefined])(
    'refuses %j -- these fields are data, not code',
    (value) => {
      expect(safeUrl(value)).toBeUndefined()
    }
  )
})

describe('presentValue', () => {
  it('passes a real value through, trimmed', () => {
    expect(presentValue('  (920) 555-1234  ')).toBe('(920) 555-1234')
  })

  it.each([undefined, '', '   '])(
    'returns undefined for %j so the line is omitted entirely',
    (value) => {
      expect(presentValue(value)).toBeUndefined()
    }
  )

  it.each(['n/a', 'N/A', 'na', 'NA', ' n/a '])(
    'filters the literal placeholder %j out of records',
    (value) => {
      expect(presentValue(value)).toBeUndefined()
    }
  )

  it('does not swallow values that merely start with "na"', () => {
    expect(presentValue('nashville-pt.com')).toBe('nashville-pt.com')
    expect(presentValue('n/a ext. 2')).toBe('n/a ext. 2')
  })
})

describe('bareDomain / displayDomain', () => {
  it('strips a query string and fragment -- nobody reads a UTM tag aloud', () => {
    expect(bareDomain('https://example.com/pelvic?utm_source=x&y=1')).toBe(
      'example.com/pelvic'
    )
    expect(bareDomain('https://example.com/pelvic#hours')).toBe('example.com/pelvic')
  })

  it('displayDomain keeps only the hostname for the one-line row', () => {
    expect(displayDomain('https://example.com/clinics/green-bay?ref=pt')).toBe(
      'example.com'
    )
    expect(displayDomain('example.com')).toBe('example.com')
  })
})

describe('buildEntries', () => {
  it('drops literal "n/a" phone, fax and website instead of printing them', () => {
    const [entry] = buildEntries([
      therapist({ phone: 'n/a', fax: 'N/A', website: 'n/a' }),
    ])

    expect(entry.phone).toBeUndefined()
    expect(entry.fax).toBeUndefined()
    expect(entry.website).toBeUndefined()
  })
})

describe('formatAddress', () => {
  it('includes a suite line when there is one', () => {
    expect(formatAddress(therapist({ address_two: 'Suite 200' }))).toBe(
      '123 Main St, Suite 200, Green Bay, WI, 54301'
    )
  })

  it('skips an absent suite line without leaving a stray comma', () => {
    expect(formatAddress(therapist())).toBe('123 Main St, Green Bay, WI, 54301')
  })
})
