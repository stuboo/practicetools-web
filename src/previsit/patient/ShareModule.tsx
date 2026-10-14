import { useEffect, useState } from 'react'
import { generateCode, lookupFor } from '../crypto/code'
import { sealEnvelope } from '../crypto/envelope'
import { getItem, setItem } from '../storage'
import { KEYS } from '../storageKeys'
import type { DiaryEvent, DiaryUnit, QuestionnaireResult, SubmissionPayload } from '../types'
import { submitEnvelope } from './api'
import { downloadIcs } from './ics'
import { readPublicKey } from './publicKey'
import { btnPrimary, btnSecondary } from './styles'

type Diary = { events: DiaryEvent[]; unit: DiaryUnit }
type Submission = { code: string; expiresAt: string; createdAt: string }

const NOTE_MAX = 500

type Status =
  | { s: 'idle' }
  | { s: 'working' }
  | { s: 'offline' }
  | { s: 'error'; message: string }

type Props = {
  packetId: string
  packetVersion: number
  visitDate: string | null
  onShared: () => void
}

export default function ShareModule({ packetId, packetVersion, visitDate, onShared }: Props) {
  const [loaded, setLoaded] = useState(false)
  const [diary, setDiary] = useState<Diary | undefined>()
  const [quid, setQuid] = useState<QuestionnaireResult | undefined>()
  const [note, setNote] = useState('')
  const [submission, setSubmission] = useState<Submission | undefined>()
  const [reshare, setReshare] = useState(false)
  const [status, setStatus] = useState<Status>({ s: 'idle' })

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getItem<Diary>(packetId, KEYS.diary),
      getItem<QuestionnaireResult>(packetId, KEYS.quid),
      getItem<string>(packetId, KEYS.patientNote),
      getItem<Submission>(packetId, KEYS.submission),
    ]).then(([d, q, n, s]) => {
      if (cancelled) return
      setDiary(d)
      setQuid(q)
      setNote(n ?? '')
      setSubmission(s)
      setLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [packetId])

  if (!loaded) return null

  const events = diary?.events ?? []
  const days = new Set(events.map((e) => e.t.slice(0, 10))).size
  const count = (k: DiaryEvent['kind']) => events.filter((e) => e.kind === k).length
  const nothingToSend = events.length === 0 && !quid

  const create = async () => {
    setStatus({ s: 'working' })
    const jwk = readPublicKey()
    if (!jwk) {
      setStatus({
        s: 'error',
        message: 'Sharing is not set up yet (missing configuration). Please tell the clinic.',
      })
      return
    }
    const trimmed = note.trim().slice(0, NOTE_MAX)
    const payload: SubmissionPayload = {
      schema: 'previsit-submission/v1',
      packetId,
      packetVersion,
      createdAt: new Date().toISOString(),
      ...(events.length > 0 && diary ? { diary: { events: diary.events, unit: diary.unit } } : {}),
      ...(quid ? { questionnaires: [quid] } : {}),
      ...(trimmed ? { patientNote: trimmed } : {}),
    }
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        const code = generateCode()
        const envelope = await sealEnvelope(payload, code, jwk)
        const lookup = await lookupFor(code)
        const res = await submitEnvelope(lookup, envelope)
        if (res.ok) {
          const saved: Submission = { code, expiresAt: res.expiresAt, createdAt: payload.createdAt }
          await setItem(packetId, KEYS.submission, saved)
          setSubmission(saved)
          setReshare(false)
          setStatus({ s: 'idle' })
          onShared()
          return
        }
        if (res.reason === 'conflict' && attempt === 0) continue
        if (res.reason === 'offline') {
          setStatus({ s: 'offline' })
          return
        }
        setStatus({
          s: 'error',
          message:
            res.reason === 'rate_limited'
              ? 'Lots of people are using this right now. Your entries are still saved. Please try again in a few minutes.'
              : 'Something went wrong. Your entries are still saved. Please try again.',
        })
        return
      }
    } catch {
      setStatus({ s: 'error', message: 'Something went wrong. Your entries are still saved. Please try again.' })
    }
  }

  if (submission && !reshare) {
    return (
      <div className="text-center">
        <p className="text-lg font-semibold">Bring this to your visit</p>
        <p
          aria-label="Your share code"
          className="my-4 select-all rounded-lg bg-gray-100 px-2 py-6 font-mono text-4xl font-bold tracking-wider"
        >
          {submission.code}
        </p>
        <p className="text-sm text-gray-600">
          Show or read this code to your care team. Only your care team can open what you shared.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          {visitDate && (
            <button type="button" className={btnPrimary} onClick={() => downloadIcs(visitDate)}>
              Add to calendar
            </button>
          )}
          <button type="button" className={btnSecondary} onClick={() => setReshare(true)}>
            I changed something: create a new code
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold">What will be sent</h2>
      <ul className="mt-3 space-y-2">
        <li>
          Bladder diary:{' '}
          {events.length > 0
            ? `${events.length} entries over ${days} ${days === 1 ? 'day' : 'days'} (${count('void')} voids, ${count('leak')} leaks, ${count('intake')} drinks)`
            : 'nothing logged yet'}
        </li>
        <li>Bladder questionnaire: {quid ? 'done' : 'not done'}</li>
      </ul>
      <label className="mt-6 block font-semibold" htmlFor="patient-note">
        Anything else you want your care team to know? (optional)
      </label>
      <textarea
        id="patient-note"
        value={note}
        maxLength={NOTE_MAX}
        rows={4}
        onChange={(e) => {
          setNote(e.target.value)
          void setItem(packetId, KEYS.patientNote, e.target.value)
        }}
        className="mt-1 w-full rounded-lg border border-gray-400 p-3 text-base"
      />
      <p className="text-right text-sm text-gray-600">
        {note.length}/{NOTE_MAX}
      </p>
      <p className="mt-2 text-sm text-gray-700">
        Your answers are locked on this device before they are sent. Only your care team can open them, using your code.
        Do not put your name or other identifying details in the note.
      </p>
      {nothingToSend && (
        <p className="mt-3 text-sm text-amber-900">You have not entered anything yet. You can still create a code.</p>
      )}
      <button
        type="button"
        className={`${btnPrimary} mt-6 w-full`}
        disabled={status.s === 'working'}
        onClick={() => void create()}
      >
        {status.s === 'working' ? 'Creating…' : 'Create my code'}
      </button>
      {reshare && (
        <button type="button" className={`${btnSecondary} mt-3 w-full`} onClick={() => setReshare(false)}>
          Keep my current code
        </button>
      )}
      {status.s === 'offline' && (
        <p role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-amber-900">
          Try again when connected. Your entries are still saved on this device.
        </p>
      )}
      {status.s === 'error' && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-red-900">
          {status.message}
        </p>
      )}
    </div>
  )
}
