import { describe, expect, it } from 'vitest'
import type { DiaryEvent } from '../types'
import { summarizeDiary } from './summary'
import { mlToOz, ozToMl, roundDisplayMl, roundDisplayOz } from './units'
import { at, workedExampleEvents } from './__fixtures__/workedExample'

describe('summarizeDiary: spec 6.4 worked example', () => {
  const s = summarizeDiary(workedExampleEvents)
  const day = s.days[0]

  it('has one day row (closing wake gets none) that is complete', () => {
    expect(s.days).toHaveLength(1)
    expect(day.date).toBe('2026-11-02')
    expect(day.complete).toBe(true)
    expect(day.fmvId).toBe('e02')
  })

  it('computes per-day values', () => {
    expect(day.daytimeVoids).toBe(6)
    expect(day.nocturiaEpisodes).toBe(1)
    expect(day.frequency24h).toBe(7)
    expect(day.voidedVolume24hMl).toBe(1850)
    expect(day.nuvMl).toBe(650)
    expect(Math.round((day.npi ?? 0) * 100)).toBe(35)
    expect(day.nocturnalPolyuria).toBe(true)
    expect(day.leaks).toEqual({ total: 2, stress: 1, urge: 1, other: 0 })
    expect(day.pads).toBe(1)
    expect(day.intakeMl).toBe(1090)
    expect(day.caffeinatedCount).toBe(1)
    expect(day.alcoholCount).toBe(0)
    expect(day.unmeasuredVoids).toBe(0)
  })

  it('computes diary-level values', () => {
    const o = s.overall
    expect(o.completeDays).toBe(1)
    expect(o.frequency24h).toBe(7)
    expect(o.daytimeVoids).toBe(6)
    expect(o.nocturiaEpisodes).toBe(1)
    expect(o.voidedVolume24hMl).toBe(1850)
    expect(o.nuvMl).toBe(650)
    expect(o.npiPercent).toBe(35)
    expect(o.nocturnalPolyuria).toBe(true)
    expect(o.maxVoid).toEqual({
      volumeMl: 400,
      isFmv: true,
      t: at('2026-11-02', '06:00'),
    })
    expect(o.meanVoidMl).toBe(281)
    expect(o.leaksStress).toBe(1)
    expect(o.leaksUrge).toBe(1)
    expect(o.pads).toBe(1)
    expect(o.intakeMl).toBe(1090)
    expect(o.caffeinatedCount).toBe(1)
    expect(o.alcoholCount).toBe(0)
    expect(o.unmeasuredVoids).toBe(0)
    expect(o.rangeStart).toBe('2026-11-02')
    expect(o.rangeEnd).toBe('2026-11-03')
  })

  it('warns about fewer than 3 complete days only', () => {
    expect(s.warnings.map((w) => w.code)).toEqual([
      'fewer_than_3_complete_days',
    ])
  })

  it('is insensitive to input order', () => {
    const shuffled = [...workedExampleEvents].reverse()
    expect(summarizeDiary(shuffled)).toEqual(s)
  })
})

