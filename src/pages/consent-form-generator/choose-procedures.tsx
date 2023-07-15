import { RadioGroup } from '@headlessui/react'
import { useState } from 'react'
import { ProcedureStatus, SelectedProcedureType } from './types'
import Button from '../../components/button'

interface ChooseProcedureFormProps {
  procedures: string[]
  setChosenProcedures: (chosenProcedures: SelectedProcedureType) => void
}

interface ProcedureItemProps {
  alias: string
  value: ProcedureStatus | null
  onChange: (key: string, value: ProcedureStatus | null) => void
}

function ProcedureItem({ alias, value, onChange }: ProcedureItemProps) {
  return (
    <RadioGroup
      name={alias}
      value={value ?? null}
      onChange={(value) => onChange(alias, value as ProcedureStatus)}
      className={`flex items-center gap-2 py-3 px-4 transition-colors ${
        value === 'planned'
          ? 'bg-green-100'
          : value === 'possible'
          ? 'bg-orange-100'
          : 'bg-gray-100'
      }`}
    >
      <RadioGroup.Option value={'planned'} className={'cursor-pointer'}>
        {({ checked }) => (
          <div className="w-5 h-5 border-2 border-gray-600 rounded-full flex items-center justify-center">
            <div
              className={`w-[75%] h-[75%] transition-opacity duration-200  rounded-full ${
                checked ? 'opacity-100 bg-green-500' : 'opacity-0'
              }`}
            />
          </div>
        )}
      </RadioGroup.Option>

      <RadioGroup.Option value={'possible'} className={'cursor-pointer'}>
        {({ checked }) => (
          <div className="w-5 h-5 border-2 border-gray-600 rounded-full flex items-center justify-center">
            <div
              className={`w-[75%] h-[75%] transition-opacity duration-200 bg-gray-600 rounded-full ${
                checked ? 'opacity-100 bg-orange-500' : 'opacity-0'
              }`}
            />
          </div>
        )}
      </RadioGroup.Option>

      <RadioGroup.Label>{alias}</RadioGroup.Label>

      {value && (
        <Button
          variant="ghost"
          title="Remove"
          className="text-red-500 hover:underline text-xs"
          onClick={() => onChange(alias, null)}
        />
      )}
    </RadioGroup>
  )
}

export default function ChooseProcedureForm({
  procedures,
  setChosenProcedures,
}: ChooseProcedureFormProps) {
  const [selectedProcedures, setSelectedProcedures] =
    useState<SelectedProcedureType>({})

  const handleProcedureSelection = (
    key: string,
    value: ProcedureStatus | null
  ) => {
    const newSelectedProcedures = { ...selectedProcedures }

    if (!value) delete newSelectedProcedures[key]
    else newSelectedProcedures[key] = value as ProcedureStatus

    setSelectedProcedures(newSelectedProcedures)
    setChosenProcedures(newSelectedProcedures)
  }

  return (
    <div className="space-y-2 my-4">
      {/* Form Guide */}
      <div className="flex items-center mb-8">
        <div className="flex gap-2 px-4">
          <div className="w-5 h-5 border-2 border-gray-600 rounded-full flex items-center justify-center">
            <div
              className={`w-[75%] h-[75%] transition-opacity duration-200 rounded-full opacity-100 bg-green-500`}
            />
          </div>

          <div className="w-5 h-5 border-2 border-gray-600 rounded-full flex items-center justify-center">
            <div
              className={`w-[75%] h-[75%] transition-opacity duration-200 rounded-full opacity-100 bg-orange-500`}
            />
          </div>
        </div>

        <p className="ml-8 mr-2 italic font-light text-sm">where</p>

        <div className="flex items-center gap-1 mr-2">
          <div className="w-5 h-5 border-2 border-gray-600/0 rounded-full flex items-center justify-center">
            <div
              className={`w-[75%] h-[75%] transition-opacity duration-200 rounded-full opacity-100 bg-green-500`}
            />
          </div>

          <p className="text-sm">Planned</p>
        </div>

        <div className="flex items-center gap-1">
          <div className="w-5 h-5 border-2 border-gray-600/0 rounded-full flex items-center justify-center">
            <div
              className={`w-[75%] h-[75%] transition-opacity duration-200 rounded-full opacity-100 bg-orange-500`}
            />
          </div>

          <p className="text-sm">Possible</p>
        </div>
      </div>

      {procedures.map((alias, index) => (
        <ProcedureItem
          key={index}
          alias={alias}
          value={selectedProcedures[alias]}
          onChange={handleProcedureSelection}
        />
      ))}
    </div>
  )
}
