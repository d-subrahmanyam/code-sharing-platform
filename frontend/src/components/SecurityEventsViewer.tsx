import React, { useState } from 'react'
import { FiX, FiAlertTriangle, FiCopy } from 'react-icons/fi'

interface SecurityEvent {
  id: string
  userId: string
  userUsername: string
  eventType: string
  eventDescription: string
  isPrevented: boolean
  createdAt: string
  ownerNotified: boolean
}

interface SecurityEventsViewerProps {
  events: SecurityEvent[]
  isOpen: boolean
  onClose: () => void
  onMarkNotified?: (eventId: string) => void
}

/**
 * Security Events Viewer Component
 * Shows unauthorized copy/paste attempts by joinee
 */
export const SecurityEventsViewer: React.FC<SecurityEventsViewerProps> = ({
  events,
  isOpen,
  onClose,
  onMarkNotified,
}) => {
  if (!isOpen) return null

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'COPY_ATTEMPT':
        return <FiCopy size={16} className="text-orange-500" />
      case 'PASTE_ATTEMPT':
        return <FiCopy size={16} className="text-orange-500" />
      default:
        return <FiAlertTriangle size={16} className="text-red-500" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <FiAlertTriangle size={20} className="text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Unauthorized Access Attempts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No unauthorized access attempts recorded.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="border border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getEventIcon(event.eventType)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {event.userUsername}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {event.eventDescription}
                          </p>
                        </div>
                        <div className="text-right">
                          {event.isPrevented && (
                            <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-xs font-semibold rounded">
                              Blocked
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{formatDate(event.createdAt)}</span>
                        {!event.ownerNotified && onMarkNotified && (
                          <button
                            onClick={() => onMarkNotified(event.id)}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Mark as reviewed
                          </button>
                        )}
                        {event.ownerNotified && (
                          <span className="text-gray-400">✓ Reviewed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default SecurityEventsViewer