describe('summarizeDiary: edge cases', () => {
  it('counts an unmeasured void in frequency but not volumes', () => {
    const events = workedExampleEvents.map(
      (e): DiaryEvent =>
        e.id === 'e06' && e.kind === 'void' ? { ...e, volumeMl: null } : e
    )
    const s = summarizeDiary(events)
    expect(s.days[0].frequency24h).toBe(7)
    expect(s.days[0].voidedVolume24hMl).toBe(1650)
    expect(s.days[0].unmeasuredVoids).toBe(1)
    expect(s.overall.unmeasuredVoids).toBe(1)
    expect(s.overall.totalVoids).toBe(8)
    // mean of the 7 measured voids: 2050 / 7
    expect(s.overall.meanVoidMl).toBe(293)
    // 1 of 8 = 12.5%: below the 25% threshold
    expect(s.warnings.map((w) => w.code)).not.toContain('many_unmeasured_voids')
  })

  it('warns when more than 25% of voids are unmeasured', () => {
    const events = workedExampleEvents.map(
      (e): DiaryEvent =>
        e.kind === 'void' && ['e04', 'e06', 'e08'].includes(e.id)
          ? { ...e, volumeMl: null }
          : e
    )
    expect(summarizeDiary(events).warnings.map((w) => w.code)).toContain(
      'many_unmeasured_voids'
    )
  })

  it('gives null 24h volume and NPI when there is no FMV', () => {
    // Move the first void to 07:30, more than 60 min after waking.
    const events = workedExampleEvents.map(
      (e): DiaryEvent =>
        e.id === 'e02' ? { ...e, t: at('2026-11-02', '07:30') } : e
    )
    const d = summarizeDiary(events).days[0]
    expect(d.fmvId).toBeNull()
    expect(d.voidedVolume24hMl).toBeNull()
    expect(d.nuvMl).toBe(650) // NUV only needs FMV_{D+1}
    expect(d.npi).toBeNull()
    expect(d.nocturnalPolyuria).toBeNull()
    expect(d.frequency24h).toBe(7)
  })

  it('treats an unmeasured next-day FMV as unknown volume', () => {
    const events = workedExampleEvents.map(
      (e): DiaryEvent =>
        e.id === 'e16' && e.kind === 'void' ? { ...e, volumeMl: null } : e
    )
    const d = summarizeDiary(events).days[0]
    expect(d.voidedVolume24hMl).toBeNull()
    expect(d.nuvMl).toBeNull()
  })

  it('does not flag polyuria at NPI exactly 0.33 or below', () => {
    // Raise the daytime volume so NPI = 650 / 2250 = 0.289.
    const events = workedExampleEvents.map(
      (e): DiaryEvent =>
        e.id === 'e08' && e.kind === 'void' ? { ...e, volumeMl: 700 } : e
    )
    const d = summarizeDiary(events).days[0]
    expect(d.voidedVolume24hMl).toBe(2250)
    expect(d.nocturnalPolyuria).toBe(false)
  })

  it('warns on a void over 1000 mL and on missing bed time', () => {
    const events = workedExampleEvents
      .filter((e) => e.kind !== 'bed')
      .map(
        (e): DiaryEvent =>
          e.id === 'e06' && e.kind === 'void' ? { ...e, volumeMl: 1200 } : e
      )
    const s = summarizeDiary(events)
    const codes = s.warnings.map((w) => w.code)
    expect(codes).toContain('large_void')
    expect(codes).toContain('missing_wake_or_bed')
    expect(s.days[0].complete).toBe(false)
    expect(s.overall.completeDays).toBe(0)
  })

  it('flags a final day that has a wake but no bed time', () => {
    const events = workedExampleEvents.filter((e) => e.t.startsWith('2026-11-02'))
    // Only Monday's wake remains, and Monday has a bed: no flag.
    expect(summarizeDiary(events).warnings.map((w) => w.code)).not.toContain('missing_wake_or_bed')
    const noBed = events.filter((e) => e.kind !== 'bed')
    expect(summarizeDiary(noBed).warnings.map((w) => w.code)).toContain('missing_wake_or_bed')
  })

  it('returns an empty summary for no events', () => {
    const s = summarizeDiary([])
    expect(s.days).toEqual([])
    expect(s.overall.completeDays).toBe(0)
    expect(s.overall.maxVoid).toBeNull()
    expect(s.overall.meanVoidMl).toBeNull()
  })
})

