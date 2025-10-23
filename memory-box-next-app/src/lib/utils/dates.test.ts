import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateShort,
  formatDateISO,
  formatRelativeTime,
  isSameDay,
  isToday,
  isPast,
  isFuture,
  startOfDay,
  endOfDay,
  getDayName,
  getMonthName,
  parseDate,
  daysBetween
} from './dates';

describe('formatDate', () => {
  it('should format date with default options', () => {
    const date = new Date(2024, 0, 15); // January 15, 2024 in local time
    const result = formatDate(date);
    expect(result).toBe('January 15, 2024');
  });

  it('should format date with custom options', () => {
    const date = new Date(2024, 0, 15); // January 15, 2024 in local time
    const result = formatDate(date, { month: 'short', day: 'numeric' });
    expect(result).toBe('Jan 15');
  });
});

describe('formatDateShort', () => {
  it('should format date in short format', () => {
    const date = new Date(2024, 0, 15); // January 15, 2024 in local time
    const result = formatDateShort(date);
    expect(result).toBe('Jan 15, 2024');
  });
});

describe('formatDateISO', () => {
  it('should format date as ISO string (YYYY-MM-DD)', () => {
    const date = new Date('2024-01-15T10:30:00');
    const result = formatDateISO(date);
    expect(result).toBe('2024-01-15');
  });

  it('should handle single digit months and days', () => {
    const date = new Date('2024-03-05T10:30:00');
    const result = formatDateISO(date);
    expect(result).toBe('2024-03-05');
  });
});

describe('formatRelativeTime', () => {
  it('should return "Today" for same day', () => {
    const date = new Date(2024, 0, 15, 14, 0, 0);
    const baseDate = new Date(2024, 0, 15, 10, 0, 0);
    const result = formatRelativeTime(date, baseDate);
    expect(result).toBe('Today');
  });

  it('should return "Tomorrow" for next day', () => {
    const date = new Date('2024-01-16');
    const baseDate = new Date('2024-01-15');
    const result = formatRelativeTime(date, baseDate);
    expect(result).toBe('Tomorrow');
  });

  it('should return "Yesterday" for previous day', () => {
    const date = new Date('2024-01-14');
    const baseDate = new Date('2024-01-15');
    const result = formatRelativeTime(date, baseDate);
    expect(result).toBe('Yesterday');
  });

  it('should return "In X days" for future dates', () => {
    const date = new Date('2024-01-20');
    const baseDate = new Date('2024-01-15');
    const result = formatRelativeTime(date, baseDate);
    expect(result).toBe('In 5 days');
  });

  it('should return "X days ago" for past dates', () => {
    const date = new Date('2024-01-10');
    const baseDate = new Date('2024-01-15');
    const result = formatRelativeTime(date, baseDate);
    expect(result).toBe('5 days ago');
  });
});

describe('isSameDay', () => {
  it('should return true for same day at different times', () => {
    const date1 = new Date('2024-01-15T08:00:00');
    const date2 = new Date('2024-01-15T20:00:00');
    expect(isSameDay(date1, date2)).toBe(true);
  });

  it('should return false for different days', () => {
    const date1 = new Date('2024-01-15');
    const date2 = new Date('2024-01-16');
    expect(isSameDay(date1, date2)).toBe(false);
  });

  it('should return false for same day number but different months', () => {
    const date1 = new Date('2024-01-15');
    const date2 = new Date('2024-02-15');
    expect(isSameDay(date1, date2)).toBe(false);
  });
});

describe('isToday', () => {
  it('should return true for current date', () => {
    const now = new Date();
    expect(isToday(now)).toBe(true);
  });

  it('should return false for past date', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isToday(yesterday)).toBe(false);
  });

  it('should return false for future date', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isToday(tomorrow)).toBe(false);
  });
});

describe('isPast', () => {
  it('should return true for past date', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isPast(yesterday)).toBe(true);
  });

  it('should return false for today', () => {
    const today = new Date();
    expect(isPast(today)).toBe(false);
  });

  it('should return false for future date', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isPast(tomorrow)).toBe(false);
  });
});

