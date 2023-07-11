import { ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
  className?: string
  bgColor?: string
}

export default function Container({
  bgColor,
  children,
  className,
}: ContainerProps) {
  return (
    <div className={`flex justify-center ${bgColor} min-h-full`}>
      <div className={`w-full max-w-7xl px-6 lg:px-0 ${className}`}>
        {children}
      </div>
    </div>
  )
}
