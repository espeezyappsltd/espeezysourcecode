/**
 * High-Precision DateTime Utility
 * 
 * Ensures absolute consistency and precision across the application.
 * - Storage: Always UTC ISO-8601 strings.
 * - Backend: Uses Firebase ServerValue.timestamp where possible.
 * - UI: Uses Intl.DateTimeFormat for localized, high-quality display.
 */

export class DateTime {
  /**
   * Returns a UTC ISO-8601 string representing the current moment.
   * Useful for Firestore 'created_at' fields when not using serverTimestamp().
   */
  static now(): string {
    return new Date().toISOString()
  }

  /**
   * Formats a date for UI display.
   * @param date Date object, ISO string, or number
   * @param options 'full', 'compact', 'timeOnly', or custom Intl.DateTimeFormatOptions
   */
  static format(
    date: Date | string | number,
    options: 'full' | 'compact' | 'timeOnly' | 'relative' | Intl.DateTimeFormatOptions = 'full'
  ): string {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    if (isNaN(d.getTime())) return 'Invalid Date'

    if (options === 'relative') {
      return this.formatRelative(d)
    }

    let config: Intl.DateTimeFormatOptions
    switch (options) {
      case 'full':
        config = { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
        break
      case 'compact':
        config = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
        break
      case 'timeOnly':
        config = { hour: '2-digit', minute: '2-digit' }
        break
      default:
        config = options
    }

    return new Intl.DateTimeFormat(undefined, config).format(d)
  }

  /**
   * Formats a date relative to now (e.g., "5 mins ago", "Yesterday")
   */
  private static formatRelative(date: Date): string {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`
    
    const diffInHours = Math.floor(diffInSeconds / 3600)
    if (diffInHours < 24) return `${diffInHours} hours ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`

    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)
  }

  /**
   * Checks if a date is within a specific range (e.g., for deadline checks)
   */
  static isWithinRange(date: Date | string | number, start: Date, end: Date): boolean {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    return d >= start && d <= end
  }

  /**
   * Ensures a value is a valid Date object.
   */
  static toDate(value: string | number | Date): Date {
    const d = new Date(value)
    return isNaN(d.getTime()) ? new Date() : d
  }

  /**
   * Converts a date to UTC ISO-8601 string.
   */
  static toISO(date: Date | string | number): string {
    return new Date(date).toISOString()
  }
}
