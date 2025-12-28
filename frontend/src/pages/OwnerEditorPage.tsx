import React from 'react'
import { useParams } from 'react-router-dom'
import EditorPage from './EditorPage'

/**
 * Owner Editor Page Component
 * Wrapper for owner-only editor session (/start/:tinyCode and /editor/:snippetId)
 * Provides owner-specific features like saving, sharing, and full control
 */
const OwnerEditorPage: React.FC = () => {
  const params = useParams<{ snippetId?: string; tinyCode?: string }>()
  
  // Pass through to EditorPage with owner context
  return <EditorPage isOwnerFlow={true} {...params} />
}

export default OwnerEditorPage
