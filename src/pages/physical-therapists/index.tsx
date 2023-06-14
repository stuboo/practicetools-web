import PhysicalTherapistAPI from '../../api/physicaltherapist'
import { Dialog } from '@headlessui/react'
import { useState } from 'react'
import { TherapistType } from '../home/types'
import Edit from './edit'
import Show from './show'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export default function PhysicalTherapistLists() {
  const queryClient = useQueryClient()
  const [isSideBarOpen, setIsSideBarOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedTherapist, setSelectedTherapist] =
    useState<TherapistType | null>(null)

  const { data: therapists } = useQuery(['therapists'], () =>
    PhysicalTherapistAPI.getAll()
  )

  const creatorMutator = useMutation<TherapistType, unknown, TherapistType>(
    (therapist) => PhysicalTherapistAPI.create(therapist),
    {
      onSuccess(data, variables, context) {
        queryClient.invalidateQueries(['therapists'])
        setSelectedTherapist(data)
      },
    }
  )

  const handleShowFullDetails = (therapist: TherapistType) => {
    setSelectedTherapist(therapist)
    setIsSideBarOpen(true)
  }

  return (
    <>
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <div className="pb-4 bg-white dark:bg-gray-900">
          <label htmlFor="table-search" className="sr-only">
            Search
          </label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-500 dark:text-gray-400"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </div>
            <input
              type="text"
              id="table-search"
              className="block p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg w-80 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Search for physical therapists"
            />
          </div>
        </div>

        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="p-4">
                <div className="flex items-center">
                  <input
                    id="checkbox-all-search"
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="checkbox-all-search" className="sr-only">
                    checkbox
                  </label>
                </div>
              </th>
              <th scope="col" className="px-6 py-3">
                Name
              </th>
              <th scope="col" className="px-6 py-3">
                Email
              </th>
              <th scope="col" className="px-6 py-3">
                Address
              </th>
              <th scope="col" className="px-6 py-3">
                Website
              </th>
              <th scope="col" className="px-6 py-3">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {therapists &&
              therapists.map((therapist, index) => (
                <tr
                  key={index.toString()}
                  className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <td className="w-4 p-4">
                    <div className="flex items-center">
                      <input
                        id="checkbox-table-search-1"
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <label
                        htmlFor="checkbox-table-search-1"
                        className="sr-only"
                      >
                        checkbox
                      </label>
                    </div>
                  </td>
                  <th
                    scope="row"
                    className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                  >
                    {therapist.name}
                  </th>
                  <td className="px-6 py-4">{therapist.email}</td>
                  <td className="px-6 py-4">{therapist.address}</td>
                  <td className="px-6 py-4">
                    <a href={`${therapist.website}`} target="_blank">
                      {therapist.website?.substring(0, 30)}...
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => handleShowFullDetails(therapist)}
                      className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Full Details Dialog */}
        <Dialog
          open={isSideBarOpen}
          onClose={() => setIsSideBarOpen(false)}
          className="relative z-50 h-full"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 md:left-1/3  bg-white">
            <Dialog.Panel className={'h-full flex flex-col'}>
              <button
                className="absolute right-4 top-4 rounded-full p-1 hover:bg-gray-300 z-10 cursor-pointer"
                onClick={() => setIsSideBarOpen(false)}
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {selectedTherapist && (
                <>
                  {/* Editing View */}
                  {editMode && (
                    <Edit
                      therapist={selectedTherapist}
                      onCancel={() => {
                        setEditMode(false)
                      }}
                      onSave={(data) => setSelectedTherapist(data)}
                    />
                  )}

                  {/* Details View */}
                  {!editMode && (
                    <div className="overflow-y-auto">
                      <div className="h-24 bg-gray-200 flex gap-4 items-center px-8">
                        <button
                          onClick={() => setEditMode(true)}
                          className="flex items-center gap-1 bg-blue-500 px-4 py-1 rounded hover:bg-blue-500/80 text-white"
                        >
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
                              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                            />
                          </svg>
                          Edit
                        </button>

                        <button className="flex items-center gap-1 bg-red-500 px-4 py-1 rounded hover:bg-red-500/80 text-white">
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
                              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                            />
                          </svg>
                          Delete
                        </button>
                      </div>
                      <Dialog.Title
                        as={'h3'}
                        className="px-6 pt-4 text-base font-semibold leading-7 text-gray-900"
                      >
                        {selectedTherapist?.name}
                      </Dialog.Title>
                      <Dialog.Description
                        as="p"
                        className="px-6 mt-1 max-w-2xl text-sm leading-6 text-gray-500"
                      >
                        {selectedTherapist?.city},{selectedTherapist?.state}
                      </Dialog.Description>
                      <Show therapist={selectedTherapist} />
                    </div>
                  )}
                </>
              )}
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </>
  )
}
