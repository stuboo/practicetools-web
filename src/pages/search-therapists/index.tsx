import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import PhysicalTherapyCard from './PhysicalTherapyCard'
import Loading from './Loading'
import ResultsMap from './ResultsMap'
import PrintHandout from './PrintHandout'
import CopyForAvsButton from './CopyForAvsButton'
import { useDebounce } from '../../hooks/useDebounce'
import { SearchMeta, SearchValidationError, TherapistType } from './types'
import PhysicalTherapistAPI from '../../api/physicaltherapist'
import { Link } from 'react-router-dom'
import Container from '../../components/container'
import { MdOutlineFilterList } from 'react-icons/md'
import { Popover, Transition } from '@headlessui/react'
import Button from '../../components/button'
import { Slider } from '../../components/slider'
import isEqual from 'lodash/isEqual'

// 5 miles was empty for most rural ZIPs, so nearly every search fell through
// to the auto-expand path and the "showing the nearest instead" banner became
// the normal case rather than the exception it is meant to flag. Keep this in
// step with PT_SEARCH_DEFAULT_RADIUS_MILES on the API.
const DEFAULT_RADIUS_MILES = 15

// Distinct from the default: the slider floor used to be defaultFilter.radius,
// which silently made the default the *minimum* too. Matches the server's
// clamp (1-100 miles) so the UI cannot ask for something the API will reject.
const MIN_RADIUS_MILES = 1
const MAX_RADIUS_MILES = 100

