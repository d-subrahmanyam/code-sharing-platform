import React from 'react'
import { FiLock, FiUnlock, FiAlertCircle } from 'react-icons/fi'

interface EditorLockControlProps {
  isLocked: boolean
  isLoading: boolean
  isOwner: boolean
  isJoineeSession: boolean
  lockReason?: string | null
  pendingEvents: number
  onLock: (reason: string) => void
  onUnlock: () => void
  onViewEvents: () => void
}

/**
 * Editor Lock Control Component
 * UI for owner to manage lock/unlock state
 * Shows lock status for joinee
 */
export const EditorLockControl: React.FC<EditorLockControlProps> = ({
  isLocked,
  isLoading,
  isOwner,
  isJoineeSession,
  lockReason,
  pendingEvents,
  onLock,
  onUnlock,
  onViewEvents,
}) => {
  if (!isJoineeSession && !isOwner) {
    return null // Not applicable for owner's own session
  }

  return (
    <div className="editor-lock-control">
      {/* Status Banner */}
      <div
        className={`lock-status-banner ${isLocked ? 'locked' : 'unlocked'}`}
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '500',
        }}
      >
        {isLocked ? (
          <>
            <FiLock size={16} />
            <span>Editor is locked - Read-only mode</span>
            {lockReason && <span className="text-gray-500">({lockReason})</span>}
          </>
        ) : (
          <>
            <FiUnlock size={16} />
            <span>Editor is unlocked - You can edit</span>
          </>
        )}
      </div>

      {/* Owner Controls */}
      {isOwner && isJoineeSession && (
        <div className="lock-controls" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <button
            onClick={() => onLock('Editor locked by owner')}
            disabled={isLocked || isLoading}
            className={`lock-button ${isLocked ? 'disabled' : ''}`}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: isLocked ? '#ccc' : '#e74c3c',
              color: 'white',
              cursor: isLocked || isLoading ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isLocked || isLoading ? 0.5 : 1,
            }}
          >
            <FiLock size={14} />
            Lock Editor
          </button>

          <button
            onClick={onUnlock}
            disabled={!isLocked || isLoading}
            className={`unlock-button ${!isLocked ? 'disabled' : ''}`}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: !isLocked ? '#ccc' : '#27ae60',
              color: 'white',
              cursor: !isLocked || isLoading ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: !isLocked || isLoading ? 0.5 : 1,
            }}
          >
            <FiUnlock size={14} />
            Unlock Editor
          </button>

          {/* Pending Events Alert */}
          {pendingEvents > 0 && (
            <button
              onClick={onViewEvents}
              className="events-alert"
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '2px solid #f39c12',
                backgroundColor: '#fff3cd',
                color: '#856404',
                cursor: 'pointer',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginLeft: 'auto',
              }}
            >
              <FiAlertCircle size={14} />
              <span>{pendingEvents} unauthorized attempt{pendingEvents > 1 ? 's' : ''}</span>
            </button>
          )}
        </div>
      )}

      {/* Joinee Read-only Indicator */}
      {!isOwner && isJoineeSession && isLocked && (
        <div
          className="read-only-indicator"
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: '#f0f0f0',
            color: '#555',
            fontSize: '12px',
            textAlign: 'center',
            marginBottom: '8px',
          }}
        >
          ℹ️ This editor is currently in read-only mode. You can view the code but cannot edit it.
        </div>
      )}

      {/* Joinee Can Edit Indicator */}
      {!isOwner && isJoineeSession && !isLocked && (
        <div
          className="editable-indicator"
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: '#d4edda',
            color: '#155724',
            fontSize: '12px',
            textAlign: 'center',
            marginBottom: '8px',
          }}
        >
          ✓ The owner has enabled editing. You can now edit the code.
        </div>
      )}
    </div>
  )
}

export default EditorLockControl
