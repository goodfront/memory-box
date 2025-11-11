import { describe, it, expect } from 'vitest';
import type { Schedule } from '../types';
import {
  calculateNextReview,
  addDays,
  nextEvenDay,
  nextOddDay,
  nextWeekday,
  nextMonthlyDate,
  isCardDue,
  getScheduleDescription,
  getAllScheduleTypes,
  getScheduleLabel,
  doesScheduleMatchDate
} from './scheduling';

describe('addDays', () => {
  it('should add days to a date', () => {
    const date = new Date(2024, 0, 15); // January 15, 2024 in local time
    const result = addDays(date, 5);
    expect(result.getDate()).toBe(20);
    expect(result.getMonth()).toBe(0); // January
  });

  it('should handle month boundaries', () => {
    const date = new Date(2024, 0, 30); // January 30, 2024 in local time
    const result = addDays(date, 5);
    expect(result.getDate()).toBe(4);
    expect(result.getMonth()).toBe(1); // February
  });

  it('should handle year boundaries', () => {
    const date = new Date(2024, 11, 30); // December 30, 2024 in local time
    const result = addDays(date, 5);
    expect(result.getDate()).toBe(4);
    expect(result.getMonth()).toBe(0); // January
    expect(result.getFullYear()).toBe(2025);
  });

  it('should not mutate the original date', () => {
    const date = new Date(2024, 0, 15); // January 15, 2024 in local time
    const originalDate = date.getDate();
    addDays(date, 5);
    expect(date.getDate()).toBe(originalDate);
  });
});

describe('nextEvenDay', () => {
  it('should return next even day from odd day', () => {
    const date = new Date(2024, 0, 15); // 15th is odd
    const result = nextEvenDay(date);
    expect(result.getDate()).toBe(16);
  });

  it('should return next even day from even day', () => {
    const date = new Date(2024, 0, 16); // 16th is even
    const result = nextEvenDay(date);
    expect(result.getDate()).toBe(18);
  });

  it('should handle month boundaries', () => {
    const date = new Date(2024, 0, 31); // 31st is odd
    const result = nextEvenDay(date);
    expect(result.getDate()).toBe(2);
    expect(result.getMonth()).toBe(1); // February
  });
});

describe('nextOddDay', () => {
  it('should return next odd day from even day', () => {
    const date = new Date(2024, 0, 16); // 16th is even
    const result = nextOddDay(date);
    expect(result.getDate()).toBe(17);
  });

  it('should return next odd day from odd day', () => {
    const date = new Date(2024, 0, 15); // 15th is odd
    const result = nextOddDay(date);
    expect(result.getDate()).toBe(17);
  });

  it('should handle month boundaries', () => {
    const date = new Date(2024, 1, 28); // February 28th is even
    const result = nextOddDay(date);
    expect(result.getDate()).toBe(29);
  });
});

describe('nextWeekday', () => {
  it('should find next Monday from Wednesday', () => {
    const date = new Date('2024-01-17'); // Wednesday
    const result = nextWeekday(date, 'monday');
    expect(result.getDay()).toBe(1); // Monday
    expect(result.getDate()).toBe(22);
  });

  it('should find next Sunday from Saturday', () => {
    const date = new Date('2024-01-20'); // Saturday
    const result = nextWeekday(date, 'sunday');
    expect(result.getDay()).toBe(0); // Sunday
    expect(result.getDate()).toBe(21);
  });

  it('should skip the current day even if it matches', () => {
    const date = new Date(2024, 0, 15); // January 15, 2024 is Monday
    const result = nextWeekday(date, 'monday');
    expect(result.getDay()).toBe(1); // Monday
    expect(result.getDate()).toBe(22); // Next Monday
  });

  it('should handle month boundaries', () => {
    const date = new Date('2024-01-29'); // Monday
    const result = nextWeekday(date, 'wednesday');
    expect(result.getDay()).toBe(3); // Wednesday
    expect(result.getDate()).toBe(31);
  });

  it('should throw error for invalid weekday', () => {
    const date = new Date('2024-01-15');
    expect(() => nextWeekday(date, 'notaday')).toThrow('Invalid weekday');
  });
});

