import { Fragment } from 'react'
import { Switch } from '@headlessui/react'

interface ToggleSwitchProps {
  label?: string
  name?: string
  isChecked: boolean
  onChange?: (checked: boolean) => void
}
export default function ToggleSwitch({
  label,
  name,
  isChecked,
  onChange,
}: ToggleSwitchProps) {
  return (
    <Switch.Group as={Fragment}>
      <Switch.Label className="block text-sm font-medium leading-6 text-gray-900">
        {label}
      </Switch.Label>
      <Switch
        name={name}
        checked={isChecked}
        onChange={onChange}
        className={`${
          isChecked ? 'bg-indigo-600' : 'bg-gray-200'
        } mt-2 relative inline-flex h-6 w-11 items-center rounded-full`}
      >
        <span
          className={`${
            isChecked ? 'translate-x-6' : 'translate-x-1'
          } inline-block h-4 w-4 transform rounded-full bg-white transition`}
        />
      </Switch>
    </Switch.Group>
  )
}
