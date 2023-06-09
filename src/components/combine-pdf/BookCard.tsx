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
    <div
      onClick={toggleSelection}
      className="flex relative flex-col bg-blue-100 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-500 cursor-pointer rounded-lg h-full w-full overflow-hidden"
    >
      <div className="relative overflow-hidden h-16">
        <img
          src={pdf.thumbnail}
          alt={pdf.title}
          className="rounded-lg opacity-50 hover:opacity-100 inset-0 w-full object-cover object-top"
        />
      </div>
      <div className="flex-auto px-4 pb-4 flex justify-between flex-col">
        <div className="">
          <h1 className="text-blue-900 font-bold text-xl mt-2">{pdf.title}</h1>
          <p className="my-2 text-gray-600 text-sm">{pdf.description}</p>
        </div>
        <div>
          <div className="flex item-center mt-2 flex-wrap">
            {pdf.category.map((category, index) => (
              <span
                key={index}
                className="bg-blue-200 mb-2 rounded-full text-blue-500 text-xs font-bold px-3 py-2 leading-none flex items-center mr-1 whitespace-nowrap"
              >
                {category}
              </span>
            ))}
          </div>
          <div className="flex item-center justify-between mt-3">
            <h1 className="text-blue-900 font-bold text-xl">
              <small>by</small> {pdf.author}
            </h1>
            <button
              type="button"
              className={`p-3 text-base font-medium rounded-full text-white ${
                pdf.selected ? 'bg-green-500' : 'bg-blue-500'
              }`}
            >
              {pdf.selected ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
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
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookCard
