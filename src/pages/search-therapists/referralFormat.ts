import { TherapistType } from './types'

/**
 * One source of truth for how a result set is worded.
 *
 * The printed handout and the "Copy for AVS" text are the same content in two
 * renderings, so the wording, ordering and field-omission rules live here
 * rather than being written twice and drifting apart.
 */

export const HANDOUT_TITLE = 'Pelvic Floor Physical Therapy - Referral Options'

export const HANDOUT_FOOTER =
  'Drive times are estimates from your ZIP code. Please call to confirm scheduling and insurance participation before your visit.'

export type ReferralLine = {
  label: string
  value: string
}

export type ReferralEntry = {
  number: number
  name: string
  address: string
  phone?: string
  fax?: string
  website?: string
  travel: string
  therapist: TherapistType
  /** Google Maps directions URL - used for the printed QR code. */
  directionsUrl: string
}

/** Full one-line address, skipping any part the record does not have. */
export function formatAddress(therapist: TherapistType): string {
  const street = [therapist.address, therapist.address_two].filter(Boolean).join(', ')
  const locality = [therapist.city, therapist.state].filter(Boolean).join(', ')
  return [street, locality, therapist.zip].filter(Boolean).join(', ').trim()
}

/**
 * How far away this clinic is, in the patient's terms.
 *
 * When Google could not be reached the number is a straight-line distance, and
 * saying so is the honest thing to hand a patient -- a "22 minute" figure that
 * was never a real route would send them out the door with a wrong plan.
 */
export function formatTravel(therapist: TherapistType): string {
  const miles = therapist.drive_distance_miles ?? therapist.distance
  const milesText = miles === undefined ? '' : `${Math.round(miles)} miles`

  if (therapist.drive_time_source === 'estimate' || therapist.drive_time_minutes === undefined) {
    return milesText ? `About ${milesText} away (straight-line estimate)` : 'Distance unavailable'
  }

  const minutes = therapist.drive_time_minutes
  const minuteText = `About ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} away by car`
  return milesText ? `${minuteText} (${milesText})` : minuteText
}

/** The badge on a result card: "28 min drive - 24.3 mi", or the estimate form. */
export function formatDistanceBadge(therapist: TherapistType): string {
  const miles = therapist.drive_distance_miles ?? therapist.distance

  if (therapist.drive_time_source === 'estimate' || therapist.drive_time_minutes === undefined) {
    return miles === undefined ? 'Distance unavailable' : `~${miles.toFixed(1)} mi (straight line)`
  }
  const minutes = `${therapist.drive_time_minutes} min drive`
  return miles === undefined ? minutes : `${minutes} · ${miles.toFixed(1)} mi`
}

export function directionsUrl(therapist: TherapistType): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    formatAddress(therapist)
  )}`
}

export function buildEntries(therapists: TherapistType[]): ReferralEntry[] {
  return therapists.map((therapist, index) => ({
    number: index + 1,
    name: therapist.name,
    address: formatAddress(therapist),
    phone: therapist.phone || undefined,
    fax: therapist.fax || undefined,
    website: therapist.website ? bareDomain(therapist.website) : undefined,
    travel: formatTravel(therapist),
    therapist,
    directionsUrl: directionsUrl(therapist),
  }))
}

/** Strip scheme and trailing slash: a printed URL is read, not clicked. */
export function bareDomain(website: string): string {
  return website
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '')
}

/**
 * Strip anything that is not plain 7-bit ASCII.
 *
 * This text is pasted into Epic's AVS / SmartText editors, which mangle or
 * silently drop curly quotes, en/em dashes, bullets and non-breaking spaces.
 * Normalising the common offenders keeps the paste predictable everywhere in
 * Hyperspace instead of depending on which field it lands in.
 */
export function toAscii(text: string): string {
  return text
    .replace(/[\u2018\u2019\u201B\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201F\u2033]/g, '"')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/[\u2022\u00B7\u2027]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[\u00A0\u2002\u2003\u2007\u2009\u202F]/g, ' ')
    .replace(/\t/g, '    ')
    // Anything still outside printable ASCII would be a guess at best; drop it
    // rather than let Epic decide what to do with it.
    .replace(/[^\x20-\x7E\n]/g, '')
}

/**
 * The clipboard payload for Epic. Plain text only -- no HTML flavor is ever
 * written, because rich-text paste into AVS carries styling Epic then strips
 * or corrupts.
 */
export function buildAvsText(therapists: TherapistType[], zip: string): string {
  const entries = buildEntries(therapists)
  const indent = '   '

  const header = [
    'PELVIC FLOOR PHYSICAL THERAPY - REFERRAL OPTIONS',
    `(nearest options to ZIP ${zip}, listed closest first)`,
  ].join('\n')

  const blocks = entries.map((entry) => {
    const lines = [`${entry.number}. ${entry.name}`]
    if (entry.address) lines.push(`${indent}${entry.address}`)

    const contact: string[] = []
    if (entry.phone) contact.push(`Phone: ${entry.phone}`)
    if (entry.fax) contact.push(`Fax: ${entry.fax}`)
    if (contact.length) lines.push(`${indent}${contact.join('   ')}`)

    if (entry.website) lines.push(`${indent}Website: ${entry.website}`)
    lines.push(`${indent}${entry.travel}`)
    return lines.join('\n')
  })

  const footer = [
    'Drive times are estimates from your ZIP code. Please call to',
    'confirm scheduling and insurance participation before your visit.',
  ].join('\n')

  return toAscii([header, ...blocks, footer].join('\n\n') + '\n')
}
