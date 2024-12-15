import { QrCodeIcon } from '@heroicons/react/24/outline'
import { PDF } from '../../pages/combine-pdf/types'

type CardProps = {
  pdf: PDF
  onBookSelected?: (book: PDF) => void
  onBookRemoved?: (book: PDF) => void
}

const BookCard = ({ pdf, onBookSelected, onBookRemoved }: CardProps) => {
  const canBeSelected = !(pdf.selected ? true : false)

  const toggleSelection = () => {
    if (canBeSelected && onBookSelected) onBookSelected(pdf)
    else if (onBookRemoved) onBookRemoved(pdf)
  }

  return (
    <div className="relative flex flex-col w-full h-full overflow-hidden transition-all duration-500 bg-blue-100 rounded-lg shadow-lg cursor-pointer hover:shadow-xl hover:scale-105">
      <a
        href={pdf.source}
        target="_blank"
        className="relative h-16 overflow-hidden"
      >
        <img
          src={pdf.thumbnail}
          alt={pdf.title}
          className="inset-0 object-cover object-top w-full rounded-lg opacity-50 hover:opacity-100"
        />
      </a>
      <div className="flex flex-col justify-between flex-auto px-4 pb-4">
        <a href={pdf.source} target="_blank" className="flex flex-col flex-1">
          <h1 className="mt-2 text-xl font-bold text-blue-900">{pdf.title}</h1>
          <p className="flex-1 my-2 text-sm text-gray-600">{pdf.description}</p>
          <div className="flex flex-wrap items-end flex-1 mt-2">
            {pdf.category.map((category, index) => (
              <span
                key={index}
                className="flex items-center px-3 py-2 mb-2 mr-1 text-xs font-bold leading-none text-blue-500 bg-blue-200 rounded-full whitespace-nowrap"
              >
                {category}
              </span>
            ))}
          </div>
        </a>
        <div className="">
          <div className="flex justify-between mt-3 item-center">
            <h1 className="text-xl font-bold text-blue-900">
              <small>by</small> {pdf.author}
            </h1>
            <div className="flex gap-2">
              <button
                type="button"
                className={`p-3 w-12 text-base font-medium rounded-full text-white bg-white `}
              >
                <QrCodeIcon className="w-6 h-6 text-black" />
              </button>
              <button
                type="button"
                onClick={toggleSelection}
                className={`p-3 text-base font-medium rounded-full text-white ${
                  pdf.selected ? 'bg-green-500' : 'bg-blue-500'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-6 h-6 transition-all duration-300 ${
                    pdf.selected ? 'rotate-45' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookCard
