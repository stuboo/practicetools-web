import { Fragment, useEffect, useState } from 'react'
import PhysicalTherapyCard from './PhysicalTherapyCard'
import Loading from './Loading'
import { useDebounce } from '../../hooks/useDebounce'
import { TherapistType } from './types'
import PhysicalTherapistAPI from '../../api/physicaltherapist'
import { Link } from 'react-router-dom'
import Container from '../../components/container'
import { MdOutlineFilterList } from 'react-icons/md'
import { Popover, Transition } from '@headlessui/react'
import Button from '../../components/button'
import { Slider } from '../../components/slider'
import isEqual from 'lodash/isEqual'

const defaultFilter: {
  radius: number
} = {
  radius: 5,
}

export default function SearchTherapists() {
  const [zipCode, setZipCode] = useState('')
  const debouncedValue = useDebounce<string>(zipCode, 1000)

  const [isSuccessful, setIsSuccessful] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [therapists, setTherapists] = useState<TherapistType[]>([])

  const [filter, setFilter] = useState(defaultFilter)
  const debouncedFilter = useDebounce(filter)
  const isFilterApplied = !isEqual(filter, defaultFilter)

  useEffect(() => {
    const search = async () => {
      setIsLoading(true)

      const data = await PhysicalTherapistAPI.searchTherapistsByZipCode(
        debouncedValue,
        isFilterApplied ? filter.radius : undefined
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
  }, [debouncedValue, debouncedFilter.radius, isFilterApplied])

  return (
    <div className="flex flex-col bg-red">
      <Container bgColor="bg-gray-100">
        <div className="h-48 flex flex-col justify-center items-center bg-gray-100">
          <div className="flex justify-start w-full mb-4">
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
          </div>

          <div className="flex gap-8">
            <input
              type="text"
              placeholder="Enter Zip"
              className="px-8 py-4 text-gray-900 text-2xl font-bold outline-4 transition-[outline] duration-200 outline-gray-600/20 focus:outline focus:rounded-md"
              onChange={(event) => {
                setIsTyping(true)
                setZipCode(event.target.value)
              }}
            />

            <Popover className="relative">
              <Popover.Button
                className={`px-8 py-4 flex gap-3 items-center  text-2xl font-bold outline-4 transition-all duration-200 outline-gray-600/20 focus:outline focus:rounded-md w-56 ${
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
                <Popover.Panel className="absolute rounded-xl bg-blue-100 z-10 mt-3 w-[400px] min-h-[300px] transform px-4 py-4 h-full shadow-xl">
                  <div className="flex flex-col h-full">
                    <div className="flex flex-col flex-grow">
                      <hr />
                      <h4 className="text-lg text-blue-900">Radius</h4>
                      <div className="flex gap-4">
                        <Slider
                          defaultValue={[defaultFilter.radius]}
                          value={[filter.radius]}
                          min={defaultFilter.radius}
                          max={100}
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
                          min={defaultFilter.radius}
                          max={100}
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
