import React from 'react'
import { useParams } from 'react-router-dom'
import EditorPage from './EditorPage'

/**
 * Joinee Editor Page Component
 * Wrapper for joinee-only editor session (/join/:tinyCode)
 * Provides joinee-specific features like code viewing and real-time updates
 * Hides owner controls like save and sharing
 */
const JoineeEditorPage: React.FC = () => {
  const params = useParams<{ tinyCode?: string }>()
  
  // Pass through to EditorPage with joinee context
  return <EditorPage isJoineeFlow={true} {...params} />
}

export default JoineeEditorPage
