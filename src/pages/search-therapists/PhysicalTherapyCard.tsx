import { forwardRef } from 'react'
import { TherapistType } from './types'
import { displayDomain, formatAddress, presentValue } from './referralFormat'

interface PhysicalTherapyCardProps {
  therapist: TherapistType
  /** 1-based position, mirrored by the numbered map pin. */
  position: number
  selected?: boolean
  onSelect?: (id: number) => void
}

/** The badge on a row: "6 min · 2.3 mi", or the honest estimate form. */
function driveBadge(therapist: TherapistType) {
  const miles = therapist.drive_distance_miles ?? therapist.distance
  const isEstimate =
    therapist.drive_time_source === 'estimate' ||
    therapist.drive_time_minutes === undefined

  if (isEstimate) {
    return {
      text:
        miles === undefined
          ? 'Distance unavailable'
          : `~${miles.toFixed(1)} mi straight line`,
      // A straight-line fallback says so rather than passing itself off as a
      // route, and dresses down to match.
      className: 'bg-gray-100 text-gray-600',
    }
  }
  return {
    text:
      miles === undefined
        ? `${therapist.drive_time_minutes} min`
        : `${therapist.drive_time_minutes} min · ${miles.toFixed(1)} mi`,
    className: 'bg-[#e5f3ea] text-[#0e5e2f]',
  }
}

const PhysicalTherapyCard = forwardRef<HTMLDivElement, PhysicalTherapyCardProps>(
  function PhysicalTherapyCard({ therapist, position, selected, onSelect }, ref) {
    const handleAddressClick = (event: React.MouseEvent) => {
      event.stopPropagation()
      const addressQuery = encodeURIComponent(formatAddress(therapist))
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${addressQuery}`,
        '_blank'
      )
    }

    const badge = driveBadge(therapist)
    const phone = presentValue(therapist.phone)
    const fax = presentValue(therapist.fax)
    const website = presentValue(therapist.website)
    const referralFormUrl = presentValue(therapist.referral_form_url)

    return (
      <div
        ref={ref}
        onClick={() => onSelect?.(therapist.id)}
        className={`relative flex gap-3.5 px-4 lg:px-5 py-3.5 border-b border-[#eef2f6] cursor-pointer transition-colors ${
          selected ? 'bg-[#f0f7ff]' : 'hover:bg-[#f8fafc]'
        }`}
      >
        {selected && (
          <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#2f7dd1]" />
        )}

        <span
          className={`shrink-0 w-[26px] h-[26px] mt-0.5 rounded-md flex items-center justify-center font-plexmono text-[13px] text-white ${
            selected ? 'bg-[#2f7dd1]' : 'bg-[#0f2a43]'
          }`}
        >
          {position}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2.5">
            <h2 className="flex-1 text-[15.5px] font-semibold text-[#0f2a43]">
              {therapist.name}
            </h2>
            <span
              className={`shrink-0 font-plexmono text-[12.5px] font-medium px-2 py-0.5 rounded whitespace-nowrap ${badge.className}`}
            >
              {badge.text}
            </span>
          </div>

          <p
            className="text-[13.5px] text-[#42566b] mt-0.5 hover:underline"
            onClick={handleAddressClick}
          >
            {formatAddress(therapist)}
          </p>

          <div className="flex flex-wrap gap-x-3.5 gap-y-0.5 text-[12.5px] text-[#8195a8] mt-1">
            {phone && <span>{phone}</span>}
            {fax && <span>Fax {fax}</span>}
            {website && (
              <a
                href={therapist.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                {displayDomain(website)}
              </a>
            )}
            {referralFormUrl && (
              <a
                href={referralFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2f7dd1] font-semibold hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                Referral form &darr;
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }
)

export default PhysicalTherapyCard
