import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BoxOverview } from './BoxOverview';
import type { Card } from '@/lib/types';
import * as dbOperations from '@/lib/db/operations';
import * as schedulingUtils from '@/lib/utils/scheduling';

// Mock the db operations and scheduling utils
vi.mock('@/lib/db/operations');
vi.mock('@/lib/utils/scheduling', () => ({
  getAllScheduleTypes: vi.fn(),
  getScheduleLabel: vi.fn((schedule: string) => {
    if (!isNaN(Number(schedule))) {
      return `Day ${schedule}`;
    }
    switch (schedule) {
      case 'daily': return 'Daily';
      case 'even': return 'Even';
      case 'odd': return 'Odd';
      default: return schedule.charAt(0).toUpperCase() + schedule.slice(1);
    }
  }),
}));

describe('BoxOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('loading state', () => {
    it('should show loading spinner initially', () => {
      // Mock to make the component stay in loading state
      vi.mocked(dbOperations.getAllCards).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      vi.mocked(schedulingUtils.getAllScheduleTypes).mockReturnValue([
        'daily',
        'even',
        'odd',
      ]);

      render(<BoxOverview />);

      expect(screen.getByText('Loading box data...')).toBeInTheDocument();
      // Check for the loading spinner container
      const loadingContainer = screen.getByText('Loading box data...').parentElement;
      expect(loadingContainer).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should display error message when data loading fails', async () => {
      vi.mocked(dbOperations.getAllCards).mockRejectedValue(
        new Error('Database connection failed')
      );
      vi.mocked(schedulingUtils.getAllScheduleTypes).mockReturnValue([
        'daily',
        'even',
        'odd',
      ]);

      render(<BoxOverview />);

      await waitFor(() => {
        expect(
          screen.getByText(/Error: Database connection failed/i)
        ).toBeInTheDocument();
      });
    });

    it('should handle non-Error objects in catch block', async () => {
      vi.mocked(dbOperations.getAllCards).mockRejectedValue('String error');
      vi.mocked(schedulingUtils.getAllScheduleTypes).mockReturnValue([
        'daily',
      ]);

      render(<BoxOverview />);

      await waitFor(() => {
        expect(
          screen.getByText(/Error: Failed to load box data/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('successful data loading with no cards', () => {
    beforeEach(() => {
      vi.mocked(dbOperations.getAllCards).mockResolvedValue([]);
      vi.mocked(schedulingUtils.getAllScheduleTypes).mockReturnValue([
        'daily',
        'even',
        'odd',
      ]);
    });

    it('should display zero counts when no cards exist', async () => {
      render(<BoxOverview />);

      await waitFor(() => {
        expect(screen.getByText('Total Cards')).toBeInTheDocument();
      });

      expect(screen.getByText('Due Today')).toBeInTheDocument();
      expect(screen.getByText('Schedules in Use')).toBeInTheDocument();

      // Check for zero counts
      const counts = screen.getAllByText('0');
      expect(counts.length).toBeGreaterThanOrEqual(2); // Total and Due should both be 0
    });

    it('should render all schedule types with zero counts', async () => {
      // Ensure mocks are set up for this test
      vi.mocked(dbOperations.getAllCards).mockResolvedValue([]);
      vi.mocked(schedulingUtils.getAllScheduleTypes).mockReturnValue([
        'daily',
        'even',
        'odd',
      ]);

      render(<BoxOverview />);

      await waitFor(() => {
        expect(screen.queryByText('Loading box data...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Daily')).toBeInTheDocument();
      expect(screen.getByText('Even')).toBeInTheDocument();
      expect(screen.getByText('Odd')).toBeInTheDocument();
    });
  });

  describe('successful data loading with cards', () => {
    // Use dates relative to now for realistic testing
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const today = new Date();

    it('should display correct total card count', async () => {
      const mockCards: Card[] = [
        createMockCard('1', 'daily', yesterday),
        createMockCard('2', 'even', tomorrow),
        createMockCard('3', 'odd', yesterday),
      ];

      vi.mocked(dbOperations.getAllCards).mockResolvedValue(mockCards);
      vi.mocked(schedulingUtils.getAllScheduleTypes).mockReturnValue([
        'daily',
        'even',
        'odd',
      ]);

      render(<BoxOverview />);

      await waitFor(() => {
        expect(screen.queryByText('Loading box data...')).not.toBeInTheDocument();
      });

      // Should show 3 total cards
      const totalCardsSection = screen
        .getByText('Total Cards')
        .closest('div');
      expect(totalCardsSection).toHaveTextContent('3');
    });

    it('should count due cards correctly', async () => {
      const mockCards: Card[] = [
        createMockCard('1', 'daily', yesterday), // due
        createMockCard('2', 'even', today), // due
        createMockCard('3', 'odd', tomorrow), // not due
        createMockCard('4', 'monday', yesterday), // due
      ];

      vi.mocked(dbOperations.getAllCards).mockResolvedValue(mockCards);
      vi.mocked(schedulingUtils.getAllScheduleTypes).mockReturnValue([
        'daily',
        'even',
        'odd',
        'monday',
      ]);

      render(<BoxOverview />);

      await waitFor(() => {
        expect(screen.queryByText('Loading box data...')).not.toBeInTheDocument();
      });

      // Should show 3 due cards (yesterday and today, but not tomorrow)
      const dueSection = screen.getByText('Due Today').closest('div');
      expect(dueSection).toHaveTextContent('3');
    });

    it('should count schedules in use correctly', async () => {
      const mockCards: Card[] = [
        createMockCard('1', 'daily', today),
        createMockCard('2', 'daily', today), // same schedule
        createMockCard('3', 'even', today),
        // 'odd' has no cards
      ];

      vi.mocked(dbOperations.getAllCards).mockResolvedValue(mockCards);
      vi.mocked(schedulingUtils.getAllScheduleTypes).mockReturnValue([
        'daily',
        'even',
        'odd',
      ]);

      render(<BoxOverview />);

      await waitFor(() => {
        expect(screen.queryByText('Loading box data...')).not.toBeInTheDocument();
      });

      // Should show 2 schedules in use (daily and even, but not odd)
      const schedulesSection = screen
        .getByText('Schedules in Use')
        .closest('div');
      expect(schedulesSection).toHaveTextContent('2');
    });

    it('should render schedule groups with correct headers', async () => {
      vi.mocked(dbOperations.getAllCards).mockResolvedValue([]);
      vi.mocked(schedulingUtils.getAllScheduleTypes).mockReturnValue([
        'daily',
        'even',
        'odd',
        'monday',
        '1',
      ]);

      render(<BoxOverview />);

      await waitFor(() => {
        expect(screen.queryByText('Loading box data...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Frequency Schedules')).toBeInTheDocument();
    });
  });

  describe('integration with ScheduleView components', () => {
    it('should pass correct props to ScheduleView components', async () => {
      // Use dates relative to now
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const mockCards: Card[] = [
        createMockCard('1', 'daily', yesterday), // due
        createMockCard('2', 'daily', tomorrow), // not due
        createMockCard('3', 'even', tomorrow), // not due
      ];

      vi.mocked(dbOperations.getAllCards).mockResolvedValue(mockCards);
      vi.mocked(schedulingUtils.getAllScheduleTypes).mockReturnValue([
        'daily',
        'even',
        'odd',
      ]);

      render(<BoxOverview />);

      await waitFor(() => {
        expect(screen.queryByText('Loading box data...')).not.toBeInTheDocument();
      });

      // Daily schedule should show 2 cards, 1 due
      // Find the schedule card by going up to the parent with class 'rounded-lg'
      const dailyHeading = screen.getByText('Daily');
      const dailyCard = dailyHeading.closest('.rounded-lg');
      expect(dailyCard).toBeInTheDocument();
      // Check that the card contains both the count and due badge
      const dailyContent = dailyCard?.textContent;
      expect(dailyContent).toContain('2');
      expect(dailyContent).toContain('1 due');

      // Even schedule should show 1 card, 0 due
      const evenHeading = screen.getByText('Even');
      const evenCard = evenHeading.closest('.rounded-lg');
      expect(evenCard).toBeInTheDocument();
      const evenContent = evenCard?.textContent;
      expect(evenContent).toContain('1');
      expect(evenContent).not.toContain('due');

      // Odd schedule should show 0 cards
      const oddHeading = screen.getByText('Odd');
      const oddCard = oddHeading.closest('.rounded-lg');
      expect(oddCard).toBeInTheDocument();
      expect(oddCard?.textContent).toContain('0');
    });
  });
});

// Helper function to create mock cards
function createMockCard(
  id: string,
  schedule: Card['schedule'],
  nextReview: Date
): Card {
  return {
    id,
    quotation: `Test quotation ${id}`,
    author: 'Test Author',
    reference: 'Test Reference',
    schedule,
    timeAdded: new Date('2025-01-01'),
    timeModified: new Date('2025-01-01'),
    lastReviewed: new Date('2025-01-01'),
    nextReview,
    reviewHistory: [],
  };
}
