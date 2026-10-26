import { useMemo, useState } from 'react'
import { ChevronRight, ExternalLink } from 'lucide-react'
import { Flag, MedCovChange, MedCovPayer, MedCovPayerDetail, MedCovRow } from '../../types/medCoverage'
import { productLines, rowsForLine } from './util/group'
import { DEFAULT_CLASS_ORDER, SummaryItem, displayName, summarize, summaryItems } from './util/summary'
import { CatalogueDrug, buildHeatmap } from './util/heatmap'
import Heatmap from './Heatmap'
import {
  PORTAL_DISCLAIMER,
  criteriaChecklist,
  dateText,
  flagText,
  hostOf,
  isGap,
  nextSmartPhrases,
  planYears,
  quantityLimitText,
  rowsForYear,
} from './util/format'

interface ResultViewProps {
  detail: MedCovPayerDetail
  /** Class codes in display order (from /v1/classes); beta-3s first by default. */
  classOrder?: string[]
  /** Newest CMS release plan year (/v1/meta cms_release.plan_year). */
  currentPlanYear?: number | null
  /** Every drug in /v1/classes, so the heatmap can tell "no data" from "no such product". */
  catalogue?: CatalogueDrug[]
}

function itemDomId(key: string): string {
  return `medcov-item-${key}`
}

const HIGHLIGHT_CLASS = 'medcov-yft'
const HIGHLIGHT_MS = 2000
const highlightTimers = new WeakMap<Element, number>()

/**
 * Yellow fade on a detail pane. Removing the class and forcing a reflow
 * before re-adding it restarts the animation, so a second tap on the same
 * product fades again. The class is dropped after the fade, which also ends
 * the static outline used under prefers-reduced-motion.
 */
function flash(el: HTMLElement) {
  el.classList.remove(HIGHLIGHT_CLASS)
  void el.offsetWidth
  el.classList.add(HIGHLIGHT_CLASS)
  const previous = highlightTimers.get(el)
  if (previous) window.clearTimeout(previous)
  highlightTimers.set(el, window.setTimeout(() => el.classList.remove(HIGHLIGHT_CLASS), HIGHLIGHT_MS))
}

/** Open a product's detail in the list, bring it into view, and flash it. */
function openItem(key: string) {
  const el = document.getElementById(itemDomId(key))
  if (!el) return
  const details = el.querySelector('details')
  if (details) details.open = true
  el.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
  const pane = el.querySelector<HTMLElement>('[data-testid="drug-result"]')
  if (pane) flash(pane)
}

const BUCKET_TONE: Record<string, string> = {
  open: 'border-green-300 bg-green-50 text-green-900',
  restricted: 'border-amber-300 bg-amber-50 text-amber-900',
  not_covered: 'border-red-300 bg-red-50 text-red-900',
  unknown: 'border-gray-300 bg-gray-100 text-gray-800',
}

