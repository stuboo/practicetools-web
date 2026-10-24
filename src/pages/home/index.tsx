import { Link } from 'react-router-dom'
import {
  AiOutlineFilePdf,
  AiOutlineForm,
  AiOutlineSearch,
  AiOutlineFileText,
  AiOutlineSchedule,
} from 'react-icons/ai'

interface Tools {
  title: string
  href?: string
  action?: () => void
  description?: string | JSX.Element
  icon: JSX.Element
}

const toolsList: Tools[] = [
  {
    title: 'Combine PDF',
    description: 'Merge multiple PDF documents into a single file effortlessly',
    icon: <AiOutlineFilePdf className="w-8 h-8 lg:w-16 lg:h-16" />,
    href: '/combine-pdfs',
  },

  {
    title: 'Search Therapists',
    description: 'Locate therapists around you',
    icon: <AiOutlineSearch className="w-8 h-8 lg:w-16 lg:h-16" />,
    href: '/search-therapists',
  },

  {
    title: 'Scheduling',
    description: 'Guide for scheduling patients with appropriate providers',
    icon: <AiOutlineSchedule className="w-8 h-8 lg:w-16 lg:h-16" />,
    href: '/scheduling',
  },
]

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-10 bg-gray-50 h-full">
      <h1 className="text-4xl font-bold mt-8">Office Tools</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-10 px-10 py-10 w-full max-w-7xl">
        {toolsList.map(({ title, description, href, action, icon }) => (
          <Link key={title} to={href ?? '#'}>
            <div
              className="flex flex-col gap-4 items-center bg-blue-100 py-8 px-3 lg:px-10 w-full rounded-2xl cursor-pointer transition-all duration-500 hover:shadow-xl hover:scale-105 h-full"
              onClick={() => {
                action && action()
              }}
            >
              {/* Icon Section */}
              <div>{icon}</div>

              {/* Title Section */}
              <div className="text-md lg:text-xl font-bold text-center line-clamp-2 flex-grow">
                {title}
              </div>

              {/* Description Section */}
              <p className="text-xs lg:text-sm font-light line-clamp-2 text-center">
                {description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
