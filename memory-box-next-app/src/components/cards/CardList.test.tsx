import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CardList } from './CardList';
import type { Card } from '@/lib/types';

// Mock the scheduling utils
vi.mock('@/lib/utils/scheduling', () => ({
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

describe('CardList', () => {
  const mockCards: Card[] = [
    {
      id: '1',
      quotation: 'First quotation',
      author: 'Author One',
      reference: 'Reference 1',
      schedule: 'daily',
      timeAdded: new Date('2025-01-01'),
      timeModified: new Date('2025-01-01'),
      lastReviewed: new Date('2025-01-03'),
      nextReview: new Date('2025-01-10'),
      reviewHistory: [new Date('2025-01-03')],
    },
    {
      id: '2',
      quotation: 'Second quotation',
      author: 'Author Two',
      reference: 'Reference 2',
      schedule: 'even',
      timeAdded: new Date('2025-01-02'),
      timeModified: new Date('2025-01-02'),
      lastReviewed: new Date('2025-01-04'),
      nextReview: new Date('2025-01-12'),
      reviewHistory: [new Date('2025-01-04'), new Date('2025-01-05')],
    },
    {
      id: '3',
      quotation: 'Third quotation',
      author: 'Author Three',
      reference: 'Reference 3',
      schedule: 'odd',
      timeAdded: new Date('2025-01-03'),
      timeModified: new Date('2025-01-03'),
      lastReviewed: new Date('2025-01-05'),
      nextReview: new Date('2025-01-08'),
      reviewHistory: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should show loading spinner when loading is true', () => {
      render(<CardList cards={[]} loading={true} />);
      expect(screen.getByText(/loading cards/i)).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error message when error is provided', () => {
      render(<CardList cards={[]} error="Failed to load cards" />);
      expect(screen.getByText(/error: failed to load cards/i)).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should show default empty message when no cards', () => {
      render(<CardList cards={[]} />);
      expect(screen.getByText(/no cards found/i)).toBeInTheDocument();
    });

    it('should show custom empty message when provided', () => {
      render(<CardList cards={[]} emptyMessage="Custom empty message" />);
      expect(screen.getByText(/custom empty message/i)).toBeInTheDocument();
    });
  });

  describe('card display', () => {
    it('should display all cards', () => {
      render(<CardList cards={mockCards} />);
      expect(screen.getByText('First quotation')).toBeInTheDocument();
      expect(screen.getByText('Second quotation')).toBeInTheDocument();
      expect(screen.getByText('Third quotation')).toBeInTheDocument();
    });

    it('should display card metadata', () => {
      render(<CardList cards={mockCards} />);
      expect(screen.getByText(/by author one/i)).toBeInTheDocument();
      expect(screen.getByText(/reference 1/i)).toBeInTheDocument();
    });

    it('should display schedule labels', () => {
      render(<CardList cards={mockCards} />);
      // Use getAllByText since schedule labels appear in badge elements
      const dailyLabels = screen.getAllByText('Daily');
      const evenLabels = screen.getAllByText('Even');
      const oddLabels = screen.getAllByText('Odd');

      expect(dailyLabels.length).toBeGreaterThan(0);
      expect(evenLabels.length).toBeGreaterThan(0);
      expect(oddLabels.length).toBeGreaterThan(0);
    });

    it('should display review counts', () => {
      render(<CardList cards={mockCards} />);
      expect(screen.getByText('1 reviews')).toBeInTheDocument();
      expect(screen.getByText('2 reviews')).toBeInTheDocument();
      expect(screen.getByText('0 reviews')).toBeInTheDocument();
    });

    it('should truncate long quotations', () => {
      const longQuotation = 'A'.repeat(150);
      const cardsWithLongQuote: Card[] = [{
        ...mockCards[0],
        quotation: longQuotation,
      }];

      render(<CardList cards={cardsWithLongQuote} />);
      const displayedText = screen.getByText(/A+\.\.\./);
      // truncateText cuts at 100 chars and adds "..." = 103 total
      expect(displayedText.textContent).toHaveLength(103);
    });
  });

  describe('card click handling', () => {
    it('should call onCardClick when a card is clicked', async () => {
      const user = userEvent.setup();
      const mockOnCardClick = vi.fn();
      render(<CardList cards={mockCards} onCardClick={mockOnCardClick} />);

      await user.click(screen.getByText('First quotation'));
      expect(mockOnCardClick).toHaveBeenCalledWith(mockCards[0]);
    });

    it('should not make cards clickable when onCardClick is not provided', () => {
      render(<CardList cards={mockCards} />);
      const card = screen.getByText('First quotation').closest('div');
      expect(card).not.toHaveClass('cursor-pointer');
    });
  });

  describe('search functionality', () => {
    it('should filter cards by quotation text', async () => {
      const user = userEvent.setup();
      render(<CardList cards={mockCards} showControls={true} />);

      const searchInput = screen.getByPlaceholderText(/search cards by content, author, or source/i);
      await user.type(searchInput, 'First');

      expect(screen.getByText('First quotation')).toBeInTheDocument();
      expect(screen.queryByText('Second quotation')).not.toBeInTheDocument();
      expect(screen.queryByText('Third quotation')).not.toBeInTheDocument();
    });

    it('should filter cards by author', async () => {
      const user = userEvent.setup();
      render(<CardList cards={mockCards} showControls={true} />);

      const searchInput = screen.getByPlaceholderText(/search cards by content, author, or source/i);
      await user.type(searchInput, 'Author Two');

      expect(screen.queryByText('First quotation')).not.toBeInTheDocument();
      expect(screen.getByText('Second quotation')).toBeInTheDocument();
      expect(screen.queryByText('Third quotation')).not.toBeInTheDocument();
    });

    it('should filter cards by reference', async () => {
      const user = userEvent.setup();
      render(<CardList cards={mockCards} showControls={true} />);

      const searchInput = screen.getByPlaceholderText(/search cards by content, author, or source/i);
      await user.type(searchInput, 'Reference 3');

      expect(screen.queryByText('First quotation')).not.toBeInTheDocument();
      expect(screen.queryByText('Second quotation')).not.toBeInTheDocument();
      expect(screen.getByText('Third quotation')).toBeInTheDocument();
    });

    it('should be case-insensitive', async () => {
      const user = userEvent.setup();
      render(<CardList cards={mockCards} showControls={true} />);

      const searchInput = screen.getByPlaceholderText(/search cards by content, author, or source/i);
      await user.type(searchInput, 'FIRST');

      expect(screen.getByText('First quotation')).toBeInTheDocument();
    });
  });

  describe('sorting', () => {
    it('should sort by date added (newest first) by default', () => {
      render(<CardList cards={mockCards} showControls={true} />);

      const quotations = screen.getAllByText(/quotation/i);
      expect(quotations[0].textContent).toContain('Third'); // 2025-01-03
      expect(quotations[1].textContent).toContain('Second'); // 2025-01-02
      expect(quotations[2].textContent).toContain('First'); // 2025-01-01
    });

    it('should sort by date added (oldest first)', async () => {
      const user = userEvent.setup();
      render(<CardList cards={mockCards} showControls={true} />);

      const sortSelect = screen.getByDisplayValue(/date added \(newest first\)/i);
      await user.selectOptions(sortSelect, 'timeAdded');

      const quotations = screen.getAllByText(/quotation/i);
      // Sorted by date added ascending (oldest first)
      expect(quotations[0].textContent).toContain('First'); // 2025-01-01
      expect(quotations[1].textContent).toContain('Second'); // 2025-01-02
      expect(quotations[2].textContent).toContain('Third'); // 2025-01-03
    });

    it('should sort by author', async () => {
      const user = userEvent.setup();
      render(<CardList cards={mockCards} showControls={true} />);

      const sortSelect = screen.getByDisplayValue(/date added \(newest first\)/i);
      await user.selectOptions(sortSelect, 'author');

      const quotations = screen.getAllByText(/quotation/i);
      expect(quotations[0].textContent).toContain('First'); // Author One
      expect(quotations[1].textContent).toContain('Third'); // Author Three
      expect(quotations[2].textContent).toContain('Second'); // Author Two
    });

    it('should sort by author (Z-A)', async () => {
      const user = userEvent.setup();
      render(<CardList cards={mockCards} showControls={true} />);

      const sortSelect = screen.getByDisplayValue(/date added \(newest first\)/i);
      await user.selectOptions(sortSelect, 'authorDesc');

      const quotations = screen.getAllByText(/quotation/i);
      expect(quotations[0].textContent).toContain('Second'); // Author Two
      expect(quotations[1].textContent).toContain('Third'); // Author Three
      expect(quotations[2].textContent).toContain('First'); // Author One
    });
  });

  describe('schedule filtering', () => {
    it('should show all schedules by default', () => {
      render(<CardList cards={mockCards} showControls={true} />);
      expect(screen.getByText('First quotation')).toBeInTheDocument();
      expect(screen.getByText('Second quotation')).toBeInTheDocument();
      expect(screen.getByText('Third quotation')).toBeInTheDocument();
    });

    it('should filter by schedule', async () => {
      const user = userEvent.setup();
      render(<CardList cards={mockCards} showControls={true} />);

      const scheduleFilter = screen.getByDisplayValue(/all schedules/i);
      await user.selectOptions(scheduleFilter, 'even');

      expect(screen.queryByText('First quotation')).not.toBeInTheDocument();
      expect(screen.getByText('Second quotation')).toBeInTheDocument();
      expect(screen.queryByText('Third quotation')).not.toBeInTheDocument();
    });

    it('should only show schedules present in cards', () => {
      render(<CardList cards={mockCards} showControls={true} />);

      const scheduleFilter = screen.getByDisplayValue(/all schedules/i);
      const options = within(scheduleFilter).getAllByRole('option');

      // Should have "All Schedules" + 3 schedule options
      expect(options).toHaveLength(4);
      expect(options.map(opt => opt.textContent)).toEqual([
        'All Schedules',
        'Daily',
        'Even',
        'Odd',
      ]);
    });
  });

  describe('controls visibility', () => {
    it('should show controls when showControls is true', () => {
      render(<CardList cards={mockCards} showControls={true} />);
      expect(screen.getByPlaceholderText(/search cards by content, author, or source/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue(/date added/i)).toBeInTheDocument();
    });

    it('should hide controls when showControls is false', () => {
      render(<CardList cards={mockCards} showControls={false} />);
      expect(screen.queryByPlaceholderText(/search cards by content, author, or source/i)).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue(/date added/i)).not.toBeInTheDocument();
    });

    it('should not show controls when there are no cards', () => {
      render(<CardList cards={[]} showControls={true} />);
      expect(screen.queryByPlaceholderText(/search cards by content, author, or source/i)).not.toBeInTheDocument();
    });
  });

  describe('results count', () => {
    it('should display correct count of filtered results', async () => {
      const user = userEvent.setup();
      render(<CardList cards={mockCards} showControls={true} />);

      expect(screen.getByText(/showing 3 of 3 cards/i)).toBeInTheDocument();

      const searchInput = screen.getByPlaceholderText(/search cards by content, author, or source/i);
      await user.type(searchInput, 'First');

      expect(screen.getByText(/showing 1 of 3 cards/i)).toBeInTheDocument();
    });
  });

  describe('overdue indicator', () => {
    it('should render cards with overdue nextReview dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const cardsWithOverdue: Card[] = [
        {
          ...mockCards[0],
          nextReview: yesterday,
        },
      ];

      render(<CardList cards={cardsWithOverdue} />);

      // Component should render the card (overdue visual indicator removed from current implementation)
      expect(screen.getByText('First quotation')).toBeInTheDocument();
    });
  });

  describe('combined filtering and sorting', () => {
    it('should filter and sort correctly together', async () => {
      const user = userEvent.setup();
      render(<CardList cards={mockCards} showControls={true} />);

      // First search for "quotation" (matches all)
      const searchInput = screen.getByPlaceholderText(/search cards by content, author, or source/i);
      await user.type(searchInput, 'quotation');

      // Then sort by author
      const sortSelect = screen.getByDisplayValue(/date added \(newest first\)/i);
      await user.selectOptions(sortSelect, 'author');

      const quotations = screen.getAllByText(/quotation/i);
      expect(quotations[0].textContent).toContain('First'); // Author One
      expect(quotations[1].textContent).toContain('Third'); // Author Three
      expect(quotations[2].textContent).toContain('Second'); // Author Two
    });
  });
});
