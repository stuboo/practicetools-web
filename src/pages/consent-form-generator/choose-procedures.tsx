import { RadioGroup } from '@headlessui/react'
import { useState } from 'react'
import { ProcedureStatus, SelectedProcedureType } from './types'
import Button from '../../components/button'
import { useQuery } from '@tanstack/react-query'
import ProcedureAliasAPI from '../../api/alias'
import { ProcedureAlias } from '../../types'

interface ChooseProcedureFormProps {
  setChosenProcedures: (chosenProcedures: SelectedProcedureType) => void
}

interface ProcedureItemProps {
  alias: ProcedureAlias
  value: ProcedureStatus | null
  onChange: (id: number, key: string, value: ProcedureStatus | null) => void
}

function ProcedureItem({ alias, value, onChange }: ProcedureItemProps) {
  // fetch procedure alias
  return (
    <RadioGroup
      name={alias.alias}
      value={value ?? null}
      onChange={(value) =>
        onChange(alias.id, alias.alias, value as ProcedureStatus)
      }
      className={`flex items-center gap-2 py-3 px-4 transition-all ${
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

      <RadioGroup.Label>{alias.alias}</RadioGroup.Label>

      {value && (
        <Button
          variant="ghost"
          title="Remove"
          className="text-red-500 hover:underline text-xs h-4"
          onClick={() => onChange(alias.id, alias.alias, null)}
        />
      )}
    </RadioGroup>
  )
}

export default function ChooseProcedureForm({
  setChosenProcedures,
}: ChooseProcedureFormProps) {
  const [selectedProcedures, setSelectedProcedures] =
    useState<SelectedProcedureType>({})

  const { data: procedures } = useQuery(['procedure-alias'], () =>
    ProcedureAliasAPI.getAll()
  )

  const handleProcedureSelection = (
    id: number,
    key: string,
    value: ProcedureStatus | null
  ) => {
    const newSelectedProcedures = { ...selectedProcedures }

    if (!value) delete newSelectedProcedures[key]
    else newSelectedProcedures[key] = { status: value as ProcedureStatus, id }

    setSelectedProcedures(newSelectedProcedures)
    setChosenProcedures(newSelectedProcedures)
  }

  if (!procedures)
    return (
      <div className="py-6">
        <h1>No procedures found!</h1>
      </div>
    )

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

      <div className="grid gap-x-4 gap-y-4 grid-cols-2 transition-all">
        {procedures.map((alias, index) => (
          <ProcedureItem
            key={index}
            alias={alias}
            value={selectedProcedures[alias.alias]?.status}
            onChange={handleProcedureSelection}
          />
        ))}
      </div>
    </div>
  )
}