describe('nextMonthlyDate', () => {
  it('should find next occurrence of day 15 when current day is before 15', () => {
    const date = new Date('2024-01-10');
    const result = nextMonthlyDate(date, 15);
    expect(result.getDate()).toBe(15);
    expect(result.getMonth()).toBe(0); // Same month
  });

  it('should find next occurrence of day 15 when current day is after 15', () => {
    const date = new Date('2024-01-20');
    const result = nextMonthlyDate(date, 15);
    expect(result.getDate()).toBe(15);
    expect(result.getMonth()).toBe(1); // February
  });

  it('should skip February when day is 30', () => {
    const date = new Date('2024-01-31');
    const result = nextMonthlyDate(date, 30);
    expect(result.getDate()).toBe(30);
    expect(result.getMonth()).toBe(2); // March (skips Feb)
  });

  it('should skip February when day is 31', () => {
    const date = new Date('2024-01-15');
    const result = nextMonthlyDate(date, 31);
    expect(result.getDate()).toBe(31);
    expect(result.getMonth()).toBe(0); // January
  });

  it('should handle February 29 on leap year', () => {
    const date = new Date('2024-02-15');
    const result = nextMonthlyDate(date, 29);
    expect(result.getDate()).toBe(29);
    expect(result.getMonth()).toBe(1); // February
    expect(result.getFullYear()).toBe(2024);
  });

  it('should skip February 29 on non-leap year', () => {
    const date = new Date('2025-02-15');
    const result = nextMonthlyDate(date, 29);
    expect(result.getDate()).toBe(29);
    expect(result.getMonth()).toBe(2); // March (skips Feb)
  });

  it('should handle year boundaries', () => {
    const date = new Date('2024-12-20');
    const result = nextMonthlyDate(date, 10);
    expect(result.getDate()).toBe(10);
    expect(result.getMonth()).toBe(0); // January
    expect(result.getFullYear()).toBe(2025);
  });

  it('should throw error for invalid day', () => {
    const date = new Date('2024-01-15');
    expect(() => nextMonthlyDate(date, 0)).toThrow('Invalid day of month');
    expect(() => nextMonthlyDate(date, 32)).toThrow('Invalid day of month');
  });
});

describe('calculateNextReview', () => {
  it('should calculate next review for daily schedule', () => {
    const date = new Date(2024, 0, 15); // January 15, 2024 in local time
    const result = calculateNextReview('daily', date);
    expect(result.getDate()).toBe(16);
  });

  it('should calculate next review for even schedule', () => {
    const date = new Date('2024-01-15'); // odd day
    const result = calculateNextReview('even', date);
    expect(result.getDate()).toBe(16); // next even
  });

  it('should calculate next review for odd schedule', () => {
    const date = new Date('2024-01-16'); // even day
    const result = calculateNextReview('odd', date);
    expect(result.getDate()).toBe(17); // next odd
  });

  it('should calculate next review for weekday schedule', () => {
    const date = new Date('2024-01-15'); // Monday
    const result = calculateNextReview('friday', date);
    expect(result.getDay()).toBe(5); // Friday
    expect(result.getDate()).toBe(19);
  });

  it('should calculate next review for monthly schedule (string number)', () => {
    const date = new Date('2024-01-15');
    const result = calculateNextReview('20', date);
    expect(result.getDate()).toBe(20);
    expect(result.getMonth()).toBe(0); // Same month
  });

  it('should handle monthly schedule crossing month boundary', () => {
    const date = new Date('2024-01-25');
    const result = calculateNextReview('15', date);
    expect(result.getDate()).toBe(15);
    expect(result.getMonth()).toBe(1); // February
  });

  it('should throw error for invalid schedule', () => {
    const date = new Date('2024-01-15');
    expect(() => calculateNextReview('invalid' as unknown as Schedule, date)).toThrow('Invalid schedule');
  });
});

