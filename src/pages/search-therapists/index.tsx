import { useCallback, useEffect, useRef, useState } from 'react'
import PhysicalTherapyCard from './PhysicalTherapyCard'
import Loading from './Loading'
import ResultsMap from './ResultsMap'
import PrintHandout from './PrintHandout'
import CopyForAvsButton from './CopyForAvsButton'
import { useDebounce } from '../../hooks/useDebounce'
import { SearchMeta, SearchValidationError, TherapistType } from './types'
import PhysicalTherapistAPI from '../../api/physicaltherapist'
import { Link } from 'react-router-dom'

// Keep DEFAULT_RADIUS in step with PT_SEARCH_DEFAULT_RADIUS_MILES on the API.
// The server clamps to 1-100; the UI floor of 5 is deliberately stricter
// because a sub-5-mile pelvic floor PT search is never what a clinician wants.
const DEFAULT_RADIUS = 15
const RADIUS_STEP = 5
const MIN_RADIUS = 5
const MAX_RADIUS = 100

const ZIP_PATTERN = /^\d{5}$/

export default function SearchTherapists() {
  const [zipCode, setZipCode] = useState('')
  const debouncedValue = useDebounce<string>(zipCode, 1000)

  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [therapists, setTherapists] = useState<TherapistType[]>([])
  const [meta, setMeta] = useState<SearchMeta | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const [radius, setRadius] = useState(DEFAULT_RADIUS)
  // Matches the ZIP input's delay. Each stepper click is a search: a request
  // logged against the per-IP hourly limit, plus a spinner replacing results
  // the clinician is mid-sentence about. Waiting for the clicks to settle
  // costs a second and avoids both.
  const debouncedRadius = useDebounce(radius, 1000)

  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({})
  // Guards against a slow earlier search landing after a faster later one and
  // overwriting the results the clinician is already reading from.
  const requestId = useRef(0)

  useEffect(() => {
    const trimmed = debouncedValue.trim()
    setIsTyping(false)

    if (trimmed === '') {
      setTherapists([])
      setMeta(null)
      setErrorMessage(null)
      return
    }

    // No request at all for input that cannot be a ZIP: it would only ever
    // come back a 422, and each search can cost a billable API call.
    if (!ZIP_PATTERN.test(trimmed)) {
      setTherapists([])
      setMeta(null)
      setErrorMessage('Enter a 5-digit ZIP code')
      return
    }

    const currentRequest = ++requestId.current
    const search = async () => {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const result = await PhysicalTherapistAPI.searchTherapistsByZipCode(
          trimmed,
          debouncedRadius
        )
        if (currentRequest !== requestId.current) return
        setTherapists(result.therapists)
        setMeta(result.meta)
        setSelectedId(null)
      } catch (error) {
        if (currentRequest !== requestId.current) return
        setTherapists([])
        setMeta(null)
        setErrorMessage(
          error instanceof SearchValidationError
            ? error.message
            : 'Something went wrong loading results. Please try again.'
        )
      } finally {
        if (currentRequest === requestId.current) setIsLoading(false)
      }
    }

    search()
    // Both dependencies are debounced values, so nothing here can fire on a
    // keystroke or a stepper click.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue, debouncedRadius])

  const handleSelect = useCallback((id: number) => {
    setSelectedId(id)
    cardRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])

  const stepRadius = (direction: 1 | -1) => {
    setRadius((current) =>
      Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, current + direction * RADIUS_STEP))
    )
  }

  const hasResults = therapists.length > 0
  const showSkeleton = isLoading || isTyping
  // The server expands past the radius whenever it holds fewer than the
  // minimum number of results, which includes "one clinic was in range".
  // Saying "no locations within 15 miles" above a row reading 0.7 mi would
  // read as a bug to the clinician, so the banner counts what is actually in
  // range rather than assuming zero.
  const withinRadiusCount = meta
    ? therapists.filter(
        (therapist) =>
          (therapist.drive_distance_miles ?? therapist.distance ?? Infinity) <=
          meta.radius_requested
      ).length
    : 0

  return (
    <div className="flex flex-col font-plex">
      {/* Console toolbar: every control and action in one bar. */}
      <div className="bg-[#0f2a43] text-white print:hidden">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 lg:px-6 py-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-[#9db8d2] hover:text-white transition-colors"
          >
            <span aria-hidden="true">&larr;</span>
            <h1 className="font-semibold text-[15px] text-white">
              PT referral
            </h1>
          </Link>

          <label className="flex items-center bg-[#1b3d5e] border border-[#2d5479] rounded-lg overflow-hidden focus-within:border-[#2f7dd1] focus-within:ring-2 focus-within:ring-[#2f7dd1]">
            <span className="text-[11px] uppercase tracking-[0.08em] text-[#7ea4c8] pl-3 pr-2">
              ZIP
            </span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              value={zipCode}
              placeholder="_____"
              aria-label="Patient ZIP code"
              className="bg-transparent border-none outline-none text-white font-plexmono font-medium text-[17px] w-24 py-2 pr-3 placeholder:text-[#4a6b8c] focus:ring-0"
              onChange={(event) => {
                // Only flag typing when the value actually diverges from the
                // settled one: if the clinician types a digit and backspaces
                // it within the debounce window, the debounced value never
                // changes, the effect never re-runs, and an unconditional
                // setIsTyping(true) would leave the skeleton on forever.
                setIsTyping(event.target.value.trim() !== debouncedValue.trim())
                setZipCode(event.target.value)
              }}
            />
          </label>

          <div className="flex items-center border border-[#2d5479] rounded-lg overflow-hidden text-[13px]">
            <button
              type="button"
              aria-label="Decrease search radius"
              disabled={radius <= MIN_RADIUS}
              onClick={() => stepRadius(-1)}
              className="bg-[#1b3d5e] text-[#7ea4c8] hover:text-white w-8 h-9 text-base disabled:opacity-40"
            >
              &minus;
            </button>
            <div className="bg-[#16324f] px-3 leading-9 font-plexmono text-white">
              {radius} mi
            </div>
            <button
              type="button"
              aria-label="Increase search radius"
              disabled={radius >= MAX_RADIUS}
              onClick={() => stepRadius(1)}
              className="bg-[#1b3d5e] text-[#7ea4c8] hover:text-white w-8 h-9 text-base disabled:opacity-40"
            >
              +
            </button>
          </div>

          {meta && !showSkeleton && (
            <div className="text-[13px] text-[#9db8d2]">
              <span className="font-plexmono text-white">{therapists.length}</span>{' '}
              result{therapists.length === 1 ? '' : 's'} &middot;{' '}
              {/* Never claim drive-time ranking when the banner below is
                  simultaneously admitting the drive times are missing. */}
              {meta.degraded ? 'ranked by distance' : 'ranked by drive time'}
            </div>
          )}

          <div className="flex-1" />

          {/* Both actions freeze during a search: the state still holds the
              PREVIOUS patient's results for the debounce+fetch window, and a
              handout printed in that window would be for the wrong ZIP. */}
          <div className="flex gap-2.5">
            <CopyForAvsButton
              therapists={therapists}
              zip={meta?.zip ?? ''}
              disabled={!hasResults || showSkeleton}
            />
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!hasResults || showSkeleton}
              className="px-4 py-2 rounded-lg bg-[#2f7dd1] text-white text-[13px] font-semibold hover:bg-[#2568b0] transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              Print handout
            </button>
          </div>
        </div>
      </div>

      {errorMessage && !showSkeleton && (
        <p
          role="alert"
          className="px-4 lg:px-6 py-2.5 bg-red-50 text-red-800 text-sm font-semibold border-b border-red-100 print:hidden"
        >
          {errorMessage}
        </p>
      )}

      {meta && !showSkeleton && hasResults && (meta.expanded || meta.degraded) && (
        <div className="px-4 lg:px-6 py-2.5 bg-amber-50 border-b border-amber-100 print:hidden">
          {meta.expanded && (
            <p className="text-sm font-semibold text-amber-800">
              {withinRadiusCount === 0
                ? `No locations within ${meta.radius_requested} miles`
                : `Only ${withinRadiusCount} location${
                    withinRadiusCount === 1 ? '' : 's'
                  } within ${meta.radius_requested} miles`}{' '}
              &mdash; showing the {therapists.length} nearest.
            </p>
          )}
          {meta.degraded && (
            <p className="text-sm text-amber-700">
              Drive times unavailable &mdash; distances are straight-line.
            </p>
          )}
        </div>
      )}

      {showSkeleton && (
        <div className="lg:w-[46%] bg-white print:hidden" role="status">
          <span className="sr-only">Loading results&hellip;</span>
          {Array.from('000000').map((_, index) => (
            <Loading key={index.toString()} />
          ))}
        </div>
      )}

      {/* A search that genuinely found nothing is not the same page state as
          "nothing typed yet": the onboarding prompt under a toolbar reading
          "0 results" would contradict itself. */}
      {!showSkeleton && !hasResults && !errorMessage && meta && (
        <div className="py-24 text-center text-gray-600 text-[15px] print:hidden">
          No physical therapy locations found near {meta.zip}.
        </div>
      )}

      {!showSkeleton && !hasResults && !errorMessage && !meta && (
        <div className="py-24 text-center text-gray-600 text-[15px] print:hidden">
          Enter the patient&rsquo;s 5-digit ZIP code to find nearby pelvic floor
          physical therapy.
        </div>
      )}

      {!showSkeleton && hasResults && meta && (
        /* Map above the list when stacked, beside it on wide screens:
           exam-room displays come in both shapes. */
        <div className="flex flex-col lg:flex-row print:hidden">
          <div className="lg:w-[46%] bg-white border-r border-[#dfe6ec]">
            {therapists.map((therapist, index) => (
              <PhysicalTherapyCard
                key={therapist.id}
                therapist={therapist}
                position={index + 1}
                selected={selectedId === therapist.id}
                onSelect={handleSelect}
                ref={(node) => {
                  cardRefs.current[therapist.id] = node
                }}
              />
            ))}
          </div>

          <div className="order-first lg:order-last lg:w-[54%]">
            <div className="relative h-[320px] lg:h-screen lg:sticky lg:top-0">
              <ResultsMap
                therapists={therapists}
                meta={meta}
                selectedId={selectedId}
                onSelect={handleSelect}
              />
              <div className="absolute bottom-3.5 left-3.5 z-[500] bg-[#0f2a43]/90 text-[#cfe0ef] text-xs px-3 py-2 rounded-md pointer-events-none">
                Pins match list rank &middot;{' '}
                <span className="text-red-500">&#9670;</span> ZIP {meta.zip}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unmounted during a search so Ctrl+P cannot capture the previous
          patient's handout while the screen shows skeletons. */}
      {hasResults && meta && !showSkeleton && (
        <PrintHandout therapists={therapists} zip={meta.zip} />
      )}
    </div>
  )
}
