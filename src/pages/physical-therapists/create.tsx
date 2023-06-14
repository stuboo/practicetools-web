import { TherapistType } from '../home/types'
import Input from '../../components/input'
import TextArea from '../../components/textarea'
import ToggleSwitch from '../../components/toggle-switch'
import Button from '../../components/button'

interface CreateTherapistProps {
  therapist: TherapistType
  onCancel: () => void
  onSave: (therapist: TherapistType) => void
  isLoading?: boolean
}

export default function Create({
  therapist,
  onCancel,
  onSave,
  isLoading,
}: CreateTherapistProps) {
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
          onClick={() => onSave(therapist.id)}
          isLoading={isLoading}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-12 px-6">
        <div className="border-b border-gray-900/10 pb-12">
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-full">
              <Input
                label="Name"
                name="therapy-name"
                value={therapist.name}
                onChange={(e) => onUpdate('name', e.target.value)}
              />
            </div>

            <div className="sm:col-span-full">
              <Input
                label="Email"
                name="therapy-email"
                value={therapist.email}
                onChange={(e) => onUpdate('email', e.target.value)}
              />
            </div>

            <div className="sm:col-span-full">
              <Input
                label="Phone"
                name="therapy-phone"
                value={therapist.phone}
                onChange={(e) => onUpdate('phone', e.target.value)}
              />
            </div>

            <div className="sm:col-span-full">
              <Input
                label="Address"
                name="therapy-address"
                value={therapist.address}
                onChange={(e) => onUpdate('address', e.target.value)}
              />
            </div>

            <div className="sm:col-span-full">
              <Input
                label="Address 2"
                name="therapy-address-two"
                value={therapist.address_two}
                onChange={(e) => onUpdate('address_two', e.target.value)}
              />
            </div>

            <div className="sm:col-span-full">
              <Input
                label="Zip Code"
                name="therapy-zipcode"
                value={therapist.zip}
                onChange={(e) => onUpdate('zip', e.target.value)}
              />
            </div>

            <div className="sm:col-span-full">
              <Input
                label="Website"
                name="therapy-website"
                type="url"
                value={therapist.website}
                onChange={(e) => onUpdate('website', e.target.value)}
              />
            </div>

            <div className="sm:col-span-full">
              <Input
                label="Fax"
                name="therapy-fax"
                value={therapist.fax}
                onChange={(e) => onUpdate('fax', e.target.value)}
              />
            </div>

            <div className="sm:col-span-full">
              <ToggleSwitch
                label="Medicare Status"
                name="therapy-medicare-status"
                isChecked={therapist.medicare_status}
                onChange={(checked) => onUpdate('medicare_status', checked)}
              />
            </div>

            <div className="sm:col-span-full">
              <ToggleSwitch
                label="Medicare Status"
                name="therapy-medicare-status"
                isChecked={therapist.medicaid_status}
                onChange={(checked) => onUpdate('medicaid_status', checked)}
              />
            </div>

            <div className="sm:col-span-full">
              <ToggleSwitch
                label="Cash Only"
                name="therapy-cash-only"
                isChecked={therapist.cash_only}
                onChange={(checked) => onUpdate('cash_only', checked)}
              />
            </div>

            <div className="sm:col-span-full">
              <Input
                label="Referral From URL"
                name="therapy-referral-url"
                value={therapist.referral_form_url}
                type="url"
                onChange={(e) =>
                  onUpdate('expectations_letter_url', e.target.value)
                }
              />
            </div>

            <div className="sm:col-span-full">
              <Input
                label="Expection Letter URL"
                name="therapy-expectation-url"
                value={therapist.expectations_letter_url}
                type="url"
                onChange={(e) =>
                  onUpdate('expectations_letter_url', e.target.value)
                }
              />
            </div>

            <div className="sm:col-span-full">
              <TextArea
                label="Notes"
                name="therapy-notes"
                value={therapist.notes}
                onChange={(e) => onUpdate('notes', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
