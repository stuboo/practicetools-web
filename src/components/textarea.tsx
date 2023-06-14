import classNames from 'classnames'
import React from 'react'

interface CustomTextAreaProps
  extends React.DetailedHTMLProps<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    HTMLTextAreaElement
  > {
  label: string
  helperText?: string
  error?: string
}
export default function TextArea({
  label,
  helperText,
  value,
  error,
  ...props
}: CustomTextAreaProps) {
  const inputClass = classNames(
    'block w-full rounded-md px-4 border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6',
    { 'ring-red-500': error }
  )

  return (
    <>
      <label
        htmlFor="about"
        className="block text-sm font-medium leading-6 text-gray-900"
      >
        {label}
      </label>
      <div className="mt-2">
        <textarea
          defaultValue={value}
          rows={3}
          className={classNames(inputClass)}
          {...props}
        />
      </div>
      <p className="mt-3 text-sm leading-6 text-gray-600">{helperText}</p>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}{' '}
      {/* Display the error message if it exists */}
    </>
  )
}