describe('isCardDue', () => {
  it('should return true when next review is before check date', () => {
    const nextReview = new Date('2024-01-15');
    const checkDate = new Date('2024-01-20');
    expect(isCardDue(nextReview, checkDate)).toBe(true);
  });

  it('should return true when next review is on check date', () => {
    const nextReview = new Date('2024-01-15T10:00:00');
    const checkDate = new Date('2024-01-15T14:00:00');
    expect(isCardDue(nextReview, checkDate)).toBe(true);
  });

  it('should return false when next review is after check date', () => {
    const nextReview = new Date('2024-01-20');
    const checkDate = new Date('2024-01-15');
    expect(isCardDue(nextReview, checkDate)).toBe(false);
  });

  it('should use current date as default', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isCardDue(yesterday)).toBe(true);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isCardDue(tomorrow)).toBe(false);
  });
});

describe('getScheduleDescription', () => {
  it('should return description for daily', () => {
    expect(getScheduleDescription('daily')).toBe('Every day');
  });

  it('should return description for even', () => {
    expect(getScheduleDescription('even')).toBe('Even days (2, 4, 6, etc.)');
  });

  it('should return description for odd', () => {
    expect(getScheduleDescription('odd')).toBe('Odd days (1, 3, 5, etc.)');
  });

  it('should return description for weekdays', () => {
    expect(getScheduleDescription('monday')).toBe('Every Monday');
    expect(getScheduleDescription('friday')).toBe('Every Friday');
    expect(getScheduleDescription('sunday')).toBe('Every Sunday');
  });

  it('should return description for monthly schedules', () => {
    expect(getScheduleDescription('1')).toBe('Monthly on day 1');
    expect(getScheduleDescription('15')).toBe('Monthly on day 15');
    expect(getScheduleDescription('31')).toBe('Monthly on day 31');
  });
});

describe('getAllScheduleTypes', () => {
  it('should return all 41 schedule types', () => {
    const schedules = getAllScheduleTypes();
    expect(schedules).toHaveLength(41);
  });

  it('should return schedules in correct order', () => {
    const schedules = getAllScheduleTypes();

    // First three should be frequency schedules
    expect(schedules[0]).toBe('daily');
    expect(schedules[1]).toBe('even');
    expect(schedules[2]).toBe('odd');

    // Next seven should be weekdays
    expect(schedules[3]).toBe('sunday');
    expect(schedules[4]).toBe('monday');
    expect(schedules[5]).toBe('tuesday');
    expect(schedules[6]).toBe('wednesday');
    expect(schedules[7]).toBe('thursday');
    expect(schedules[8]).toBe('friday');
    expect(schedules[9]).toBe('saturday');

    // Remaining 31 should be monthly days
    expect(schedules[10]).toBe('1');
    expect(schedules[11]).toBe('2');
    expect(schedules[40]).toBe('31');
  });

  it('should return all unique schedule types', () => {
    const schedules = getAllScheduleTypes();
    const uniqueSchedules = new Set(schedules);
    expect(uniqueSchedules.size).toBe(41);
  });

  it('should return valid Schedule types', () => {
    const schedules = getAllScheduleTypes();

    // Check that all returned values are valid Schedule types
    schedules.forEach(schedule => {
      expect(typeof schedule).toBe('string');
    });

    // Check specific known valid schedules
    expect(schedules).toContain('daily');
    expect(schedules).toContain('even');
    expect(schedules).toContain('odd');
    expect(schedules).toContain('monday');
    expect(schedules).toContain('15');
    expect(schedules).toContain('31');
  });
});

