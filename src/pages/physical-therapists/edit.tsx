import { TherapistType } from '../home/types'
import Input from '../../components/input'
import TextArea from '../../components/textarea'
import ToggleSwitch from '../../components/toggle-switch'
import Button from '../../components/button'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import PhysicalTherapistAPI from '../../api/physicaltherapist'
import { useState } from 'react'
import {
  MdOutlineSave,
  MdOutlineSaveAlt,
  MdOutlineUpload,
} from 'react-icons/md'
import { toast } from 'react-hot-toast'

interface EditTherapistProps {
  therapist: TherapistType
  onCancel: () => void
  onSave: (therapist: TherapistType) => void
}

export default function Edit({
  therapist,
  onCancel,
  onSave,
}: EditTherapistProps) {
  const [updatedTherapist, setUpdatedTherapist] = useState(therapist)

  const queryClient = useQueryClient()
  const { isLoading, mutate } = useMutation<
    TherapistType,
    unknown,
    { id: string; therapist: TherapistType }
  >(({ id, therapist }) => PhysicalTherapistAPI.update(id, therapist), {
    onSuccess(data) {
      queryClient.invalidateQueries(['therapists'])
      setUpdatedTherapist(data)
      onSave(data)
      toast.success('Physical Therapy Data updated successfully!')
    },
  })

  const handleInputChange = (name: string, value: any) => {
    setUpdatedTherapist((prevTherapist) => ({
      ...prevTherapist,
      [name]: value,
    }))
  }

  return (
    <div className="absolute inset-0 first-line:bg-red-500 overflow-y-auto bg-white z-10">
      <div className="h-24 bg-gray-200 flex gap-4 items-center justify-between px-8">
        <Button
          title="Cancel"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
          isLoading={isLoading}
        />
        <Button
          title="Save"
          onClick={() =>
            mutate({ id: `${therapist.id}`, therapist: updatedTherapist })
          }
          isLoading={isLoading}
          disabled={isLoading}
          colorScheme="green"
          iconLeft={<MdOutlineUpload size={24} />}
        />
      </div>

      <div className="space-y-12 px-6">
        <div className="border-b border-gray-900/10 pb-12">
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-full">
              <Input
                label="Name"
                name="therapy-name"
                value={updatedTherapist.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>

            <div className="sm:col-span-full">
              <Input
                label="Email"
                name="therapy-email"
                value={updatedTherapist.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>

            <div className="sm:col-span-full">
              <Input
                label="Phone"
                name="therapy-phone"
                value={updatedTherapist.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>

            <div className="sm:col-span-full">
              <Input
                label="Address"
                name="therapy-address"
                value={updatedTherapist.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </div>

            <div className="sm:col-span-full">
              <Input
                label="Address 2"
                name="therapy-address-two"
                value={updatedTherapist.address_two}
                onChange={(e) =>
                  handleInputChange('address_two', e.target.value)
                }
              />
            </div>

            <div className="sm:col-span-full">
              <Input
                label="Zip Code"
                name="therapy-zipcode"
                value={updatedTherapist.zip}
                onChange={(e) => handleInputChange('zip', e.target.value)}
              />
            </div>

            <div className="sm:col-span-full">
              <Input
                label="Website"
                name="therapy-website"
                type="url"
                value={updatedTherapist.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
              />
            </div>

            <div className="sm:col-span-full">
              <Input
                label="Fax"
                name="therapy-fax"
                value={updatedTherapist.fax}
                onChange={(e) => handleInputChange('fax', e.target.value)}
              />
            </div>

            <div className="sm:col-span-full">
              <ToggleSwitch
                label="Medicare Status"
                name="therapy-medicare-status"
                isChecked={updatedTherapist.medicare_status}
                onChange={(checked) =>
                  handleInputChange('medicare_status', checked)
                }
              />
            </div>

            <div className="sm:col-span-full">
              <ToggleSwitch
                label="Medicare Status"
                name="therapy-medicare-status"
                isChecked={updatedTherapist.medicaid_status}
                onChange={(checked) =>
                  handleInputChange('medicaid_status', checked)
                }
              />
            </div>

            <div className="sm:col-span-full">
              <ToggleSwitch
                label="Cash Only"
                name="therapy-cash-only"
                isChecked={updatedTherapist.cash_only}
                onChange={(checked) => handleInputChange('cash_only', checked)}
              />
            </div>

            <div className="sm:col-span-full">
              <Input
                label="Referral From URL"
                name="therapy-referral-url"
                value={updatedTherapist.referral_form_url}
                type="url"
                onChange={(e) =>
                  handleInputChange('expectations_letter_url', e.target.value)
                }
              />
            </div>

            <div className="sm:col-span-full">
              <Input
                label="Expection Letter URL"
                name="therapy-expectation-url"
                value={updatedTherapist.expectations_letter_url}
                type="url"
                onChange={(e) =>
                  handleInputChange('expectations_letter_url', e.target.value)
                }
              />
            </div>

            <div className="sm:col-span-full">
              <TextArea
                label="Notes"
                name="therapy-notes"
                value={updatedTherapist.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
