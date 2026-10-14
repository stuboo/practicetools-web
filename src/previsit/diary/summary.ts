// Bladder diary summary (spec §6.3). Pure functions; no I/O.
//
// Conventions chosen where the spec is silent (see also the Decision Log):
// - Timestamps are compared by epoch ms. A day's calendar date is the first
//   10 characters of its wake timestamp (the patient's local date).
// - A diary "day" starts at each wake event. A second wake on the same local
//   date as the previous kept wake is treated as a duplicate and ignored.
// - bed_D is the LAST bed event in [wake_D, wake_{D+1}) (naps are ignored).
// - Anything that needs a missing anchor (bed, next wake, FMV) is null.
// - The trailing wake that only closes the final day is not given a day row.

import type { DiaryEvent } from '../types'

export const FMV_WINDOW_MS = 60 * 60 * 1000
export const NOCTURNAL_POLYURIA_NPI = 0.33
export const LARGE_VOID_ML = 1000
export const UNMEASURED_WARN_FRACTION = 0.25
export const MIN_COMPLETE_DAYS = 3

type VoidEvent = Extract<DiaryEvent, { kind: 'void' }>
type LeakEvent = Extract<DiaryEvent, { kind: 'leak' }>
type IntakeEvent = Extract<DiaryEvent, { kind: 'intake' }>

export type LeakCounts = {
  total: number
  stress: number
  urge: number
  other: number
}

export type DaySummary = {
  /** Local calendar date of wake_D, YYYY-MM-DD. */
  date: string
  wake: string
  bed: string | null
  nextWake: string | null
  /** wake_D, bed_D and wake_{D+1} all exist. */
  complete: boolean
  /** First void within 60 min of wake_D, if any. */
  fmvId: string | null
  daytimeVoids: number | null
  nocturiaEpisodes: number | null
  frequency24h: number | null
  /** Excludes FMV_D, includes FMV_{D+1}. Null if not computable. */
  voidedVolume24hMl: number | null
  nuvMl: number | null
  /** NUV / 24h volume, as a ratio (0.35 = 35%). */
  npi: number | null
  nocturnalPolyuria: boolean | null
  /** Voids during wake_D..wake_{D+1} (or to end of diary) with no volume. */
  unmeasuredVoids: number
  leaks: LeakCounts | null
  pads: number | null
  intakeMl: number | null
  caffeinatedCount: number | null
  alcoholCount: number | null
}

export type MaxVoid = {
  volumeMl: number
  isFmv: boolean
  t: string
}

export type DataQualityCode =
  | 'fewer_than_3_complete_days'
  | 'missing_wake_or_bed'
  | 'many_unmeasured_voids'
  | 'large_void'

export type DataQualityWarning = {
  code: DataQualityCode
  message: string
}

/** Means over complete days. Counts rounded to 0.1, volumes to whole mL. */
export type DiaryLevel = {
  completeDays: number
  /** First complete day's date and the date of the last closing wake. */
  rangeStart: string | null
  rangeEnd: string | null
  frequency24h: number | null
  daytimeVoids: number | null
  nocturiaEpisodes: number | null
  voidedVolume24hMl: number | null
  nuvMl: number | null
  /** Whole percent, e.g. 35. */
  npiPercent: number | null
  nocturnalPolyuria: boolean | null
  leaksTotal: number | null
  leaksStress: number | null
  leaksUrge: number | null
  leaksOther: number | null
  pads: number | null
  intakeMl: number | null
  caffeinatedCount: number | null
  alcoholCount: number | null
  /** Over every measured void in the whole diary. */
  maxVoid: MaxVoid | null
  meanVoidMl: number | null
  totalVoids: number
  unmeasuredVoids: number
}

export type DiarySummary = {
  days: DaySummary[]
  overall: DiaryLevel
  warnings: DataQualityWarning[]
}

const ms = (t: string): number => Date.parse(t)
const localDate = (t: string): string => t.slice(0, 10)

const round1 = (x: number): number => Math.round(x * 10) / 10

function mean(values: Array<number | null>): number | null {
  const v = values.filter((x): x is number => x !== null)
  if (v.length === 0) return null
  return v.reduce((a, b) => a + b, 0) / v.length
}

const meanCount = (values: Array<number | null>): number | null => {
  const m = mean(values)
  return m === null ? null : round1(m)
}

const meanMl = (values: Array<number | null>): number | null => {
  const m = mean(values)
  return m === null ? null : Math.round(m)
}

function leakType(trigger: LeakEvent['trigger']): 'stress' | 'urge' | 'other' {
  if (trigger === 'cough_sneeze_laugh' || trigger === 'activity')
    return 'stress'
  if (trigger === 'urgency') return 'urge'
  return 'other'
}

type Anchor = { wake: DiaryEvent; wakeMs: number }

function buildWakes(sorted: DiaryEvent[]): Anchor[] {
  const wakes: Anchor[] = []
  for (const e of sorted) {
    if (e.kind !== 'wake') continue
    const prev = wakes[wakes.length - 1]
    if (prev && localDate(prev.wake.t) === localDate(e.t)) continue
    wakes.push({ wake: e, wakeMs: ms(e.t) })
  }
  return wakes
}

