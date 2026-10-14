// Bladder diary capture UI (spec §6.2). Events are stored in mL; the unit toggle
// only changes display. Every change is written through storage.ts immediately.
//
// Day rule: "Day 1" is the local calendar date of the first wake event, or of the
// first event if there is no wake event. Day N = calendar days since then + 1
// (Day 1 before anything is logged).

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DIARY_TEACHING_CARDS,
  DIARY_TEACHING_INTRO,
  DIARY_TEACHING_TITLE,
} from '../../content/diaryTeaching'
import { formatVolume } from '../../diary/units'
import { checkPersistent, getItem, setItem } from '../../storage'
import { KEYS } from '../../storageKeys'
import type { DiaryEvent, DiaryUnit } from '../../types'
import { EventForm } from './EventForm'
import { BEVERAGES, LEAK_AMOUNTS, LEAK_TRIGGERS, URGENCY_LABELS, type FormKind } from './labels'
import { diaryDayNumber, sortEvents } from './dayNumber'
import { localDateKey, newId, toLocalIso } from './time'

type StoredDiary = { events: DiaryEvent[]; unit: DiaryUnit }
type View = { name: 'home' } | { name: 'teaching' } | { name: 'form'; kind: FormKind; editing?: DiaryEvent }

function describe(e: DiaryEvent, unit: DiaryUnit): string {
  switch (e.kind) {
    case 'void': {
      const vol = e.volumeMl == null ? "Didn't measure" : formatVolume(e.volumeMl, unit)
      return `Peed, ${vol}${e.urgency != null ? `, urge ${e.urgency} (${URGENCY_LABELS[e.urgency]})` : ''}`
    }
    case 'leak': {
      const a = LEAK_AMOUNTS.find((x) => x.value === e.amount)?.label
      const t = LEAK_TRIGGERS.find((x) => x.value === e.trigger)?.label
      return `Leaked, ${a}, ${t}${e.padChanged ? ', changed pad' : ''}`
    }
    case 'intake': {
      const b = BEVERAGES.find((x) => x.value === e.beverage)?.label
      return `Drank ${b}, ${formatVolume(e.volumeMl, unit)}${e.caffeinated ? ', caffeinated' : ''}`
    }
    case 'bed':
      return 'Went to bed'
    case 'wake':
      return 'Got up'
  }
}

function timeLabel(iso: string, withDate: boolean): string {
  const d = new Date(iso)
  const t = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return withDate ? `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${t}` : t
}

