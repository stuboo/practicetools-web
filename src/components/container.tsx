import React, { ReactNode } from 'react'

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
    <div className={`flex justify-center ${bgColor}`}>
      <div className={`w-full max-w-7xl ${className}`}>{children}</div>
    </div>
  )
}