/** First void at/after `wakeMs` (before `endMs`) and within 60 min, if any. */
function findFmv(
  voids: VoidEvent[],
  wakeMs: number,
  endMs: number
): VoidEvent | null {
  const first = voids.find((v) => ms(v.t) >= wakeMs && ms(v.t) < endMs)
  if (!first) return null
  return ms(first.t) - wakeMs <= FMV_WINDOW_MS ? first : null
}

export function summarizeDiary(events: DiaryEvent[]): DiarySummary {
  const sorted = events
    .map((e, i) => ({ e, i, m: ms(e.t) }))
    .filter((x) => !Number.isNaN(x.m))
    .sort((a, b) => a.m - b.m || a.i - b.i)
    .map((x) => x.e)

  const voids = sorted.filter((e): e is VoidEvent => e.kind === 'void')
  const leaks = sorted.filter((e): e is LeakEvent => e.kind === 'leak')
  const intakes = sorted.filter((e): e is IntakeEvent => e.kind === 'intake')
  const beds = sorted.filter((e) => e.kind === 'bed')
  const wakes = buildWakes(sorted)

  const fmvIds = new Set<string>()
  const days: DaySummary[] = []

  wakes.forEach((a, idx) => {
    const wakeMs = a.wakeMs
    const next = wakes[idx + 1]
    const nextMs = next ? next.wakeMs : Infinity

    const bedEvent =
      [...beds].reverse().find((b) => ms(b.t) >= wakeMs && ms(b.t) < nextMs) ??
      null
    const bedMs = bedEvent ? ms(bedEvent.t) : null

    const fmv = findFmv(voids, wakeMs, nextMs)
    if (fmv) fmvIds.add(fmv.id)
    const nextFmv = next ? findFmv(voids, next.wakeMs, Infinity) : null
    if (nextFmv) fmvIds.add(nextFmv.id)

    // The last wake with nothing logged after it only closes the prior day.
    if (!next && bedMs === null) {
      const hasOther = sorted.some(
        (e) =>
          ms(e.t) >= wakeMs && e.kind !== 'wake' && !(fmv && e.id === fmv.id)
      )
      if (!hasOther) return
    }

    const complete = bedMs !== null && next !== undefined

    const dayVoids = voids.filter((v) => ms(v.t) >= wakeMs && ms(v.t) < nextMs)

    let daytimeVoids: number | null = null
    let nocturia: number | null = null
    if (bedMs !== null) {
      daytimeVoids = voids.filter(
        (v) => ms(v.t) >= wakeMs && ms(v.t) < bedMs
      ).length
    }
    if (bedMs !== null && next) {
      nocturia = voids.filter(
        (v) => ms(v.t) >= bedMs && ms(v.t) < nextMs
      ).length
    }
    const frequency =
      daytimeVoids !== null && nocturia !== null
        ? daytimeVoids + nocturia
        : null

    // 24h volume: FMV_D < t <= FMV_{D+1}; needs both FMVs (FMV_{D+1} measured).
    let volume24h: number | null = null
    if (
      fmv &&
      next &&
      nextFmv &&
      nextFmv.volumeMl !== null &&
      nextFmv.volumeMl !== undefined
    ) {
      const lo = ms(fmv.t)
      const hi = ms(nextFmv.t)
      volume24h = voids
        .filter((v) => ms(v.t) > lo && ms(v.t) <= hi)
        .reduce((s, v) => s + (v.volumeMl ?? 0), 0)
    }

    // NUV: measured nocturnal voids + FMV_{D+1}.
    let nuv: number | null = null
    if (
      bedMs !== null &&
      next &&
      nextFmv &&
      nextFmv.volumeMl !== null &&
      nextFmv.volumeMl !== undefined
    ) {
      nuv =
        voids
          .filter((v) => ms(v.t) >= bedMs && ms(v.t) < nextMs)
          .reduce((s, v) => s + (v.volumeMl ?? 0), 0) + nextFmv.volumeMl
    }

    const npi =
      nuv !== null && volume24h !== null && volume24h > 0
        ? nuv / volume24h
        : null

    let leakCounts: LeakCounts | null = null
    let pads: number | null = null
    let intakeMl: number | null = null
    let caffeinated: number | null = null
    let alcohol: number | null = null
    if (next) {
      const dayLeaks = leaks.filter(
        (l) => ms(l.t) >= wakeMs && ms(l.t) < nextMs
      )
      leakCounts = { total: dayLeaks.length, stress: 0, urge: 0, other: 0 }
      for (const l of dayLeaks) leakCounts[leakType(l.trigger)] += 1
      pads = dayLeaks.filter((l) => l.padChanged).length
      const dayIntake = intakes.filter(
        (i) => ms(i.t) >= wakeMs && ms(i.t) < nextMs
      )
      intakeMl = dayIntake.reduce((s, i) => s + i.volumeMl, 0)
      caffeinated = dayIntake.filter((i) => i.caffeinated).length
      alcohol = dayIntake.filter((i) => i.beverage === 'alcohol').length
    }

    days.push({
      date: localDate(a.wake.t),
      wake: a.wake.t,
      bed: bedEvent ? bedEvent.t : null,
      nextWake: next ? next.wake.t : null,
      complete,
      fmvId: fmv ? fmv.id : null,
      daytimeVoids,
      nocturiaEpisodes: nocturia,
      frequency24h: frequency,
      voidedVolume24hMl: volume24h,
      nuvMl: nuv,
      npi,
      nocturnalPolyuria: npi === null ? null : npi > NOCTURNAL_POLYURIA_NPI,
      unmeasuredVoids: dayVoids.filter((v) => v.volumeMl === null).length,
      leaks: leakCounts,
      pads,
      intakeMl,
      caffeinatedCount: caffeinated,
      alcoholCount: alcohol,
    })
  })

  // Diary-wide void statistics.
  const measured = voids.filter(
    (v): v is VoidEvent & { volumeMl: number } => v.volumeMl !== null
  )
  let maxVoid: MaxVoid | null = null
  for (const v of measured) {
    if (!maxVoid || v.volumeMl > maxVoid.volumeMl) {
      maxVoid = { volumeMl: v.volumeMl, isFmv: fmvIds.has(v.id), t: v.t }
    }
  }
  const meanVoidMl = meanMl(measured.map((v) => v.volumeMl))
  const unmeasuredVoids = voids.length - measured.length

  const completeDays = days.filter((d) => d.complete)
  const npiMean = mean(completeDays.map((d) => d.npi))
  const lastComplete = completeDays[completeDays.length - 1]

  const overall: DiaryLevel = {
    completeDays: completeDays.length,
    rangeStart: completeDays.length ? completeDays[0].date : null,
    rangeEnd: lastComplete?.nextWake ? localDate(lastComplete.nextWake) : null,
    frequency24h: meanCount(completeDays.map((d) => d.frequency24h)),
    daytimeVoids: meanCount(completeDays.map((d) => d.daytimeVoids)),
    nocturiaEpisodes: meanCount(completeDays.map((d) => d.nocturiaEpisodes)),
    voidedVolume24hMl: meanMl(completeDays.map((d) => d.voidedVolume24hMl)),
    nuvMl: meanMl(completeDays.map((d) => d.nuvMl)),
    npiPercent: npiMean === null ? null : Math.round(npiMean * 100),
    nocturnalPolyuria:
      npiMean === null ? null : npiMean > NOCTURNAL_POLYURIA_NPI,
    leaksTotal: meanCount(completeDays.map((d) => d.leaks?.total ?? null)),
    leaksStress: meanCount(completeDays.map((d) => d.leaks?.stress ?? null)),
    leaksUrge: meanCount(completeDays.map((d) => d.leaks?.urge ?? null)),
    leaksOther: meanCount(completeDays.map((d) => d.leaks?.other ?? null)),
    pads: meanCount(completeDays.map((d) => d.pads)),
    intakeMl: meanMl(completeDays.map((d) => d.intakeMl)),
    caffeinatedCount: meanCount(completeDays.map((d) => d.caffeinatedCount)),
    alcoholCount: meanCount(completeDays.map((d) => d.alcoholCount)),
    maxVoid,
    meanVoidMl,
    totalVoids: voids.length,
    unmeasuredVoids,
  }

  return {
    days,
    overall,
    warnings: buildWarnings(sorted, days, overall, voids),
  }
}

