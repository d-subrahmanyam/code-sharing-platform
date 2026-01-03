import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { AUTH_LOGIN_REQUEST, AUTH_REGISTER_REQUEST } from '../store/actionTypes'
import { FiMail, FiLock, FiUser, FiAlertCircle, FiCheckCircle } from 'react-icons/fi'

/**
 * Login Page Component
 * Handles user authentication with login and registration forms
 */
const LoginPage: React.FC = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated } = useSelector((state: any) => state.auth || {})
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  })

  // Watch for successful login and redirect
  useEffect(() => {
    if (isAuthenticated) {
      // Redirect to home (admin routing can be added later if roles are implemented)
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isLogin) {
        // Login
        dispatch({
          type: AUTH_LOGIN_REQUEST,
          payload: { email: formData.email, password: formData.password },
        } as any)
      } else {
        // Register - similar to login but with username
        dispatch({
          type: 'AUTH_REGISTER_REQUEST',
          payload: {
            username: formData.username,
            email: formData.email,
            password: formData.password,
          },
        } as any)
      }
      // Redirect handled by useEffect watching isAuthenticated
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white rounded-t-lg">
          <h1 className="text-3xl font-bold">Code Sharing</h1>
          <p className="text-blue-100 mt-2">Share & Collaborate on Code</p>
        </div>

        {/* Form Container */}
        <div className="px-6 py-8">
          {/* Tab Toggle */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => {
                setIsLogin(true)
                setError(null)
                setFormData({ email: '', password: '', username: '' })
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                isLogin
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔐 Login
            </button>
            <button
              onClick={() => {
                setIsLogin(false)
                setError(null)
                setFormData({ email: '', password: '', username: '' })
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                !isLogin
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✨ Register
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <FiAlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field (Register Only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FiUser size={16} className="text-blue-500" />
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                    required
                    className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder-gray-400"
                  />
                  <FiUser className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FiMail size={16} className="text-blue-500" />
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                  className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder-gray-400"
                />
                <FiMail className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FiLock size={16} className="text-blue-500" />
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder-gray-400"
                />
                <FiLock className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin mr-2">⟳</span>
                  {isLogin ? 'Logging in...' : 'Creating account...'}
                </span>
              ) : isLogin ? (
                'Login'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Demo Notice */}
          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-gray-600">
            <p className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <FiCheckCircle size={16} className="text-blue-500" />
              Demo Credentials:
            </p>
            <p className="text-xs ml-6">📧 demo@example.com</p>
            <p className="text-xs ml-6">🔑 demo123</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
