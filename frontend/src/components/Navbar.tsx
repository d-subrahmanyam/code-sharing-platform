import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { AUTH_LOGOUT } from '../store/actionTypes'

/**
 * Navigation Bar Component
 * Main navigation with user menu and authentication
 */
const Navbar: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [showMenu, setShowMenu] = useState(false)

  // Get auth state from Redux
  const { isAuthenticated, user } = useSelector((state: any) => state.auth || {})

  const handleLogout = () => {
    dispatch({
      type: AUTH_LOGOUT,
    } as any)
    navigate('/login')
    setShowMenu(false)
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-blue-600">
          <span>{'<'}</span>
          <span>Code Share</span>
          <span>{'>'}</span>
        </Link>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {/* Create Button */}
              <button
                onClick={() => navigate('/editor/new')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                + Create
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-gray-700 font-medium hidden sm:inline">
                    {user?.username || 'User'}
                  </span>
                  <span className="text-gray-500">▼</span>
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-10">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setShowMenu(false)}
                    >
                      👤 Profile
                    </Link>
                    <Link
                      to="/my-snippets"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setShowMenu(false)}
                    >
                      📝 My Snippets
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setShowMenu(false)}
                    >
                      ⚙️ Settings
                    </Link>
                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-blue-600 font-semibold hover:bg-blue-50 rounded-lg transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
