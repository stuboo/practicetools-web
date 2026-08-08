import { forwardRef } from 'react'
import { MdOutlineDownload } from 'react-icons/md'
import Button from '../../components/button'
import { TherapistType } from './types'
import { formatDistanceBadge } from './referralFormat'

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
      const addressQuery = encodeURIComponent(
        `${therapist.address}, ${therapist.city}, ${therapist.state} ${therapist.zip}`
      )
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${addressQuery}`,
        '_blank'
      )
    }

    return (
      <div
        ref={ref}
        onClick={() => onSelect?.(therapist.id)}
        className={`border-2 rounded-md bg-white p-4 transition-[border,box-shadow] cursor-pointer ${
          selected
            ? 'border-blue-600 shadow-md'
            : 'border-gray-300 hover:border-gray-600'
        }`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
              selected ? 'bg-blue-600' : 'bg-gray-800'
            }`}
          >
            {position}
          </span>
          <h2 className="text-2xl text-gray-900 font-bold">{therapist.name}</h2>
        </div>

        <div className="flex text-lg items-center gap-2 flex-wrap mt-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4 shrink-0"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
            />
          </svg>

          <p className="cursor-pointer" onClick={handleAddressClick}>
            {therapist.address}
            <span className="text-sm text-gray-500 ml-2">
              {therapist.city}, {therapist.state}
            </span>{' '}
          </p>
          <span className="bg-gray-500 text-white rounded-lg px-2 py-1 text-sm flex justify-center items-center">
            {therapist.zip}
          </span>
          {/* Drive time is what the patient is actually choosing on, so it is
              the badge. A straight-line fallback says so rather than passing
              itself off as a route. */}
          <span
            className={`text-white rounded-lg px-2 py-1 text-sm flex justify-center items-center ${
              therapist.drive_time_source === 'estimate' ? 'bg-gray-600' : 'bg-blue-800'
            }`}
          >
            {formatDistanceBadge(therapist)}
          </span>
        </div>

        <div className="text-sm gap-4 text-gray-600 mt-2">
          {therapist.email && <p>Email: {therapist.email}</p>}
          {therapist.website && (
            <a
              href={therapist.website}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              <span className="flex gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                  />
                </svg>
                {therapist.website}
              </span>
            </a>
          )}
          <p>Tel: {therapist.phone}</p>
          {therapist.fax && <p>Fax: {therapist.fax}</p>}
        </div>

        <div className="flex gap-6 mt-8">
          {therapist.referral_form_url ? (
            <a
              href={therapist.referral_form_url}
              target="_blank"
              onClick={(event) => event.stopPropagation()}
            >
              <Button
                iconLeft={<MdOutlineDownload size={24} />}
                title="Referral Form"
                colorScheme="blue"
              />
            </a>
          ) : (
            <Button
              iconLeft={<MdOutlineDownload size={24} />}
              title="Referral Form"
              colorScheme="blue"
              disabled={true}
            />
          )}
        </div>
      </div>
    )
  }
)

export default PhysicalTherapyCard
