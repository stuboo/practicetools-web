import { boolean, mixed, object, string } from 'yup'


const phoneRegExp =
    /^(?:\+?1[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})$/
const faxRegExp = /^(?:\+?1[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})$/
const zipCodeRegExp = /(^\d{5}$)|(^\d{5}-\d{4}$)/

export const CreateValidationSchema = object().shape({
    name: string().required('Name is required'),
    address: string().required('Address is required'),
    address_two: string(),
    city: string().required('City is required'),
    state: string().required('State is required'),
    zip: string()
        .matches(zipCodeRegExp, 'Invalid zip code')
        .required('Zip Code is required'),
    email: string()
        .email('Invalid email address')
        .required('Email is required'),
    website: string().url('Invalid website URL'),
    phone: string()
        .matches(phoneRegExp, 'Invalid phone number')
        .required('Phone is required'),
    fax: string().matches(faxRegExp, 'Invalid fax number'),
    notes: string(),
    medicare_status: boolean(),
    medicaid_status: boolean(),
    cash_only: boolean(),
    referral_form: mixed().test(
        'fileType',
        'Invalid file format',
        (value) => {
            if (!value) return true // Allow empty value
            const file = value as File
            return ['application/pdf'].includes(file.type)
        }
    ),
    expectations_letter: mixed().test(
        'fileType',
        'Invalid file format',
        (value) => {
            if (!value) return true // Allow empty value
            const file = value as File
            return ['application/pdf'].includes(file.type)
        }
    ),
})