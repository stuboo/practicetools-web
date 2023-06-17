import { TherapistType, UpdateTherapistType } from '../home/types'
import Input from '../../components/input'
import TextArea from '../../components/textarea'
import ToggleSwitch from '../../components/toggle-switch'
import Button from '../../components/button'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import PhysicalTherapistAPI from '../../api/physicaltherapist'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Formik } from 'formik'
import { UpdateValidationSchema } from './validation-schema'

interface EditTherapistProps {
  therapist: TherapistType
  onCancel: () => void
  onSave: (therapist: TherapistType) => void
}

const validationSchema = UpdateValidationSchema

export default function Edit({
  therapist,
  onCancel,
  onSave,
}: EditTherapistProps) {
  // TODO: find a way to make null values a string by default or update the validation to allow nnull
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

  return (
    <Formik
      initialValues={{ ...updatedTherapist } as UpdateTherapistType}
      onSubmit={(values) => {
        console.log('something happening here: ', values)
        if (updatedTherapist.id) {
          mutate({ id: String(updatedTherapist.id), therapist: values })
        }
      }}
      validationSchema={validationSchema}
    >
      {({
        values,
        errors,
        touched,
        handleSubmit,
        handleChange,
        handleBlur,
        setFieldValue,
      }) => (
        <form
          onSubmit={handleSubmit}
          className="absolute flex flex-col inset-0 first-line:bg-red-500 bg-white z-10"
        >
          <div className="h-24 bg-gray-200 flex gap-4 items-center justify-between px-8">
            <Button
              title="Cancel"
              onClick={onCancel}
              variant="ghost"
              disabled={isLoading}
              isLoading={isLoading}
            />
            <Button
              type="submit"
              title="Update"
              isLoading={isLoading}
              disabled={isLoading}
              colorScheme="blue"
            />
          </div>

          <div className="space-y-12 px-6 h-full overflow-y-auto">
            <div className="border-b border-gray-900/10 pb-12">
              <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-full">
                  <Input
                    label="Name"
                    name="name"
                    required
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.name ? errors.name : undefined}
                  />
                </div>

                <div className="sm:col-span-full">
                  <Input
                    label="Email"
                    name="email"
                    value={values.email ?? ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.email ? errors.email : undefined}
                  />
                </div>

                <div className="sm:col-span-full">
                  <Input
                    label="Phone"
                    name="phone"
                    required
                    value={values.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.phone ? errors.phone : undefined}
                  />
                </div>

                <div className="sm:col-span-full">
                  <Input
                    label="Address"
                    name="address"
                    required
                    value={values.address}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.address ? errors.address : undefined}
                  />
                </div>

                <div className="sm:col-span-full">
                  <Input
                    label="Address 2"
                    name="address_two"
                    value={values.address_two ?? ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.address_two ? errors.address_two : undefined}
                  />
                </div>

                <div className="sm:col-span-full">
                  <Input
                    label="City"
                    name="city"
                    required
                    value={values.city}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.city ? errors.city : undefined}
                  />
                </div>

                <div className="sm:col-span-full">
                  <Input
                    label="State"
                    name="state"
                    required
                    value={values.state}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.state ? errors.state : undefined}
                  />
                </div>

                <div className="sm:col-span-full">
                  <Input
                    label="Zip Code"
                    name="zip"
                    required
                    value={values.zip}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.zip ? errors.zip : undefined}
                  />
                </div>

                <div className="sm:col-span-full">
                  <Input
                    label="Website"
                    name="website"
                    type="url"
                    value={values.website ?? ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.website ? errors.website : undefined}
                  />
                </div>

                <div className="sm:col-span-full">
                  <Input
                    label="Fax"
                    name="fax"
                    value={values.fax ?? ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.fax ? errors.fax : undefined}
                  />
                </div>

                <div className="sm:col-span-full">
                  <ToggleSwitch
                    label="Medicare Status"
                    name="medicare_status"
                    isChecked={values.medicare_status}
                    onChange={(checked) =>
                      setFieldValue('medicare_status', checked)
                    }
                  />
                </div>

                <div className="sm:col-span-full">
                  <ToggleSwitch
                    label="Medicaid Status"
                    name="medicaid_status"
                    isChecked={values.medicaid_status}
                    onChange={(checked) =>
                      setFieldValue('medicaid_status', checked)
                    }
                  />
                </div>

                <div className="sm:col-span-full">
                  <ToggleSwitch
                    label="Cash Only"
                    name="cash_only"
                    isChecked={values.cash_only}
                    onChange={(checked) => setFieldValue('cash_only', checked)}
                  />
                </div>

                <div className="sm:col-span-full">
                  <Input
                    label="Referral From"
                    name="referral_form"
                    type="file"
                    accept="application/pdf"
                    tooltipText="Upload a new referral form if you want to change the current one."
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0]
                      if (file) {
                        setFieldValue('referral_form', file)
                      }
                    }}
                    onBlur={handleBlur}
                    error={
                      touched.referral_form ? errors.referral_form : undefined
                    }
                  />
                </div>

                <div className="sm:col-span-full">
                  <Input
                    label="Expection Letter"
                    name="expectations_letter"
                    type="file"
                    accept="application/pdf"
                    tooltipText="Upload a new expectation form if you want to change the current one."
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0]
                      if (file) {
                        setFieldValue('expectations_letter', file)
                      }
                    }}
                    onBlur={handleBlur}
                    error={
                      touched.expectations_letter
                        ? errors.expectations_letter
                        : undefined
                    }
                  />
                </div>

                <div className="sm:col-span-full">
                  <TextArea
                    label="Notes"
                    name="notes"
                    value={values.notes ?? ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.notes ? errors.notes : undefined}
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </Formik>
  )
}