function Teaching({ onDone }: { onDone: () => void }) {
  return (
    <section aria-label="How to keep your bladder diary" className="space-y-4">
      <h2 className="text-xl font-bold">{DIARY_TEACHING_TITLE}</h2>
      <p>{DIARY_TEACHING_INTRO}</p>
      {DIARY_TEACHING_CARDS.map((c) => (
        <div key={c.id} className="space-y-2 rounded-lg border p-4">
          <h3 className="font-semibold">{c.title}</h3>
          {c.paragraphs.map((p) => (
            <p key={p} className={cn('text-sm', p.startsWith('TODO-REVIEW:') && 'text-muted-foreground')}>
              {p}
            </p>
          ))}
          {c.steps && (
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {c.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          )}
        </div>
      ))}
      <p className="rounded-lg bg-muted p-3 text-sm">
        Tap "Bed" when you go to bed planning to sleep. We use your bedtime as a stand-in for when you fall
        asleep, so you do not need to note the exact moment you fall asleep.
      </p>
      <Button size="lg" className="min-h-[44px] w-full" onClick={onDone}>
        Got it
      </Button>
    </section>
  )
}

export function DiaryModule({ packetId, onFinished }: { packetId: string; onFinished?: () => void }) {
  const [loaded, setLoaded] = useState(false)
  const [events, setEvents] = useState<DiaryEvent[]>([])
  const [unit, setUnit] = useState<DiaryUnit>('ml')
  const [view, setView] = useState<View>({ name: 'home' })
  const [persistent, setPersistent] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const latest = useRef<StoredDiary>({ events: [], unit: 'ml' })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [stored, seen, ok] = await Promise.all([
        getItem<StoredDiary>(packetId, KEYS.diary),
        getItem<boolean>(packetId, KEYS.teachingSeen),
        checkPersistent(),
      ])
      if (cancelled) return
      const s = { events: stored?.events ?? [], unit: stored?.unit ?? 'ml' }
      latest.current = s
      setEvents(s.events)
      setUnit(s.unit)
      setPersistent(ok)
      if (!seen) setView({ name: 'teaching' })
      setLoaded(true)
    })()
    return () => {
      cancelled = true
    }
  }, [packetId])

  const commit = useCallback(
    (next: Partial<StoredDiary>) => {
      const s = { ...latest.current, ...next }
      latest.current = s
      setEvents(s.events)
      setUnit(s.unit)
      void setItem(packetId, KEYS.diary, s)
    },
    [packetId],
  )

  const addOrReplace = (e: DiaryEvent) => {
    const rest = latest.current.events.filter((x) => x.id !== e.id)
    commit({ events: sortEvents([...rest, e]) })
  }

  if (!loaded) return <p role="status">Loading your diary...</p>

  const now = new Date()
  const sorted = sortEvents(events)
  const todayKey = localDateKey(now)
  const shown = showAll ? sorted : sorted.filter((e) => localDateKey(new Date(e.t)) === todayKey)
  const lastBedWake = [...sorted].reverse().find((e) => e.kind === 'bed' || e.kind === 'wake')
  const nextIsWake = lastBedWake?.kind === 'bed'
  const daysLogged = new Set(sorted.map((e) => localDateKey(new Date(e.t)))).size
  const dayN = diaryDayNumber(events, now)

  function closeTeaching() {
    void setItem(packetId, KEYS.teachingSeen, true)
    setView({ name: 'home' })
  }

  if (view.name === 'teaching') {
    return (
      <div className="mx-auto max-w-md space-y-4 p-4">
        <Teaching onDone={closeTeaching} />
      </div>
    )
  }

  if (view.name === 'form') {
    return (
      <div className="mx-auto max-w-md p-4">
        <EventForm
          kind={view.kind}
          initial={view.editing}
          unit={unit}
          onCancel={() => setView({ name: 'home' })}
          onSave={(e) => {
            addOrReplace(e)
            setView({ name: 'home' })
          }}
        />
      </div>
    )
  }

  const big = 'min-h-[88px] text-lg font-semibold'

  function finish() {
    void setItem(packetId, KEYS.diaryFinished, true)
    onFinished?.()
  }

  return (
    <div className="mx-auto max-w-md space-y-5 p-4">
      {!persistent && (
        <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">
          Your browser is not saving data on this device. Your diary will be lost if you refresh or close this
          page.
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold" aria-live="polite">
          Day {dayN} of 3
        </h2>
        <button
          type="button"
          className="min-h-[44px] px-2 text-sm text-primary underline"
          onClick={() => setView({ name: 'teaching' })}
        >
          How to
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button className={big} onClick={() => setView({ name: 'form', kind: 'void' })}>
          Peed
        </Button>
        <Button className={big} onClick={() => setView({ name: 'form', kind: 'leak' })}>
          Leaked
        </Button>
        <Button className={big} onClick={() => setView({ name: 'form', kind: 'intake' })}>
          Drank
        </Button>
        <Button
          className={big}
          onClick={() =>
            addOrReplace({ id: newId(), t: toLocalIso(new Date()), kind: nextIsWake ? 'wake' : 'bed' })
          }
        >
          {nextIsWake ? 'Up' : 'Bed'}
        </Button>
      </div>

      <div role="group" aria-label="Units" className="flex items-center gap-2 text-sm">
        <span>Units:</span>
        {(['ml', 'oz'] as DiaryUnit[]).map((u) => (
          <button
            key={u}
            type="button"
            aria-pressed={unit === u}
            onClick={() => commit({ unit: u })}
            className={cn(
              'min-h-[44px] min-w-[56px] rounded-md border px-3 font-medium',
              unit === u ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
            )}
          >
            {u === 'ml' ? 'mL' : 'oz'}
          </button>
        ))}
      </div>

      <section aria-label="Entries" className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{showAll ? 'All entries' : 'Today'}</h3>
          <button
            type="button"
            className="min-h-[44px] px-2 text-sm text-primary underline"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show today only' : 'Show all days'}
          </button>
        </div>
        {shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {shown.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-2 p-3" data-testid="diary-event">
                <div className="min-w-0 flex-1 text-sm">
                  <div className="font-medium">{timeLabel(e.t, showAll)}</div>
                  <div>{describe(e, unit)}</div>
                </div>
                {confirmId === e.id ? (
                  <>
                    <Button
                      variant="destructive"
                      className="min-h-[44px]"
                      aria-label={`Confirm delete ${describe(e, unit)}`}
                      onClick={() => {
                        commit({ events: latest.current.events.filter((x) => x.id !== e.id) })
                        setConfirmId(null)
                      }}
                    >
                      Yes, delete
                    </Button>
                    <Button variant="outline" className="min-h-[44px]" onClick={() => setConfirmId(null)}>
                      Keep
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="min-h-[44px]"
                      aria-label={`Edit ${describe(e, unit)}`}
                      onClick={() => setView({ name: 'form', kind: e.kind, editing: e })}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      className="min-h-[44px]"
                      aria-label={`Delete ${describe(e, unit)}`}
                      onClick={() => setConfirmId(e.id)}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="space-y-2 border-t pt-4">
        {daysLogged < 3 && (
          <p className="text-sm text-muted-foreground">
            You have logged {daysLogged} of 3 days. You can finish now, but more days help us more.
          </p>
        )}
        <Button variant="secondary" size="lg" className="min-h-[44px] w-full" onClick={finish}>
          Finish diary
        </Button>
      </div>
    </div>
  )
}
