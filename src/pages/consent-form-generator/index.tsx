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
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

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

  const handleFormGeneration = async () => {
    console.log('form generation')

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([600, 800])

    const font = await pdfDoc.embedFont(StandardFonts.Courier)
    const fontSize = 8

    consent_schemas.sources.forEach((source) => {
      // if (source.file) {
      //   const imageBytes = fetch(jsonData.sources[0].file).then((res) =>
      //     res.arrayBuffer()
      //   )
      //   const image = await pdfDoc.embedJpg(imageBytes)

      //   page.drawImage(image, {
      //     x: 0,
      //     y: 0,
      //     width: 600,
      //     height: 800,
      //   })
      // }

      const pageHeight = page.getHeight()

      source.form_fields.forEach((field) => {
        // loop for number or parts
        // in the loop, get the max length
        // extract the substring of the value of that length and keep the remaining text
        // draw text in the required location

        let textValue = field.value
        field.params.parts.forEach((part) => {
          console.log('nice')

          const currentText = textValue.substring(0, part.max_length)
          textValue = textValue.substring(part.max_length)

          const { x, y } = part.location
          const adjustedY = pageHeight - y
          page.drawText(currentText, {
            x,
            y: adjustedY,
            size: fontSize,
            font,
            color: rgb(
              source.style.color.r / 255,
              source.style.color.g / 255,
              source.style.color.b / 255
            ),
          })
        })
      })
    })

    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)

    // Optionally, you can open the PDF in a new tab
    window.open(url, '_blank')
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
              {consent_schemas.sources.map((source) => (
                <SelectOption key={source.name} value={source.name}>
                  {source.name}
                </SelectOption>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Based on the selection above, a specific component is loaded */}
        <FormBuilder procedures={selectedProcedures} name={consentForm} />

        <Button
          type="submit"
          title="Create Form"
          colorScheme="blue"
          className="w-40 mt-8"
          onClick={handleFormGeneration}
        />
      </div>

      <Transition appear show={showAddNewProcedureForm} as={Fragment}>
        <Dialog
          open={showAddNewProcedureForm}
          onClose={() => {
            return
          }}
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
                  <Button
                    onClick={closeForm}
                    title="Cancel"
                    colorScheme="red"
                  />
                  <Button title="Add Procedure Alias" colorScheme="green" />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </Container>
  )
}