function buildWarnings(
  sorted: DiaryEvent[],
  days: DaySummary[],
  overall: DiaryLevel,
  voids: VoidEvent[]
): DataQualityWarning[] {
  const warnings: DataQualityWarning[] = []

  if (overall.completeDays < MIN_COMPLETE_DAYS) {
    warnings.push({
      code: 'fewer_than_3_complete_days',
      message: 'Fewer than 3 complete days',
    })
  }

  // A day is flagged if it lacks a bed time (and a later wake exists), or if
  // events were logged on a calendar date that has no wake event at all.
  const wakeDates = new Set(days.map((d) => d.date))
  const allWakeDates = new Set(
    sorted.filter((e) => e.kind === 'wake').map((e) => localDate(e.t))
  )
  const missing = new Set<string>()
  for (const d of days) {
    if (d.bed === null && d.nextWake !== null) missing.add(d.date)
  }
  for (const e of sorted) {
    const d = localDate(e.t)
    if (!allWakeDates.has(d) && !wakeDates.has(d)) missing.add(d)
  }
  if (missing.size > 0) {
    warnings.push({
      code: 'missing_wake_or_bed',
      message: 'Some days are missing a wake or bed time',
    })
  }

  if (
    voids.length > 0 &&
    overall.unmeasuredVoids / voids.length > UNMEASURED_WARN_FRACTION
  ) {
    warnings.push({
      code: 'many_unmeasured_voids',
      message: 'More than 25% of voids were not measured',
    })
  }

  if (voids.some((v) => (v.volumeMl ?? 0) > LARGE_VOID_ML)) {
    warnings.push({
      code: 'large_void',
      message: 'A void over 1000 mL was recorded (check entry)',
    })
  }

  return warnings
}
