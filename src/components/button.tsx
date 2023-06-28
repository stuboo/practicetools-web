import classnames from 'classnames'
import { forwardRef } from 'react'

interface CustomButtonProps
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  size?: string
  title: string
  variant?: 'solid' | 'ghost'
  iconLeft?: React.ReactNode
  disabled?: boolean
  colorScheme?: ColorScheme
  isLoading?: boolean
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
      ...props
    },
    ref
  ) => {
    const bgClasses = generateClassName(colorScheme)
    const buttonClasses = classnames(
      'text-sm',
      'flex',
      'items-center justify-center',
      'gap-2',
      {
        'font-semibold': variant === 'ghost',
        'leading-6': variant === 'ghost',
        'text-gray-900': variant === 'ghost',
        [`rounded-md h-9 px-3 py-2 font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${bgClasses}`]:
          variant === 'solid',
        'opacity-50 cursor-not-allowed': disabled,
      }
    )

    return (
      <button
        type="submit"
        ref={ref}
        className={classnames(buttonClasses, className)}
        {...props}
      >
        {isLoading && <span className="mr-2">Loading...</span>}
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
