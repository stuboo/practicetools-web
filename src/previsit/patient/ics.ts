// Calendar file built on the device (spec §7.4). No server call.

import { addDays } from './dates'

const compact = (iso: string) => iso.replace(/-/g, '')

export function escapeIcsText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

// RFC 5545 line folding at 75 octets (ASCII text here, so chars == octets).
function fold(line: string): string {
  if (line.length <= 75) return line
  const parts = [line.slice(0, 75)]
  for (let i = 75; i < line.length; i += 74) parts.push(' ' + line.slice(i, i + 74))
  return parts.join('\r\n')
}

function stamp(now: Date): string {
  return now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

export const DIARY_LEAD_DAYS = 5

export function buildIcs(visitDate: string, now: Date = new Date()): string {
  const events = [
    { uid: `diary-${visitDate}@previsit`, date: addDays(visitDate, -DIARY_LEAD_DAYS), summary: 'Start bladder diary' },
    {
      uid: `visit-${visitDate}@previsit`,
      date: visitDate,
      summary: 'Urogynecology visit – bring your code',
    },
  ]
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Practice Tools//Previsit//EN', 'CALSCALE:GREGORIAN']
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART;VALUE=DATE:${compact(e.date)}`,
      `DTEND;VALUE=DATE:${compact(addDays(e.date, 1))}`,
      `SUMMARY:${escapeIcsText(e.summary)}`,
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}

export function downloadIcs(visitDate: string): void {
  const blob = new Blob([buildIcs(visitDate)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'bladder-visit.ics'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
