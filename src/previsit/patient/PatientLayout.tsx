import { useEffect, useState, type ReactNode } from 'react'
import { checkPersistent, isPersistent } from '../storage'

type Props = {
  children?: ReactNode
  draft?: boolean
  title?: string
}

// Minimal patient shell: no site nav, 16px gutters, readable type.
export default function PatientLayout({ children, draft = false, title }: Props) {
  const [persistent, setPersistent] = useState(true)

  useEffect(() => {
    let cancelled = false
    checkPersistent().then((p) => {
      if (!cancelled) setPersistent(p)
    })
    // A failed write later flips isPersistent(); re-check occasionally.
    const timer = setInterval(() => setPersistent(isPersistent()), 3000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {draft && (
        <div role="status" className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-900">
          Draft content
        </div>
      )}
      {!persistent && (
        <div role="alert" className="bg-red-100 px-4 py-3 text-sm font-medium text-red-900">
          Your entries can't be saved on this device and will be lost if you refresh
        </div>
      )}
      <main className="mx-auto w-full max-w-xl px-4 py-6 text-base leading-relaxed">
        {title && <h1 className="mb-4 text-2xl font-bold leading-tight">{title}</h1>}
        {children}
      </main>
    </div>
  )
}
