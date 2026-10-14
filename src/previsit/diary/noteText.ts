// Plain-text note for Epic (spec §6.5): ASCII only, no tabs, <= 80 chars/line.

import type { QuestionnaireResult } from '../types'
import type { DiarySummary } from './summary'

export const NOTE_MAX_LINE = 80

export type NoteTextOptions = {
  quid?: QuestionnaireResult | null
  patientNote?: string | null
}

const num1 = (x: number | null): string => (x === null ? 'n/a' : x.toFixed(1))
const ml = (x: number | null): string => (x === null ? 'n/a' : `${x} mL`)

/** Reduce arbitrary text to single-line printable ASCII. */
export function toAscii(text: string): string {
  return text
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—−]/g, '-')
    .replace(/…/g, '...')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7e]/g, '')
    .trim()
}

/** Word-wrap to `width`; continuation lines are indented two spaces. */
function wrap(line: string, width = NOTE_MAX_LINE): string[] {
  if (line.length <= width) return [line]
  const out: string[] = []
  let cur = ''
  for (let word of line.split(' ')) {
    while (word.length > width - 2) {
      // Hard-split an over-long token.
      if (cur) {
        out.push(cur)
        cur = ''
      }
      out.push((out.length ? '  ' : '') + word.slice(0, width - 2))
      word = word.slice(width - 2)
    }
    const prefix = out.length > 0 || cur.startsWith('  ') ? '  ' : ''
    const candidate = cur ? `${cur} ${word}` : prefix + word
    if (candidate.length > width) {
      out.push(cur)
      cur = `  ${word}`
    } else {
      cur = candidate
    }
  }
  if (cur) out.push(cur)
  return out
}

function header(summary: DiarySummary): string {
  const o = summary.overall
  const n = o.completeDays
  const days = `${n} complete ${n === 1 ? 'day' : 'days'}`
  if (!o.rangeStart || !o.rangeEnd) {
    return `PRE-VISIT BLADDER DIARY (patient-entered, ${days})`
  }
  const [, sm, sd] = o.rangeStart.split('-')
  const [ey, em, ed] = o.rangeEnd.split('-')
  return (
    `PRE-VISIT BLADDER DIARY (patient-entered, ${days}, ` +
    `${sm}/${sd}-${em}/${ed}/${ey})`
  )
}

/**
 * Data quality line. Decision: when there are no unmeasured voids and no
 * warnings it reads "all voids measured"; otherwise it lists the unmeasured
 * count (only if > 0) followed by each warning, joined with "; ". The
 * many-unmeasured warning is omitted because the count already says it.
 */
function dataQuality(summary: DiarySummary): string {
  const parts: string[] = []
  const u = summary.overall.unmeasuredVoids
  if (u > 0) parts.push(`${u} ${u === 1 ? 'void' : 'voids'} not measured`)
  for (const w of summary.warnings) {
    if (w.code === 'many_unmeasured_voids') continue
    parts.push(w.message)
  }
  return `Data quality: ${
    parts.length ? parts.join('; ') : 'all voids measured'
  }`
}

export function noteText(
  summary: DiarySummary,
  opts: NoteTextOptions = {}
): string {
  const o = summary.overall
  const lines: string[] = [header(summary)]

  lines.push(
    `24h frequency: ${num1(o.frequency24h)} ` +
      `(day ${num1(o.daytimeVoids)}, night ${num1(o.nocturiaEpisodes)})`
  )

  const npi =
    o.npiPercent === null
      ? 'n/a'
      : `${o.npiPercent}%${o.nocturnalPolyuria ? ' (nocturnal polyuria)' : ''}`
  lines.push(
    `24h voided volume: ${ml(o.voidedVolume24hMl)} | NUV: ${ml(o.nuvMl)} | ` +
      `NPI: ${npi}`
  )

  const max = o.maxVoid
    ? `${o.maxVoid.volumeMl} mL${o.maxVoid.isFmv ? ' (first morning)' : ''}`
    : 'n/a'
  lines.push(`Max voided volume: ${max} | Mean: ${ml(o.meanVoidMl)}`)

  lines.push(
    `Leaks/24h: ${num1(o.leaksTotal)} (stress ${num1(o.leaksStress)}, ` +
      `urge ${num1(o.leaksUrge)}, other ${num1(o.leaksOther)}) | ` +
      `Pads/24h: ${num1(o.pads)}`
  )
  lines.push(
    `Fluid intake/24h: ${ml(o.intakeMl)} ` +
      `(caffeinated ${num1(o.caffeinatedCount)}, ` +
      `alcohol ${num1(o.alcoholCount)})`
  )
  lines.push(dataQuality(summary))

  if (opts.quid) {
    const { SUI, UUI } = opts.quid.scores
    lines.push(
      `QUID: SUI ${SUI ?? 'n/a'}, UUI ${UUI ?? 'n/a'} -> ` +
        toAscii(opts.quid.interpretation)
    )
  }

  const note = opts.patientNote ? toAscii(opts.patientNote) : ''
  if (note) lines.push(`Patient note: "${note.replace(/"/g, "'")}"`)

  return lines.flatMap((l) => wrap(l)).join('\n')
}