describe('isFuture', () => {
  it('should return true for future date', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isFuture(tomorrow)).toBe(true);
  });

  it('should return false for today', () => {
    const today = new Date();
    expect(isFuture(today)).toBe(false);
  });

  it('should return false for past date', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isFuture(yesterday)).toBe(false);
  });
});

describe('startOfDay', () => {
  it('should set time to 00:00:00.000', () => {
    const date = new Date('2024-01-15T14:30:45.123');
    const result = startOfDay(date);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
    expect(result.getDate()).toBe(15);
  });

  it('should not mutate original date', () => {
    const date = new Date('2024-01-15T14:30:00');
    const originalHours = date.getHours();
    startOfDay(date);
    expect(date.getHours()).toBe(originalHours);
  });
});

describe('endOfDay', () => {
  it('should set time to 23:59:59.999', () => {
    const date = new Date('2024-01-15T14:30:45.123');
    const result = endOfDay(date);
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
    expect(result.getDate()).toBe(15);
  });

  it('should not mutate original date', () => {
    const date = new Date('2024-01-15T14:30:00');
    const originalHours = date.getHours();
    endOfDay(date);
    expect(date.getHours()).toBe(originalHours);
  });
});

describe('getDayName', () => {
  it('should return correct day name for Monday', () => {
    const date = new Date(2024, 0, 15); // January 15, 2024 is Monday
    expect(getDayName(date)).toBe('Monday');
  });

  it('should return correct day name for Friday', () => {
    const date = new Date(2024, 0, 19); // January 19, 2024 is Friday
    expect(getDayName(date)).toBe('Friday');
  });

  it('should return correct day name for Sunday', () => {
    const date = new Date(2024, 0, 21); // January 21, 2024 is Sunday
    expect(getDayName(date)).toBe('Sunday');
  });
});

describe('getMonthName', () => {
  it('should return correct month name for January', () => {
    const date = new Date('2024-01-15');
    expect(getMonthName(date)).toBe('January');
  });

  it('should return correct month name for December', () => {
    const date = new Date('2024-12-15');
    expect(getMonthName(date)).toBe('December');
  });
});

describe('parseDate', () => {
  it('should return Date object when given Date object', () => {
    const date = new Date('2024-01-15');
    const result = parseDate(date);
    expect(result).toBeInstanceOf(Date);
    expect(result).toBe(date);
  });

  it('should parse ISO date string', () => {
    const dateString = '2024-01-15T10:30:00';
    const result = parseDate(dateString);
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(0); // January
    expect(result.getDate()).toBe(15);
  });

  it('should parse simple date string', () => {
    const dateString = '2024-01-15';
    const result = parseDate(dateString);
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(0); // January
    // Day can vary based on timezone, so just check it's a valid date
    expect(result.getDate()).toBeGreaterThan(0);
  });
});

describe('daysBetween', () => {
  it('should return positive number when date2 is after date1', () => {
    const date1 = new Date('2024-01-15');
    const date2 = new Date('2024-01-20');
    expect(daysBetween(date1, date2)).toBe(5);
  });

  it('should return negative number when date2 is before date1', () => {
    const date1 = new Date('2024-01-20');
    const date2 = new Date('2024-01-15');
    expect(daysBetween(date1, date2)).toBe(-5);
  });

  it('should return 0 for same date', () => {
    const date1 = new Date('2024-01-15T10:00:00');
    const date2 = new Date('2024-01-15T14:00:00');
    expect(daysBetween(date1, date2)).toBe(0);
  });

  it('should handle month boundaries', () => {
    const date1 = new Date('2024-01-30');
    const date2 = new Date('2024-02-05');
    expect(daysBetween(date1, date2)).toBe(6);
  });

  it('should handle year boundaries', () => {
    const date1 = new Date('2024-12-30');
    const date2 = new Date('2025-01-05');
    expect(daysBetween(date1, date2)).toBe(6);
  });
});
