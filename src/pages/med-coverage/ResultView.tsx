import { useMemo, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { ClassCode, MedCovChange, MedCovPayer, MedCovPayerDetail, MedCovRow } from '../../types/medCoverage'
import { ingredientsOf, prescribeThis } from './util/prescribe'
import { ALL_LINES, ProductGroup, groupByProduct, productLines, rowsForLine } from './util/group'
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
  classCode: ClassCode | null
}

export default function ResultView({ detail, classCode }: ResultViewProps) {
  const classRows = useMemo(
    () => (classCode ? detail.rows.filter((r) => r.drug.class_code === classCode) : detail.rows),
    [detail.rows, classCode]
  )
  const years = useMemo(() => planYears(classRows), [classRows])
  const [chosenYear, setChosenYear] = useState<number | null>(null)
  const year = chosenYear != null && years.includes(chosenYear) ? chosenYear : years[0] ?? null
  const rows = rowsForYear(classRows, year)
  const lines = productLines(rows)
  const [chosenLine, setChosenLine] = useState<string>(ALL_LINES)
  const line = chosenLine === ALL_LINES || lines.includes(chosenLine) ? chosenLine : ALL_LINES
  const shownLines = lines.length > 1 ? (line === ALL_LINES ? lines : [line]) : [ALL_LINES]

  return (
    <section aria-label="Coverage result" className="flex flex-col gap-4">
      <PayerHeader payer={detail.payer} />

      {years.length > 1 && (
        <div role="group" aria-label="Plan year" className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">Plan year</span>
          {years.map((y) => (
            <button
              key={y}
              type="button"
              aria-pressed={y === year}
              onClick={() => setChosenYear(y)}
              className={`rounded-full border px-3 py-1 text-sm ${
                y === year ? 'border-blue-700 bg-blue-700 text-white' : 'border-gray-300 bg-white text-gray-800'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      )}

      {lines.length > 1 && (
        <div role="group" aria-label="Product line" className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">Product line</span>
          {[ALL_LINES, ...lines].map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={l === line}
              onClick={() => setChosenLine(l)}
              className={`rounded-full border px-3 py-1 text-sm ${
                l === line ? 'border-blue-700 bg-blue-700 text-white' : 'border-gray-300 bg-white text-gray-800'
              }`}
            >
              {l === ALL_LINES ? 'All' : l || 'Unspecified'}
            </button>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-700">
          No coverage rows are published for this payer and medication class yet.
        </p>
      ) : (
        shownLines.map((l) => {
          const lineRows = rowsForLine(rows, l)
          return (
            <div key={l} className="flex flex-col gap-4" data-testid="product-line">
              {l !== ALL_LINES && (
                <h3 className="break-words border-b border-gray-300 pb-1 text-base font-bold">
                  {l || 'Unspecified product line'}
                </h3>
              )}
              {ingredientsOf(lineRows).map((ingredient) => (
                <IngredientBlock key={ingredient} ingredient={ingredient} rows={lineRows} />
              ))}
            </div>
          )
        })
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
  return (
    <header className="flex flex-col gap-1">
      <h2 className="break-words text-xl font-bold">{plan ? plan.plan_name : payer.name}</h2>
      <p className="break-words text-sm text-gray-600">
        {plan
          ? [plan.contract_plan, plan.contract_name || plan.org_name, plan.plan_type, `Plan year ${plan.plan_year}`]
              .filter(Boolean)
              .join(' · ')
          : payer.pbm_name
          ? `Pharmacy benefit: ${payer.pbm_name}`
          : null}
      </p>
      {plan?.brown_county && <p className="text-xs text-gray-500">Serves Brown County</p>}
    </header>
  )
}

function IngredientBlock({ ingredient, rows }: { ingredient: string; rows: MedCovRow[] }) {
  const advice = prescribeThis(ingredient, rows)
  const mine = rows.filter((r) => r.drug.name === ingredient)
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
        <h3 className="text-base font-semibold capitalize">{ingredient}</h3>
        <p className="text-sm">
          <span className="font-semibold">Prescribe this: </span>
          <span data-testid="prescribe-this">{advice.text}</span>
        </p>
      </div>
      {groupByProduct(mine).map((group) => (
        <ProductBlock key={group.key} group={group} />
      ))}
    </div>
  )
}

function ProductBlock({ group }: { group: ProductGroup }) {
  if (group.uniform) {
    return <DrugCard row={group.rows[0]} title={group.label} strengths={group.strengths} />
  }
  // Strengths differ in coverage: say so and show each one.
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold">{group.label}: coverage differs by strength</p>
      {group.rows.map((row) => (
        <DrugCard key={row.id} row={row} title={row.drug.label} strengths={[]} />
      ))}
    </div>
  )
}

function StatusBadge({ row }: { row: MedCovRow }) {
  const [text, tone] =
    row.on_formulary === true
      ? [isGap(row.status_or_tier) ? 'Covered' : row.status_or_tier, 'bg-green-100 text-green-900']
      : row.on_formulary === false
      ? [isGap(row.status_or_tier) ? 'Not on formulary' : row.status_or_tier, 'bg-red-100 text-red-900']
      : ['Coverage not published', 'bg-gray-200 text-gray-800']
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>{text}</span>
}

function DrugCard({ row, title, strengths }: { row: MedCovRow; title: string; strengths: string[] }) {
  const phrases = nextSmartPhrases(row)
  const unknownDetail = row.on_formulary == null && !isGap(row.status_or_tier) ? row.status_or_tier : null
  return (
    <article
      aria-label={title}
      data-testid="drug-result"
      className="flex min-w-0 flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0">
          <h4 className="break-words font-semibold">{title}</h4>
          {strengths.length > 0 && (
            <p className="text-xs text-gray-600">
              {strengths.length > 1 ? 'Strengths' : 'Strength'}: {strengths.join(', ')}
            </p>
          )}
        </div>
        <StatusBadge row={row} />
      </div>
      {unknownDetail && <p className="text-xs text-gray-600">Payer listing: {unknownDetail}</p>}

      <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
        <Edit label="Prior auth (PA)" value={flagText(row.pa)} gap={isGap(row.pa)} />
        <Edit label="Step therapy (ST)" value={flagText(row.st)} gap={isGap(row.st)} />
        <Edit label="Quantity limit (QL)" value={quantityLimitText(row)} gap={isGap(row.ql)} />
      </dl>

      <div>
        <h5 className="text-sm font-semibold">PA criteria</h5>
        <ul className="mt-1 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
          {criteriaChecklist(row).map((c) => (
            <li key={c.label} className="flex flex-wrap gap-x-1">
              <span className="text-gray-600">{c.label}:</span>
              <span className={c.gap ? 'italic text-gray-500' : ''}>{c.value}</span>
            </li>
          ))}
        </ul>
        {!isGap(row.criteria_summary) && (
          <p className="mt-2 break-words text-sm text-gray-700">{row.criteria_summary}</p>
        )}
        {!isGap(row.notes) && <p className="mt-2 break-words text-sm text-gray-700">Note: {row.notes}</p>}
      </div>

      <div className="text-sm">
        <h5 className="font-semibold">Next step</h5>
        {phrases.length ? (
          <p className="mt-1 flex flex-wrap gap-2">
            {phrases.map((p) => (
              <code key={p} className="rounded bg-gray-100 px-1.5 py-0.5 font-plexmono text-xs">
                {p}
              </code>
            ))}
          </p>
        ) : (
          <p className="mt-1 text-gray-700">No PA or step edit published. Prescribe as usual.</p>
        )}
      </div>

      <SourceLine row={row} />
    </article>
  )
}

function Edit({ label, value, gap }: { label: string; value: string; gap: boolean }) {
  return (
    <div className="flex justify-between gap-2 rounded bg-gray-50 px-2 py-1 sm:flex-col sm:justify-start">
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
  return (
    <div>
      <h3 className="text-base font-semibold">Recent changes for this payer</h3>
      {changes.length === 0 ? (
        <p className="text-sm text-gray-600">No changes recorded yet.</p>
      ) : (
        <ul className="mt-1 flex flex-col gap-2">
          {changes.map((c) => (
            <li key={c.id} className="break-words rounded border border-gray-200 bg-white p-2 text-sm">
              <span className="font-plexmono text-xs text-gray-500">{c.date}</span> {c.summary}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
