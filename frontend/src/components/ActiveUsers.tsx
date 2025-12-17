import React from 'react'
import { FiAward } from 'react-icons/fi'

export interface ActiveUser {
  id: string
  username: string
  timestamp: Date
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
          <div key={user.id} className="relative">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getUserColor(
                user.id
              )} cursor-default transition-transform hover:scale-110`}
              title={user.username}
            >
              {truncateUsername(user.username).toUpperCase()[0]}
            </div>
            {ownerId === user.id && (
              <div
                className="absolute -top-1 -right-1 text-yellow-400"
                title="Owner"
              >
                <FiAward size={12} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
