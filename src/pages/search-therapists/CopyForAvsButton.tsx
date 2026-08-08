import { useEffect, useRef, useState } from 'react'
import { TherapistType } from './types'
import { buildAvsText } from './referralFormat'

interface CopyForAvsButtonProps {
  therapists: TherapistType[]
  zip: string
}

/**
 * Puts the result list on the clipboard as plain text for Epic's AVS.
 *
 * Only `text/plain` is written -- never `text/html`. Epic's AVS and SmartText
 * editors mangle pasted markup, fonts and styles, and the paste has to land
 * identically whichever field in Hyperspace it goes into.
 *
 * The Clipboard API needs a secure context and can be denied by permissions,
 * so a failure falls back to a selectable textarea rather than leaving the
 * clinician with a button that did nothing.
 */
export default function CopyForAvsButton({ therapists, zip }: CopyForAvsButtonProps) {
  const [copied, setCopied] = useState(false)
  const [fallbackText, setFallbackText] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  useEffect(() => {
    if (fallbackText === null) return
    textareaRef.current?.focus()
    textareaRef.current?.select()
  }, [fallbackText])

  const handleCopy = async () => {
    const text = buildAvsText(therapists, zip)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      setFallbackText(text)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        disabled={therapists.length === 0}
        className="px-4 py-2 rounded-md border-2 border-gray-800 font-semibold text-gray-900 hover:bg-gray-800 hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        {copied ? 'Copied ✓' : 'Copy for AVS'}
      </button>

      {fallbackText !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 print:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Copy referral text"
          onClick={() => setFallbackText(null)}
        >
          <div
            className="bg-white rounded-md p-4 w-full max-w-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="mb-2 font-semibold">
              Copy this text manually (press Ctrl/Cmd + C):
            </p>
            <textarea
              ref={textareaRef}
              readOnly
              value={fallbackText}
              rows={16}
              className="w-full border border-gray-400 rounded p-2 font-mono text-sm"
            />
            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={() => setFallbackText(null)}
                className="px-4 py-2 rounded-md bg-gray-800 text-white font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
