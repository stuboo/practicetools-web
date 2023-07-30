import { Link } from 'react-router-dom'
import Container from '../../components/container'
import ChooseProcedureForm from './choose-procedures'
import { Fragment, useRef, useState } from 'react'
import { SelectedProcedureType, SourceType } from './types'
import Button from '../../components/button'
import { Dialog, Transition } from '@headlessui/react'
import { useBoolean } from '../../hooks/useBoolean'
import Input from '../../components/input'
import {
  Select,
  SelectContent,
  SelectOption,
  SelectTrigger,
} from '../../components/select'
import consent_schemas from './consent_schema.json'
import FormBuilder from './forms/form-builder'
import { Formik } from 'formik'
import { CreateProcedureAliasType, ProcedureAlias } from '../../types'
import { object, string } from 'yup'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import ProcedureAliasAPI from '../../api/alias'
import { toast } from 'react-hot-toast'
import { AxiosError } from 'axios'

const defaultProcedure: CreateProcedureAliasType = {
  alias: '',
  abbreviation: '',
  glossary_definition: '',
  simple_description: '',
}

const validationSchema = object().shape({
  alias: string().required().min(3),
  abbreviation: string(),
  glossary_definition: string().min(5),
  simple_description: string(),
})

export default function ConsentFormGenerator() {
  const {
    value: showAddNewProcedureForm,
    setFalse: closeForm,
    setTrue: openForm,
  } = useBoolean(false)
  const [selectedProcedures, setSelectedProcedures] =
    useState<SelectedProcedureType>({})

  const firstInputRef = useRef<HTMLInputElement>(null)
  const [consentForm, setConsentForm] = useState<SourceType | null>(null)

  const queryClient = useQueryClient()
  const { isLoading, mutate } = useMutation<
    ProcedureAlias,
    unknown,
    CreateProcedureAliasType
  >((therapist) => ProcedureAliasAPI.create(therapist), {
    onSuccess() {
      queryClient.invalidateQueries(['procedure-alias'])
      closeForm()
      toast.success('Procedure Alias added successfully!')
    },
    onError(error) {
      const e = error as AxiosError
      const message = e.response?.data as string
      toast.error(message || 'Could not create a new procedure alias')
    },
  })

  const handleCreateNewProcedure = (values: CreateProcedureAliasType) => {
    mutate(values)
  }

  const handleCloseFormModal = () => {
    if (isLoading) return

    closeForm()
  }

  return (
    <Container className="py-8">
      <Link to={'/'} className="flex items-center self-start gap-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 lg:w-6 lg:h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75"
          />
        </svg>

        <h1 className="text-md lg:text-2xl font-light">
          Consent Form Generator
        </h1>
      </Link>

      <div className="flex flex-col">
        <h3 className="uppercase text-lg mt-4 font-bold">Choose Procedures</h3>

        <ChooseProcedureForm setChosenProcedures={setSelectedProcedures} />

        <Button
          title="Add New Procedure"
          variant="ghost"
          className="underline hover:italic w-fit my-4"
          onClick={openForm}
        />

        {/* Consent Form : Select(Choose Form) */}
        <div className="flex items-center gap-4 mb-10">
          <h3 className="uppercase text-lg font-bold">Consent Form</h3>
          <Select
            value={consentForm}
            onChange={(value) => setConsentForm(value as SourceType)}
          >
            <SelectTrigger>Choose Form: {consentForm}</SelectTrigger>
            <SelectContent>
              {Object.values(consent_schemas.sources).map((source) => (
                <SelectOption key={source.name} value={source.name}>
                  {source.name}
                </SelectOption>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Based on the selection above, a specific component is loaded */}
        <FormBuilder procedures={selectedProcedures} name={consentForm} />
      </div>

      <Transition appear show={showAddNewProcedureForm} as={Fragment}>
        <Dialog
          open={showAddNewProcedureForm}
          onClose={handleCloseFormModal}
          className="relative z-50"
          // initialFocus={cancelRef}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            {/* The backdrop, rendered as a fixed sibling to the panel container */}
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md rounded bg-white p-4">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Add New Procedure Alias
                </Dialog.Title>

                <Formik
                  onSubmit={handleCreateNewProcedure}
                  validationSchema={validationSchema}
                  initialValues={defaultProcedure}
                >
                  {({
                    values,
                    errors,
                    touched,
                    handleSubmit,
                    handleChange,
                    handleBlur,
                  }) => (
                    <form onSubmit={handleSubmit}>
                      <div className="mt-4 flex flex-col gap-4">
                        <Input
                          placeholder="Alias"
                          label="Alias"
                          required
                          name="alias"
                          ref={firstInputRef}
                          value={values.alias}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.alias ? errors.alias : undefined}
                        />
                        <Input
                          placeholder="Abbreviation"
                          label="Abbreviation"
                          name="abbreviation"
                          value={values.abbreviation}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={
                            touched.abbreviation
                              ? errors.abbreviation
                              : undefined
                          }
                        />
                        <Input
                          label="Description"
                          name="simple_description"
                          placeholder="Short Description"
                          value={values.simple_description}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={
                            touched.simple_description
                              ? errors.simple_description
                              : undefined
                          }
                        />
                        <Input
                          label="Glossay Definition"
                          name="glossary_definition"
                          placeholder="Glossary Definition"
                          value={values.glossary_definition}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={
                            touched.glossary_definition
                              ? errors.glossary_definition
                              : undefined
                          }
                        />
                      </div>

                      <div className="mt-8 flex justify-between">
                        <Button
                          onClick={handleCloseFormModal}
                          title="Cancel"
                          colorScheme="red"
                          type="button"
                        />
                        <Button
                          title="Add Procedure Alias"
                          colorScheme="green"
                          type="submit"
                        />
                      </div>
                    </form>
                  )}
                </Formik>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </Container>
  )
}
