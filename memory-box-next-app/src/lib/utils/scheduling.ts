import type { Schedule } from '../types';

/**
 * Calculate the next review date based on the card's schedule
 * @param schedule The schedule type for the card
 * @param currentDate The current/last review date (defaults to now)
 * @returns The next review date
 */
export function calculateNextReview(schedule: Schedule, currentDate: Date = new Date()): Date {
  // Check if schedule is a number (monthly schedule)
  if (!isNaN(Number(schedule))) {
    const monthlyDay = Number(schedule);
    return nextMonthlyDate(currentDate, monthlyDay);
  }

  // Handle named schedules
  switch (schedule) {
    case 'daily':
      return addDays(currentDate, 1);
    case 'even':
      return nextEvenDay(currentDate);
    case 'odd':
      return nextOddDay(currentDate);
    case 'sunday':
    case 'monday':
    case 'tuesday':
    case 'wednesday':
    case 'thursday':
    case 'friday':
    case 'saturday':
      return nextWeekday(currentDate, schedule);
    default:
      throw new Error(`Invalid schedule: ${schedule}`);
  }
}

/**
 * Add days to a date
 * @param date Starting date
 * @param days Number of days to add
 * @returns New date with days added
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Get the next even day after the current date
 * @param currentDate Current date
 * @returns Next even day
 */
export function nextEvenDay(currentDate: Date): Date {
  let nextDate = addDays(currentDate, 1);
  while (nextDate.getDate() % 2 !== 0) {
    nextDate = addDays(nextDate, 1);
  }
  return nextDate;
}

/**
 * Get the next odd day after the current date
 * @param currentDate Current date
 * @returns Next odd day
 */
export function nextOddDay(currentDate: Date): Date {
  let nextDate = addDays(currentDate, 1);
  while (nextDate.getDate() % 2 === 0) {
    nextDate = addDays(nextDate, 1);
  }
  return nextDate;
}

/**
 * Get the next occurrence of a specific weekday
 * @param currentDate Current date
 * @param weekday Name of the weekday (lowercase)
 * @returns Next occurrence of the specified weekday
 */
export function nextWeekday(currentDate: Date, weekday: string): Date {
  const weekdayMap: Record<string, number> = {
    'sunday': 0,
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6
  };

  const targetDay = weekdayMap[weekday.toLowerCase()];
  if (targetDay === undefined) {
    throw new Error(`Invalid weekday: ${weekday}`);
  }

  let nextDate = addDays(currentDate, 1);
  while (nextDate.getDay() !== targetDay) {
    nextDate = addDays(nextDate, 1);
  }

  return nextDate;
}

/**
 * Get the next occurrence of a specific day of the month
 * @param currentDate Current date
 * @param dayOfMonth Day of month (1-31)
 * @returns Next occurrence of the specified day
 */
export function nextMonthlyDate(currentDate: Date, dayOfMonth: number): Date {
  if (dayOfMonth < 1 || dayOfMonth > 31) {
    throw new Error(`Invalid day of month: ${dayOfMonth}`);
  }

  // Start with the next day
  let nextDate = addDays(currentDate, 1);

  // If we're already past the target day this month, move to next month
  if (nextDate.getDate() > dayOfMonth) {
    nextDate = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 1);
  }

  // Find the next valid occurrence of the day
  while (true) {
    const year = nextDate.getFullYear();
    const month = nextDate.getMonth();

    // Check if this day exists in the current month
    const testDate = new Date(year, month, dayOfMonth);

    // If the month didn't roll over, we found a valid date
    if (testDate.getMonth() === month) {
      return testDate;
    }

    // Otherwise, skip to the next month
    nextDate = new Date(year, month + 1, 1);
  }
}

/**
 * Check if a card is due for review on a specific date
 * @param nextReview The card's next review date
 * @param checkDate The date to check against (defaults to today)
 * @returns True if the card is due
 */
export function isCardDue(nextReview: Date, checkDate: Date = new Date()): boolean {
  // Compare dates at the day level (ignore time)
  const nextReviewDay = new Date(nextReview.getFullYear(), nextReview.getMonth(), nextReview.getDate());
  const checkDay = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());

  return nextReviewDay <= checkDay;
}

/**
 * Get a human-readable description of a schedule
 * @param schedule The schedule type
 * @returns Description string
 */
export function getScheduleDescription(schedule: Schedule): string {
  if (!isNaN(Number(schedule))) {
    const day = Number(schedule);
    return `Monthly on day ${day}`;
  }

  switch (schedule) {
    case 'daily':
      return 'Every day';
    case 'even':
      return 'Even days (2, 4, 6, etc.)';
    case 'odd':
      return 'Odd days (1, 3, 5, etc.)';
    default:
      // Capitalize weekday names
      return `Every ${schedule.charAt(0).toUpperCase() + schedule.slice(1)}`;
  }
}

/**
 * Get all possible schedule types in a logical order
 * @returns Array of all schedule types
 */
export function getAllScheduleTypes(): Schedule[] {
  const weekdays: Schedule[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const monthlyDays: Schedule[] = Array.from({ length: 31 }, (_, i) => String(i + 1) as Schedule);

  return ['daily', 'even', 'odd', ...weekdays, ...monthlyDays];
}

/**
 * Get a short label for a schedule type
 * @param schedule The schedule type
 * @returns Short label string
 */
export function getScheduleLabel(schedule: Schedule): string {
  if (!isNaN(Number(schedule))) {
    return getOrdinal(Number(schedule));
  }

  switch (schedule) {
    case 'daily':
      return 'Daily';
    case 'even':
      return 'Even';
    case 'odd':
      return 'Odd';
    default:
      // Capitalize weekday names
      return schedule.charAt(0).toUpperCase() + schedule.slice(1);
  }
}

/**
 * Convert a number to its ordinal representation (1st, 2nd, 3rd, etc.)
 * @param num The number to convert
 * @returns Ordinal string
 */
function getOrdinal(num: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}
