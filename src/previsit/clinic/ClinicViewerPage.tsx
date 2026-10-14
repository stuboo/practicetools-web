import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { lookupFor, normalizeCode } from '../crypto/code'
import { openEnvelope, type Envelope } from '../crypto/envelope'
import { noteText } from '../diary/noteText'
import { summarizeDiary, type DiarySummary } from '../diary/summary'
import type { DiaryEvent, SubmissionPayload } from '../types'
import { deleteSubmission, redeem } from './api'
import { getPracticeKey } from './keystore'

const GENERIC_ERROR = 'Code not found or could not be opened'

type Opened = {
  payload: SubmissionPayload
  summary: DiarySummary | null
  lookup: string
}

/** Uppercase, strip separators, and format as XXXXX-XXXXX while typing. */
function formatTyping(raw: string): string {
  const chars = raw.toUpperCase().replace(/[\s-]/g, '').slice(0, 10)
  return chars.length > 5 ? `${chars.slice(0, 5)}-${chars.slice(5)}` : chars
}

const na = (x: number | null, suffix = ''): string =>
  x === null ? 'n/a' : `${x}${suffix}`
// Clinicians always see exact mL (the note text does too), whatever unit the patient used.
const formatVolume = (ml: number): string => `${ml} mL`
const c1 = (x: number | null): string => (x === null ? 'n/a' : x.toFixed(1))
const mlText = (x: number | null): string =>
  x === null ? 'n/a' : formatVolume(x)

function timeOf(t: string): string {
  const m = /T(\d\d:\d\d)/.exec(t)
  return m ? m[1] : t
}

function describe(e: DiaryEvent): { icon: string; label: string } {
  switch (e.kind) {
    case 'void':
      return {
        icon: '\u{1F6BD}',
        label:
          `Void ${e.volumeMl === null ? '(not measured)' : formatVolume(e.volumeMl)}` +
          (e.urgency === null ? '' : `, urgency ${e.urgency}/4`),
      }
    case 'leak':
      return {
        icon: '\u{1F4A7}',
        label: `Leak (${e.amount}, ${e.trigger.replace(/_/g, '/')})${e.padChanged ? ', pad changed' : ''}`,
      }
    case 'intake':
      return {
        icon: '\u{1F964}',
        label: `Intake ${formatVolume(e.volumeMl)} ${e.beverage}${e.caffeinated ? ' (caffeinated)' : ''}`,
      }
    case 'bed':
      return { icon: '\u{1F6CF}', label: 'Bedtime' }
    case 'wake':
      return { icon: '\u2600', label: 'Wake' }
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/50 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  )
}

