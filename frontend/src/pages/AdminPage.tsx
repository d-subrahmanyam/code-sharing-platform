import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { FiSettings, FiUsers, FiActivity, FiAlertCircle, FiCheck, FiX } from 'react-icons/fi'
import apiClient from '../api/client'

/**
 * Admin Dashboard Page Component
 * Displays admin-only features for managing the platform
 */
const AdminPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useSelector((state: any) => state.auth || {})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSessions, setActiveSessions] = useState([])
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'users'>('overview')

  // Check authentication and admin role
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    // Check if user is admin
    if (user?.role !== 'ADMIN') {
      setError('You do not have permission to access the admin dashboard')
      setLoading(false)
      return
    }

    loadDashboardData()
  }, [isAuthenticated, user?.role, user?.id])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch active sessions
      const sessionsRes = await apiClient.get('/admin/sessions')
      setActiveSessions(sessionsRes.data || [])

      // Fetch health status
      const healthRes = await apiClient.get('/admin/health')
      setHealthStatus(healthRes.data)
    } catch (err: any) {
      // Check if it's an authentication error
      if (err.response?.status === 401) {
        // The apiClient response interceptor will redirect to login
        return
      }
      
      setError(err.response?.data?.error || err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  if (error && error.includes('permission')) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center max-w-md">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FiSettings className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Manage platform settings and monitor activity</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex gap-3">
              <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-6 py-4 font-semibold text-center transition-colors border-b-2 ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FiActivity className="w-5 h-5" />
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex-1 px-6 py-4 font-semibold text-center transition-colors border-b-2 ${
                activeTab === 'sessions'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FiUsers className="w-5 h-5" />
                Sessions
              </div>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 px-6 py-4 font-semibold text-center transition-colors border-b-2 ${
                activeTab === 'users'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FiUsers className="w-5 h-5" />
                Users
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Health Status Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">System Health</h3>
                  {healthStatus?.status === 'UP' ? (
                    <FiCheck className="w-5 h-5 text-green-500" />
                  ) : (
                    <FiX className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {healthStatus?.status || 'Unknown'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {healthStatus?.message || 'Unable to fetch health status'}
                </p>
              </div>

              {/* Active Sessions Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Active Sessions</h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {activeSessions.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Collaborative editing sessions
                </p>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                <button
                  onClick={loadDashboardData}
                  className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors mb-2"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Active Sessions</h3>
              </div>
              {activeSessions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">
                          Session ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">
                          Participants
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">
                          Started
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {activeSessions.map((session: any) => (
                        <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                            {session.id}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                            {session.participantCount || 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {new Date(session.startedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">No active sessions</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">User Management</h3>
              <p className="text-gray-600 dark:text-gray-400">
                User management features will be available here
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminPage
