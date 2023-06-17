import { MdOutlineDownload } from 'react-icons/md'
import Button from '../../components/button'
import { TherapistType } from './types'
interface PhysicalTherapyCardProps {
  therapist: TherapistType
}

export default function PhysicalTherapyCard({
  therapist,
}: PhysicalTherapyCardProps) {
  return (
    <div className="border-2 border-gray-300 rounded-md bg-white p-4 transition-[border] hover:border-gray-600">
      <h2 className="text-2xl text-gray-900 font-bold">{therapist.name}</h2>
      <div className="flex text-lg items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-4 h-4"
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

        <p>
          {/* TODO: clickable and open to google map address in another tab */}
          {therapist.address}
          <span className="text-sm text-gray-500 ml-2">
            {therapist.city}, {therapist.state}
          </span>{' '}
        </p>
        <span className="bg-gray-800 text-white rounded-lg px-2 ml-3 text-sm flex justify-center items-center">
          {therapist.zip}
        </span>
        {/* Add another badge that show distance e.g 2.4 miles */}
      </div>
      <div className="text-sm gap-4 text-gray-600">
        <p>Email: {therapist.email}</p>
        <a
          href="https://www.ecommunity.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          <span className="flex gap-1">
            {' '}
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
            https://www.ecommunity.com/
          </span>
        </a>
        <p>Tel: {therapist.phone}</p>
        <p>Fax: {therapist.fax}</p>
      </div>

      <div className="flex gap-6 mt-8">
        {/* Button to download referral form */}
        <Button
          iconLeft={<MdOutlineDownload size={24} />}
          title="Referral Form"
        />
      </div>
      {/* <p className="italic text-gray-500">Fax: {therapist.fax}</p>
      <p className="italic text-gray-500">Notes: {therapist.notes}</p> */}
    </div>
  )
}
