import SockJS from 'sockjs-client'
import * as Stomp from 'stompjs'

export interface UserPresence {
  userId: string
  username: string
  joinedAt: string
  isTyping: boolean
  owner?: boolean
}

export interface OwnerDetails {
  userId: string
  username: string
  owner: true
}

export interface CodeChangeMessage {
  userId: string
  username: string
  code: string
  language: string
  timestamp: number
}

export interface PresenceMessage {
  type: 'user_joined' | 'user_left'
  userId: string
  username: string
  activeUsers: UserPresence[]
  snippetTitle?: string
  ownerDetails?: OwnerDetails
  // Owner's current metadata fields for joinee synchronization
  ownerTitle?: string
  ownerDescription?: string
  ownerLanguage?: string
  ownerTags?: string[]
}

export interface TypingStatusMessage {
  typingUsers: Array<{ userId: string; username: string }>
}

export type WebSocketCallback<T> = (data: T) => void

/**
 * WebSocket Service for Collaborative Editing
 * Manages STOMP connections and message routing
 */
export class WebSocketService {
  private stompClient: Stomp.Client | null = null
  private isConnected = false
  private connectionPromise: Promise<void> | null = null
  private subscriptions: Map<string, Stomp.Subscription> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  /**
   * Connect to WebSocket server
   */
  async connect(userId: string): Promise<void> {
    if (this.isConnected && this.stompClient?.connected) {
      console.log('[WebSocket] Already connected, skipping')
      return
    }

    if (this.connectionPromise) {
      console.log('[WebSocket] Connection in progress, returning existing promise')
      return this.connectionPromise
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        // Use relative path for WebSocket URL
        // This works in both development and Docker environments
        // Note: SockJS handles protocol fallback automatically, so we can use http:// for the URL
        // and it will upgrade to ws:// or wss:// as needed
        const host = window.location.host
        
        // Use the same protocol as the page but SockJS will handle fallbacks
        // In HTTPS environment, SockJS will try wss -> ws fallback
        // In HTTP environment, SockJS will use ws
        let wsUrl: string
        if (window.location.protocol === 'https:') {
          // For HTTPS pages, use https:// endpoint and let SockJS upgrade to wss://
          wsUrl = `https://${host}/api/ws`
        } else {
          // For HTTP pages, use http:// endpoint and let SockJS use ws://
          wsUrl = `http://${host}/api/ws`
        }
        
        console.log('[WebSocket] Connecting to:', wsUrl)
        const socket = new SockJS(wsUrl)

        this.stompClient = Stomp.over(socket)

        // Disable debug logging in production
        this.stompClient.debug = (msg: string) => {
          if (import.meta.env.DEV) {
            console.log('[STOMP]', msg)
          }
        }

        this.stompClient.connect(
          { userId },
          () => {
            console.log('[WebSocket] ✓ Connected successfully')
            this.isConnected = true
            this.reconnectAttempts = 0
            resolve()
          },
          (error: any) => {
            console.error('[WebSocket] ✗ Connection error:', error)
            this.handleConnectionError(resolve, reject)
          }
        )

        // Timeout for connection attempt
        setTimeout(() => {
          if (!this.isConnected) {
            console.error('[WebSocket] ✗ Connection timeout')
            this.handleConnectionError(resolve, reject)
          }
        }, 10000)
      } catch (error) {
        console.error('[WebSocket] ✗ Failed to create connection:', error)
        reject(error)
      }
    })

    return this.connectionPromise
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.stompClient && this.isConnected) {
      // Unsubscribe from all subscriptions
      this.subscriptions.forEach((subscription) => {
        subscription.unsubscribe()
      })
      this.subscriptions.clear()

      // Disconnect
      this.stompClient.disconnect(() => {
        console.log('WebSocket disconnected')
        this.isConnected = false
      })
    }
  }

  /**
   * Join a snippet session
   */
  joinSnippet(snippetId: string, userId: string, username: string): Promise<void> {
    return this.ensureConnected().then(() => {
      this.stompClient!.send(`/app/snippet/${snippetId}/join`, {}, JSON.stringify({ userId, username }))
    })
  }

  /**
   * Leave a snippet session
   */
  leaveSnippet(snippetId: string, userId: string): Promise<void> {
    return this.ensureConnected().then(() => {
      this.stompClient!.send(`/app/snippet/${snippetId}/leave`, {}, JSON.stringify({ userId }))
    })
  }

  /**
   * Send code change
   */
  sendCodeChange(
    snippetId: string,
    userId: string,
    username: string,
    code: string,
    language: string
  ): Promise<void> {
    return this.ensureConnected().then(() => {
      const destination = `/app/snippet/${snippetId}/code`
      const payload = {
        userId,
        username,
        code,
        language,
        timestamp: Date.now(),
      }
      console.log('[WebSocketService.sendCodeChange] Sending to:', destination, payload)
      this.stompClient!.send(
        destination,
        {},
        JSON.stringify(payload)
      )
      console.log('[WebSocketService.sendCodeChange] ✓ Sent')
    }).catch((error) => {
      console.error('[WebSocketService.sendCodeChange] ✗ Error:', error)
      throw error
    })
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(snippetId: string, userId: string, isTyping: boolean): Promise<void> {
    return this.ensureConnected().then(() => {
      const destination = `/app/snippet/${snippetId}/typing`
      const payload = {
        userId,
        isTyping,
      }
      console.log('[WebSocketService.sendTypingIndicator] Sending to:', destination, payload)
      this.stompClient!.send(
        destination,
        {},
        JSON.stringify(payload)
      )
      console.log('[WebSocketService.sendTypingIndicator] ✓ Sent')
    }).catch((error) => {
      console.error('[WebSocketService.sendTypingIndicator] ✗ Error:', error)
      throw error
    })
  }

  /**
   * Send metadata update (title, description, language, tags)
   */
  sendMetadataUpdate(
    snippetId: string,
    userId: string,
    metadata: {
      title?: string
      description?: string
      language?: string
      tags?: string[]
    }
  ): Promise<void> {
    return this.ensureConnected().then(() => {
      const destination = `/app/snippet/${snippetId}/metadata`
      const payload = {
        userId,
        ...metadata,
        timestamp: Date.now(),
      }
      console.log('[WebSocketService.sendMetadataUpdate] Sending to:', destination, payload)
      this.stompClient!.send(
        destination,
        {},
        JSON.stringify(payload)
      )
      console.log('[WebSocketService.sendMetadataUpdate] ✓ Sent')
    }).catch((error) => {
      console.error('[WebSocketService.sendMetadataUpdate] ✗ Error:', error)
      throw error
    })
  }

  /**
   * Request state sync from owner (called by joinee)
   * This tells the owner to broadcast their current code and metadata state
   */
  requestStateSync(snippetId: string, userId: string, username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const destination = `/app/snippet/${snippetId}/sync-state`
        const payload = { userId, username, timestamp: Date.now() }
        console.log('[WebSocketService.requestStateSync] Requesting state for:', snippetId, 'from:', username)
        this.stompClient!.send(
          destination,
          {},
          JSON.stringify(payload)
        )
        console.log('[WebSocketService.requestStateSync] ✓ Sent')
        resolve()
      } catch (error) {
        console.error('[WebSocketService.requestStateSync] ✗ Error:', error)
        reject(error)
      }
    })
  }

  /**
   * Subscribe to presence updates
   */
  subscribeToPresence(
    snippetId: string,
    callback: WebSocketCallback<PresenceMessage>
  ): void {
    const topic = `/topic/snippet/${snippetId}/presence`
    this.unsubscribeFromTopic(topic)

    this.ensureConnected().then(() => {
      const subscription = this.stompClient!.subscribe(topic, (message) => {
        try {
          const data = JSON.parse(message.body)
          callback(data)
        } catch (error) {
          console.error('Error parsing presence message:', error)
        }
      })
      this.subscriptions.set(topic, subscription)
    })
  }

  /**
   * Subscribe to code changes
   */
  subscribeToCodeChanges(
    snippetId: string,
    callback: WebSocketCallback<CodeChangeMessage>
  ): void {
    const topic = `/topic/snippet/${snippetId}/code`
    this.unsubscribeFromTopic(topic)

    this.ensureConnected().then(() => {
      const subscription = this.stompClient!.subscribe(topic, (message) => {
        try {
          const data = JSON.parse(message.body)
          callback(data)
        } catch (error) {
          console.error('Error parsing code change message:', error)
        }
      })
      this.subscriptions.set(topic, subscription)
    })
  }

  /**
   * Subscribe to typing indicators
   */
  subscribeToTypingStatus(
    snippetId: string,
    callback: WebSocketCallback<TypingStatusMessage>
  ): void {
    const topic = `/topic/snippet/${snippetId}/typing`
    this.unsubscribeFromTopic(topic)

    this.ensureConnected().then(() => {
      const subscription = this.stompClient!.subscribe(topic, (message) => {
        try {
          const data = JSON.parse(message.body)
          callback(data)
        } catch (error) {
          console.error('Error parsing typing status message:', error)
        }
      })
      this.subscriptions.set(topic, subscription)
    })
  }

  /**
   * Subscribe to metadata updates
   */
  subscribeToMetadataUpdates(
    snippetId: string,
    callback: WebSocketCallback<any>
  ): void {
    const topic = `/topic/snippet/${snippetId}/metadata`
    this.unsubscribeFromTopic(topic)

    this.ensureConnected().then(() => {
      const subscription = this.stompClient!.subscribe(topic, (message) => {
        try {
          const data = JSON.parse(message.body)
          callback(data)
        } catch (error) {
          console.error('Error parsing metadata update message:', error)
        }
      })
      this.subscriptions.set(topic, subscription)
    })
  }

  /**
   * Subscribe to state sync requests/responses
   * Used to coordinate state synchronization between owner and joinee
   */
  subscribeToStateSync(
    snippetId: string,
    callback: WebSocketCallback<any>
  ): void {
    const topic = `/topic/snippet/${snippetId}/sync`
    this.unsubscribeFromTopic(topic)

    this.ensureConnected().then(() => {
      const subscription = this.stompClient!.subscribe(topic, (message) => {
        try {
          const data = JSON.parse(message.body)
          callback(data)
        } catch (error) {
          console.error('Error parsing state sync message:', error)
        }
      })
      this.subscriptions.set(topic, subscription)
    })
  }

  /**
   * Unsubscribe from a specific topic
   */
  private unsubscribeFromTopic(topic: string): void {
    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic)!.unsubscribe()
      this.subscriptions.delete(topic)
    }
  }

  /**
   * Check connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected && this.stompClient !== null && this.stompClient.connected
  }

  /**
   * Ensure WebSocket is connected
   */
  private ensureConnected(): Promise<void> {
    if (this.isConnected && this.stompClient?.connected) {
      return Promise.resolve()
    }
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (this.isConnected && this.stompClient?.connected) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 200)

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval)
        reject(new Error('WebSocket connection timeout'))
      }, 10000)
    })
  }

  /**
   * Handle connection errors and attempt reconnection
   */
  private handleConnectionError(resolve: () => void, reject: (error: Error) => void): void {
    this.reconnectAttempts++

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

      setTimeout(() => {
        this.connectionPromise = null
        this.connect('').then(resolve).catch(reject)
      }, delay)
    } else {
      reject(new Error('WebSocket connection failed after max retries'))
    }
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService()
