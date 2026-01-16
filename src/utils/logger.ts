/**
 * Production-safe logging utility
 * Only logs in development mode to avoid polluting production console
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const shouldLog = (level: LogLevel): boolean => {
  // Only log in development mode
  if (!import.meta.env.DEV) {
    return false
  }
  return true
}

export const logger = {
  debug: (message: string, ...args: unknown[]): void => {
    if (shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, ...args)
    }
  },

  info: (message: string, ...args: unknown[]): void => {
    if (shouldLog('info')) {
      console.info(`[INFO] ${message}`, ...args)
    }
  },

  warn: (message: string, ...args: unknown[]): void => {
    if (shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args)
    }
  },

  error: (message: string, ...args: unknown[]): void => {
    // Always log errors in development
    if (import.meta.env.DEV) {
      console.error(`[ERROR] ${message}`, ...args)
    }
    // For critical errors, you could send to error tracking service here
  },

  // Group logs for better organization
  group: (label: string, fn: () => void): void => {
    if (shouldLog('info')) {
      console.group(`[GROUP] ${label}`)
      fn()
      console.groupEnd()
    }
  },

  // Timing for performance measurement
  time: (label: string): (() => void) => {
    if (shouldLog('debug')) {
      console.time(`[TIMER] ${label}`)
      return () => console.timeEnd(`[TIMER] ${label}`)
    }
    return () => {}
  }
}

export default logger
