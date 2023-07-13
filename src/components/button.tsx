import classnames from 'classnames'
import { forwardRef } from 'react'
import { FaSpinner } from 'react-icons/fa'

interface CustomButtonProps
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  title: string
  variant?: 'solid' | 'ghost'
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

const generateClassName = (color: ColorScheme) => {
  switch (color) {
    case 'red':
      return 'bg-red-500 hover:bg-red-600 focus-visible:outline-red-600'
      break
    case 'blue':
      return 'bg-blue-500 hover:bg-blue-600 focus-visible:outline-blue-600'
      break
    case 'green':
      return 'bg-green-500 hover:bg-green-600 focus-visible:outline-green-600'
      break
    case 'yellow':
      return 'bg-yellow-500 hover:bg-yellow-600 focus-visible:outline-yellow-600'
      break

    default:
      return 'bg-gray-500 hover:bg-gray-600 focus-visible:outline-gray-600'
      break
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
    const bgClasses = generateClassName(colorScheme)
    const buttonClasses = classnames(
      'flex items-center justify-center gap-2',
      {
        'font-semibold': variant === 'ghost',
        'leading-6': variant === 'ghost',
        'text-gray-900': variant === 'ghost',
        [`rounded-md font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${bgClasses}`]:
          variant === 'solid',
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
