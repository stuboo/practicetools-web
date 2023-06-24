import { InputHTMLAttributes, forwardRef } from 'react'

type CheckboxProps = InputHTMLAttributes<HTMLInputElement>

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>((props, ref) => {
  return (
    <input
      type="checkbox"
      ref={ref}
      className="peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
      {...props}
    />
  )
})

export default Checkbox
