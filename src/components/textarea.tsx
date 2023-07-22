import classNames from 'classnames'
import React, { forwardRef } from 'react'

interface CustomTextAreaProps
  extends React.DetailedHTMLProps<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    HTMLTextAreaElement
  > {
  label: string
  helperText?: string
  error?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}
const TextArea = forwardRef<HTMLTextAreaElement, CustomTextAreaProps>(
  (
    {
      label,
      helperText,
      value,
      error,
      size = 'md',
      ...props
    }: CustomTextAreaProps,
    ref
  ) => {
    const inputSizeClasses = {
      sm: 'rounded-sm px-3 text-sm',
      md: 'rounded-md px-4 text-md',
      lg: 'rounded-md px-4 text-lg',
      xl: 'rounded-md px-6 text-xl',
    }

    const inputClass = classNames(
      'block w-full border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600',
      inputSizeClasses[size],
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
            defaultValue={''}
            value={value}
            rows={3}
            className={classNames(inputClass)}
            {...props}
            ref={ref}
          />
        </div>
        <p className="mt-3 text-sm leading-6 text-gray-600">{helperText}</p>
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}{' '}
        {/* Display the error message if it exists */}
      </>
    )
  }
)

export default TextArea
