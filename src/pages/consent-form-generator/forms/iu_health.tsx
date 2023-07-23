import TextArea from '../../../components/textarea'
import Input from '../../../components/input'
import { SelectedProcedureType } from '../types'
import { useEffect, useRef } from 'react'
import ProcedureAliasAPI from '../../../api/alias'
import { useDebounce } from '../../../hooks/useDebounce'
import { useQuery } from '@tanstack/react-query'
import { Risk } from '../../../types'
import { FaSpinner } from 'react-icons/fa'

interface IUHealthFormProps {
  procedures: SelectedProcedureType
}

export default function IUHealthForm({ procedures }: IUHealthFormProps) {
  const passedInProcedures = useDebounce(procedures, 1000)
  const procedureKeys = Object.keys(procedures)
  const proceduresInputRef = useRef<HTMLTextAreaElement>(null)
  const riskInputRef = useRef<HTMLInputElement>(null)
  const alternativeInputRef = useRef<HTMLInputElement>(null)

  const ids = Object.values(procedures).map((val) => val.id)
  const { data: risks, isLoading: risksLoading } = useQuery({
    queryKey: ['risks', ...ids],
    queryFn: async () => await ProcedureAliasAPI.risks(ids),
  })

  const { data: alternatives, isLoading: alternativesLoading } = useQuery({
    queryKey: ['alternatives', ...ids],
    queryFn: async () => await ProcedureAliasAPI.alternatives(ids),
  })

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
        <Input type="date" label="Date" />
        <Input type="time" label="Time" />
      </div>
    </div>
  )
}
