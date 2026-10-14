import type { DiaryEvent } from '../../types'

const ms = (e: DiaryEvent) => new Date(e.t).getTime()
export const sortEvents = (evs: DiaryEvent[]) => [...evs].sort((a, b) => ms(a) - ms(b))

// Day 1 = local date of the first wake event, else of the first event.
export function diaryDayNumber(events: DiaryEvent[], now: Date): number {
  const sorted = sortEvents(events)
  const anchor = sorted.find((e) => e.kind === 'wake') ?? sorted[0]
  if (!anchor) return 1
  const a = new Date(anchor.t)
  const start = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return Math.max(1, Math.round((today - start) / 86_400_000) + 1)
}

