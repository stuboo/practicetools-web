import TextArea from '../../../components/textarea'
import Input from '../../../components/input'
import { SelectedProcedureType } from '../types'
import { useEffect, useRef } from 'react'
import ProcedureAliasAPI from '../../../api/alias'
import { useDebounce } from '../../../hooks/useDebounce'

interface IUHealthFormProps {
  procedures: SelectedProcedureType
}

export default function IUHealthForm({ procedures }: IUHealthFormProps) {
  const passedInProcedures = useDebounce(procedures, 1000)
  const procedureKeys = Object.keys(procedures)
  const proceduresInputRef = useRef<HTMLTextAreaElement>(null)
  const riskInputRef = useRef<HTMLInputElement>(null)
  const alternativeInputRef = useRef<HTMLInputElement>(null)

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
    const find = async () => {
      const ids = Object.values(procedures).map((val) => val.id)

      const risks = await ProcedureAliasAPI.risks(ids)
      const alternatives = await ProcedureAliasAPI.alternatives(ids)

      if (riskInputRef && riskInputRef.current) {
        riskInputRef.current.value = risks.map((risk) => risk.risk).join(',')
      }

      if (alternativeInputRef && alternativeInputRef.current) {
        alternativeInputRef.current.value = alternatives
          .map((alt) => alt.alternative)
          .join(',')
      }
    }

    find()
  }, [passedInProcedures])

  return (
    <div className="flex flex-col gap-3">
      <TextArea ref={proceduresInputRef} label="Procedures (IUH)" />
      <Input ref={riskInputRef} label="Other Risks" />
      <Input ref={alternativeInputRef} label="Alternatives" />
      <div className="flex gap-8">
        <Input type="date" label="Date" />
        <Input type="time" label="Time" />
      </div>
    </div>
  )
}
