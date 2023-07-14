import classnames from 'classnames'
import { forwardRef } from 'react'
import { FaSpinner } from 'react-icons/fa'

interface CustomButtonProps
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  title: string
  variant?: 'solid' | 'ghost' | 'outline' | 'link'
  iconLeft?: React.ReactNode
  disabled?: boolean
  colorScheme?: ColorScheme
  isLoading?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

type ColorScheme =
  | 'gray'
  | 'red'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'pink'
  | 'teal'

const getColorClass = (
  variant: 'solid' | 'ghost' | 'outline' | 'link',
  color: ColorScheme
) => {
  switch (variant) {
    case 'solid':
      return generateSolidClasses(color)
    case 'outline':
      return generateOutlineClasses(color)
    case 'ghost':
      return generateGhostClasses(color)
    case 'link':
      return generateLinkClasses(color)
  }
}

const generateLinkClasses = (color: ColorScheme) => {
  switch (color) {
    case 'gray':
      return 'text-gray-500 hover:underline'
    case 'red':
      return 'text-red-500 hover:underline'
    case 'yellow':
      return 'text-yellow-500 hover:underline'
    case 'green':
      return 'text-green-500 hover:underline'
    case 'blue':
      return 'text-blue-500 hover:underline'
    case 'indigo':
      return 'text-indigo-500 hover:underline'
    case 'purple':
      return 'text-purple-500 hover:underline'
    case 'pink':
      return 'text-pink-500 hover:underline'
    case 'teal':
      return 'text-teal-500 hover:underline'
  }
}

const generateGhostClasses = (color: ColorScheme) => {
  switch (color) {
    case 'gray':
      return 'bg-transparent hover:bg-gray-50 text-gray-600 focus-visible:outline-gray-600'
    case 'red':
      return 'bg-transparent hover:bg-red-50 text-red-600 focus-visible:outline-red-600'
    case 'yellow':
      return 'bg-transparent hover:bg-yellow-50 text-yellow-600 focus-visible:outline-yellow-600'
    case 'green':
      return 'bg-transparent hover:bg-green-50 text-green-600 focus-visible:outline-green-600'
    case 'blue':
      return 'bg-transparent hover:bg-blue-50 text-blue-600 focus-visible:outline-blue-600'
    case 'indigo':
      return 'bg-transparent hover:bg-indigo-50 text-indigo-600 focus-visible:outline-indigo-600'
    case 'purple':
      return 'bg-transparent hover:bg-purple-50 text-purple-600 focus-visible:outline-purple-600'
    case 'pink':
      return 'bg-transparent hover:bg-pink-50 text-pink-600 focus-visible:outline-pink-600'
    case 'teal':
      return 'bg-transparent hover:bg-teal-50 text-teal-600 focus-visible:outline-teal-600'
  }
}

const generateOutlineClasses = (color: ColorScheme) => {
  switch (color) {
    case 'gray':
      return 'text-gray-800 border-[1px] border-gray-200 bg-transparent focus-visible:outline-gray-600 hover:bg-gray-50'
    case 'red':
      return 'text-red-500 border-[1px] border-[currentColor] bg-transparent focus-visible:outline-red-600 hover:bg-red-50'
    case 'yellow':
      return 'text-yellow-600 border-[1px] border-[currentColor] bg-transparent focus-visible:outline-yellow-600 hover:bg-yellow-50'
    case 'green':
      return 'text-green-500 border-[1px] border-[currentColor] bg-transparent focus-visible:outline-green-600 hover:bg-green-50'
    case 'blue':
      return 'text-blue-600 border-[1px] border-[currentColor] bg-transparent focus-visible:outline-blue-600 hover:bg-blue-50'
    case 'indigo':
      return 'text-indigo-500 border-[1px] border-[currentColor] bg-transparent focus-visible:outline-indigo-600 hover:bg-indigo-50'
    case 'purple':
      return 'text-purple-500 border-[1px] border-[currentColor] bg-transparent focus-visible:outline-purple-600 hover:bg-purple-50'
    case 'pink':
      return 'text-pink-600 border-[1px] border-[currentColor] bg-transparent focus-visible:outline-pink-600 hover:bg-pink-50'
    case 'teal':
      return 'text-teal-600 border-[1px] border-[currentColor] bg-transparent focus-visible:outline-teal-600 hover:bg-teal-50'
  }
}

const generateSolidClasses = (color: ColorScheme) => {
  switch (color) {
    case 'red':
      return 'text-white bg-red-500 hover:bg-red-600 focus-visible:outline-red-600'
    case 'blue':
      return 'text-white bg-blue-500 hover:bg-blue-600 focus-visible:outline-blue-600'
    case 'green':
      return 'text-white bg-green-500 hover:bg-green-600 focus-visible:outline-green-600'
    case 'yellow':
      return 'bg-yellow-400 hover:bg-yellow-500 focus-visible:outline-yellow-600'
    case 'purple':
      return 'text-white bg-purple-500 hover:bg-purple-600 focus-visible:outline-purple-600'
    case 'indigo':
      return 'text-white bg-indigo-500 hover:bg-indigo-600 focus-visible:outline-indigo-600'
    case 'gray':
      return 'text-gray-800 bg-gray-100 hover:bg-gray-200 focus-visible:outline-gray-600'
    case 'pink':
      return 'text-white bg-pink-500 hover:bg-pink-600 focus-visible:outline-pink-600'
    case 'teal':
      return 'text-white bg-teal-500 hover:bg-teal-600 focus-visible:outline-teal-600'

    default:
      return 'text-white bg-gray-500 hover:bg-gray-600 focus-visible:outline-gray-600'
  }
}

const Button = forwardRef<HTMLButtonElement, CustomButtonProps>(
  (
    {
      variant = 'solid',
      iconLeft,
      title,
      disabled,
      isLoading,
      className,
      colorScheme = 'indigo',
      size = 'md',
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'h-8 px-3 text-sm min-w-[2rem]',
      md: 'h-10 px-4 text-md min-w-[2.5rem]',
      lg: 'h-12 px-6 text-lg min-w-[3rem]',
      xl: 'h-14 px-8 text-xl min-w-[3.5rem]',
    }
    const bgClasses = getColorClass(variant, colorScheme)
    const buttonClasses = classnames(
      'flex items-center justify-center gap-2 font-semibold leading-5 whitespace-nowrap ',
      'rounded-md font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
      bgClasses,
      {
        'opacity-50 cursor-not-allowed': disabled || isLoading,
      },
      sizeClasses[size]
    )

    return (
      <button
        type="submit"
        ref={ref}
        className={classnames(buttonClasses, className)}
        {...props}
      >
        {isLoading && <FaSpinner className="animate-spin" />}
        {iconLeft && (
          <span className="w-5 h-5 flex justify-center items-center">
            {iconLeft}
          </span>
        )}
        {title}
      </button>
    )
  }
)

export default Button

Button.displayName = 'Button'
