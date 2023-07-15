import { Listbox, Transition } from '@headlessui/react'
import { ChevronUpDownIcon } from '@heroicons/react/24/outline'
import classNames from 'classnames'
import { useState, ReactNode, Fragment } from 'react'
import { MdOutlineCheck } from 'react-icons/md'

type SelectValue = string | number | null

interface SelectProps {
  value?: SelectValue
  onChange: (value: SelectValue) => void
  children: ReactNode
  className?: string
}

const Select = ({
  value = null,
  onChange,
  children,
  className,
}: SelectProps) => {
  const [selectedValue, setSelectedValue] = useState<SelectValue>(value)

  const handleSelectChange = (newValue: SelectValue) => {
    setSelectedValue(newValue)
    onChange(newValue)
  }

  return (
    <div className={classNames('flex relative w-full lg:w-72', className)}>
      <Listbox value={selectedValue} onChange={handleSelectChange}>
        {children}
      </Listbox>
    </div>
  )
}

interface SelectTriggerProps {
  children: ReactNode
  error?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

const SelectTrigger = ({
  children,
  error,
  size = 'md',
}: SelectTriggerProps) => {
  const inputSizeClasses = {
    xs: 'h-6 rounded-sm px-2 text-xs',
    sm: 'h-8 rounded-sm px-3 text-sm',
    md: 'h-10 rounded-md px-4 text-md',
    lg: 'h-12 rounded-md px-4 text-lg',
  }

  const inputClass = classNames(
    'w-full border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500',
    inputSizeClasses[size],
    { 'ring-red-500': error }
  )

  return (
    <Listbox.Button className={classNames(inputClass)}>
      <div className="flex justify-between">
        <div>{children}</div>
        <ChevronUpDownIcon
          className="h-5 w-5 text-gray-400"
          aria-hidden="true"
        />
      </div>
    </Listbox.Button>
  )
}

interface SelectContentProps {
  children: ReactNode
}

const SelectContent = ({ children }: SelectContentProps) => {
  return (
    <Transition
      as={Fragment}
      leave="transition ease-in duration-100"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      {/* mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm */}
      <Listbox.Options
        className={
          'absolute z-10 mt-1 max-h-60 bg-white overflow-auto w-full py-1 text-base shadow-lg ring-1 ring-inset ring-gray-300 rounded-md  focus:outline-none top-[100%]'
        }
      >
        {children}
      </Listbox.Options>
    </Transition>
  )
}

interface SelectOptionProps {
  value: SelectValue
  children: ReactNode
}

const SelectOption = ({ value, children }: SelectOptionProps) => {
  return (
    <Listbox.Option
      className={({ active, selected }) =>
        `relative cursor-default select-none py-2 px-4 ${
          active || selected ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
        }`
      }
      value={value}
    >
      {({ selected }) => (
        <div className="flex items-center gap-4">
          {selected ? (
            <MdOutlineCheck className={`w-4 h-4 `} />
          ) : (
            <div className="w-4 h-4" />
          )}
          {children}
        </div>
      )}
    </Listbox.Option>
  )
}

export { Select, SelectTrigger, SelectContent, SelectOption }
