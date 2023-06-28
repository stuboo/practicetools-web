import { useEffect, useState } from 'react'
import PhysicalTherapyCard from './PhysicalTherapyCard'
import Loading from './Loading'
import { useDebounce } from '../../hooks/useDebounce'
import { TherapistType } from './types'
import PhysicalTherapistAPI from '../../api/physicaltherapist'
import { Link } from 'react-router-dom'
import Container from '../../components/container'

export default function SearchTherapists() {
  const [zipCode, setZipCode] = useState('')
  const debouncedValue = useDebounce<string>(zipCode, 1000)

  const [isSuccessful, setIsSuccessful] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [therapists, setTherapists] = useState<TherapistType[]>([])

  useEffect(() => {
    const search = async () => {
      setIsLoading(true)

      const data = await PhysicalTherapistAPI.searchTherapistsByZipCode(
        debouncedValue
      )
      setTherapists(data)
      setIsLoading(false)
      setIsSuccessful(true)
    }

    setIsTyping(false)
    if (debouncedValue.length >= 5) {
      search()
    } else {
      setTherapists([])
      setIsSuccessful(false)
    }
  }, [debouncedValue])

  return (
    <div className="flex flex-col bg-red">
      <Container bgColor="bg-gray-100">
        <div className="h-48 flex flex-col justify-center items-center bg-gray-100">
          <Link to={'/'} className="flex items-center self-start gap-4">
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
                d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75"
              />
            </svg>

            <h1 className="text-2xl font-light">Go Back</h1>
          </Link>

          <input
            type="text"
            placeholder="Enter Zip"
            className="px-8 py-4 text-gray-900 text-2xl font-bold outline-4 transition-[outline] duration-200 outline-gray-600/20 focus:outline focus:rounded-md "
            onChange={(event) => {
              setIsTyping(true)
              setZipCode(event.target.value)
            }}
          />
        </div>
      </Container>

      {(isLoading || isTyping) && (
        <div className="px-10 py-12 grid md:grid-cols-2 gap-4 overflow-auto">
          {Array.from('00000000').map((_, index) => (
            <Loading key={index.toString()} />
          ))}
        </div>
      )}

      <div className="px-10 py-12 grid md:grid-cols-2 gap-4 overflow-auto">
        {!isLoading &&
          !isTyping &&
          therapists?.map((therapist, index) => (
            <PhysicalTherapyCard therapist={therapist} key={index.toString()} />
          ))}
      </div>

      {isSuccessful && therapists?.length == 0 && (
        <div className="flex justify-center items-center h-80">
          <p className="text-2xl">Not Found!</p>
        </div>
      )}
    </div>
  )
}
