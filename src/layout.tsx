import { Link, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="h-full">
      <div className="flex justify-center">
        <Link
          to={'physical-therapists'}
          className="text-lg text-gray-700 hover:underline"
        >
          View Management Dashboard
        </Link>
      </div>
      <Outlet />
    </div>
  )
}
