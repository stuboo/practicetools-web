import { useState } from 'react'
import PhysicalTherapyCard from './PhysicalTherapyCard'

export default function Home() {
  const [therapists, setTherapists] = useState([])
  const handleZipCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newZipCode = event.target.value

    // Check if the entered ZIP code is valid
    if (/^\d{5}$/.test(newZipCode)) {
      // Perform the search based on the valid ZIP code
      searchByZipCode(newZipCode)
    }
  }

  const searchByZipCode = (zipCode: string) => {
    // Perform your search logic here based on the valid ZIP code
    // This could involve making an API request to retrieve the relevant data
    console.log(`Searching for ZIP code: ${zipCode}`)
    // ...
  }

  return (
    <div className="h-full flex flex-col bg-red">
      <div className="h-36 flex justify-center items-center bg-gray-100">
        <input
          type="text"
          placeholder="Enter Zip"
          className="px-8 py-4 text-gray-900 text-2xl font-bold outline-4 transition-[outline] duration-200 outline-gray-600/20 focus:outline focus:rounded-md "
          onChange={handleZipCodeChange}
        />
      </div>

      <div className="px-10 py-12 grid grid-cols-2 gap-4">
        {therapists.map((_, index) => (
          <PhysicalTherapyCard key={index.toString()} />
        ))}
      </div>

      {therapists.length == 0 && (
        <div className="flex justify-center items-center h-80">
          <p className="text-2xl">Not Found!</p>
        </div>
      )}
    </div>
  )
}
