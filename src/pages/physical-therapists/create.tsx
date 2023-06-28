import Input from '../../components/input'
import TextArea from '../../components/textarea'
import ToggleSwitch from '../../components/toggle-switch'
import Button from '../../components/button'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import PhysicalTherapistAPI from '../../api/physicaltherapist'
import { Formik } from 'formik'
import { toast } from 'react-hot-toast'
import { CreateValidationSchema } from './validation-schema'
import { CreateTherapistType, TherapistType } from '../search-therapists/types'

interface CreateTherapistProps {
  onCancel?: () => void
}

const defaultTherapyData: CreateTherapistType = {
  name: '',
  address: '',
  address_two: '',
  city: '',
  state: '',
  zip: '',
  email: '',
  website: '',
  phone: '',
  fax: '',
  notes: '',
  medicare_status: false,
  medicaid_status: false,
  cash_only: false,
}

const validationSchema = CreateValidationSchema

export default function Create({ onCancel }: CreateTherapistProps) {
  const queryClient = useQueryClient()
  const { isLoading, mutate } = useMutation<
    TherapistType,
    unknown,
    CreateTherapistType
  >((therapist) => PhysicalTherapistAPI.create(therapist), {
    onSuccess() {
      queryClient.invalidateQueries(['therapists'])
      onCancel && onCancel()
      toast.success('Data added successfully!')
    },
  })

  return (
    <Formik
      initialValues={{ ...defaultTherapyData }}
      onSubmit={(values) => {
        mutate(values)
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
              title="Create"
              isLoading={isLoading}
              disabled={isLoading}
              colorScheme="green"
            />
          </div>

          <div className="space-y-12 px-6 h-full overflow-y-auto">
            <div className="border-b border-gray-900/10 pb-12">
              <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-full">
                  <Input
                    label="Name"
                    name="name"
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
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.email ? errors.email : undefined}
                  />
                </div>

                <div className="sm:col-span-full">
                  <Input
                    label="Phone"
                    name="phone"
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
                    value={values.address_two}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.address_two ? errors.address_two : undefined}
                  />
                </div>

                <div className="sm:col-span-full">
                  <Input
                    label="City"
                    name="city"
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
                    value={values.website}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.website ? errors.website : undefined}
                  />
                </div>

                <div className="sm:col-span-full">
                  <Input
                    label="Fax"
                    name="fax"
                    value={values.fax}
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
                    value={values.notes}
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
