import TextArea from '../../../components/textarea'
import Input from '../../../components/input'
import { SelectedProcedureType } from '../types'
import {useEffect, useRef, useState} from 'react'
import ProcedureAliasAPI from '../../../api/alias'
// import { useDebounce } from '../../../hooks/useDebounce'
import {useMutation, useQuery} from '@tanstack/react-query'
import { FaSpinner } from 'react-icons/fa'
import {Alternative, Risk} from '../../../types'
import Button from '../../../components/button'
import {toast} from "react-hot-toast";
import {AxiosError} from "axios";

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
  const [createdFormUrl, setCreatedFormUrl] = useState("");

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

  const { isLoading: generatingForm, mutate: generateForm } = useMutation((data: any) => ProcedureAliasAPI.generateConsentForm(data), {
    onSuccess(data) {
      toast.success('Consent form generated successfully!')
      setCreatedFormUrl(data)
    },
    onError(error) {
      const e = error as AxiosError
      const message = e.response?.data
      if (typeof(message) === "object") {
        if (e.response?.status === 422) {
          toast.error('Error occured. Please be sure the form is filled properly.')
        } else toast.error(e.message || 'Error occurred while generating the consent form')
      } else {
        toast.error(message as string || 'Error occurred while generating the consent form')
      }
    },
  })



  const handleFormGeneration = async () => {
    const form_field_data = {
      "Procedures": proceduresInputRef.current?.value ?? "",
      "Other Risks": riskInputRef.current?.value ?? "",
      "Alternatives": alternativeInputRef.current?.value ?? "",
      "Date": formatDate(dateInputRef.current?.value) ?? "",
      "Time": formatTime(timeInputRef.current?.value) ?? "",
    }

    setCreatedFormUrl("")

    generateForm({ source: "iuhealth", form_field_data})
  }

  const formatDate = (inputDate: string|undefined) => {
    if (!inputDate) throw Error("Invalid date")

    const date = new Date(inputDate);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (timeInput: string|undefined) => {
    if (!timeInput) {
      return "";
    }

    const parsedTime = new Date(`1970-01-01T${timeInput}:00Z`);
    return parsedTime.toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };


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

      <div className={"flex items-center my-8 gap-10"}>
        <Button
            type="submit"
            title="Create Form"
            colorScheme="blue"
            className="w-40"
            disabled={!procedures || alternativesLoading || risksLoading || generatingForm}
            onClick={handleFormGeneration}
        />

        {
          !!createdFormUrl &&
            <a href={createdFormUrl} target={"_blank"} className={"hover:italic hover:underline flex gap-1 items-end text-blue-700"}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
              </svg>
              Download Generated Consent Form
            </a>
        }
      </div>
    </div>
  )
}
