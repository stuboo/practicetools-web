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

/**
 * Some records carry literal "n/a" strings instead of empty fields, and a
 * handout reading "Fax: n/a" wastes the line. One filter, used by the cards,
 * the AVS text and the printed handout alike.
 */
export function presentValue(value?: string): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed || /^n\/?a$/i.test(trimmed)) return undefined
  return trimmed
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

/**
 * The badge on a result row and its map popup: "28 min · 24.3 mi", or the
 * honest estimate form. One function so the row and the pin can never word
 * the same fact two different ways. A straight-line fallback says so rather
 * than passing itself off as a route.
 */
export function formatDistanceBadge(therapist: TherapistType): {
  text: string
  isEstimate: boolean
} {
  const miles = therapist.drive_distance_miles ?? therapist.distance
  const isEstimate =
    therapist.drive_time_source === 'estimate' ||
    therapist.drive_time_minutes === undefined

  if (isEstimate) {
    return {
      text:
        miles === undefined
          ? 'Distance unavailable'
          : `~${miles.toFixed(1)} mi straight line`,
      isEstimate: true,
    }
  }
  const minutes = `${therapist.drive_time_minutes} min`
  return {
    text: miles === undefined ? minutes : `${minutes} · ${miles.toFixed(1)} mi`,
    isEstimate: false,
  }
}

/**
 * An href that is safe to render from database content: http(s) only, with a
 * scheme prefixed for bare-domain records ("example.com"). Anything else --
 * javascript:, data:, mailto:, garbage -- returns undefined and the link is
 * simply not rendered. These fields are populated through admin forms and
 * CSV imports, so they are data, not code.
 */
export function safeUrl(value?: string): string | undefined {
  const present = presentValue(value)
  if (!present) return undefined
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(present) ? present : `https://${present}`
  try {
    const parsed = new URL(candidate)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return candidate
  } catch {
    return undefined
  }
  return undefined
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
    phone: presentValue(therapist.phone),
    fax: presentValue(therapist.fax),
    // Through safeUrl so the printed handout -- the highest-trust artifact
    // this page produces -- never carries a URL the on-screen row refused.
    website: (() => {
      const url = safeUrl(therapist.website)
      return url ? bareDomain(url) : undefined
    })(),
    travel: formatTravel(therapist),
    therapist,
    directionsUrl: directionsUrl(therapist),
  }))
}

/**
 * Strip scheme, query string and trailing slash: a printed URL is read, not
 * clicked, and nobody reads a UTM tag aloud.
 */
export function bareDomain(website: string): string {
  return website
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '')
}

/**
 * Just the hostname, for the one-line result row where a path is noise.
 * Parsed with URL so userinfo tricks ("trusted.com@evil.com") cannot make the
 * link text lead with a domain the href does not actually go to.
 */
export function displayDomain(website: string): string {
  const url = safeUrl(website)
  if (url) return new URL(url).hostname
  return bareDomain(website).split('/')[0]
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