describe('summarizeDiary: three complete days', () => {
  // Per day: wake 06:00, FMV at 06:05, N daytime voids, bed 22:00, M night
  // voids. Day i uses dates 11/(2+i) with a closing wake the next morning.
  const mk = (): DiaryEvent[] => {
    const ev: DiaryEvent[] = []
    let n = 0
    const id = () => `x${n++}`
    const plan = [
      { day: 5, night: 0, fmv: 300, leaks: 1, pads: 0 },
      { day: 6, night: 1, fmv: 400, leaks: 2, pads: 1 },
      { day: 7, night: 2, fmv: 500, leaks: 3, pads: 2 },
    ]
    plan.forEach((p, i) => {
      const d = `2026-11-0${2 + i}`
      const nx = `2026-11-0${3 + i}`
      ev.push({ id: id(), t: at(d, '06:00'), kind: 'wake' })
      ev.push({
        id: id(),
        t: at(d, '06:05'),
        kind: 'void',
        volumeMl: p.fmv,
        urgency: null,
      })
      for (let k = 1; k < p.day; k++) {
        ev.push({
          id: id(),
          t: at(d, `${String(8 + k).padStart(2, '0')}:00`),
          kind: 'void',
          volumeMl: 200,
          urgency: null,
        })
      }
      for (let k = 0; k < p.leaks; k++) {
        ev.push({
          id: id(),
          t: at(d, `1${k}:30`),
          kind: 'leak',
          amount: 'drops',
          trigger: k === 0 ? 'no_reason' : 'activity',
          padChanged: k < p.pads,
        })
      }
      ev.push({
        id: id(),
        t: at(d, '12:00'),
        kind: 'intake',
        volumeMl: 500,
        beverage: 'alcohol',
        caffeinated: false,
      })
      ev.push({ id: id(), t: at(d, '22:00'), kind: 'bed' })
      for (let k = 0; k < p.night; k++) {
        ev.push({
          id: id(),
          t: at(nx, `0${1 + k}:00`),
          kind: 'void',
          volumeMl: 100,
          urgency: null,
        })
      }
      ev.push({ id: id(), t: at(nx, '06:00'), kind: 'wake' })
    })
    // FMV of the last closing morning.
    ev.push({
      id: id(),
      t: at('2026-11-05', '06:05'),
      kind: 'void',
      volumeMl: 350,
      urgency: null,
    })
    return ev
  }

  const s = summarizeDiary(mk())

  it('finds three complete days and no warnings', () => {
    expect(s.days.map((d) => d.complete)).toEqual([true, true, true])
    expect(s.overall.completeDays).toBe(3)
    expect(s.warnings).toEqual([])
    expect(s.overall.rangeStart).toBe('2026-11-02')
    expect(s.overall.rangeEnd).toBe('2026-11-05')
  })

  it('computes each day', () => {
    // Day 1: 24h = 4x200 (daytime non-FMV) + 0 night + FMV2 400 = 1200
    expect(s.days[0].frequency24h).toBe(5)
    expect(s.days[0].voidedVolume24hMl).toBe(1200)
    // Day 2: 5x200 + 1x100 + 500 = 1600; NUV = 100 + 500
    expect(s.days[1].frequency24h).toBe(7)
    expect(s.days[1].voidedVolume24hMl).toBe(1600)
    expect(s.days[1].nuvMl).toBe(600)
    // Day 3: 6x200 + 2x100 + 350 = 1750; NUV = 200 + 350
    expect(s.days[2].frequency24h).toBe(9)
    expect(s.days[2].voidedVolume24hMl).toBe(1750)
    expect(s.days[2].nuvMl).toBe(550)
  })

  it('averages over complete days with the stated rounding', () => {
    const o = s.overall
    expect(o.frequency24h).toBe(7)
    expect(o.daytimeVoids).toBe(6)
    expect(o.nocturiaEpisodes).toBe(1)
    expect(o.voidedVolume24hMl).toBe(1517) // (1200+1600+1750)/3 = 1516.67
    expect(o.nuvMl).toBe(517) // (400+600+550)/3 = 516.67
    expect(o.leaksTotal).toBe(2)
    expect(o.leaksStress).toBe(1) // (0+1+2)/3
    expect(o.leaksOther).toBe(1)
    expect(o.pads).toBe(1)
    expect(o.alcoholCount).toBe(1)
    expect(o.intakeMl).toBe(500)
    expect(o.caffeinatedCount).toBe(0)
  })
})

describe('units', () => {
  it('converts between mL and oz', () => {
    expect(ozToMl(1)).toBeCloseTo(29.5735, 4)
    expect(mlToOz(29.5735)).toBeCloseTo(1, 6)
  })
  it('rounds for display', () => {
    expect(roundDisplayMl(252)).toBe(250)
    expect(roundDisplayMl(253)).toBe(255)
    expect(roundDisplayOz(8.3)).toBe(8.5)
    expect(roundDisplayOz(8.2)).toBe(8)
  })
})
