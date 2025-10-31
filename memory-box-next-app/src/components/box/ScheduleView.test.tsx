import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScheduleView } from './ScheduleView';
import type { Schedule } from '@/lib/types';

describe('ScheduleView', () => {
  describe('rendering with no cards', () => {
    it('should render with muted styling when cardCount is 0', () => {
      const { container } = render(
        <ScheduleView schedule="daily" cardCount={0} dueCount={0} />
      );

      const scheduleDiv = container.firstChild as HTMLElement;
      expect(scheduleDiv).toHaveClass('opacity-60');
      expect(screen.getByText('Daily')).toBeInTheDocument();
      expect(screen.getByText('Every day')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should not show due count badge when no cards', () => {
      render(<ScheduleView schedule="monday" cardCount={0} dueCount={0} />);

      expect(screen.queryByText(/due/i)).not.toBeInTheDocument();
    });
  });

  describe('rendering with cards but none due', () => {
    it('should render with normal styling', () => {
      const { container } = render(
        <ScheduleView schedule="even" cardCount={5} dueCount={0} />
      );

      const scheduleDiv = container.firstChild as HTMLElement;
      expect(scheduleDiv).not.toHaveClass('opacity-60');
      expect(screen.getByText('Even')).toBeInTheDocument();
      expect(screen.getByText('Even days (2, 4, 6, etc.)')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should not show due count badge when no due cards', () => {
      render(<ScheduleView schedule="even" cardCount={5} dueCount={0} />);

      expect(screen.queryByText(/due/i)).not.toBeInTheDocument();
    });
  });

  describe('rendering with due cards', () => {
    it('should render with highlighted styling when cards are due', () => {
      const { container } = render(
        <ScheduleView schedule="odd" cardCount={10} dueCount={3} />
      );

      const scheduleDiv = container.firstChild as HTMLElement;
      expect(scheduleDiv).toHaveClass('border-indigo-300');
      expect(scheduleDiv).toHaveClass('bg-indigo-50');
    });

    it('should show due count badge', () => {
      render(<ScheduleView schedule="odd" cardCount={10} dueCount={3} />);

      expect(screen.getByText('3 due')).toBeInTheDocument();
    });
  });

  describe('schedule labels and descriptions', () => {
    it('should display correct label and description for daily schedule', () => {
      render(<ScheduleView schedule="daily" cardCount={1} dueCount={0} />);

      expect(screen.getByText('Daily')).toBeInTheDocument();
      expect(screen.getByText('Every day')).toBeInTheDocument();
    });

    it('should display correct label and description for weekday schedules', () => {
      const weekdays: Schedule[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

      weekdays.forEach((day) => {
        const { unmount } = render(
          <ScheduleView schedule={day} cardCount={1} dueCount={0} />
        );

        const expectedLabel = day.charAt(0).toUpperCase() + day.slice(1);
        expect(screen.getByText(expectedLabel)).toBeInTheDocument();
        expect(screen.getByText(`Every ${expectedLabel}`)).toBeInTheDocument();

        unmount();
      });
    });

    it('should display correct label and description for monthly schedules', () => {
      render(<ScheduleView schedule="15" cardCount={2} dueCount={0} />);

      expect(screen.getByText('15th')).toBeInTheDocument();
      expect(screen.getByText('Monthly on day 15')).toBeInTheDocument();
    });
  });

  describe('card count display', () => {
    it('should display correct card count', () => {
      render(<ScheduleView schedule="daily" cardCount={42} dueCount={0} />);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should display both card count and due count', () => {
      render(<ScheduleView schedule="daily" cardCount={100} dueCount={25} />);

      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('25 due')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle all due cards', () => {
      render(<ScheduleView schedule="daily" cardCount={5} dueCount={5} />);

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('5 due')).toBeInTheDocument();
    });

    it('should handle schedule "1" (first day of month)', () => {
      render(<ScheduleView schedule="1" cardCount={1} dueCount={0} />);

      expect(screen.getByText('1st')).toBeInTheDocument();
      expect(screen.getByText('Monthly on day 1')).toBeInTheDocument();
    });

    it('should handle schedule "31" (last day of month)', () => {
      render(<ScheduleView schedule="31" cardCount={1} dueCount={0} />);

      expect(screen.getByText('31st')).toBeInTheDocument();
      expect(screen.getByText('Monthly on day 31')).toBeInTheDocument();
    });
  });
});