function SummaryCard({ summary }: { summary: DiarySummary }) {
  const o = summary.overall
  const npi =
    o.npiPercent === null
      ? 'n/a'
      : `${o.npiPercent}%${o.nocturnalPolyuria ? ' (nocturnal polyuria)' : ''}`
  return (
    <section className="rounded-lg border p-4 space-y-3" aria-label="Diary summary">
      <h2 className="text-lg font-semibold">
        Bladder diary ({o.completeDays} complete day{o.completeDays === 1 ? '' : 's'}
        {o.rangeStart && o.rangeEnd ? `, ${o.rangeStart} to ${o.rangeEnd}` : ''})
      </h2>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Stat label="24h frequency" value={c1(o.frequency24h)} />
        <Stat label="Daytime voids" value={c1(o.daytimeVoids)} />
        <Stat label="Nocturia episodes" value={c1(o.nocturiaEpisodes)} />
        <Stat label="24h voided volume" value={mlText(o.voidedVolume24hMl)} />
        <Stat label="NUV" value={mlText(o.nuvMl)} />
        <Stat label="NPI" value={npi} />
        <Stat
          label="Max voided volume"
          value={
            o.maxVoid
              ? `${formatVolume(o.maxVoid.volumeMl)}${o.maxVoid.isFmv ? ' (first morning)' : ''}`
              : 'n/a'
          }
        />
        <Stat label="Mean voided volume" value={mlText(o.meanVoidMl)} />
        <Stat
          label="Leaks/24h"
          value={`${c1(o.leaksTotal)} (stress ${c1(o.leaksStress)}, urge ${c1(o.leaksUrge)}, other ${c1(o.leaksOther)})`}
        />
        <Stat label="Pads/24h" value={c1(o.pads)} />
        <Stat label="Fluid intake/24h" value={mlText(o.intakeMl)} />
        <Stat
          label="Caffeinated / alcohol"
          value={`${c1(o.caffeinatedCount)} / ${c1(o.alcoholCount)}`}
        />
      </div>
      {o.unmeasuredVoids > 0 && (
        <p className="text-sm text-muted-foreground">
          {o.unmeasuredVoids} void{o.unmeasuredVoids === 1 ? '' : 's'} not measured
        </p>
      )}
      {summary.warnings.length > 0 && (
        <ul className="space-y-1" aria-label="Data quality warnings">
          {summary.warnings.map((w) => (
            <li
              key={w.code}
              className="rounded border border-amber-300 bg-amber-50 px-3 py-1 text-sm text-amber-900"
            >
              {w.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function DayTable({ summary }: { summary: DiarySummary }) {
  if (summary.days.length === 0) return null
  return (
    <section className="rounded-lg border p-4" aria-label="Per-day table">
      <h2 className="mb-2 text-lg font-semibold">Per day</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              {['Date', 'Day', 'Night', '24h freq', '24h vol', 'NUV', 'NPI', 'Leaks', 'Pads', 'Intake', 'Complete'].map(
                (h) => (
                  <th key={h} className="whitespace-nowrap px-2 py-1 font-medium">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {summary.days.map((d) => (
              <tr key={d.date} className="border-b last:border-0">
                <td className="px-2 py-1">{d.date}</td>
                <td className="px-2 py-1">{na(d.daytimeVoids)}</td>
                <td className="px-2 py-1">{na(d.nocturiaEpisodes)}</td>
                <td className="px-2 py-1">{na(d.frequency24h)}</td>
                <td className="px-2 py-1">{mlText(d.voidedVolume24hMl)}</td>
                <td className="px-2 py-1">{mlText(d.nuvMl)}</td>
                <td className="px-2 py-1">
                  {d.npi === null ? 'n/a' : `${Math.round(d.npi * 100)}%`}
                </td>
                <td className="px-2 py-1">{d.leaks ? d.leaks.total : 'n/a'}</td>
                <td className="px-2 py-1">{na(d.pads)}</td>
                <td className="px-2 py-1">{mlText(d.intakeMl)}</td>
                <td className="px-2 py-1">{d.complete ? 'yes' : 'no'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function EventLog({ events }: { events: DiaryEvent[] }) {
  const byDay = useMemo(() => {
    const sorted = [...events].sort((a, b) => Date.parse(a.t) - Date.parse(b.t))
    const map = new Map<string, DiaryEvent[]>()
    for (const e of sorted) {
      const day = e.t.slice(0, 10)
      map.set(day, [...(map.get(day) ?? []), e])
    }
    return [...map.entries()]
  }, [events])
  return (
    <details className="rounded-lg border p-4">
      <summary className="cursor-pointer text-lg font-semibold">
        Raw event log ({events.length})
      </summary>
      <div className="mt-3 space-y-4">
        {byDay.map(([day, evs]) => (
          <div key={day}>
            <h3 className="text-sm font-semibold">{day}</h3>
            <ul className="mt-1 border-l-2 pl-3">
              {evs.map((e) => {
                const d = describe(e)
                return (
                  <li key={e.id} className="flex gap-2 py-0.5 text-sm">
                    <span className="w-12 shrink-0 tabular-nums text-muted-foreground">
                      {timeOf(e.t)}
                    </span>
                    <span aria-hidden="true">{d.icon}</span>
                    <span>{d.label}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </details>
  )
}

function Result({
  opened,
  onClear,
}: {
  opened: Opened
  onClear: () => void
}) {
  const { payload, summary, lookup } = opened
  const [, copy] = useCopyToClipboard()
  const [copyMsg, setCopyMsg] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null)
  const quid = payload.questionnaires?.find((q) => q.id === 'quid') ?? null

  async function onCopy() {
    const text = summary
      ? noteText(summary, { quid, patientNote: payload.patientNote })
      : ''
    const ok = await copy(text)
    setCopyMsg(ok ? 'Copied.' : 'Copy failed.')
  }

  async function onDelete() {
    setConfirmDelete(false)
    try {
      await deleteSubmission(lookup)
      setDeleteMsg('Deleted from the server.')
    } catch {
      setDeleteMsg('Could not delete from the server.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => void onCopy()} disabled={!summary}>
          Copy for note
        </Button>
        {confirmDelete ? (
          <>
            <span className="text-sm">Delete this submission from the server?</span>
            <Button variant="destructive" onClick={() => void onDelete()}>
              Yes, delete
            </Button>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={() => setConfirmDelete(true)}>
            Delete from server
          </Button>
        )}
        <Button variant="ghost" onClick={onClear}>
          Clear
        </Button>
        {copyMsg && <span className="text-sm" role="status">{copyMsg}</span>}
        {deleteMsg && <span className="text-sm" role="status">{deleteMsg}</span>}
      </div>

      {summary && <SummaryCard summary={summary} />}
      {summary && <DayTable summary={summary} />}

      {payload.questionnaires && payload.questionnaires.length > 0 && (
        <section className="rounded-lg border p-4" aria-label="Questionnaires">
          <h2 className="mb-2 text-lg font-semibold">Questionnaires</h2>
          {payload.questionnaires.map((q) => (
            <div key={q.id} className="text-sm">
              <div className="font-medium">
                {q.id.toUpperCase()}: SUI {q.scores.SUI ?? 'n/a'}, UUI {q.scores.UUI ?? 'n/a'}
              </div>
              <div>{q.interpretation}</div>
            </div>
          ))}
        </section>
      )}

      {payload.patientNote && (
        <section className="rounded-lg border p-4" aria-label="Patient note">
          <h2 className="mb-2 text-lg font-semibold">Patient note</h2>
          <p className="whitespace-pre-wrap text-sm">{payload.patientNote}</p>
        </section>
      )}

      {payload.diary && payload.diary.events.length > 0 && (
        <EventLog events={payload.diary.events} />
      )}
    </div>
  )
}

export default function ClinicViewerPage() {
  const [hasKey, setHasKey] = useState<boolean | null>(null)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [opened, setOpened] = useState<Opened | null>(null)

  useEffect(() => {
    void getPracticeKey().then((k) => setHasKey(!!k))
  }, [])

  const norm = normalizeCode(input)
  const showInlineError = input.length > 0 && !norm.ok && (norm.error !== 'incomplete')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!norm.ok || busy) return
    setBusy(true)
    setFailed(false)
    setOpened(null)
    try {
      const key = await getPracticeKey()
      if (!key) throw new Error('no key')
      const lookup = await lookupFor(norm.code)
      const res = await redeem(lookup)
      const envelope = JSON.parse(res.envelope) as Envelope
      const payload = await openEnvelope(envelope, norm.code, key)
      setOpened({
        payload,
        lookup,
        summary: payload.diary ? summarizeDiary(payload.diary.events) : null,
      })
      setInput('')
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  if (hasKey === null) {
    return <div className="p-6 text-sm">Loading...</div>
  }

  if (!hasKey) {
    return (
      <div className="mx-auto max-w-2xl space-y-3 p-6">
        <h1 className="text-2xl font-semibold">Pre-visit packets</h1>
        <p>No practice key is set up on this computer.</p>
        <Link to="/clinic/previsit/setup" className="text-primary underline">
          Set up the practice key
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold">Pre-visit packets</h1>
        <Link to="/clinic/previsit/setup" className="text-sm text-primary underline">
          Key setup
        </Link>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-2">
        <label htmlFor="share-code" className="block text-sm font-medium">
          Patient share code
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="share-code"
            value={formatTyping(input)}
            onChange={(e) => {
              setInput(formatTyping(e.target.value))
              setFailed(false)
            }}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="XXXXX-XXXXX"
            aria-invalid={showInlineError}
            aria-describedby="share-code-error"
            className="w-48 rounded-md border bg-background px-3 py-2 font-mono text-lg tracking-wider"
          />
          <Button type="submit" disabled={!norm.ok || busy}>
            {busy ? 'Opening...' : 'Open'}
          </Button>
        </div>
        <div id="share-code-error" className="min-h-5 text-sm text-red-700">
          {showInlineError && !norm.ok && <span role="alert">{norm.message}</span>}
        </div>
      </form>

      {failed && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {GENERIC_ERROR}
        </p>
      )}

      {opened && <Result opened={opened} onClear={() => setOpened(null)} />}
    </div>
  )
}
