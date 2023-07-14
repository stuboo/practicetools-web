import classNames from 'classnames'
import React from 'react'
import { MdOutlineInfo } from 'react-icons/md'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip'

interface CustomInputProps
  extends React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  label?: string
  error?: string
  tooltipText?: string
  className?: string
  inputSize?: 'xs' | 'sm' | 'md' | 'lg'
}
export default function Input({
  label,
  name,
  error,
  tooltipText,
  required,
  className,
  inputSize = 'md',
  ...props
}: CustomInputProps) {
  const inputSizeClasses = {
    xs: 'h-6 rounded-sm px-2 text-xs',
    sm: 'h-8 rounded-sm px-3 text-sm',
    md: 'h-10 rounded-md px-4 text-md',
    lg: 'h-12 rounded-md px-4 text-lg',
  }
  const inputClass = classNames(
    'block w-full transition-all duration-200 border-0 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500',
    inputSizeClasses[inputSize],
    { 'ring-red-500': error }
  )
  return (
    <div className={`flex flex-col w-full ${className}`}>
      <div className="flex items-center gap-2">
        <label
          htmlFor={name}
          className="block text-sm font-medium leading-6 text-gray-900 "
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {tooltipText && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <MdOutlineInfo size={18} />
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
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
    </div>
  )
}