export default function ResultView({
  detail,
  classOrder = DEFAULT_CLASS_ORDER,
  currentPlanYear = null,
  catalogue = [],
}: ResultViewProps) {
  const years = useMemo(() => planYears(detail.rows), [detail.rows])
  const [chosenYear, setChosenYear] = useState<number | null>(null)
  const year = chosenYear != null && years.includes(chosenYear) ? chosenYear : years[0] ?? null
  const yearRows = rowsForYear(detail.rows, year)
  const lines = productLines(yearRows)
  const [chosenLine, setChosenLine] = useState<string | null>(null)
  const line = chosenLine != null && lines.includes(chosenLine) ? chosenLine : lines[0] ?? ''
  const rows = lines.length > 1 ? rowsForLine(yearRows, line) : yearRows
  const buckets = summarize(rows, classOrder)
  const heatRows = rows.length ? buildHeatmap(summaryItems(rows), catalogue) : []

  return (
    <section aria-label="Coverage result" className="flex flex-col gap-3">
      <PayerHeader payer={detail.payer} />
      {detail.payer.plan && currentPlanYear != null && years.length > 0 && years[0] < currentPlanYear && (
        <p role="status" data-testid="stale-plan-year" className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-sm text-amber-900">
          This plan has no {currentPlanYear} version in CMS data. Showing {year ?? years[0]}.
        </p>
      )}

      {(years.length > 1 || lines.length > 1) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {years.length > 1 && (
            <div role="group" aria-label="Plan year" className="flex items-center gap-1">
              <span className="text-gray-600">Year</span>
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  aria-pressed={y === year}
                  onClick={() => setChosenYear(y)}
                  className={`rounded-full border px-2.5 py-0.5 ${
                    y === year ? 'border-blue-700 bg-blue-700 text-white' : 'border-gray-300 bg-white text-gray-800'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
          {lines.length > 1 && (
            <label className="flex min-w-0 max-w-full items-center gap-1">
              <span className="shrink-0 text-gray-600">Product line</span>
              <select
                aria-label="Product line"
                value={line}
                onChange={(e) => setChosenLine(e.target.value)}
                className="min-w-0 max-w-full rounded border border-gray-300 bg-white px-1 py-0.5"
              >
                {lines.map((l) => (
                  <option key={l} value={l}>
                    {l || 'Unspecified'}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white p-3 text-sm text-gray-700">
          No coverage rows are published for this payer yet.
        </p>
      ) : (
        <>
          <Heatmap rows={heatRows} onOpen={openItem} />

          {buckets.map((bucket) => (
            <div key={bucket.availability} data-testid={`bucket-${bucket.availability}`} className="flex flex-col gap-1">
              <h3 className={`rounded-md border px-2 py-1 text-sm font-semibold ${BUCKET_TONE[bucket.availability]}`}>
                {bucket.label} <span className="font-normal">({bucket.items.length})</span>
              </h3>
              <ul className="flex flex-col divide-y divide-gray-200 rounded-md border border-gray-200 bg-white">
                {bucket.items.map((item) => (
                  <ProductLine key={item.key} item={item} />
                ))}
              </ul>
            </div>
          ))}
        </>
      )}

      <RecentChanges changes={detail.changes.slice(0, 3)} />

      <p role="note" className="rounded-lg bg-amber-50 p-3 text-sm font-medium text-amber-900">
        {PORTAL_DISCLAIMER}
      </p>
    </section>
  )
}

function PayerHeader({ payer }: { payer: MedCovPayer }) {
  const plan = payer.plan
  const meta = plan
    ? [plan.contract_plan, plan.contract_name || plan.org_name, plan.plan_type].filter(Boolean).join(' · ')
    : payer.pbm_name
    ? `Pharmacy benefit: ${payer.pbm_name}`
    : ''
  return (
    <header className="min-w-0">
      <h2 className="break-words text-lg font-bold leading-tight">{plan ? plan.plan_name : payer.name}</h2>
      {meta && <p className="break-words text-xs text-gray-600">{meta}</p>}
    </header>
  )
}

function EditBadge({ label, flag }: { label: string; flag: Flag | null }) {
  if (flag === 'N') return null
  if (flag === 'Y') {
    return <span className="rounded bg-amber-200 px-1 text-[11px] font-semibold text-amber-950">{label}</span>
  }
  return (
    <span title={`${label} not published`} className="rounded border border-gray-300 px-1 text-[11px] text-gray-500">
      {label}?
    </span>
  )
}

function ProductLine({ item }: { item: SummaryItem }) {
  const showEdits = item.availability !== 'not_covered'
  return (
    <li data-testid="product-line-item" id={itemDomId(item.key)}>
      <details className="group">
        <summary className="flex cursor-pointer list-none items-start gap-2 px-2 py-2 [&::-webkit-details-marker]:hidden">
          <ChevronRight
            className="mt-0.5 h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-90"
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1">
            <span className="block break-words text-sm font-medium">
              {item.name}
              {item.strengths.length > 0 && (
                <span className="font-normal text-gray-500"> {item.strengths.join(', ')}</span>
              )}
            </span>
            {item.tier && <span className="block break-words text-xs text-gray-600">{item.tier}</span>}
          </span>
          {showEdits && (
            <span className="flex shrink-0 items-center gap-1 pt-0.5">
              <EditBadge label="PA" flag={item.pa} />
              <EditBadge label="ST" flag={item.st} />
              <EditBadge label="QL" flag={item.ql} />
            </span>
          )}
        </summary>
        <ProductDetail row={item.row} />
      </details>
    </li>
  )
}

function ProductDetail({ row }: { row: MedCovRow }) {
  const phrases = nextSmartPhrases(row)
  return (
    <div data-testid="drug-result" className="flex min-w-0 flex-col gap-3 border-t border-gray-100 bg-gray-50 px-3 py-3 text-sm">
      <p className="text-xs text-gray-600">
        {displayName(row.drug.label, row.drug.product, row.drug.name)}
        {!isGap(row.status_or_tier) && <> · Payer listing: {row.status_or_tier}</>}
      </p>
      <dl className="grid grid-cols-1 gap-1 sm:grid-cols-3">
        <Edit label="Prior auth (PA)" value={flagText(row.pa)} gap={isGap(row.pa)} />
        <Edit label="Step therapy (ST)" value={flagText(row.st)} gap={isGap(row.st)} />
        <Edit label="Quantity limit (QL)" value={quantityLimitText(row)} gap={isGap(row.ql)} />
      </dl>

      <div>
        <h5 className="font-semibold">PA criteria</h5>
        <ul className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2">
          {criteriaChecklist(row).map((c) => (
            <li key={c.label} className="flex flex-wrap gap-x-1">
              <span className="text-gray-600">{c.label}:</span>
              <span className={c.gap ? 'italic text-gray-500' : ''}>{c.value}</span>
            </li>
          ))}
        </ul>
        {!isGap(row.criteria_summary) && <p className="mt-2 break-words text-gray-700">{row.criteria_summary}</p>}
        {!isGap(row.notes) && <p className="mt-2 break-words text-gray-700">Note: {row.notes}</p>}
      </div>

      <div>
        <h5 className="font-semibold">Next step</h5>
        {phrases.length ? (
          <p className="mt-1 flex flex-wrap gap-2">
            {phrases.map((p) => (
              <code key={p} className="rounded bg-white px-1.5 py-0.5 font-plexmono text-xs">
                {p}
              </code>
            ))}
          </p>
        ) : (
          <p className="mt-1 text-gray-700">No PA or step edit published. Prescribe as usual.</p>
        )}
      </div>

      <SourceLine row={row} />
    </div>
  )
}

function Edit({ label, value, gap }: { label: string; value: string; gap: boolean }) {
  return (
    <div className="flex justify-between gap-2 rounded bg-white px-2 py-1 sm:flex-col sm:justify-start">
      <dt className="text-gray-600">{label}</dt>
      <dd className={gap ? 'italic text-gray-500' : 'font-medium'}>{value}</dd>
    </div>
  )
}

function SourceLine({ row }: { row: MedCovRow }) {
  const source = row.source
  const extra = Array.from(new Set(source?.urls ?? [])).filter((u) => u && u !== source?.url)
  if (!source) {
    return (
      <p data-testid="source-line" className="text-xs text-gray-500">
        Source: not recorded · Document date: Not published · Last checked: Not published
      </p>
    )
  }
  return (
    <p data-testid="source-line" className="break-words text-xs text-gray-500">
      Source:{' '}
      <a
        href={source.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-0.5 text-blue-700 underline"
      >
        {hostOf(source.url)}
        <ExternalLink className="h-3 w-3" aria-hidden="true" />
      </a>{' '}
      · Document date: {dateText(source.doc_date)} · Last checked: {dateText(source.last_checked)}
      {!isGap(row.formulary_name) && <> · Formulary: {row.formulary_name}</>}
      {extra.length > 0 && (
        <>
          {' '}
          · Also:{' '}
          {extra.map((url, i) => (
            <span key={url}>
              {i > 0 && ', '}
              <a href={url} target="_blank" rel="noreferrer" className="text-blue-700 underline">
                {hostOf(url)}
              </a>
            </span>
          ))}
        </>
      )}
    </p>
  )
}

function RecentChanges({ changes }: { changes: MedCovChange[] }) {
  if (changes.length === 0) {
    return <p className="text-sm text-gray-600">Recent changes: no changes recorded yet.</p>
  }
  return (
    <details className="rounded-md border border-gray-200 bg-white text-sm">
      <summary className="cursor-pointer px-2 py-2 font-semibold">Recent changes ({changes.length})</summary>
      <ul className="flex flex-col gap-1 border-t border-gray-100 px-2 py-2">
        {changes.map((c) => (
          <li key={c.id} className="break-words">
            <span className="font-plexmono text-xs text-gray-500">{c.date}</span> {c.summary}
          </li>
        ))}
      </ul>
    </details>
  )
}
