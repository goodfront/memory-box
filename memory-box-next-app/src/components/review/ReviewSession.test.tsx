import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewSession } from './ReviewSession';
import type { Card } from '@/lib/types';
import * as dbOperations from '@/lib/db/operations';

// Mock the database operations
vi.mock('@/lib/db/operations', () => ({
  markCardAsReviewed: vi.fn(),
}));

// Mock the CardView component to simplify testing
vi.mock('@/components/cards/CardView', () => ({
  CardView: ({ card, onMarkReviewed }: { card: Card; onMarkReviewed?: () => void }) => (
    <div data-testid="card-view">
      <div data-testid="card-quotation">{card.quotation}</div>
      <div data-testid="card-author">{card.author}</div>
      {onMarkReviewed && (
        <button onClick={onMarkReviewed} data-testid="mark-reviewed-button">
          Mark as Reviewed
        </button>
      )}
    </div>
  ),
}));

describe('ReviewSession', () => {
  const mockCards: Card[] = [
    {
      id: '1',
      quotation: 'First test quotation',
      author: 'First Author',
      reference: 'First Reference',
      schedule: 'daily',
      timeAdded: new Date('2025-01-01'),
      timeModified: new Date('2025-01-02'),
      lastReviewed: new Date('2025-01-03'),
      nextReview: new Date('2025-01-10'),
      reviewHistory: [new Date('2025-01-03')],
    },
    {
      id: '2',
      quotation: 'Second test quotation',
      author: 'Second Author',
      reference: 'Second Reference',
      schedule: 'even',
      timeAdded: new Date('2025-01-01'),
      timeModified: new Date('2025-01-02'),
      lastReviewed: new Date('2025-01-04'),
      nextReview: new Date('2025-01-11'),
      reviewHistory: [new Date('2025-01-04')],
    },
    {
      id: '3',
      quotation: 'Third test quotation',
      author: 'Third Author',
      reference: 'Third Reference',
      schedule: 'odd',
      timeAdded: new Date('2025-01-01'),
      timeModified: new Date('2025-01-02'),
      lastReviewed: new Date('2025-01-05'),
      nextReview: new Date('2025-01-12'),
      reviewHistory: [new Date('2025-01-05')],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dbOperations.markCardAsReviewed).mockResolvedValue(mockCards[0]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('empty state', () => {
    it('should show empty state when no cards provided', () => {
      render(<ReviewSession cards={[]} />);
      expect(screen.getByText(/no cards to review/i)).toBeInTheDocument();
      expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
    });

    it('should not show navigation controls in empty state', () => {
      render(<ReviewSession cards={[]} />);
      expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
    });
  });

  describe('progress tracking', () => {
    it('should display progress bar', () => {
      render(<ReviewSession cards={mockCards} />);
      expect(screen.getByText(/review progress/i)).toBeInTheDocument();
      expect(screen.getByText('0 of 3 completed')).toBeInTheDocument();
    });

    it('should display current card position', () => {
      render(<ReviewSession cards={mockCards} />);
      expect(screen.getByText('Card 1 of 3')).toBeInTheDocument();
    });

    it('should update progress after marking card as reviewed', async () => {
      const user = userEvent.setup();

      render(<ReviewSession cards={mockCards} />);

      // Mark first card as reviewed
      await user.click(screen.getByTestId('mark-reviewed-button'));

      // Wait for the auto-advance timeout
      await waitFor(() => {
        expect(screen.getByText('1 of 3 completed')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('card navigation', () => {
    it('should display first card initially', () => {
      render(<ReviewSession cards={mockCards} />);
      expect(screen.getByTestId('card-quotation')).toHaveTextContent('First test quotation');
      expect(screen.getByTestId('card-author')).toHaveTextContent('First Author');
    });

    it('should navigate to next card when Next button clicked', async () => {
      const user = userEvent.setup();
      render(<ReviewSession cards={mockCards} />);

      expect(screen.getByTestId('card-quotation')).toHaveTextContent('First test quotation');

      await user.click(screen.getByRole('button', { name: /next →/i }));

      expect(screen.getByTestId('card-quotation')).toHaveTextContent('Second test quotation');
      expect(screen.getByText('Card 2 of 3')).toBeInTheDocument();
    });

    it('should navigate to previous card when Previous button clicked', async () => {
      const user = userEvent.setup();
      render(<ReviewSession cards={mockCards} />);

      // Go to second card first
      await user.click(screen.getByRole('button', { name: /next →/i }));
      expect(screen.getByTestId('card-quotation')).toHaveTextContent('Second test quotation');

      // Go back to first card
      await user.click(screen.getByRole('button', { name: /← previous/i }));
      expect(screen.getByTestId('card-quotation')).toHaveTextContent('First test quotation');
      expect(screen.getByText('Card 1 of 3')).toBeInTheDocument();
    });

    it('should disable Previous button on first card', () => {
      render(<ReviewSession cards={mockCards} />);
      expect(screen.getByRole('button', { name: /← previous/i })).toBeDisabled();
    });

    it('should disable Next button on last card', async () => {
      const user = userEvent.setup();
      render(<ReviewSession cards={mockCards} />);

      // Navigate to last card
      await user.click(screen.getByRole('button', { name: /next →/i }));
      await user.click(screen.getByRole('button', { name: /next →/i }));

      expect(screen.getByRole('button', { name: /next →/i })).toBeDisabled();
    });

    it('should skip to next card when Skip button clicked', async () => {
      const user = userEvent.setup();
      render(<ReviewSession cards={mockCards} />);

      expect(screen.getByTestId('card-quotation')).toHaveTextContent('First test quotation');

      await user.click(screen.getByRole('button', { name: /skip/i }));

      expect(screen.getByTestId('card-quotation')).toHaveTextContent('Second test quotation');
    });
  });

  describe('marking cards as reviewed', () => {
    it('should call markCardAsReviewed when Mark as Reviewed is clicked', async () => {
      const user = userEvent.setup();
      render(<ReviewSession cards={mockCards} />);

      await user.click(screen.getByTestId('mark-reviewed-button'));

      expect(dbOperations.markCardAsReviewed).toHaveBeenCalledWith('1');
    });

    it('should call onCardReviewed callback when card is marked as reviewed', async () => {
      const user = userEvent.setup();
      const mockOnCardReviewed = vi.fn();

      render(<ReviewSession cards={mockCards} onCardReviewed={mockOnCardReviewed} />);

      await user.click(screen.getByTestId('mark-reviewed-button'));

      await waitFor(() => {
        expect(mockOnCardReviewed).toHaveBeenCalledWith(mockCards[0]);
      }, { timeout: 1000 });
    });

    it('should show reviewed indicator after marking card as reviewed', async () => {
      const user = userEvent.setup();

      render(<ReviewSession cards={mockCards} />);

      await user.click(screen.getByTestId('mark-reviewed-button'));

      await waitFor(() => {
        expect(screen.getByText(/✓ reviewed/i)).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should auto-advance to next card after marking as reviewed', async () => {
      const user = userEvent.setup();

      render(<ReviewSession cards={mockCards} />);

      expect(screen.getByTestId('card-quotation')).toHaveTextContent('First test quotation');

      await user.click(screen.getByTestId('mark-reviewed-button'));

      await waitFor(() => {
        expect(screen.getByTestId('card-quotation')).toHaveTextContent('Second test quotation');
      }, { timeout: 1000 });
    });

    it('should call onComplete when last card is marked as reviewed', async () => {
      const user = userEvent.setup();
      const mockOnComplete = vi.fn();

      render(<ReviewSession cards={[mockCards[0]]} onComplete={mockOnComplete} />);

      await user.click(screen.getByTestId('mark-reviewed-button'));

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    it('should prevent double-clicking mark as reviewed', async () => {
      const user = userEvent.setup();

      render(<ReviewSession cards={mockCards} />);

      const button = screen.getByTestId('mark-reviewed-button');

      // Click twice quickly
      await user.click(button);
      // Try to click again immediately (should be blocked by isReviewing flag)
      // Note: button might not exist for second click if it was removed, so we check
      const secondButton = screen.queryByTestId('mark-reviewed-button');
      if (secondButton) {
        await user.click(secondButton);
      }

      // Should only be called once
      await waitFor(() => {
        expect(dbOperations.markCardAsReviewed).toHaveBeenCalledTimes(1);
      }, { timeout: 500 });
    });

    it('should hide mark as reviewed button after card is reviewed', async () => {
      const user = userEvent.setup();

      render(<ReviewSession cards={mockCards} />);

      await user.click(screen.getByTestId('mark-reviewed-button'));

      await waitFor(() => {
        expect(screen.queryByTestId('mark-reviewed-button')).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('keyboard shortcuts', () => {
    it('should navigate to next card with arrow right key', async () => {
      const user = userEvent.setup();
      render(<ReviewSession cards={mockCards} />);

      expect(screen.getByTestId('card-quotation')).toHaveTextContent('First test quotation');

      await user.keyboard('{ArrowRight}');

      expect(screen.getByTestId('card-quotation')).toHaveTextContent('Second test quotation');
    });

    it('should navigate to previous card with arrow left key', async () => {
      const user = userEvent.setup();
      render(<ReviewSession cards={mockCards} />);

      // Go to second card first
      await user.keyboard('{ArrowRight}');

      // Go back
      await user.keyboard('{ArrowLeft}');

      expect(screen.getByTestId('card-quotation')).toHaveTextContent('First test quotation');
    });

    it('should mark card as reviewed with Enter key', async () => {
      const user = userEvent.setup();
      render(<ReviewSession cards={mockCards} />);

      await user.keyboard('{Enter}');

      expect(dbOperations.markCardAsReviewed).toHaveBeenCalledWith('1');
    });

    it('should skip card with S key', async () => {
      const user = userEvent.setup();
      render(<ReviewSession cards={mockCards} />);

      expect(screen.getByTestId('card-quotation')).toHaveTextContent('First test quotation');

      await user.keyboard('s');

      expect(screen.getByTestId('card-quotation')).toHaveTextContent('Second test quotation');
    });

    it('should call onComplete when skipping last card', async () => {
      const user = userEvent.setup();
      const mockOnComplete = vi.fn();

      render(<ReviewSession cards={[mockCards[0]]} onComplete={mockOnComplete} />);

      await user.keyboard('s');

      expect(mockOnComplete).toHaveBeenCalled();
    });

    it('should not trigger keyboard shortcuts when typing in input field', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <input type="text" data-testid="test-input" />
          <ReviewSession cards={mockCards} />
        </div>
      );

      const input = screen.getByTestId('test-input');
      await user.click(input);
      await user.keyboard('{ArrowRight}');

      // Should still be on first card since we were in an input
      expect(screen.getByTestId('card-quotation')).toHaveTextContent('First test quotation');
    });
  });

  describe('session completion', () => {
    it('should call onComplete when last card is skipped', async () => {
      const user = userEvent.setup();
      const mockOnComplete = vi.fn();

      render(<ReviewSession cards={[mockCards[0]]} onComplete={mockOnComplete} />);

      await user.click(screen.getByRole('button', { name: /skip/i }));

      expect(mockOnComplete).toHaveBeenCalled();
    });

    it('should complete entire session workflow', { timeout: 10000 }, async () => {
      const user = userEvent.setup();
      const mockOnComplete = vi.fn();
      const mockOnCardReviewed = vi.fn();

      render(
        <ReviewSession
          cards={mockCards}
          onComplete={mockOnComplete}
          onCardReviewed={mockOnCardReviewed}
        />
      );

      // Review first card
      await user.click(screen.getByTestId('mark-reviewed-button'));
      await waitFor(() => {
        expect(screen.getByTestId('card-quotation')).toHaveTextContent('Second test quotation');
      }, { timeout: 1000 });

      // Review second card
      await user.click(screen.getByTestId('mark-reviewed-button'));
      await waitFor(() => {
        expect(screen.getByTestId('card-quotation')).toHaveTextContent('Third test quotation');
      }, { timeout: 1000 });

      // Review third card
      await user.click(screen.getByTestId('mark-reviewed-button'));
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
      }, { timeout: 1000 });

      expect(dbOperations.markCardAsReviewed).toHaveBeenCalledTimes(3);
      expect(mockOnCardReviewed).toHaveBeenCalledTimes(3);
    });
  });

  describe('keyboard shortcuts help', () => {
    it('should display keyboard shortcuts help', () => {
      render(<ReviewSession cards={mockCards} />);
      expect(screen.getByText(/keyboard shortcuts/i)).toBeInTheDocument();
      expect(screen.getByText(/previous card/i)).toBeInTheDocument();
      expect(screen.getByText(/next card/i)).toBeInTheDocument();
      expect(screen.getByText(/mark reviewed/i)).toBeInTheDocument();
      expect(screen.getByText(/skip card/i)).toBeInTheDocument();
    });
  });
});
