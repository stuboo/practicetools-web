import { useState } from 'react'
import { HeatChip, HeatRow, HeatSort, HeatTone, sortHeatmap } from './util/heatmap'
import { CNS_BADGE } from './util/cns'

// Light and dark pairs; every pair keeps body text above 4.5:1.
const TONE_CLASS: Record<HeatTone, string> = {
  green: 'bg-green-100 text-green-950 border-green-400 dark:bg-green-900 dark:text-green-50 dark:border-green-600',
  amber: 'bg-amber-100 text-amber-950 border-amber-400 dark:bg-amber-900 dark:text-amber-50 dark:border-amber-600',
  red: 'bg-red-100 text-red-950 border-red-400 dark:bg-red-900 dark:text-red-50 dark:border-red-600',
  grey: 'bg-gray-100 text-gray-900 border-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600',
}

const LEGEND: [HeatTone, string][] = [
  ['green', 'Covered, no PA or step'],
  ['amber', 'PA or step therapy'],
  ['red', 'Not covered'],
  ['grey', 'Not published'],
]

interface HeatmapProps {
  rows: HeatRow[]
  /** Open and scroll to a product in the list below. */
  onOpen: (itemKey: string) => void
}

export default function Heatmap({ rows, onOpen }: HeatmapProps) {
  const [sort, setSort] = useState<HeatSort>('cns')
  const sorted = sortHeatmap(rows, sort)
  if (rows.length === 0) return null

  return (
    <section aria-label="Coverage heatmap" data-testid="heatmap" className="flex flex-col gap-2">
      <div role="group" aria-label="Sort medications" className="flex flex-wrap items-center gap-1 text-xs">
        <span className="text-gray-600 dark:text-gray-300">Sort</span>
        {([
          ['cns', 'CNS activity (low → high)'],
          ['coverage', 'Coverage (best first)'],
        ] as [HeatSort, string][]).map(([mode, text]) => (
          <button
            key={mode}
            type="button"
            aria-pressed={sort === mode}
            onClick={() => setSort(mode)}
            className={`rounded-full border px-2 py-0.5 ${
              sort === mode ? 'border-blue-700 bg-blue-700 text-white' : 'border-gray-300 bg-white text-gray-800'
            }`}
          >
            {text}
          </button>
        ))}
      </div>

      <div role="table" aria-label="OAB medication coverage" className="overflow-hidden rounded-md border border-gray-200 bg-white text-xs dark:border-gray-700 dark:bg-gray-900">
        <div role="row" className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)] gap-1 border-b border-gray-200 bg-gray-50 px-1.5 py-1 font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
          <span role="columnheader">Medication · CNS</span>
          <span role="columnheader">Generic</span>
          <span role="columnheader">Brand</span>
        </div>
        {sorted.map((row) => {
          const first = [...(row.generic ?? []), ...(row.brand ?? [])].find((c) => c.itemKey)
          return (
            <div
              role="row"
              key={row.key}
              data-testid="heat-row"
              className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)] items-start gap-1 border-b border-gray-100 px-1.5 py-1 last:border-b-0 dark:border-gray-800"
            >
              <span role="rowheader" className="flex min-w-0 flex-col items-start gap-0.5">
                <button
                  type="button"
                  disabled={!first}
                  onClick={() => first?.itemKey && onOpen(first.itemKey)}
                  className="break-words text-left font-medium text-gray-900 disabled:cursor-default dark:text-gray-100"
                >
                  {row.label}
                </button>
                <span
                  data-testid="cns-level"
                  className="rounded border border-gray-300 px-1 text-[10px] text-gray-700 dark:border-gray-600 dark:text-gray-300"
                  title={row.level ? `CNS activity: ${row.level}` : 'CNS activity not rated'}
                >
                  CNS {row.level ? CNS_BADGE[row.level] : '?'}
                </span>
              </span>
              <Cell chips={row.generic} onOpen={onOpen} />
              <Cell chips={row.brand} onOpen={onOpen} />
            </div>
          )
        })}
      </div>

      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-700 dark:text-gray-300">
        {LEGEND.map(([tone, text]) => (
          <span key={tone} className="inline-flex items-center gap-1">
            <span aria-hidden="true" className={`inline-block h-3 w-3 rounded-sm border ${TONE_CLASS[tone]}`} />
            {text}
          </span>
        ))}
        <span>— no such product</span>
        <span>Tap a medication for details.</span>
      </p>
    </section>
  )
}

function Cell({ chips, onOpen }: { chips: HeatChip[] | null; onOpen: (itemKey: string) => void }) {
  if (!chips) {
    return (
      <span role="cell" className="px-1 py-1 text-gray-400" aria-label="No such product">
        —
      </span>
    )
  }
  return (
    <span role="cell" className="flex min-w-0 flex-col gap-0.5">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          data-testid="heat-chip"
          data-tone={chip.tone}
          disabled={!chip.itemKey}
          onClick={() => chip.itemKey && onOpen(chip.itemKey)}
          className={`flex min-w-0 flex-col items-start rounded border px-1 py-0.5 text-left disabled:cursor-default ${TONE_CLASS[chip.tone]}`}
        >
          <span className="w-full break-words font-medium leading-tight">{chip.label}</span>
          <span className="flex flex-wrap gap-x-1 text-[10px] leading-tight">
            <span className="font-semibold">{chip.status}</span>
            {chip.marks.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </span>
        </button>
      ))}
    </span>
  )
}
