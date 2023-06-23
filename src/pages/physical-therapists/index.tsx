import PhysicalTherapistAPI from '../../api/physicaltherapist'
import { Dialog } from '@headlessui/react'
import { useEffect, useRef, useState } from 'react'
import { TherapistType } from '../home/types'
import Edit from './edit'
import Show from './show'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Button from '../../components/button'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import Create from './create'
import { MdOutlineAdd, MdOutlineLink, MdSearch } from 'react-icons/md'
import { toast } from 'react-hot-toast'

export default function PhysicalTherapistLists() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isSideBarOpen, setIsSideBarOpen] = useState(false)
  const [createTherapySideBar, setCreateTherapySideBar] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedTherapist, setSelectedTherapist] =
    useState<TherapistType | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  // Selection Checkbox
  const mainCheckBoxRef = useRef<HTMLInputElement | null>(null)
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<number[]>([])

  // Handle topmost checkbox (select all)
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked

    if (isChecked && therapists) {
      if (mainCheckBoxRef.current) mainCheckBoxRef.current.checked = true
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const allItemIds = therapists.map((t) => t.id!)
      setSelectedCheckboxes(allItemIds)
    } else {
      setSelectedCheckboxes([])
    }
  }

  const handleSinlgleSelection = (id: number, isChecked: boolean) => {
    const updatedCheckboxes = isChecked
      ? [...selectedCheckboxes, id]
      : selectedCheckboxes.filter((i) => i !== id)

    setSelectedCheckboxes(updatedCheckboxes)

    if (mainCheckBoxRef.current) {
      mainCheckBoxRef.current.checked =
        updatedCheckboxes.length === therapists?.length
      mainCheckBoxRef.current.indeterminate =
        updatedCheckboxes.length > 0 &&
        updatedCheckboxes.length < (therapists?.length ?? 0)
    }
  }

  const queryClient = useQueryClient()
  const { isLoading, mutate } = useMutation<TherapistType, unknown, string>(
    (id) => PhysicalTherapistAPI.deleteData(id),
    {
      onSuccess() {
        queryClient.invalidateQueries(['therapists'])
        toast.success('Physical Therapy Data deleted successfully!')
      },
    }
  )

  const { data: therapists } = useQuery(['therapists'], () =>
    PhysicalTherapistAPI.getAll()
  )

  const handleShowFullDetails = (therapist: TherapistType) => {
    console.log('selected: ', therapist)
    setSelectedTherapist(therapist)
    setIsSideBarOpen(true)
  }

  const handleDelete = () => {
    if (!selectedTherapist) return
    setShowConfirmDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (selectedTherapist) {
      await mutate(String(selectedTherapist.id))
      setShowConfirmDialog(false)
    }
  }

  return (
    <>
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <div className="flex items-center">
          <div className="pb-4 bg-white flex w-full justify-between items-center dark:bg-gray-900">
            <label htmlFor="table-search" className="sr-only">
              Search
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <MdSearch className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </div>
              <input
                type="text"
                id="table-search"
                className="block p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg w-80 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Search for physical therapists"
              />
            </div>

            <Button
              title="Add New Data"
              colorScheme="gray"
              iconLeft={<MdOutlineAdd size={24} />}
              onClick={() => setCreateTherapySideBar(true)}
            />
          </div>
        </div>

        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="p-4">
                <div className="flex items-center">
                  <input
                    ref={mainCheckBoxRef}
                    id="checkbox-all-search"
                    type="checkbox"
                    onChange={handleSelectAll}
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
                        checked={selectedCheckboxes.includes(therapist.id)}
                        onChange={(event) =>
                          handleSinlgleSelection(
                            therapist.id,
                            event.target.checked
                          )
                        }
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
                    <p>{therapist.name}</p>
                    <p className="text-gray-500 text-xs">
                      {therapist.city}, {therapist.state}
                    </p>
                  </th>
                  <td className="px-6 py-4">{therapist.email}</td>
                  <td className="px-6 py-4">{therapist.address}</td>
                  <td className="px-6 py-4">
                    {therapist.website ? (
                      <a
                        href={`${therapist.website}`}
                        className="flex gap-1 items-center hover:underline"
                        target="_blank"
                      >
                        <MdOutlineLink /> {therapist.website?.substring(0, 30)}
                        ...
                      </a>
                    ) : (
                      ''
                    )}
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
          <div className="fixed inset-0 md:left-2/3  bg-white">
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
                        <Button
                          title="Edit"
                          onClick={() => setEditMode(true)}
                          iconLeft={<PencilSquareIcon />}
                          colorScheme="blue"
                          isLoading={isLoading}
                        />
                        <Button
                          title="Delete"
                          onClick={handleDelete}
                          iconLeft={<TrashIcon />}
                          colorScheme="red"
                          isLoading={isLoading}
                        />
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

        {/* Create Therapy Dialog */}
        <Dialog
          open={createTherapySideBar}
          onClose={() => setCreateTherapySideBar(false)}
          className="relative z-50 h-full"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 md:left-2/3  bg-white">
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

              <Create onCancel={() => setCreateTherapySideBar(false)} />
            </Dialog.Panel>
          </div>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog
          open={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          className="relative z-50"
          initialFocus={cancelRef}
        >
          {/* The backdrop, rendered as a fixed sibling to the panel container */}
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md rounded bg-white p-4">
              <Dialog.Title
                as="h3"
                className="text-lg font-medium leading-6 text-gray-900"
              >
                Delete Physical Therapy Data?
              </Dialog.Title>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this physical therapy data?
                  This action cannot be undone.
                </p>
              </div>

              <div className="mt-8 flex justify-between">
                <Button
                  onClick={() => setShowConfirmDialog(false)}
                  title="Cancel"
                  ref={cancelRef}
                />
                <Button
                  onClick={handleConfirmDelete}
                  title="Continue"
                  colorScheme="red"
                />
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </>
  )
}
