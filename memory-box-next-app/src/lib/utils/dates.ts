/**
 * Date utility functions for formatting and manipulation
 */

/**
 * Format a date as a readable string
 * @param date The date to format
 * @param options Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
): string {
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Format a date as a short string (e.g., "Jan 15, 2024")
 * @param date The date to format
 * @returns Short formatted date string
 */
export function formatDateShort(date: Date): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format a date as ISO date string (YYYY-MM-DD)
 * @param date The date to format
 * @returns ISO date string
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format a date as a relative time string (e.g., "2 days ago", "in 3 days")
 * @param date The date to format
 * @param baseDate The date to compare against (defaults to now)
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date, baseDate: Date = new Date()): string {
  const diffMs = date.getTime() - baseDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays === -1) {
    return 'Yesterday';
  } else if (diffDays > 1) {
    return `In ${diffDays} days`;
  } else {
    return `${Math.abs(diffDays)} days ago`;
  }
}

/**
 * Check if two dates are on the same day
 * @param date1 First date
 * @param date2 Second date
 * @returns True if dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if a date is today
 * @param date The date to check
 * @returns True if date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Check if a date is in the past
 * @param date The date to check
 * @returns True if date is in the past
 */
export function isPast(date: Date): boolean {
  const now = new Date();
  return date < now && !isSameDay(date, now);
}

/**
 * Check if a date is in the future
 * @param date The date to check
 * @returns True if date is in the future
 */
export function isFuture(date: Date): boolean {
  const now = new Date();
  return date > now && !isSameDay(date, now);
}

/**
 * Get the start of day for a date (00:00:00.000)
 * @param date The date
 * @returns New date at start of day
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get the end of day for a date (23:59:59.999)
 * @param date The date
 * @returns New date at end of day
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Get the day of week name
 * @param date The date
 * @returns Day name (e.g., "Monday")
 */
export function getDayName(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
}

/**
 * Get the month name
 * @param date The date
 * @returns Month name (e.g., "January")
 */
export function getMonthName(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
}

/**
 * Parse a date string to Date object
 * Handles ISO strings and Date objects
 * @param dateInput Date string or Date object
 * @returns Date object
 */
export function parseDate(dateInput: string | Date): Date {
  if (dateInput instanceof Date) {
    return dateInput;
  }
  return new Date(dateInput);
}

/**
 * Get the number of days between two dates
 * @param date1 First date
 * @param date2 Second date
 * @returns Number of days (positive if date2 is after date1)
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diffMs = date2.getTime() - date1.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
