import { TherapistType } from '../home/types'
import Input from '../../components/input'
import TextArea from '../../components/textarea'
import ToggleSwitch from '../../components/toggle-switch'
import Button from '../../components/button'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import PhysicalTherapistAPI from '../../api/physicaltherapist'
import { Formik } from 'formik'
import * as Yup from 'yup'

interface CreateTherapistProps {
  onCancel?: () => void
}

const defaultTherapyData: TherapistType = {
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
  referral_form_url: '',
  expectations_letter_url: '',
}

const phoneRegExp =
  /^(?:\+?1[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})$/
const faxRegExp = /^(?:\+?1[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})$/
const zipCodeRegExp = /(^\d{5}$)|(^\d{5}-\d{4}$)/

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  address: Yup.string().required('Address is required'),
  address_two: Yup.string(),
  city: Yup.string().required('City is required'),
  state: Yup.string().required('State is required'),
  zip: Yup.string()
    .matches(zipCodeRegExp, 'Invalid zip code')
    .required('Zip Code is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  website: Yup.string().url('Invalid website URL'),
  phone: Yup.string()
    .matches(phoneRegExp, 'Invalid phone number')
    .required('Phone is required'),
  fax: Yup.string().matches(faxRegExp, 'Invalid fax number'),
  notes: Yup.string(),
  medicare_status: Yup.boolean(),
  medicaid_status: Yup.boolean(),
  cash_only: Yup.boolean(),
  referral_form_url: Yup.string().url('Invalid referral form URL'),
  expectations_letter_url: Yup.string().url('Invalid expectations letter URL'),
})

export default function Create({ onCancel }: CreateTherapistProps) {
  const queryClient = useQueryClient()
  const { isLoading, mutate } = useMutation<
    TherapistType,
    unknown,
    TherapistType
  >((therapist) => PhysicalTherapistAPI.create(therapist), {
    onSuccess() {
      queryClient.invalidateQueries(['therapists'])
      onCancel && onCancel()
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
                    label="Referral From URL"
                    name="referral_form_url"
                    value={values.referral_form_url}
                    type="url"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={
                      touched.referral_form_url
                        ? errors.referral_form_url
                        : undefined
                    }
                  />
                </div>

                <div className="sm:col-span-full">
                  <Input
                    label="Expection Letter URL"
                    name="expectations_letter_url"
                    value={values.expectations_letter_url}
                    type="url"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={
                      touched.expectations_letter_url
                        ? errors.expectations_letter_url
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
