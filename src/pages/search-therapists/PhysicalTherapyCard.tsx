import { forwardRef } from 'react'
import { TherapistType } from './types'
import {
  displayDomain,
  formatAddress,
  formatDistanceBadge,
  presentValue,
  safeUrl,
} from './referralFormat'

interface PhysicalTherapyCardProps {
  therapist: TherapistType
  /** 1-based position, mirrored by the numbered map pin. */
  position: number
  selected?: boolean
  onSelect?: (id: number) => void
}

const PhysicalTherapyCard = forwardRef<HTMLDivElement, PhysicalTherapyCardProps>(
  function PhysicalTherapyCard({ therapist, position, selected, onSelect }, ref) {
    const handleAddressClick = (event: React.MouseEvent) => {
      event.stopPropagation()
      const addressQuery = encodeURIComponent(formatAddress(therapist))
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${addressQuery}`,
        '_blank',
        'noopener,noreferrer'
      )
    }

    const badge = formatDistanceBadge(therapist)
    const phone = presentValue(therapist.phone)
    const fax = presentValue(therapist.fax)
    const email = presentValue(therapist.email)
    const websiteUrl = safeUrl(therapist.website)
    const referralFormUrl = safeUrl(therapist.referral_form_url)

    // The container is a plain mouse click target; the rank badge is the
    // keyboard-accessible select control. A role="button" container would
    // wrap the address button and links in another button, which ARIA
    // forbids and screen readers mis-expose.
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

        <button
          type="button"
          aria-label={`Select result ${position}: ${therapist.name}`}
          aria-pressed={selected}
          onClick={(event) => {
            event.stopPropagation()
            onSelect?.(therapist.id)
          }}
          className={`shrink-0 w-[26px] h-[26px] mt-0.5 rounded-md flex items-center justify-center font-plexmono text-[13px] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f7dd1] ${
            selected ? 'bg-[#2f7dd1]' : 'bg-[#0f2a43]'
          }`}
        >
          {position}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2.5">
            <h2 className="flex-1 text-[15.5px] font-semibold text-[#0f2a43]">
              {therapist.name}
            </h2>
            <span
              className={`shrink-0 font-plexmono text-[12.5px] font-medium px-2 py-0.5 rounded whitespace-nowrap ${
                badge.isEstimate
                  ? 'bg-gray-100 text-gray-600'
                  : 'bg-[#e5f3ea] text-[#0e5e2f]'
              }`}
            >
              {badge.text}
            </span>
          </div>

          <button
            type="button"
            className="block text-left text-[13.5px] text-[#42566b] mt-0.5 hover:underline"
            onClick={handleAddressClick}
          >
            {formatAddress(therapist)}
          </button>

          <div className="flex flex-wrap gap-x-3.5 gap-y-0.5 text-[12.5px] text-[#5b7186] mt-1">
            {phone && <span>{phone}</span>}
            {fax && <span>Fax {fax}</span>}
            {email && <span>{email}</span>}
            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                {displayDomain(websiteUrl)}
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
