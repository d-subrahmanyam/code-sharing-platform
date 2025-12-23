import React from 'react'
import { FiAward, FiUser } from 'react-icons/fi'

export interface ActiveUser {
  id: string
  username: string
  timestamp: Date
  owner?: boolean
}

// Color palette for user avatars
const COLORS = [
  'bg-red-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-teal-500',
]

/**
 * Get a consistent color for a user based on their ID
 */
export function getUserColor(userId: string): string {
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return COLORS[hash % COLORS.length]
}

/**
 * Truncate username to 5-6 characters
 */
export function truncateUsername(username: string): string {
  return username.length > 6 ? username.substring(0, 6) : username
}

/**
 * Active Users Display Component
 * Shows colored avatars of all users currently editing the snippet
 * Marks owner with crown badge
 */
export const ActiveUsers: React.FC<{ users: ActiveUser[]; ownerId?: string }> = ({ users, ownerId }) => {
  if (!users || users.length === 0) {
    return (
      <div className="text-gray-400 text-sm">
        No active users
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-300 text-xs font-semibold">Active Users:</span>
      <div className="flex items-center gap-1 flex-wrap">
        {users.map((user) => (
          <div key={user.id} className="relative group">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getUserColor(
                user.id
              )} cursor-default transition-transform hover:scale-110`}
              title={user.username}
            >
              {truncateUsername(user.username).toUpperCase()[0]}
            </div>
            {user.owner && (
              <div
                className="absolute -top-2 -right-2 text-yellow-300 flex items-center justify-center bg-gray-950 rounded-full p-1 shadow-lg border border-yellow-400"
                title={`${user.username} (Owner)`}
              >
                <FiAward size={14} className="text-yellow-300" />
              </div>
            )}
            {!user.owner && (
              <div
                className="absolute -top-2 -right-2 text-blue-300 flex items-center justify-center bg-gray-950 rounded-full p-1 shadow-lg border border-blue-400"
                title={`${user.username} (Joinee)`}
              >
                <FiUser size={14} className="text-blue-300" />
              </div>
            )}
            {/* Tooltip with full username and owner/joinee status */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {user.username}
              {user.owner && <span className="ml-1 text-yellow-400">👑 Owner</span>}
              {!user.owner && <span className="ml-1 text-blue-400">👤 Joinee</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