const defaultFilter: {
  radius: number
} = {
  radius: DEFAULT_RADIUS_MILES,
}

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

  const [filter, setFilter] = useState(defaultFilter)
  // Matches the ZIP input's delay. A slider drag emits a change per pixel, and
  // every one of them is a search: a request logged against the per-IP hourly
  // limit, plus a spinner replacing results the clinician is mid-sentence
  // about. Waiting for the drag to settle costs a second and avoids both.
  const debouncedFilter = useDebounce(filter, 1000)

  // Live, so the Filters button lights up the moment the slider moves rather
  // than a second later.
  const isFilterApplied = !isEqual(filter, defaultFilter)

  // Settled, and the only radius the effect is allowed to see. Deriving it as
  // one primitive keeps the debounce honest: an `isFilterApplied` computed
  // from the live filter would flip false->true on the first pixel of a drag
  // and, being an effect dependency, fire a search immediately -- skipping the
  // debounce entirely for exactly the interaction it exists to protect.
  //
  // Always an explicit number, never undefined-to-mean-default: two defaults
  // that have to be kept in agreement across a network boundary is a bug
  // waiting for one of them to be edited alone.
  const searchRadius = debouncedFilter.radius

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
          searchRadius
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
    // keystroke or a slider pixel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue, searchRadius])

  const handleSelect = useCallback((id: number) => {
    setSelectedId(id)
    cardRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])

  const hasResults = therapists.length > 0
  const showSkeleton = isLoading || isTyping
  // The server expands past the radius whenever it holds fewer than the
  // minimum number of results, which includes "one clinic was in range".
  // Saying "no locations within 5 miles" above a card reading 0.7 mi would
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
    <div className="flex flex-col bg-red">
      <Container bgColor="bg-gray-100">
        <div className="h-fit py-6 lg:py-0 lg:h-48 flex flex-col justify-center items-center bg-gray-100 print:hidden">
          <div className="flex justify-start w-full mb-4">
            <Link to={'/'} className="flex items-center self-start gap-2 lg:gap-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 lg:w-6 lg:h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75"
                />
              </svg>

              <h1 className="text-md lg:text-2xl font-light">Go Back</h1>
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
            <div className="flex flex-col">
              <input
                type="text"
                inputMode="numeric"
                maxLength={5}
                value={zipCode}
                placeholder="Enter Zip"
                aria-label="Patient ZIP code"
                className="px-8 py-4 text-gray-900 text-2xl font-bold outline-4 transition-[outline] duration-200 outline-gray-600/20 focus:outline focus:rounded-md"
                onChange={(event) => {
                  setIsTyping(true)
                  setZipCode(event.target.value)
                }}
              />
              {errorMessage && !showSkeleton && (
                <p className="text-red-700 text-sm mt-2 font-semibold" role="alert">
                  {errorMessage}
                </p>
              )}
            </div>

            <Popover className="relative">
              <Popover.Button
                className={`px-8 py-4 flex gap-3 items-center  text-2xl font-bold outline-4 transition-all duration-200 outline-gray-600/20 focus:outline focus:rounded-md w-full lg:w-56  ${
                  isFilterApplied
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-900 bg-gray-200'
                }`}
              >
                <MdOutlineFilterList />
                Filters
                {/* Badge with number of filters applied */}
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full bg-white text-blue-600 transition-all duration-200 ${
                    isFilterApplied ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  1
                </div>
              </Popover.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Popover.Panel className="absolute rounded-xl bg-blue-100 z-20 mt-3 w-[400px] min-h-[300px] transform px-4 py-4 h-full shadow-xl">
                  <div className="flex flex-col h-full">
                    <div className="flex flex-col flex-grow">
                      <hr />
                      <h4 className="text-lg text-blue-900">Radius</h4>
                      <div className="flex gap-4">
                        <Slider
                          defaultValue={[defaultFilter.radius]}
                          value={[filter.radius]}
                          min={MIN_RADIUS_MILES}
                          max={MAX_RADIUS_MILES}
                          step={1}
                          componentStyle={{
                            ringOffsetBg: 'ring-offset-blue-900',
                            trackBg: 'bg-white',
                            selectedBg: 'bg-blue-900',
                            thumbBg: 'bg-blue-900',
                            thumbBorder: 'border-white',
                          }}
                          onValueChange={(value) =>
                            setFilter({
                              ...filter,
                              radius: Number(value),
                            })
                          }
                        />
                        <input
                          type="number"
                          value={filter.radius}
                          step={1}
                          min={MIN_RADIUS_MILES}
                          max={MAX_RADIUS_MILES}
                          className="block rounded-md px-4 border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 h-12 text-center w-20"
                          onChange={(e) => {
                            setFilter({
                              ...filter,
                              radius: Number(e.target.value),
                            })
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        title="Reset"
                        onClick={() => setFilter(defaultFilter)}
                      />
                      {/* <Button title="Apply" colorScheme="blue" /> */}
                    </div>
                  </div>
                </Popover.Panel>
              </Transition>
            </Popover>
          </div>
        </div>
      </Container>

      {showSkeleton && (
        <div className="px-10 py-12 grid md:grid-cols-2 gap-4 overflow-auto print:hidden">
          {Array.from('00000000').map((_, index) => (
            <Loading key={index.toString()} />
          ))}
        </div>
      )}

      {!showSkeleton && hasResults && meta && (
        <div className="px-4 lg:px-10 py-8 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              {meta.expanded && (
                <p className="text-lg font-semibold text-amber-800">
                  {withinRadiusCount === 0
                    ? `No locations within ${meta.radius_requested} miles`
                    : `Only ${withinRadiusCount} location${
                        withinRadiusCount === 1 ? '' : 's'
                      } within ${meta.radius_requested} miles`}{' '}
                  &mdash; showing the {therapists.length} nearest.
                </p>
              )}
              {meta.degraded && (
                <p className="text-sm text-gray-500">
                  Drive times unavailable &mdash; distances are straight-line.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <CopyForAvsButton therapists={therapists} zip={meta.zip} />
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-md bg-blue-700 text-white font-semibold hover:bg-blue-800 transition-colors"
              >
                Print handout
              </button>
            </div>
          </div>

          {/* Map above the cards when stacked, beside them on wide screens:
              exam-room displays come in both shapes. */}
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="h-[320px] lg:h-auto lg:w-1/2 lg:order-2">
              <div className="h-[320px] lg:h-[calc(100vh-14rem)] lg:sticky lg:top-4">
                <ResultsMap
                  therapists={therapists}
                  meta={meta}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                />
              </div>
            </div>

            <div className="lg:w-1/2 lg:order-1 flex flex-col gap-4">
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
          </div>
        </div>
      )}

      {hasResults && meta && <PrintHandout therapists={therapists} zip={meta.zip} />}
    </div>
  )
}
