import React from 'react'

interface CustomTextAreaProps
  extends React.DetailedHTMLProps<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    HTMLTextAreaElement
  > {
  label: string
  helperText?: string
}
export default function TextArea({
  label,
  helperText,
  ...props
}: CustomTextAreaProps) {
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
          defaultValue={''}
          rows={3}
          {...props}
          className="block w-full px-4 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        />
      </div>
      <p className="mt-3 text-sm leading-6 text-gray-600">{helperText}</p>
    </>
  )
}
