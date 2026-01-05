/**
 * Editor Security Utilities
 * Handles copy/paste prevention and security event tracking
 */

/**
 * Prevent copy action and record event
 */
export function preventCopy(
  event: ClipboardEvent,
  isLocked: boolean,
  onSecurityEvent: (eventType: string) => void
) {
  if (isLocked) {
    event.preventDefault()
    try {
      onSecurityEvent('COPY_ATTEMPT')
    } catch (e) {
      console.warn('[EditorSecurity] Error recording copy event:', e)
    }
    console.warn('[EditorSecurity] Copy attempt blocked - editor locked')
  }
}

/**
 * Prevent paste action and record event
 */
export function preventPaste(
  event: ClipboardEvent,
  isLocked: boolean,
  onSecurityEvent: (eventType: string) => void
) {
  if (isLocked) {
    event.preventDefault()
    try {
      onSecurityEvent('PASTE_ATTEMPT')
    } catch (e) {
      console.warn('[EditorSecurity] Error recording paste event:', e)
    }
    console.warn('[EditorSecurity] Paste attempt blocked - editor locked')
  }
}

/**
 * Prevent context menu (right-click) copy/cut/paste
 */
export function preventContextMenu(
  event: MouseEvent,
  isLocked: boolean,
  onSecurityEvent: (eventType: string) => void
) {
  if (isLocked) {
    event.preventDefault()
    onSecurityEvent('CONTEXT_MENU_ATTEMPT')
    console.warn('[EditorSecurity] Context menu blocked - editor locked')
  }
}

/**
 * Prevent cut action
 */
export function preventCut(
  event: ClipboardEvent,
  isLocked: boolean,
  onSecurityEvent: (eventType: string) => void
) {
  if (isLocked) {
    event.preventDefault()
    try {
      onSecurityEvent('COPY_ATTEMPT')
    } catch (e) {
      console.warn('[EditorSecurity] Error recording cut event:', e)
    }
    console.warn('[EditorSecurity] Cut attempt blocked - editor locked')
  }
}

/**
 * Disable drag and drop
 */
export function preventDragDrop(
  event: DragEvent,
  isLocked: boolean,
  onSecurityEvent: (eventType: string) => void
) {
  if (isLocked) {
    event.preventDefault()
    event.dataTransfer!.dropEffect = 'none'
    onSecurityEvent('PASTE_ATTEMPT')
    console.warn('[EditorSecurity] Drag and drop blocked - editor locked')
  }
}

/**
 * Prevent keyboard shortcuts for cut/copy/paste (Ctrl+C, Ctrl+V, Ctrl+X)
 */
export function preventKeyboardShortcuts(
  event: KeyboardEvent,
  isLocked: boolean,
  onSecurityEvent: (eventType: string) => void
) {
  console.log('[EditorSecurity] KeyDown event triggered:', { isLocked, key: event.key, ctrlKey: event.ctrlKey, metaKey: event.metaKey })
  
  if (!isLocked) {
    console.log('[EditorSecurity] Editor not locked, allowing keyboard action')
    return
  }

  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform)
  const ctrlKey = isMac ? event.metaKey : event.ctrlKey

  console.log('[EditorSecurity] Editor locked, checking for restricted key combinations:', { isMac, ctrlKey, key: event.key.toLowerCase() })

  // Ctrl+C (Copy) or Cmd+C on Mac
  if (ctrlKey && event.key.toLowerCase() === 'c') {
    event.preventDefault()
    console.warn('[EditorSecurity] Copy (Ctrl+C) attempt blocked, calling onSecurityEvent')
    onSecurityEvent('COPY_ATTEMPT')
  }

  // Ctrl+V (Paste) or Cmd+V on Mac
  if (ctrlKey && event.key.toLowerCase() === 'v') {
    event.preventDefault()
    console.warn('[EditorSecurity] Paste (Ctrl+V) attempt blocked, calling onSecurityEvent')
    onSecurityEvent('PASTE_ATTEMPT')
  }

  // Ctrl+X (Cut) or Cmd+X on Mac
  if (ctrlKey && event.key.toLowerCase() === 'x') {
    event.preventDefault()
    console.warn('[EditorSecurity] Cut (Ctrl+X) attempt blocked, calling onSecurityEvent')
    onSecurityEvent('COPY_ATTEMPT')
  }
}

/**
 * Setup all security event listeners
 */
