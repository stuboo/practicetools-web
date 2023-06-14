import { TherapistType } from '../home/types'
import Input from '../../components/input'
import TextArea from '../../components/textarea'
import ToggleSwitch from '../../components/toggle-switch'
import Button from '../../components/button'

interface EditTherapistProps {
  therapist: TherapistType
  onCancel: () => void
}

export default function Edit({ therapist, onCancel }: EditTherapistProps) {
  return (
    <div className="absolute inset-0 first-line:bg-red-500 overflow-y-auto">
      <div className="h-24 bg-gray-200 flex gap-4 items-center justify-between px-8">
        <Button title="Cancel" variant="ghost" onClick={onCancel} />
        <Button title="Save" />
      </div>

      <div className="space-y-12 px-6">
        <div className="border-b border-gray-900/10 pb-12">
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-full">
              <Input label="Name" name="therapy-name" value={therapist.name} />
            </div>

            <div className="sm:col-span-full">
              <Input
                label="Email"
                name="therapy-email"
                value={therapist.email}
              />
            </div>

            <div className="sm:col-span-full">
              <Input
                label="Phone"
                name="therapy-phone"
                value={therapist.phone}
              />
            </div>

            <div className="sm:col-span-full">
              <Input
                label="Address"
                name="therapy-address"
                value={therapist.address}
              />
            </div>

            <div className="sm:col-span-full">
              <Input
                label="Address 2"
                name="therapy-address-two"
                value={therapist.address_two}
              />
            </div>

            <div className="sm:col-span-full">
              <Input
                label="Zip Code"
                name="therapy-zipcode"
                value={therapist.zip}
              />
            </div>

            <div className="sm:col-span-full">
              <Input
                label="Website"
                name="therapy-website"
                type="url"
                value={therapist.website}
              />
            </div>

            <div className="sm:col-span-full">
              <Input label="Fax" name="therapy-fax" value={therapist.fax} />
            </div>

            <div className="sm:col-span-full">
              <ToggleSwitch
                label="Medicare Status"
                name="therapy-medicare-status"
                isChecked={therapist.medicare_status}
              />
            </div>

            <div className="sm:col-span-full">
              <ToggleSwitch
                label="Medicare Status"
                name="therapy-medicare-status"
                isChecked={therapist.medicaid_status}
              />
            </div>

            <div className="sm:col-span-full">
              <ToggleSwitch
                label="Cash Only"
                name="therapy-cash-only"
                isChecked={therapist.cash_only}
              />
            </div>

            <div className="sm:col-span-full">
              <Input
                label="Referral From URL"
                name="therapy-referral-url"
                value={therapist.referral_form_url}
                type="url"
              />
            </div>

            <div className="sm:col-span-full">
              <Input
                label="Expection Letter URL"
                name="therapy-expectation-url"
                value={therapist.expectations_letter_url}
                type="url"
              />
            </div>

            <div className="sm:col-span-full">
              <TextArea
                label="Notes"
                name="therapy-notes"
                value={therapist.notes}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
