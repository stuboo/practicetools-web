import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getPacket, isDraftPacket, recommendedStartDate } from '../packets'
import { clearPacket, getItem, setItem } from '../storage'
import { KEYS } from '../storageKeys'
import type { Module } from '../types'
import { sendEventOnce } from './api'
import { countdownLabel, formatLongDate, formatShortDate, isValidIsoDate, todayLocal } from './dates'
import { DiaryModule } from './diary/DiaryModule'
import { downloadIcs } from './ics'
import InfoModule from './InfoModule'
import PatientLayout from './PatientLayout'
import QuestionnaireModule from './QuestionnaireModule'
import ShareModule from './ShareModule'
import { btnPrimary, btnSecondary } from './styles'

type Progress = {
  completed: string[]
  quid: boolean
  diaryFinished: boolean
  shared: boolean
}

const EMPTY: Progress = { completed: [], quid: false, diaryFinished: false, shared: false }

function fragmentDate(): string | null {
  const m = /(?:^#|&)d=([^&]*)/.exec(window.location.hash)
  return m && isValidIsoDate(m[1]) ? m[1] : null
}

// Routes: /p/:packetId (home) and /p/:packetId/m/:moduleId (module view).
export default function PacketPage() {
  const { packetId = '', moduleId } = useParams()
  const packet = getPacket(packetId)

  if (!packet) {
    return (
      <PatientLayout title="We couldn't find that page">
        <p>The link may be incomplete or out of date. Please check the link you were given, or contact the clinic.</p>
      </PatientLayout>
    )
  }
  return <PacketView packetId={packet.id} moduleId={moduleId} />
}

function PacketView({ packetId, moduleId }: { packetId: string; moduleId?: string }) {
  const packet = getPacket(packetId)
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [visitDate, setVisitDate] = useState<string | null>(null)
  const [progress, setProgress] = useState<Progress>(EMPTY)
  const [dateInput, setDateInput] = useState('')
  const [confirmErase, setConfirmErase] = useState(false)

  const loadProgress = useCallback(async () => {
    const [completed, quid, diaryFinished, submission] = await Promise.all([
      getItem<string[]>(packetId, KEYS.completedModules),
      getItem(packetId, KEYS.quid),
      getItem<boolean>(packetId, KEYS.diaryFinished),
      getItem(packetId, KEYS.submission),
    ])
    setProgress({
      completed: completed ?? [],
      quid: !!quid,
      diaryFinished: !!diaryFinished,
      shared: !!submission,
    })
  }, [packetId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const fromHash = fragmentDate()
      if (fromHash) await setItem(packetId, KEYS.visitDate, fromHash)
      const stored = fromHash ?? (await getItem<string>(packetId, KEYS.visitDate))
      await loadProgress()
      if (cancelled) return
      setVisitDate(stored && isValidIsoDate(stored) ? stored : null)
      setReady(true)
      void sendEventOnce(packetId, 'packet_opened')
    })()
    return () => {
      cancelled = true
    }
  }, [packetId, loadProgress])

  const isDone = (m: Module): boolean => {
    switch (m.kind) {
      case 'info':
        return progress.completed.includes(m.id)
      case 'questionnaire':
        return progress.quid
      case 'diary':
        return progress.diaryFinished
      case 'share':
        return progress.shared
    }
  }

  const markDone = async (m: Module) => {
    if (!progress.completed.includes(m.id)) {
      const next = [...progress.completed, m.id]
      await setItem(packetId, KEYS.completedModules, next)
      setProgress((p) => ({ ...p, completed: next }))
    }
    void sendEventOnce(packetId, 'module_completed', m.id)
  }

  const erase = async () => {
    await clearPacket(packetId)
    setProgress(EMPTY)
    setVisitDate(null)
    setDateInput('')
    setConfirmErase(false)
    navigate(`/p/${packetId}`, { replace: true })
  }

  const saveDate = async () => {
    if (!isValidIsoDate(dateInput)) return
    await setItem(packetId, KEYS.visitDate, dateInput)
    setVisitDate(dateInput)
  }

  const draft = isDraftPacket(packetId)
  if (!packet) return null
  if (!ready) return <PatientLayout draft={draft} />

  const mod = moduleId ? packet.modules.find((m) => m.id === moduleId) : undefined

  if (moduleId) {
    if (!mod) {
      return (
        <PatientLayout draft={draft} title="We couldn't find that step">
          <Link to={`/p/${packetId}`} className={btnPrimary}>
            Back to your steps
          </Link>
        </PatientLayout>
      )
    }
    return (
      <PatientLayout draft={draft} title={mod.title}>
        <Link to={`/p/${packetId}`} className="mb-4 inline-flex min-h-[44px] items-center font-semibold text-blue-700 underline">
          ← Back to your steps
        </Link>
        {mod.kind === 'info' && (
          <InfoModule blocks={mod.blocks} completed={isDone(mod)} onComplete={() => void markDone(mod)} />
        )}
        {mod.kind === 'questionnaire' && (
          <QuestionnaireModule
            packetId={packetId}
            questionnaireId={mod.questionnaireId}
            onFinished={() => {
              void loadProgress()
              void sendEventOnce(packetId, 'module_completed', mod.id)
            }}
          />
        )}
        {mod.kind === 'diary' && (
          <DiaryModule
            packetId={packetId}
            onFinished={() => {
              void sendEventOnce(packetId, 'diary_finished')
              void sendEventOnce(packetId, 'module_completed', mod.id)
              void loadProgress()
            }}
          />
        )}
        {mod.kind === 'share' && (
          <ShareModule
            packetId={packetId}
            packetVersion={packet.version}
            visitDate={visitDate}
            onShared={() => void loadProgress()}
          />
        )}
      </PatientLayout>
    )
  }

  return (
    <PatientLayout draft={draft} title={packet.title}>
      <p className="text-gray-700">{packet.visitLabel}</p>

      {visitDate ? (
        <section className="mt-4 rounded-lg bg-blue-50 p-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-900">Your visit</p>
          <p className="text-lg font-bold">{formatLongDate(visitDate)}</p>
          <p>{countdownLabel(visitDate)}</p>
          <button type="button" className={`${btnSecondary} mt-3`} onClick={() => downloadIcs(visitDate)}>
            Add to calendar
          </button>
        </section>
      ) : (
        <section className="mt-4 rounded-lg bg-blue-50 p-4">
          <label htmlFor="visit-date" className="font-semibold">
            When is your visit?
          </label>
          <input
            id="visit-date"
            type="date"
            value={dateInput}
            min={todayLocal()}
            onChange={(e) => setDateInput(e.target.value)}
            className="mt-2 block min-h-[44px] w-full rounded-lg border border-gray-400 px-3 text-base"
          />
          <button type="button" className={`${btnPrimary} mt-3`} disabled={!isValidIsoDate(dateInput)} onClick={() => void saveDate()}>
            Save date
          </button>
          <p className="mt-2 text-sm text-gray-700">This date is saved only on this device.</p>
        </section>
      )}

      <h2 className="mt-8 text-xl font-bold">Your steps</h2>
      <ol className="mt-3 space-y-3">
        {packet.modules.map((m) => {
          const done = isDone(m)
          return (
            <li key={m.id}>
              <Link
                to={`/p/${packetId}/m/${m.id}`}
                className="block min-h-[44px] rounded-lg border border-gray-300 p-4 hover:bg-gray-50"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="font-semibold">{m.title}</span>
                  <span className={`shrink-0 text-sm font-semibold ${done ? 'text-green-800' : 'text-gray-600'}`}>
                    {done ? 'Done' : 'To do'}
                  </span>
                </span>
                <span className="mt-1 block text-sm text-gray-700">
                  {visitDate ? `Suggested start: ${formatShortDate(recommendedStartDate(visitDate, m))}` : 'Set your visit date to see a suggested start'}
                  {m.estMinutes ? ` · about ${m.estMinutes} min` : ''}
                </span>
              </Link>
            </li>
          )
        })}
      </ol>

      <section className="mt-10 border-t border-gray-200 pt-6">
        {confirmErase ? (
          <div role="alertdialog" aria-label="Confirm erase" className="rounded-lg bg-red-50 p-4">
            <p className="font-semibold text-red-900">
              Erase everything you entered on this device? This cannot be undone. A code you already made will still
              work until it expires.
            </p>
            <div className="mt-3 flex gap-3">
              <button type="button" className={btnPrimary} onClick={() => void erase()}>
                Yes, erase
              </button>
              <button type="button" className={btnSecondary} onClick={() => setConfirmErase(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className={btnSecondary} onClick={() => setConfirmErase(true)}>
            Erase my data
          </button>
        )}
      </section>
    </PatientLayout>
  )
}

