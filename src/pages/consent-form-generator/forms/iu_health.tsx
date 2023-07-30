import TextArea from '../../../components/textarea'
import Input from '../../../components/input'
import { SelectedProcedureType } from '../types'
import { useEffect, useRef } from 'react'
import ProcedureAliasAPI from '../../../api/alias'
// import { useDebounce } from '../../../hooks/useDebounce'
import { useQuery } from '@tanstack/react-query'
// import { Risk } from '../../../types'
import { FaSpinner } from 'react-icons/fa'
import { Alternative, Risk } from '../../../types'
import Button from '../../../components/button'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import consent_schemas from '../consent_schema.json'

interface IUHealthFormProps {
  procedures: SelectedProcedureType
}

export default function IUHealthForm({ procedures }: IUHealthFormProps) {
  // const passedInProcedures = useDebounce(procedures, 1000)
  const procedureKeys = Object.keys(procedures)
  const proceduresInputRef = useRef<HTMLTextAreaElement>(null)
  const riskInputRef = useRef<HTMLInputElement>(null)
  const alternativeInputRef = useRef<HTMLInputElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)
  const timeInputRef = useRef<HTMLInputElement>(null)

  const ids = Object.values(procedures).map((val) => val.id)
  const { data: risks, isLoading: risksLoading } = useQuery({
    queryKey: ['risks', ...ids],
    queryFn: async () => {
      if (ids.length > 0) {
        await ProcedureAliasAPI.risks(ids)
      }
      return [] as Risk[]
    },
  })

  const { data: alternatives, isLoading: alternativesLoading } = useQuery({
    queryKey: ['alternatives', ...ids],
    queryFn: async () => {
      if (ids.length > 0) {
        await ProcedureAliasAPI.alternatives(ids)
      }
      return [] as Alternative[]
    },
  })

  const handleFormGeneration = async () => {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([600, 800])

    const font = await pdfDoc.embedFont(StandardFonts.Courier)
    const fontSize = 8
    const pageHeight = page.getHeight()

    const source = consent_schemas.sources.iuhealth

    if (source.file) {
      const imageBytes = await fetch('/iuhealth_consent.png').then((res) =>
        res.arrayBuffer()
      )
      const image = await pdfDoc.embedPng(imageBytes)
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: 600,
        height: 800,
      })
    }

    source.form_fields.forEach((field) => {
      // loop for number or parts
      // in the loop, get the max length
      // extract the substring of the value of that length and keep the remaining text
      // draw text in the required location

      let textValue = field.value
      field.params.parts.forEach((part) => {
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

    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)

    // Optionally, you can open the PDF in a new tab
    window.open(url, '_blank')
  }

  useEffect(() => {
    if (proceduresInputRef && proceduresInputRef.current) {
      proceduresInputRef.current.value = procedureKeys
        .map(
          (pk, i) =>
            `${i === 0 ? '' : ' '}${
              procedures[pk].status === 'planned' ? '' : procedures[pk].status
            } ${pk}`
        )
        .join(',')
    }
  }, [procedures])

  useEffect(() => {
    if (!risksLoading && risks && riskInputRef && riskInputRef.current) {
      riskInputRef.current.value = risks.map((risk) => risk.risk).join(',')
    }
  }, [risks, risksLoading, riskInputRef])

  useEffect(() => {
    if (
      !alternativesLoading &&
      alternatives &&
      alternativeInputRef &&
      alternativeInputRef.current
    ) {
      alternativeInputRef.current.value = alternatives
        .map((alt) => alt.alternative)
        .join(',')
    }
  }, [alternatives, alternativesLoading, alternativeInputRef])

  return (
    <div className="flex flex-col gap-3">
      <TextArea ref={proceduresInputRef} label="Procedures (IUH)" />
      <div className="relative">
        <Input ref={riskInputRef} label="Other Risks" />
        {risksLoading && (
          <div className="absolute top-0 w-full h-full bg-gray-500/20 flex justify-center items-center">
            <FaSpinner className="animate-spin" />
          </div>
        )}
      </div>

      <div className="relative">
        <Input ref={alternativeInputRef} label="Alternatives" />
        {alternativesLoading && (
          <div className="absolute top-0 w-full h-full bg-gray-500/20 flex justify-center items-center">
            <FaSpinner className="animate-spin" />
          </div>
        )}
      </div>

      <div className="flex gap-8">
        <Input ref={dateInputRef} type="date" label="Date" />
        <Input ref={timeInputRef} type="time" label="Time" />
      </div>

      <Button
        type="submit"
        title="Create Form"
        colorScheme="blue"
        className="w-40 mt-8"
        disabled={!procedures || alternativesLoading || risksLoading}
        onClick={handleFormGeneration}
      />
    </div>
  )
}
