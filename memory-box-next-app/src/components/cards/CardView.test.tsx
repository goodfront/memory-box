import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CardView } from './CardView';
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
  getScheduleDescription: vi.fn((schedule: string) => {
    if (!isNaN(Number(schedule))) {
      return `Monthly on day ${schedule}`;
    }
    switch (schedule) {
      case 'daily': return 'Every day';
      case 'even': return 'Even days (2, 4, 6, etc.)';
      case 'odd': return 'Odd days (1, 3, 5, etc.)';
      default: return `Every ${schedule.charAt(0).toUpperCase() + schedule.slice(1)}`;
    }
  }),
}));

describe('CardView', () => {
  const mockCard: Card = {
    id: '1',
    quotation: 'Test quotation',
    author: 'Test Author',
    reference: 'Test Reference',
    schedule: 'daily',
    timeAdded: new Date('2025-01-01'),
    timeModified: new Date('2025-01-02'),
    lastReviewed: new Date('2025-01-03'),
    nextReview: new Date('2025-01-10'),
    reviewHistory: [new Date('2025-01-03'), new Date('2025-01-04')],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should display card quotation', () => {
      render(<CardView card={mockCard} />);
      expect(screen.getByText('Test quotation')).toBeInTheDocument();
    });

    it('should display card author', () => {
      render(<CardView card={mockCard} />);
      expect(screen.getByText('Test Author')).toBeInTheDocument();
    });

    it('should display card reference', () => {
      render(<CardView card={mockCard} />);
      expect(screen.getByText('Test Reference')).toBeInTheDocument();
    });

    it('should display schedule information', () => {
      render(<CardView card={mockCard} />);
      expect(screen.getByText('Daily')).toBeInTheDocument();
      expect(screen.getByText(/every day/i)).toBeInTheDocument();
    });

    it('should display review count', () => {
      render(<CardView card={mockCard} />);
      expect(screen.getByText(/review count/i)).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('metadata visibility', () => {
    it('should show metadata by default', () => {
      render(<CardView card={mockCard} />);
      expect(screen.getByText('Author:')).toBeInTheDocument();
      expect(screen.getByText('Schedule:')).toBeInTheDocument();
    });

    it('should hide metadata when showMetadata is false', () => {
      render(<CardView card={mockCard} showMetadata={false} />);
      expect(screen.queryByText(/author/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/schedule/i)).not.toBeInTheDocument();
    });
  });

  describe('review mode', () => {
    it('should hide quotation initially in review mode', () => {
      render(<CardView card={mockCard} reviewMode={true} />);
      expect(screen.queryByText('Test quotation')).not.toBeInTheDocument();
      expect(screen.getByText(/try to recall the quotation/i)).toBeInTheDocument();
    });

    it('should show quotation after clicking Show button', async () => {
      const user = userEvent.setup();
      render(<CardView card={mockCard} reviewMode={true} />);

      expect(screen.queryByText('Test quotation')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /show/i }));

      expect(screen.getByText('Test quotation')).toBeInTheDocument();
    });

    it('should hide quotation after clicking Hide button', async () => {
      const user = userEvent.setup();
      render(<CardView card={mockCard} reviewMode={true} />);

      // Show quotation
      await user.click(screen.getByRole('button', { name: /show/i }));
      expect(screen.getByText('Test quotation')).toBeInTheDocument();

      // Hide quotation
      await user.click(screen.getByRole('button', { name: /hide/i }));
      expect(screen.queryByText('Test quotation')).not.toBeInTheDocument();
    });

    it('should show quotation by default when not in review mode', () => {
      render(<CardView card={mockCard} reviewMode={false} />);
      expect(screen.getByText('Test quotation')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /show/i })).not.toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    it('should not show action buttons by default', () => {
      render(<CardView card={mockCard} />);
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });

    it('should show action buttons when showActions is true', () => {
      render(
        <CardView
          card={mockCard}
          showActions={true}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnEdit = vi.fn();
      render(
        <CardView
          card={mockCard}
          showActions={true}
          onEdit={mockOnEdit}
          onDelete={vi.fn()}
        />
      );

      await user.click(screen.getByRole('button', { name: /edit/i }));
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnDelete = vi.fn();
      render(
        <CardView
          card={mockCard}
          showActions={true}
          onEdit={vi.fn()}
          onDelete={mockOnDelete}
        />
      );

      await user.click(screen.getByRole('button', { name: /delete/i }));
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe('mark as reviewed button', () => {
    it('should show mark as reviewed button when onMarkReviewed is provided', () => {
      render(<CardView card={mockCard} onMarkReviewed={vi.fn()} />);
      expect(screen.getByRole('button', { name: /mark as reviewed/i })).toBeInTheDocument();
    });

    it('should not show mark as reviewed button when onMarkReviewed is not provided', () => {
      render(<CardView card={mockCard} />);
      expect(screen.queryByRole('button', { name: /mark as reviewed/i })).not.toBeInTheDocument();
    });

    it('should call onMarkReviewed when button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnMarkReviewed = vi.fn();
      render(<CardView card={mockCard} onMarkReviewed={mockOnMarkReviewed} />);

      await user.click(screen.getByRole('button', { name: /mark as reviewed/i }));
      expect(mockOnMarkReviewed).toHaveBeenCalledTimes(1);
    });
  });

  describe('date formatting', () => {
    it('should display "Never" for undefined lastReviewed', () => {
      const cardWithoutReview: Card = {
        ...mockCard,
        lastReviewed: undefined,
      };
      render(<CardView card={cardWithoutReview} />);

      // Find the "Last Reviewed" label and check its sibling contains "Never"
      const lastReviewedLabel = screen.getByText(/last reviewed/i);
      const container = lastReviewedLabel.closest('div');
      expect(container?.textContent).toContain('Never');
    });

    it('should format dates correctly', () => {
      render(<CardView card={mockCard} />);

      // Check that dates are displayed (format may vary by locale)
      const nextReviewLabel = screen.getByText(/next review/i);
      const nextReviewContainer = nextReviewLabel.closest('div');
      expect(nextReviewContainer).toBeInTheDocument();
      expect(nextReviewContainer?.textContent).toMatch(/\d{4}/); // Should contain a year
    });
  });

  describe('overdue indicator', () => {
    it('should show overdue indicator when next review is in the past', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const overdueCard: Card = {
        ...mockCard,
        nextReview: yesterday,
      };

      render(<CardView card={overdueCard} />);
      expect(screen.getByText(/overdue/i)).toBeInTheDocument();
    });

    it('should not show overdue indicator when next review is in the future', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const futureCard: Card = {
        ...mockCard,
        nextReview: tomorrow,
      };

      render(<CardView card={futureCard} />);
      expect(screen.queryByText(/overdue/i)).not.toBeInTheDocument();
    });
  });

  describe('optional fields', () => {
    it('should handle card without author', () => {
      const cardWithoutAuthor: Card = {
        ...mockCard,
        author: undefined,
      };
      render(<CardView card={cardWithoutAuthor} />);
      expect(screen.queryByText(/author/i)).not.toBeInTheDocument();
    });

    it('should handle card without reference', () => {
      const cardWithoutReference: Card = {
        ...mockCard,
        reference: undefined,
      };
      render(<CardView card={cardWithoutReference} />);
      expect(screen.queryByText(/reference/i)).not.toBeInTheDocument();
    });

    it('should handle card with empty review history', () => {
      const cardWithoutHistory: Card = {
        ...mockCard,
        reviewHistory: [],
      };
      render(<CardView card={cardWithoutHistory} />);
      expect(screen.getByText(/review count/i)).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });
});
