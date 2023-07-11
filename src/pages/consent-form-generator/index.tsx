import { Link } from 'react-router-dom'
import Container from '../../components/container'
import ChooseProcedureForm from './choose-procedures'
import { useRef, useState } from 'react'
import { SelectedProcedureType } from './types'
import Button from '../../components/button'
import { Dialog } from '@headlessui/react'
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

export default function ConsentFormGenerator() {
  const {
    value: showAddNewProcedureForm,
    setFalse: closeForm,
    setTrue: openForm,
  } = useBoolean(false)
  const [selectedProcedures, setSelectedProcedures] =
    useState<SelectedProcedureType>()
  const procedures = [
    'robotic hysterectomy',
    'mesh sacrocolpopexy',
    'cystoscopy',
  ] // will be fetched from an api

  const firstInputRef = useRef<HTMLInputElement>(null)

  return (
    <Container className="py-8">
      <Link to={'/'} className="flex items-center self-start gap-4">
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
            d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75"
          />
        </svg>

        <h1 className="text-2xl font-light">Consent Form Generator</h1>
      </Link>

      <div className="flex flex-col">
        <h3 className="uppercase text-lg mt-4 font-bold">Choose Procedures</h3>

        <ChooseProcedureForm
          procedures={procedures}
          setChosenProcedures={setSelectedProcedures}
        />

        <Button
          title="Add New Procedure"
          variant="ghost"
          className="underline hover:italic w-fit my-4"
          onClick={openForm}
        />

        {/* Consent Form : Select(Choose Form) */}
        <div className="flex items-center gap-4 mb-10">
          <h3 className="uppercase text-lg font-bold">Consent Form</h3>
          <Select onChange={console.log}>
            <SelectTrigger>Choose Form</SelectTrigger>
            <SelectContent>
              {consent_schemas.sources.map((source) => (
                <SelectOption key={source.name} value={source.name}>
                  {source.name}
                </SelectOption>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Based on the selection above, a specific component is loaded */}
        <FormBuilder name={null} />

        <Button
          type="submit"
          title="Create Form"
          colorScheme="blue"
          className="w-40 mt-8"
        />
      </div>

      <Dialog
        open={showAddNewProcedureForm}
        onClose={() => {
          return
        }}
        className="relative z-50"
        // initialFocus={cancelRef}
      >
        {/* The backdrop, rendered as a fixed sibling to the panel container */}
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded bg-white p-4">
            <Dialog.Title
              as="h3"
              className="text-lg font-medium leading-6 text-gray-900"
            >
              Add New Procedure Alias
            </Dialog.Title>

            <div className="mt-4 flex flex-col gap-4">
              <Input
                placeholder="Alias"
                label="Alias"
                required
                ref={firstInputRef}
              />
              <Input placeholder="Abbreviation" label="Abbreviation" />
              <Input
                label="Description"
                name="simple_description"
                placeholder="Short Description"
              />
              <Input
                label="Glossay Definition"
                name="glossary_definition"
                placeholder="Glossary Definition"
              />
            </div>

            <div className="mt-8 flex justify-between">
              <Button onClick={closeForm} title="Cancel" colorScheme="red" />
              <Button title="Add Procedure Alias" colorScheme="green" />
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Container>
  )
}
