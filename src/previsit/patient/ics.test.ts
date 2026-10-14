import { describe, expect, it } from 'vitest'
import { buildIcs, escapeIcsText } from './ics'

describe('buildIcs', () => {
  const ics = buildIcs('2026-11-03', new Date('2026-10-14T12:34:56.789Z'))

  it('uses CRLF line endings and a calendar wrapper', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/)
  })

  it('has two all-day events at visit-5 and visit', () => {
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2)
    expect(ics).toContain('DTSTART;VALUE=DATE:20261029\r\n')
    expect(ics).toContain('DTEND;VALUE=DATE:20261030\r\n')
    expect(ics).toContain('SUMMARY:Start bladder diary\r\n')
    expect(ics).toContain('DTSTART;VALUE=DATE:20261103\r\n')
    expect(ics).toContain('SUMMARY:Urogynecology visit – bring your code\r\n')
  })

  it('has UID and DTSTAMP on each event', () => {
    expect(ics.match(/^UID:.+@previsit$/gm)).toHaveLength(2)
    expect(ics.match(/^DTSTAMP:20261014T123456Z$/gm)).toHaveLength(2)
  })

  it('crosses month boundaries', () => {
    expect(buildIcs('2026-11-03')).toContain('DTSTART;VALUE=DATE:20261029')
    expect(buildIcs('2026-03-02')).toContain('DTSTART;VALUE=DATE:20260225')
  })
})

describe('escapeIcsText', () => {
  it('escapes backslash, semicolon, comma, newline', () => {
    expect(escapeIcsText('a\\b;c,d\ne')).toBe('a\\\\b\\;c\\,d\\ne')
  })
})