export function setupSecurityListeners(
  editorElement: HTMLElement | null,
  isLocked: boolean,
  onSecurityEvent: (eventType: string) => void
) {
  if (!editorElement) {
    console.log('[EditorSecurity] setupSecurityListeners: editorElement is null')
    return () => {}
  }

  console.log('[EditorSecurity] setupSecurityListeners called', { isLocked, editorElementTag: editorElement.tagName })

  const handleCopy = (e: Event) =>
    preventCopy(e as ClipboardEvent, isLocked, onSecurityEvent)
  const handlePaste = (e: Event) =>
    preventPaste(e as ClipboardEvent, isLocked, onSecurityEvent)
  const handleCut = (e: Event) =>
    preventCut(e as ClipboardEvent, isLocked, onSecurityEvent)
  const handleContextMenu = (e: Event) =>
    preventContextMenu(e as MouseEvent, isLocked, onSecurityEvent)
  const handleDragOver = (e: Event) =>
    preventDragDrop(e as DragEvent, isLocked, onSecurityEvent)
  const handleDrop = (e: Event) =>
    preventDragDrop(e as DragEvent, isLocked, onSecurityEvent)
  const handleKeyDown = (e: Event) =>
    preventKeyboardShortcuts(e as KeyboardEvent, isLocked, onSecurityEvent)

  // Also try to find and attach to textarea directly
  const textarea = editorElement.querySelector('textarea')
  console.log('[EditorSecurity] Found textarea element:', !!textarea)
  
  // Add event listeners to container with capture phase
  console.log('[EditorSecurity] Adding event listeners to container (capture phase for keydown)')
  editorElement.addEventListener('copy', handleCopy, false)
  editorElement.addEventListener('paste', handlePaste, false)
  editorElement.addEventListener('cut', handleCut, false)
  editorElement.addEventListener('contextmenu', handleContextMenu, false)
  editorElement.addEventListener('dragover', handleDragOver, false)
  editorElement.addEventListener('drop', handleDrop, false)
  editorElement.addEventListener('keydown', handleKeyDown, true) // Use capture phase for keydown

  // Also add listeners directly to textarea if found
  let textareaListeners: Array<{ type: string; handler: EventListener; capture: boolean }> = []
  if (textarea) {
    console.log('[EditorSecurity] Adding event listeners directly to textarea')
    const textareaHandlers = [
      { type: 'copy', handler: handleCopy, capture: false },
      { type: 'paste', handler: handlePaste, capture: false },
      { type: 'cut', handler: handleCut, capture: false },
      { type: 'contextmenu', handler: handleContextMenu, capture: false },
      { type: 'keydown', handler: handleKeyDown, capture: false },
    ]
    
    textareaHandlers.forEach(({ type, handler, capture }) => {
      textarea.addEventListener(type, handler, capture)
      textareaListeners.push({ type, handler, capture })
    })
  }

  // Return cleanup function
  return () => {
    console.log('[EditorSecurity] Cleaning up security event listeners')
    editorElement.removeEventListener('copy', handleCopy, false)
    editorElement.removeEventListener('paste', handlePaste, false)
    editorElement.removeEventListener('cut', handleCut, false)
    editorElement.removeEventListener('contextmenu', handleContextMenu, false)
    editorElement.removeEventListener('dragover', handleDragOver, false)
    editorElement.removeEventListener('drop', handleDrop, false)
    editorElement.removeEventListener('keydown', handleKeyDown, true) // Use capture phase for keydown

    // Remove listeners from textarea
    textareaListeners.forEach(({ type, handler, capture }) => {
      textarea?.removeEventListener(type, handler, capture)
    })
  }
}

/**
 * Get visual indicator for lock status
 */
export function getLockStatusIndicator(isLocked: boolean, isJoineeSession: boolean) {
  if (!isJoineeSession) {
    return {
      status: 'unlocked',
      message: 'Editor is unlocked - you can edit',
      color: 'green',
      icon: '🔓',
    }
  }

  if (isLocked) {
    return {
      status: 'locked',
      message: 'Editor is locked - read-only mode',
      color: 'red',
      icon: '🔒',
    }
  }

  return {
    status: 'unlocked',
    message: 'Editor is unlocked - you can edit',
    color: 'green',
    icon: '🔓',
  }
}

/**
 * Validate action against lock state
 */
export function isActionAllowed(
  action: 'edit' | 'copy' | 'paste' | 'cut',
  isLocked: boolean,
  isOwner: boolean
): boolean {
  // Owner can always perform actions
  if (isOwner) return true

  // If locked, no actions allowed except view
  if (isLocked) {
    return false // No actions allowed when locked
  }

  // If unlocked, allow all actions
  return true
}