describe('getScheduleLabel', () => {
  it('should return label for daily', () => {
    expect(getScheduleLabel('daily')).toBe('Daily');
  });

  it('should return label for even', () => {
    expect(getScheduleLabel('even')).toBe('Even');
  });

  it('should return label for odd', () => {
    expect(getScheduleLabel('odd')).toBe('Odd');
  });

  it('should return capitalized labels for weekdays', () => {
    expect(getScheduleLabel('monday')).toBe('Monday');
    expect(getScheduleLabel('tuesday')).toBe('Tuesday');
    expect(getScheduleLabel('wednesday')).toBe('Wednesday');
    expect(getScheduleLabel('thursday')).toBe('Thursday');
    expect(getScheduleLabel('friday')).toBe('Friday');
    expect(getScheduleLabel('saturday')).toBe('Saturday');
    expect(getScheduleLabel('sunday')).toBe('Sunday');
  });

  it('should return ordinal labels for monthly schedules', () => {
    expect(getScheduleLabel('1')).toBe('1st');
    expect(getScheduleLabel('2')).toBe('2nd');
    expect(getScheduleLabel('3')).toBe('3rd');
    expect(getScheduleLabel('4')).toBe('4th');
    expect(getScheduleLabel('10')).toBe('10th');
    expect(getScheduleLabel('11')).toBe('11th');
    expect(getScheduleLabel('12')).toBe('12th');
    expect(getScheduleLabel('13')).toBe('13th');
    expect(getScheduleLabel('15')).toBe('15th');
    expect(getScheduleLabel('21')).toBe('21st');
    expect(getScheduleLabel('22')).toBe('22nd');
    expect(getScheduleLabel('23')).toBe('23rd');
    expect(getScheduleLabel('31')).toBe('31st');
  });

  it('should handle all monthly days with correct ordinal suffixes', () => {
    const expectedSuffixes: Record<number, string> = {
      1: 'st', 2: 'nd', 3: 'rd', 4: 'th', 5: 'th', 6: 'th', 7: 'th', 8: 'th', 9: 'th', 10: 'th',
      11: 'th', 12: 'th', 13: 'th', 14: 'th', 15: 'th', 16: 'th', 17: 'th', 18: 'th', 19: 'th', 20: 'th',
      21: 'st', 22: 'nd', 23: 'rd', 24: 'th', 25: 'th', 26: 'th', 27: 'th', 28: 'th', 29: 'th', 30: 'th',
      31: 'st'
    };

    for (let i = 1; i <= 31; i++) {
      const schedule = String(i) as Schedule;
      expect(getScheduleLabel(schedule)).toBe(`${i}${expectedSuffixes[i]}`);
    }
  });
});

