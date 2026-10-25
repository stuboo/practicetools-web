import { FormEvent, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import MedCoverageAPI from '../../api/medCoverage'
import { Button } from '@/components/ui/button'
import { MedCovRequestResult } from '../../types/medCoverage'
import {
  DEFAULT_STEPS,
  REQUESTS_CLOSED,
  REQUEST_CONFIRMATION,
  REQUEST_MAX_LENGTH,
  REQUEST_PLACEHOLDER,
  validateRequestName,
} from './util/request'

export default function RequestBox() {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const mutation = useMutation<MedCovRequestResult, unknown, string>(MedCoverageAPI.requestPayer)
  const result = mutation.data

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const problem = validateRequestName(name)
    setError(problem)
    if (problem) return
    mutation.mutate(name.trim())
  }

  const done = result?.status === 'requested' || result?.status === 'closed'

  return (
    <section aria-labelledby="medcov-request-heading" className="flex flex-col gap-2">
      <h2 id="medcov-request-heading" className="text-lg font-bold">
        Payer not listed?
      </h2>

      {done ? (
        <div className="flex flex-col gap-2" role="status">
          <p className="font-medium">{result.status === 'requested' ? REQUEST_CONFIRMATION : REQUESTS_CLOSED}</p>
          <DefaultSteps />
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <label htmlFor="medcov-request" className="sr-only">
              Plan or PBM name
            </label>
            <input
              id="medcov-request"
              type="text"
              value={name}
              maxLength={REQUEST_MAX_LENGTH}
              placeholder={REQUEST_PLACEHOLDER}
              autoComplete="off"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'medcov-request-error' : undefined}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError(null)
                if (mutation.data) mutation.reset()
              }}
              className="w-full min-w-0 rounded border border-gray-300 bg-white p-2 text-sm"
            />
            {(error || result?.status === 'invalid' || result?.status === 'rate_limited' || result?.status === 'error') && (
              <p id="medcov-request-error" role="alert" className="text-sm text-red-700">
                {error ??
                  (result?.status === 'invalid'
                    ? result.message
                    : result?.status === 'rate_limited'
                    ? 'Too many requests from this connection today. Try again tomorrow.'
                    : 'The request could not be sent. Try again later.')}
              </p>
            )}
          </div>
          <Button type="submit" disabled={mutation.isLoading} className="bg-blue-700 text-white hover:bg-blue-800">
            {mutation.isLoading ? 'Sending…' : 'Request'}
          </Button>
        </form>
      )}
    </section>
  )
}

function DefaultSteps() {
  return (
    <div>
      <h3 className="text-sm font-semibold">Until then</h3>
      <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
        {DEFAULT_STEPS.map((step) => (
          <li key={step} className="break-words">
            {step}
          </li>
        ))}
      </ol>
    </div>
  )
}
