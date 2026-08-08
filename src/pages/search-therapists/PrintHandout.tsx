import { QRCodeSVG } from 'qrcode.react'
import { TherapistType } from './types'
import { HANDOUT_FOOTER, HANDOUT_TITLE, buildEntries } from './referralFormat'

interface PrintHandoutProps {
  therapists: TherapistType[]
  zip: string
}

/**
 * The sheet the patient leaves the room with.
 *
 * Rendered inline and hidden on screen rather than opened in a popup window:
 * popups get blocked, and an exam-room click that silently does nothing is
 * worse than no button. `print:` utilities and the rules in index.css hide the
 * rest of the app when the browser prints.
 *
 * No map image -- Leaflet's tiles print unreliably (background images are
 * commonly dropped) and a static map adds nothing to a decision the patient is
 * making from names and drive times.
 */
export default function PrintHandout({ therapists, zip }: PrintHandoutProps) {
  const entries = buildEntries(therapists)
  const printedOn = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div
      id="pt-print-handout"
      aria-hidden="true"
      className="hidden print:block text-black bg-white"
    >
      <header className="border-b-2 border-black pb-2 mb-4">
        <h1 className="text-xl font-bold">{HANDOUT_TITLE}</h1>
        <p className="text-sm">
          Prepared for ZIP {zip} &middot; {printedOn}
        </p>
      </header>

      <ol className="space-y-4">
        {entries.map((entry) => (
          <li
            key={entry.therapist.id}
            className="flex gap-4 items-start break-inside-avoid border-b border-gray-400 pb-3"
          >
            <span className="text-lg font-bold w-6 shrink-0">{entry.number}.</span>

            <div className="flex-grow text-sm leading-snug">
              <p className="text-base font-bold">{entry.name}</p>
              <p>{entry.address}</p>
              <p>
                {entry.phone && <span>Phone: {entry.phone}</span>}
                {entry.fax && <span className="ml-4">Fax: {entry.fax}</span>}
              </p>
              {entry.website && <p>Website: {entry.website}</p>}
              <p className="font-semibold">{entry.travel}</p>
            </div>

            <div className="shrink-0 text-center">
              {/* Free Google Maps URL scheme: no API call, no key, no billing. */}
              <QRCodeSVG value={entry.directionsUrl} size={72} level="M" />
              <p className="text-[9px] mt-1 w-[72px] leading-tight">Scan for directions</p>
            </div>
          </li>
        ))}
      </ol>

      <footer className="mt-4 text-xs">{HANDOUT_FOOTER}</footer>
    </div>
  )
}
