import { useState } from 'react'
import PhysicalTherapyCard from './PhysicalTherapyCard'
import { useQuery, useQueryClient } from 'react-query'
import PhysicalTherapist from '../../api/physicaltherapist'

export default function Home() {
  const [zipCode, setZipCode] = useState('')
  const [canSearch, setCanSearch] = useState(false)

  const queryClient = useQueryClient()
  const { data: therapists, isLoading } = useQuery(
    ['therapists', zipCode],
    () => PhysicalTherapist.searchTherapistsByZipCode(zipCode),
    {
      enabled: canSearch,
    }
  )

  const handleZipCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newZipCode = event.target.value

    if (!newZipCode) {
      // invalidate query
      setCanSearch(false)
      queryClient.invalidateQueries(['therapists'])
    }

    // Check if the entered ZIP code is valid
    if (/^\d{5}$/.test(newZipCode)) {
      // Perform the search based on the valid ZIP code
      setZipCode(newZipCode)
      setCanSearch(true)
    }
  }

  return (
    <div className="flex flex-col bg-red">
      <div className="h-36 flex justify-center items-center bg-gray-100">
        <input
          type="text"
          placeholder="Enter Zip"
          className="px-8 py-4 text-gray-900 text-2xl font-bold outline-4 transition-[outline] duration-200 outline-gray-600/20 focus:outline focus:rounded-md "
          onChange={handleZipCodeChange}
        />
      </div>

      {isLoading && <p>Searching...</p>}

      <div className="px-10 py-12 grid grid-cols-2 gap-4 overflow-auto">
        {therapists?.map((therapist, index) => (
          <PhysicalTherapyCard therapist={therapist} key={index.toString()} />
        ))}
      </div>

      {therapists?.length == 0 && (
        <div className="flex justify-center items-center h-80">
          <p className="text-2xl">Not Found!</p>
        </div>
      )}
    </div>
  )
}
