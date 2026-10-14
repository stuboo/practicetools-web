import { useEffect, useState } from 'react'
import { getQuestionnaire } from '../questionnaires/registry'
import { getItem, setItem } from '../storage'
import { KEYS } from '../storageKeys'
import type { QuestionnaireResult } from '../types'
import { btnPrimary, btnSecondary } from './styles'

type Props = {
  packetId: string
  questionnaireId: string
  onFinished: () => void
}

// All questions on one page: fewer taps on a phone, easy to review.
export default function QuestionnaireModule({ packetId, questionnaireId, onFinished }: Props) {
  const q = getQuestionnaire(questionnaireId)
  const [answers, setAnswers] = useState<(number | undefined)[]>([])
  const [done, setDone] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    getItem<QuestionnaireResult>(packetId, KEYS.quid).then((saved) => {
      if (cancelled) return
      if (saved?.answers) {
        setAnswers(saved.answers)
        setDone(true)
      }
      setLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [packetId])

  if (!q) return <p>This questionnaire is not available.</p>
  if (!loaded) return null

  const complete = q.questions.every((_, i) => answers[i] !== undefined)

  const save = async () => {
    const { scores, interpretation } = q.score(answers as number[])
    const result: QuestionnaireResult = { id: 'quid', answers: answers as number[], scores, interpretation }
    await setItem(packetId, KEYS.quid, result)
    setDone(true)
    onFinished()
  }

  if (done) {
    return (
      <div>
        <p className="text-lg font-semibold text-green-800">Thank you. Your answers are saved on this device.</p>
        <p className="mt-2">Your care team will go over them with you at your visit.</p>
        <button type="button" className={`${btnSecondary} mt-6`} onClick={() => setDone(false)}>
          Change my answers
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (complete) void save()
      }}
    >
      <p>Please answer each question. There are no wrong answers.</p>
      {q.questions.map((question, qi) => (
        <fieldset key={question.id} className="mt-6">
          <legend className="font-semibold">
            {qi + 1}. {question.text}
          </legend>
          <div className="mt-2 space-y-2">
            {question.options.map((opt) => (
              <label
                key={opt.value}
                className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-gray-300 px-3 py-2 has-[:checked]:border-blue-700 has-[:checked]:bg-blue-50"
              >
                <input
                  type="radio"
                  name={`q${question.id}`}
                  value={opt.value}
                  checked={answers[qi] === opt.value}
                  onChange={() =>
                    setAnswers((prev) => {
                      const next = [...prev]
                      next[qi] = opt.value
                      return next
                    })
                  }
                  className="h-5 w-5"
                />
                <span>{opt.text}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <button type="submit" disabled={!complete} className={`${btnPrimary} mt-8 w-full`}>
        Save my answers
      </button>
      {!complete && <p className="mt-2 text-sm text-gray-600">Answer every question to continue.</p>}
    </form>
  )
}
