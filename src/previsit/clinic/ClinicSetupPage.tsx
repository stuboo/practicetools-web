import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  getPracticeKey,
  importKeyFromJwkText,
  removePracticeKey,
} from './keystore'

type Status = 'loading' | 'present' | 'absent'

export default function ClinicSetupPage() {
  const [status, setStatus] = useState<Status>('loading')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(async () => {
    setStatus((await getPracticeKey()) ? 'present' : 'absent')
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setError(null)
    setMessage(null)
    if (!file) return
    let text = ''
    try {
      text = await file.text()
    } catch {
      setError('The file could not be read.')
    }
    if (text) {
      const result = await importKeyFromJwkText(text)
      text = ''
      if (result.ok) setMessage('Key imported on this computer.')
      else setError(result.message)
    }
    // Never keep the key file selected.
    if (fileRef.current) fileRef.current.value = ''
    await refresh()
  }

  async function onRemove() {
    setConfirmRemove(false)
    setError(null)
    const ok = await removePracticeKey()
    if (ok) setMessage('Key removed from this computer.')
    else setError('The key could not be removed.')
    await refresh()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <h1 className="text-2xl font-semibold">Pre-visit packets: clinic setup</h1>
      <p className="text-sm text-muted-foreground">
        Import the practice private key file once per workstation. It is stored
        in this browser as a non-extractable key and cannot be exported again.
      </p>

      <div className="rounded-lg border p-4 space-y-3">
        <div className="text-sm" role="status">
          {status === 'loading' && 'Checking for a key...'}
          {status === 'present' && (
            <span className="font-medium text-green-700">
              Practice key is present on this computer.
            </span>
          )}
          {status === 'absent' && (
            <span className="font-medium text-amber-700">
              No practice key on this computer.
            </span>
          )}
        </div>

        <div>
          <label htmlFor="key-file" className="block text-sm font-medium mb-1">
            Private key file (.jwk.json)
          </label>
          <input
            id="key-file"
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            onChange={(e) => void onFile(e)}
            className="block w-full text-sm"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        {message && <p className="text-sm text-green-700">{message}</p>}

        {status === 'present' &&
          (confirmRemove ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm">
                Remove the key? You will need the key file to import it again.
              </span>
              <Button variant="destructive" size="sm" onClick={() => void onRemove()}>
                Yes, remove
              </Button>
              <Button variant="outline" size="sm" onClick={() => setConfirmRemove(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setConfirmRemove(true)}>
              Remove key from this computer
            </Button>
          ))}
      </div>

      <Link to="/clinic/previsit" className="text-sm text-primary underline">
        Go to the pre-visit viewer
      </Link>
    </div>
  )
}