describe('doesScheduleMatchDate', () => {
  it('should match daily schedule on any date', () => {
    expect(doesScheduleMatchDate('daily', new Date('2024-01-15'))).toBe(true);
    expect(doesScheduleMatchDate('daily', new Date('2024-02-20'))).toBe(true);
    expect(doesScheduleMatchDate('daily', new Date('2024-12-31'))).toBe(true);
  });

  it('should match even schedule only on even days', () => {
    expect(doesScheduleMatchDate('even', new Date('2024-01-02T12:00:00Z'))).toBe(true);
    expect(doesScheduleMatchDate('even', new Date('2024-01-04T12:00:00Z'))).toBe(true);
    expect(doesScheduleMatchDate('even', new Date('2024-01-30T12:00:00Z'))).toBe(true);
    expect(doesScheduleMatchDate('even', new Date('2024-01-01T12:00:00Z'))).toBe(false);
    expect(doesScheduleMatchDate('even', new Date('2024-01-15T12:00:00Z'))).toBe(false);
    expect(doesScheduleMatchDate('even', new Date('2024-01-31T12:00:00Z'))).toBe(false);
  });

  it('should match odd schedule only on odd days', () => {
    expect(doesScheduleMatchDate('odd', new Date('2024-01-01T12:00:00Z'))).toBe(true);
    expect(doesScheduleMatchDate('odd', new Date('2024-01-15T12:00:00Z'))).toBe(true);
    expect(doesScheduleMatchDate('odd', new Date('2024-01-31T12:00:00Z'))).toBe(true);
    expect(doesScheduleMatchDate('odd', new Date('2024-01-02T12:00:00Z'))).toBe(false);
    expect(doesScheduleMatchDate('odd', new Date('2024-01-20T12:00:00Z'))).toBe(false);
    expect(doesScheduleMatchDate('odd', new Date('2024-01-30T12:00:00Z'))).toBe(false);
  });

  it('should match weekday schedules correctly', () => {
    // January 15, 2024 is a Monday
    expect(doesScheduleMatchDate('monday', new Date('2024-01-15T12:00:00Z'))).toBe(true);
    expect(doesScheduleMatchDate('tuesday', new Date('2024-01-15T12:00:00Z'))).toBe(false);

    // January 16, 2024 is a Tuesday
    expect(doesScheduleMatchDate('tuesday', new Date('2024-01-16T12:00:00Z'))).toBe(true);
    expect(doesScheduleMatchDate('monday', new Date('2024-01-16T12:00:00Z'))).toBe(false);

    // January 17, 2024 is a Wednesday
    expect(doesScheduleMatchDate('wednesday', new Date('2024-01-17T12:00:00Z'))).toBe(true);

    // January 18, 2024 is a Thursday
    expect(doesScheduleMatchDate('thursday', new Date('2024-01-18T12:00:00Z'))).toBe(true);

    // January 19, 2024 is a Friday
    expect(doesScheduleMatchDate('friday', new Date('2024-01-19T12:00:00Z'))).toBe(true);

    // January 20, 2024 is a Saturday
    expect(doesScheduleMatchDate('saturday', new Date('2024-01-20T12:00:00Z'))).toBe(true);

    // January 21, 2024 is a Sunday
    expect(doesScheduleMatchDate('sunday', new Date('2024-01-21T12:00:00Z'))).toBe(true);
  });

  it('should match monthly schedule on correct day of month', () => {
    expect(doesScheduleMatchDate('1', new Date('2024-01-01T12:00:00Z'))).toBe(true);
    expect(doesScheduleMatchDate('15', new Date('2024-01-15T12:00:00Z'))).toBe(true);
    expect(doesScheduleMatchDate('31', new Date('2024-01-31T12:00:00Z'))).toBe(true);

    expect(doesScheduleMatchDate('1', new Date('2024-01-02T12:00:00Z'))).toBe(false);
    expect(doesScheduleMatchDate('15', new Date('2024-01-16T12:00:00Z'))).toBe(false);
    expect(doesScheduleMatchDate('31', new Date('2024-01-30T12:00:00Z'))).toBe(false);
  });

  it('should work across different months', () => {
    expect(doesScheduleMatchDate('15', new Date('2024-01-15T12:00:00Z'))).toBe(true);
    expect(doesScheduleMatchDate('15', new Date('2024-02-15T12:00:00Z'))).toBe(true);
    expect(doesScheduleMatchDate('15', new Date('2024-12-15T12:00:00Z'))).toBe(true);
  });

  it('should handle edge case of day 31 in months without 31 days', () => {
    // February doesn't have day 31
    expect(doesScheduleMatchDate('31', new Date('2024-02-28T12:00:00Z'))).toBe(false);
    expect(doesScheduleMatchDate('31', new Date('2024-02-29T12:00:00Z'))).toBe(false);

    // April doesn't have day 31
    expect(doesScheduleMatchDate('31', new Date('2024-04-30T12:00:00Z'))).toBe(false);
  });

  it('should use current date by default', () => {
    const today = new Date();
    const dayOfMonth = today.getDate();

    // Test with a monthly schedule matching today
    expect(doesScheduleMatchDate(String(dayOfMonth) as Schedule)).toBe(true);

    // Test with daily which should always match
    expect(doesScheduleMatchDate('daily')).toBe(true);
  });
});
