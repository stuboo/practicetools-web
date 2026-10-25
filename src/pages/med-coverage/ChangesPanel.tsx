import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import MedCoverageAPI from '../../api/medCoverage'
import { MedCovChange } from '../../types/medCoverage'
import { hostOf } from './util/format'

const PAGE = 10

const ORIGIN_LABEL: Record<string, string> = {
  cms: 'CMS',
  reviewed: 'Reviewed',
  seed: 'Initial data',
  system: 'Automated check',
}

export default function ChangesPanel() {
  const [payerId, setPayerId] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)

  const meta = useQuery(['medcov', 'meta'], MedCoverageAPI.getMeta, { staleTime: 5 * 60_000 })
  const all = useQuery(['medcov', 'changes', 'all'], () => MedCoverageAPI.getChanges(), {
    staleTime: 5 * 60_000,
  })
  const filtered = useQuery(
    ['medcov', 'changes', payerId],
    () => MedCoverageAPI.getChanges({ payerId: payerId ?? undefined }),
    { enabled: payerId != null, staleTime: 5 * 60_000 }
  )

  // Filter choices come from the payers that actually have changes.
  const payers = useMemo(() => {
    const seen = new Map<number, string>()
    for (const c of all.data ?? []) {
      if (c.payer_id != null && !seen.has(c.payer_id)) seen.set(c.payer_id, c.payer_name ?? `Payer ${c.payer_id}`)
    }
    return Array.from(seen, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [all.data])

  const active = payerId == null ? all : filtered
  const changes: MedCovChange[] = active.data ?? []
  const shown = showAll ? changes : changes.slice(0, PAGE)

  return (
    <section aria-labelledby="medcov-changes-heading" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 id="medcov-changes-heading" className="text-lg font-bold">
          What changed
        </h2>
        <p className="text-sm text-gray-600" data-testid="data-checked">
          {meta.data?.data_checked ? `Data checked ${meta.data.data_checked}` : 'Data checked: not available'}
        </p>
      </div>

      {payers.length > 0 && (
        <label className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:gap-2">
          <span className="text-gray-700">Payer</span>
          <select
            className="w-full min-w-0 rounded border border-gray-300 bg-white p-2 sm:w-auto"
            value={payerId ?? ''}
            onChange={(e) => setPayerId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">All payers</option>
            {payers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {active.isLoading && active.fetchStatus !== 'idle' ? (
        <p className="text-sm text-gray-600">Loading changes…</p>
      ) : active.isError ? (
        <p className="text-sm text-red-700">Changes could not be loaded.</p>
      ) : changes.length === 0 ? (
        <p className="text-sm text-gray-600">No changes recorded yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((c) => (
            <li key={c.id} className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-white p-3 text-sm">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                <span className="font-plexmono">{c.date}</span>
                {c.payer_name && <span className="font-semibold text-gray-800">{c.payer_name}</span>}
                <span className="rounded bg-gray-100 px-1.5">{ORIGIN_LABEL[c.origin] ?? c.origin}</span>
              </div>
              <p className="break-words">{c.summary}</p>
              {c.source_url && (
                <a
                  href={c.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-xs text-blue-700 underline"
                >
                  Source: {hostOf(c.source_url)}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
      {!showAll && changes.length > PAGE && (
        <button type="button" onClick={() => setShowAll(true)} className="self-start text-sm font-medium text-blue-700 underline">
          Show all {changes.length} changes
        </button>
      )}
    </section>
  )
}
