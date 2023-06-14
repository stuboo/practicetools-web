interface CustomButtonProps
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  size?: string
  title: string
  variant?: 'primary' | 'ghost'
  iconLeft?: React.ReactNode
}

export default function Button({
  variant,
  iconLeft,
  title,
  ...props
}: CustomButtonProps) {
  let classDecoration
  if (variant === 'ghost') {
    classDecoration = 'text-sm font-semibold leading-6 text-gray-900'
  } else {
    classDecoration =
      'rounded-md h-9 bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
  }
  return (
    <button type="submit" className={`${classDecoration}`} {...props}>
      {iconLeft}
      {title}
    </button>
  )
}
