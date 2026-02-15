import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

interface CoverageHeaderProps {
  title: string;
  subtitle: string;
}

export function CoverageHeader({ title, subtitle }: CoverageHeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
              {subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {user && (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-gray-600">
                    {user.name || user.email}
                  </span>
                  {user.is_admin && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                      Admin
                    </span>
                  )}
                </div>

                {/* User menu dropdown */}
                <div className="relative group">
                  <button className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 py-1 px-2">
                    Menu ▾
                  </button>
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 hidden group-hover:block z-10">
                    <div className="py-1">
                      <Link
                        to="/change-password"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Change Password
                      </Link>
                      {user.is_admin && (
                        <>
                          <div className="border-t border-gray-100"></div>
                          <Link
                            to="/admin/users"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            User Management
                          </Link>
                        </>
                      )}
                      <div className="border-t border-gray-100"></div>
                      <button
                        onClick={logout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
