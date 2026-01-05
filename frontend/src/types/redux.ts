/**
 * Redux Type Definitions
 * Defines TypeScript interfaces for Redux actions and state
 */

// Auth Types
export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
}

export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  createdAt: string
  role?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  username: string
  email: string
  password: string
  confirmPassword: string
}

// Joinee Session Types
export interface JoineeSessionState {
  isLoading: boolean
  error: string | null
  ownerId: string | null
  ownerUsername: string | null
  title: string | null
  code: string | null
  language: string | null
  tags: string[]
  description: string | null
}

// Snippet Types
export interface SnippetState {
  items: CodeSnippet[]
  currentSnippet: CodeSnippet | null
  joineeSession: JoineeSessionState
  loading: boolean
  error: string | null
}

export interface CodeSnippet {
  id: string
  title: string
  description: string
  code: string
  language: string
  author: User
  tags: string[]
  url: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
  views: number
  comments: Comment[]
}

// Comment Types
export interface CommentState {
  items: Comment[]
  loading: boolean
  error: string | null
}

export interface Comment {
  id: string
  content: string
  author: User
  snippetId: string
  parentId?: string
  replies: Comment[]
  createdAt: string
  updatedAt: string
  likes: number
}

// UI Types
export interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}

export interface UIState {
  notifications: Notification[]
  sidebarOpen: boolean
  theme: 'light' | 'dark'
}
