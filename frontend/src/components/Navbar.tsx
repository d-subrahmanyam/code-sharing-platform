import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { AUTH_LOGOUT } from '../store/actionTypes'
import { ThemeToggle } from './ThemeToggle'
import { 
  FiCode, 
  FiMenu, 
  FiX, 
  FiPlus, 
  FiUser, 
  FiFileText, 
  FiSettings, 
  FiLogOut,
  FiHome,
  FiSearch,
  FiTrendingUp
} from 'react-icons/fi'

/**
 * Navigation Bar Component
 * Main navigation with user menu and authentication
 */
const Navbar: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [showMenu, setShowMenu] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)

  // Get auth state from Redux
  const { isAuthenticated, user } = useSelector((state: any) => state.auth || {})

  const handleLogout = () => {
    dispatch({
      type: AUTH_LOGOUT,
    } as any)
    navigate('/login')
    setShowMenu(false)
    setShowSidebar(false)
  }

  return (
    <>
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
            <FiCode size={28} />
            <span>CodeShare</span>
          </Link>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                {/* Create Button */}
                <button
                  onClick={() => navigate('/editor/new')}
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  <FiPlus size={18} />
                  Create
                </button>

                {/* User Menu */}
                <div className="relative hidden md:block">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-gray-700 dark:text-gray-200 font-medium">
                      {user?.username || 'User'}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-10">
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setShowMenu(false)}
                      >
                        <FiUser size={18} />
                        <span>Profile</span>
                      </Link>
                      <Link
                        to="/my-snippets"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setShowMenu(false)}
                      >
                        <FiFileText size={18} />
                        <span>My Snippets</span>
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setShowMenu(false)}
                      >
                        <FiSettings size={18} />
                        <span>Settings</span>
                      </Link>
                      <hr className="my-2 dark:border-gray-700" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <FiLogOut size={18} />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Toggle menu"
                >
                  {showSidebar ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="hidden md:block px-4 py-2 text-blue-600 font-semibold hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="hidden md:block px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign Up
              </button>
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Toggle menu"
                >
                  {showSidebar ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Collapsible Right Sidebar */}
      {showSidebar && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowSidebar(false)}
          />
          
          {/* Sidebar Panel */}
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-xl">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Menu</h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-4 space-y-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
                    onClick={() => setShowSidebar(false)}
                  >
                    <FiHome size={20} />
                    <span className="font-medium">Home</span>
                  </Link>
                  <button
                    onClick={() => {
                      navigate('/editor/new')
                      setShowSidebar(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
                  >
                    <FiPlus size={20} />
                    <span>Create Snippet</span>
                  </button>
                  <Link
                    to="/my-snippets"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() => setShowSidebar(false)}
                  >
                    <FiFileText size={20} />
                    <span className="font-medium">My Snippets</span>
                  </Link>
                  <Link
                    to="/"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() => setShowSidebar(false)}
                  >
                    <FiTrendingUp size={20} />
                    <span className="font-medium">Trending</span>
                  </Link>
                  <Link
                    to="/"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() => setShowSidebar(false)}
                  >
                    <FiSearch size={20} />
                    <span className="font-medium">Explore</span>
                  </Link>
                  <hr className="my-4" />
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() => setShowSidebar(false)}
                  >
                    <FiUser size={20} />
                    <span className="font-medium">Profile</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() => setShowSidebar(false)}
                  >
                    <FiSettings size={20} />
                    <span className="font-medium">Settings</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                  >
                    <FiLogOut size={20} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() => setShowSidebar(false)}
                  >
                    <FiHome size={20} />
                    <span className="font-medium">Home</span>
                  </Link>
                  <button
                    onClick={() => {
                      navigate('/login')
                      setShowSidebar(false)
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-blue-600 border-2 border-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                  >
                    <span>Login</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/login')
                      setShowSidebar(false)
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
                  >
                    <span>Sign Up</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
export default Navbar