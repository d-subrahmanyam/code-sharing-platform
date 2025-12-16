/**
 * Tiny URL Generator for Code Snippets
 * Generates unique, short, shareable codes for snippets
 */

/**
 * Generate a unique tiny code for a snippet
 * Uses base36 encoding to create short, unique identifiers
 * Format: 6-character alphanumeric (e.g., "abc123")
 */
export function generateTinyCode(): string {
  // Generate a random number and convert to base36
  const timestamp = Date.now() % 1000000 // Last 6 digits of timestamp
  const random = Math.floor(Math.random() * 1000000)
  const combined = (timestamp * 1000000 + random).toString()
  
  // Convert to base36 and pad to 6 characters
  let code = (BigInt(combined) % BigInt(Math.pow(36, 6))).toString(36)
  code = code.padStart(6, '0').substring(0, 6).toUpperCase()
  
  return code
}

/**
 * Generate a shareable URL for a snippet
 */
export function generateShareableURL(tinyCode: string, baseURL: string = window.location.origin): string {
  return `${baseURL}/join/${tinyCode}`
}

/**
 * Validate tiny code format
 */
export function isValidTinyCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code)
}

/**
 * Decode tiny code to original snippet ID (if stored)
 * This is a mapping function that should correspond to the backend encoding
 */
export function decodeTinyCode(code: string): string | null {
  if (!isValidTinyCode(code)) {
    return null
  }
  // In real implementation, this would query backend for the mapping
  return code
}

/**
 * Snippet Share Object
 */
export interface SnippetShare {
  snippetId: string
  tinyCode: string
  shareableURL: string
  createdAt: Date
  expiresAt?: Date
}

/**
 * Create a snippet share object
 */
export function createSnippetShare(
  snippetId: string,
  expirationMinutes?: number
): SnippetShare {
  const tinyCode = generateTinyCode()
  const shareableURL = generateShareableURL(tinyCode)
  const createdAt = new Date()
  const expiresAt = expirationMinutes
    ? new Date(createdAt.getTime() + expirationMinutes * 60000)
    : undefined

  return {
    snippetId,
    tinyCode,
    shareableURL,
    createdAt,
    expiresAt,
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      // Use modern clipboard API
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for older browsers or non-https contexts
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      const success = document.execCommand('copy')
      textArea.remove()
      return success
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * Generate a QR code URL for the shareable URL (using external service)
 * Using qr-server API: https://api.qrserver.com/v1/create-qr-code/
 */
export function generateQRCodeURL(shareableURL: string, size: number = 200): string {
  const encodedURL = encodeURIComponent(shareableURL)
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedURL}`
}

/**
 * Lookup snippet ID from tiny code via API
 * This queries the backend to resolve the tiny code to the actual snippet ID
 */
export async function lookupSnippetByTinyCode(tinyCode: string): Promise<string | null> {
  try {
    if (!isValidTinyCode(tinyCode)) {
      return null
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}/snippets/lookup/${tinyCode}`
    )

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Failed to lookup tiny code: ${response.statusText}`)
    }

    const data = await response.json()
    return data.snippetId || data.id || null
  } catch (error) {
    console.error('Error looking up tiny code:', error)
    return null
  }
}

/**
 * Store tiny code to snippet ID mapping in session storage
 * Useful for offline lookups or caching
 */
export function storeTinyCodeMapping(tinyCode: string, snippetId: string): void {
  try {
    const mappings = JSON.parse(
      sessionStorage.getItem('tinyCodeMappings') || '{}'
    )
    mappings[tinyCode] = snippetId
    sessionStorage.setItem('tinyCodeMappings', JSON.stringify(mappings))
  } catch (error) {
    console.error('Error storing tiny code mapping:', error)
  }
}

/**
 * Retrieve tiny code to snippet ID mapping from session storage
 */
export function getTinyCodeMapping(tinyCode: string): string | null {
  try {
    const mappings = JSON.parse(
      sessionStorage.getItem('tinyCodeMappings') || '{}'
    )
    return mappings[tinyCode] || null
  } catch (error) {
    console.error('Error retrieving tiny code mapping:', error)
    return null
  }
}
