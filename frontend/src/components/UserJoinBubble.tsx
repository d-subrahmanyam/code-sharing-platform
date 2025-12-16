import React, { useState, useEffect } from 'react'
import { FiUser, FiX } from 'react-icons/fi'

interface UserJoinNotification {
  id: string
  username: string
  timestamp: Date
}

interface UserJoinBubbleProps {
  notification: UserJoinNotification
  onDismiss?: () => void
  autoDismissMs?: number
}

/**
 * User Join Notification Bubble
 * Displays a toast-like notification when a user joins the editor session
 */
export const UserJoinBubble: React.FC<UserJoinBubbleProps> = ({
  notification,
  onDismiss,
  autoDismissMs = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (autoDismissMs > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onDismiss?.()
      }, autoDismissMs)

      return () => clearTimeout(timer)
    }
  }, [autoDismissMs, onDismiss])

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-green-600 text-white rounded-lg shadow-lg p-4 flex items-center gap-3 animate-slide-in max-w-sm z-50">
      <FiUser size={20} className="text-green-100" />
      <div className="flex-1">
        <p className="font-semibold">{notification.username}</p>
        <p className="text-sm text-green-100">Joined the session</p>
      </div>
      <button
        onClick={() => {
          setIsVisible(false)
          onDismiss?.()
        }}
        className="text-green-100 hover:text-white transition-colors"
      >
        <FiX size={18} />
      </button>
    </div>
  )
}

/**
 * User Join Notifications Container
 * Manages multiple user join notifications
 */
interface UserJoinNotificationsProps {
  notifications: UserJoinNotification[]
  onDismiss?: (id: string) => void
}

export const UserJoinNotifications: React.FC<UserJoinNotificationsProps> = ({
  notifications,
  onDismiss,
}) => {
  return (
    <div className="fixed bottom-4 right-4 space-y-3 z-50">
      {notifications.map((notification, index) => (
        <UserJoinBubble
          key={`${notification.id}-${index}`}
          notification={notification}
          onDismiss={() => onDismiss?.(notification.id)}
          autoDismissMs={5000}
        />
      ))}
    </div>
  )
}

export default UserJoinBubble
