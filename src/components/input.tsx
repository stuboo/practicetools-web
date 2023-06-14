import classNames from 'classnames'
import React from 'react'
interface CustomInputProps
  extends React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  label: string
  error?: string
}
export default function Input({
  label,
  name,
  error,
  ...props
}: CustomInputProps) {
  const inputClass = classNames(
    'block w-full rounded-md px-4 border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6',
    { 'ring-red-500': error }
  )
  return (
    <>
      <label
        htmlFor={name}
        className="block text-sm font-medium leading-6 text-gray-900"
      >
        {label}
      </label>
      <div className="mt-2">
        <input
          name={name}
          id={name}
          {...props}
          className={classNames(inputClass)}
        />
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}{' '}
      {/* Display the error message if it exists */}
    </>
  )
}
