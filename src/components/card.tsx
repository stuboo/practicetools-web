import React from 'react'
import { AiOutlineFilePdf } from 'react-icons/ai'
import { Link } from 'react-router-dom'

interface CardProp {
  title: string
  href?: string
  action?: () => void
  description?: string | JSX.Element
  icon: JSX.Element
}

export default function Card({
  title,
  icon,
  description,
  action,
  href,
}: CardProp) {
  const handleClick = () => {
    action && action()
  }

  return (
    <Link to={href ?? '#'}>
      <div
        className="flex flex-col gap-4 items-center bg-teal-100 py-8 px-10 w-full rounded-2xl cursor-pointer transition-all duration-500 hover:shadow-xl hover:scale-105"
        onClick={handleClick}
      >
        {/* Icon Section */}
        <div>{icon}</div>

        {/* Title Section */}
        <div className="text-xl font-bold">{title}</div>

        {/* Description Section */}
        <p className="font-light line-clamp-2 text-center">{description}</p>
      </div>
    </Link>
  )
}
