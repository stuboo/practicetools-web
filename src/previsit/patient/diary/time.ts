// Time and id helpers for the diary. `t` is local ISO-8601 with UTC offset (spec §6.1).

const pad = (n: number, w = 2) => String(Math.abs(Math.trunc(n))).padStart(w, '0')

/** Local ISO-8601 with offset, e.g. 2026-11-01T06:00:00-05:00. */
export function toLocalIso(d: Date): string {
  const off = -d.getTimezoneOffset()
  const sign = off >= 0 ? '+' : '-'
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
    `${sign}${pad(off / 60)}:${pad(off % 60)}`
  )
}

/** Local calendar date key (YYYY-MM-DD) in the device's time zone. */
export function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Value for an <input type="datetime-local">, in device-local time. */
export function toInputValue(iso: string): string {
  const d = new Date(iso)
  return `${localDateKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Parse a datetime-local value back to local ISO with offset; null if invalid. */
export function fromInputValue(v: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v)
  if (!m) return null
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], 0)
  return Number.isNaN(d.getTime()) ? null : toLocalIso(d)
}

export function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    /* fall through */
  }
  return `ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
