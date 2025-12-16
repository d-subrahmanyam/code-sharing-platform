/**
 * Developer-Friendly Console Logging Utility
 * Provides enhanced logging with color coding, timestamps, and severity levels
 * Useful for debugging during development
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: unknown
  stack?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private logHistory: LogEntry[] = []
  private maxHistorySize = 500

  private getTimestamp(): string {
    return new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    })
  }

  private getStylesForLevel(level: LogLevel): {
    color: string
    backgroundColor: string
    emoji: string
  } {
    const styles = {
      [LogLevel.DEBUG]: {
        color: '#7B68EE',
        backgroundColor: 'rgba(123, 104, 238, 0.1)',
        emoji: '🔍',
      },
      [LogLevel.INFO]: {
        color: '#00B4D8',
        backgroundColor: 'rgba(0, 180, 216, 0.1)',
        emoji: 'ℹ️',
      },
      [LogLevel.WARN]: {
        color: '#FFB703',
        backgroundColor: 'rgba(255, 183, 3, 0.1)',
        emoji: '⚠️',
      },
      [LogLevel.ERROR]: {
        color: '#F72585',
        backgroundColor: 'rgba(247, 37, 133, 0.1)',
        emoji: '❌',
      },
      [LogLevel.SUCCESS]: {
        color: '#06D6A0',
        backgroundColor: 'rgba(6, 214, 160, 0.1)',
        emoji: '✅',
      },
    }
    return styles[level]
  }

  private addToHistory(entry: LogEntry): void {
    this.logHistory.push(entry)
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift()
    }
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = this.getTimestamp()
    return `[${timestamp}] [${level}] ${message}`
  }

  private log(
    level: LogLevel,
    message: string,
    data?: unknown,
    error?: Error
  ): void {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level,
      message,
      data,
      stack: error?.stack,
    }

    this.addToHistory(entry)

    if (!this.isDevelopment && level === LogLevel.DEBUG) {
      return
    }

    const styles = this.getStylesForLevel(level)
    const formattedMessage = this.formatMessage(level, message)

    const prefix = `%c${styles.emoji} ${formattedMessage}%c`
    const prefixStyle = `color: ${styles.color}; font-weight: bold; background-color: ${styles.backgroundColor}; padding: 2px 6px; border-radius: 3px;`
    const resetStyle = 'color: inherit; background-color: transparent;'

    if (data) {
      console.log(prefix, prefixStyle, resetStyle, data)
    } else {
      console.log(prefix, prefixStyle, resetStyle)
    }

    if (error) {
      console.error('Stack trace:', error.stack)
    }
  }

  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data)
  }

  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data)
  }

  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data)
  }

  error(message: string, error?: Error, data?: unknown): void {
    this.log(LogLevel.ERROR, message, data, error)
  }

  success(message: string, data?: unknown): void {
    this.log(LogLevel.SUCCESS, message, data)
  }

  /**
   * Get full log history
   */
  getHistory(): LogEntry[] {
    return [...this.logHistory]
  }

  /**
   * Clear log history
   */
  clearHistory(): void {
    this.logHistory = []
    this.info('Log history cleared')
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2)
  }

  /**
   * Filter logs by level
   */
  filterByLevel(level: LogLevel): LogEntry[] {
    return this.logHistory.filter((entry) => entry.level === level)
  }

  /**
   * Filter logs by message pattern
   */
  filterByMessage(pattern: string | RegExp): LogEntry[] {
    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern
    return this.logHistory.filter((entry) => regex.test(entry.message))
  }

  /**
   * Log API request
   */
  logRequest(method: string, url: string, data?: unknown): void {
    this.info(`API Request: ${method} ${url}`, data)
  }

  /**
   * Log API response
   */
  logResponse(
    method: string,
    url: string,
    statusCode: number,
    data?: unknown
  ): void {
    const message = `API Response: ${method} ${url} (${statusCode})`
    if (statusCode >= 200 && statusCode < 300) {
      this.success(message, data)
    } else if (statusCode >= 400) {
      this.error(message, undefined, data)
    } else {
      this.info(message, data)
    }
  }

  /**
   * Log network error
   */
  logNetworkError(
    method: string,
    url: string,
    error: Error,
    data?: unknown
  ): void {
    this.error(`API Error: ${method} ${url}`, error, { ...data })
  }

  /**
   * Create a performance timer
   */
  time(label: string): void {
    console.time(label)
  }

  timeEnd(label: string): void {
    console.timeEnd(label)
  }

  /**
   * Log performance metrics
   */
  logPerformance(message: string, duration: number): void {
    const color = duration > 1000 ? '#FFB703' : '#06D6A0'
    console.log(
      `%c⏱️ ${message}: ${duration}ms`,
      `color: ${color}; font-weight: bold;`
    )
  }

  /**
   * Create a group of logs
   */
  group(label: string): void {
    console.group(label)
  }

  groupEnd(): void {
    console.groupEnd()
  }
}

// Export singleton instance
export const logger = new Logger()

// Also expose globally for debugging in browser console
;(window as any).__logger = logger
