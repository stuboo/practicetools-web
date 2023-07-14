import { Link } from 'react-router-dom'
import {
  AiOutlineFilePdf,
  AiOutlineForm,
  AiOutlineSearch,
} from 'react-icons/ai'
import Input from '../../components/input'
import Button from '../../components/button'

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
    icon: <AiOutlineFilePdf size={58} />,
    href: '/combine-pdfs',
  },

  {
    title: 'Search Therapists',
    description: 'Locate therapists around you',
    icon: <AiOutlineSearch size={58} />,
    href: '/search-therapists',
  },

  {
    title: 'Consent Form Generator',
    description: 'Generate consent form dynamically',
    icon: <AiOutlineForm size={58} />,
    // href: '/consent-form-generator',
  },
]

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-10 bg-gray-50 h-full">
      <h1 className="text-4xl font-bold mt-8">Office Tools</h1>
      <div className="grid grid-cols-4 gap-10 px-10 py-10 w-full max-w-7xl">
        {toolsList.map(({ title, description, href, action, icon }) => (
          <Link key={title} to={href ?? '#'}>
            <div
              className="flex flex-col gap-4 items-center bg-blue-100 py-8 px-10 w-full rounded-2xl cursor-pointer transition-all duration-500 hover:shadow-xl hover:scale-105 h-full"
              onClick={() => {
                action && action()
              }}
            >
              {/* Icon Section */}
              <div>{icon}</div>

              {/* Title Section */}
              <div className="text-xl font-bold text-center line-clamp-2">
                {title}
              </div>

              {/* Description Section */}
              <p className="font-light line-clamp-2 text-center">
                {description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex gap-4"></div>
    </div>
  )
}
