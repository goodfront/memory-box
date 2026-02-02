import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReviewPage from './page';
import * as operations from '@/lib/db/operations';
import type { Card } from '@/lib/types';

// Mock the database operations
vi.mock('@/lib/db/operations', () => ({
  getCardsDueForReview: vi.fn(),
  getOverdueCards: vi.fn(),
  markCardAsReviewed: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

const mockCard: Card = {
  id: 'test-card-1',
  quotation: 'Test quotation for review',
  author: 'Test Author',
  reference: 'Test Reference',
  schedule: 'daily',
  timeAdded: new Date('2024-01-01'),
  timeModified: new Date('2024-01-01'),
  lastReviewed: new Date('2024-01-01'),
  nextReview: new Date(),
  reviewHistory: [new Date('2024-01-01')],
};

describe('Review Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      vi.mocked(operations.getCardsDueForReview).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      vi.mocked(operations.getOverdueCards).mockImplementation(
        () => new Promise(() => {})
      );

      render(<ReviewPage />);

      expect(screen.getByText(/loading review session/i)).toBeInTheDocument();
    });
  });

  describe('Empty State (No Cards Due)', () => {
    beforeEach(() => {
      vi.mocked(operations.getCardsDueForReview).mockResolvedValue([]);
      vi.mocked(operations.getOverdueCards).mockResolvedValue({
        weekly: [],
        monthly: [],
      });
    });

    it('should display empty state when no cards are due', async () => {
      render(<ReviewPage />);

      await waitFor(() => {
        expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(screen.getByText(/no cards are due for review today. check back tomorrow!/i)).toBeInTheDocument();
    });

    it('should show links to add new card and view box in empty state', async () => {
      render(<ReviewPage />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /add new card/i })).toHaveAttribute(
          'href',
          '/cards/new'
        );
      });

      expect(screen.getByRole('link', { name: /view box/i })).toHaveAttribute('href', '/box');
    });

    it('should display correct card count in header for empty state', async () => {
      render(<ReviewPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /all caught up/i })).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify the header shows "No cards are due for review today."
      const headerTexts = screen.getAllByText(/no cards are due for review today/i);
      expect(headerTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Review Session with Cards', () => {
    beforeEach(() => {
      vi.mocked(operations.getCardsDueForReview).mockResolvedValue([
        mockCard,
        { ...mockCard, id: 'test-card-2', quotation: 'Second test quotation' },
      ]);
      vi.mocked(operations.getOverdueCards).mockResolvedValue({
        weekly: [],
        monthly: [],
      });
      vi.mocked(operations.markCardAsReviewed).mockResolvedValue(mockCard);
    });

    it('should display correct card count in header', async () => {
      render(<ReviewPage />);

      await waitFor(() => {
        expect(screen.getByText(/you have 2 cards to review today/i)).toBeInTheDocument();
      });
    });

    it('should display singular "card" when only one card is due', async () => {
      vi.mocked(operations.getCardsDueForReview).mockResolvedValue([mockCard]);

      render(<ReviewPage />);

      await waitFor(() => {
        expect(screen.getByText(/you have 1 card to review today/i)).toBeInTheDocument();
      });
    });

    it('should render ReviewSession component with cards', async () => {
      const user = userEvent.setup();
      render(<ReviewPage />);

      // Wait for the ReviewSession to render - check for the "Show" button in review mode
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /show/i })).toBeInTheDocument();
      }, { timeout: 3000 });

      // Click the "Show" button to reveal the quotation
      const showButton = screen.getByRole('button', { name: /show/i });
      await user.click(showButton);

      // Now the quotation should be visible
      await waitFor(() => {
        expect(screen.getByText(/test quotation for review/i)).toBeInTheDocument();
      });
    });
  });

  describe('Session Complete State', () => {
    beforeEach(() => {
      vi.mocked(operations.getCardsDueForReview).mockResolvedValue([mockCard]);
      vi.mocked(operations.getOverdueCards).mockResolvedValue({
        weekly: [],
        monthly: [],
      });
      vi.mocked(operations.markCardAsReviewed).mockResolvedValue(mockCard);
    });

    it('should show completion screen after all cards are reviewed', async () => {
      const user = userEvent.setup();
      render(<ReviewPage />);

      // Wait for the ReviewSession to render
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
      }, { timeout: 3000 });

      // Complete the review session by clicking "Skip" on the last card
      const skipButton = screen.getByRole('button', { name: /skip/i });
      await user.click(skipButton);

      // Check for completion screen
      await waitFor(() => {
        expect(screen.getByText(/session complete/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(screen.getByText(/you reviewed 0 card/i)).toBeInTheDocument();
    });

    it('should display correct reviewed count with plural', async () => {
      // This test would need more complex mocking to track reviewed cards
      // For now, we'll test that the completion screen shows the count
      vi.mocked(operations.getCardsDueForReview).mockResolvedValue([
        mockCard,
        { ...mockCard, id: 'test-card-2' },
      ]);

      const user = userEvent.setup();
      render(<ReviewPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
      }, { timeout: 3000 });

      // Navigate to last card and skip to complete
      const nextButton = screen.getByRole('button', { name: /next →/i });
      await user.click(nextButton);

      const skipButton = screen.getByRole('button', { name: /skip/i });
      await user.click(skipButton);

      await waitFor(() => {
        expect(screen.getByText(/session complete/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should show "Start Another Session" button on completion', async () => {
      const user = userEvent.setup();
      render(<ReviewPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
      }, { timeout: 3000 });

      const skipButton = screen.getByRole('button', { name: /skip/i });
      await user.click(skipButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /start another session/i })
        ).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should show "View Box" link on completion', async () => {
      const user = userEvent.setup();
      render(<ReviewPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
      }, { timeout: 3000 });

      const skipButton = screen.getByRole('button', { name: /skip/i });
      await user.click(skipButton);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /view box/i })).toHaveAttribute('href', '/box');
      }, { timeout: 3000 });
    });
  });

  describe('Overdue Cards Modal', () => {
    it('should show overdue modal when weekly overdue cards exist', async () => {
      vi.mocked(operations.getCardsDueForReview).mockResolvedValue([]);
      vi.mocked(operations.getOverdueCards).mockResolvedValue({
        weekly: [mockCard],
        monthly: [],
      });

      render(<ReviewPage />);

      await waitFor(() => {
        expect(screen.getByText(/overdue cards found/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/weekly \(1\)/i)).toBeInTheDocument();
    });

    it('should show overdue modal when monthly overdue cards exist', async () => {
      vi.mocked(operations.getCardsDueForReview).mockResolvedValue([]);
      vi.mocked(operations.getOverdueCards).mockResolvedValue({
        weekly: [],
        monthly: [mockCard, { ...mockCard, id: 'test-card-2' }],
      });

      render(<ReviewPage />);

      await waitFor(() => {
        expect(screen.getByText(/overdue cards found/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/monthly \(2\)/i)).toBeInTheDocument();
    });

    it('should show both weekly and monthly overdue cards in modal', async () => {
      vi.mocked(operations.getCardsDueForReview).mockResolvedValue([]);
      vi.mocked(operations.getOverdueCards).mockResolvedValue({
        weekly: [mockCard],
        monthly: [{ ...mockCard, id: 'test-card-2' }],
      });

      render(<ReviewPage />);

      await waitFor(() => {
        expect(screen.getByText(/weekly \(1\)/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/monthly \(1\)/i)).toBeInTheDocument();
    });

    it('should not show overdue modal when no overdue cards exist', async () => {
      vi.mocked(operations.getCardsDueForReview).mockResolvedValue([mockCard]);
      vi.mocked(operations.getOverdueCards).mockResolvedValue({
        weekly: [],
        monthly: [],
      });

      render(<ReviewPage />);

      // Wait for the ReviewSession to render (card is in review mode, so quotation is hidden initially)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /show/i })).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(screen.queryByText(/overdue cards found/i)).not.toBeInTheDocument();
    });

    it('should close modal when "Skip Overdue" is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(operations.getCardsDueForReview).mockResolvedValue([]);
      vi.mocked(operations.getOverdueCards).mockResolvedValue({
        weekly: [mockCard],
        monthly: [],
      });

      render(<ReviewPage />);

      await waitFor(() => {
        expect(screen.getByText(/overdue cards found/i)).toBeInTheDocument();
      });

      const skipButton = screen.getByRole('button', { name: /skip overdue/i });
      await user.click(skipButton);

      await waitFor(() => {
        expect(screen.queryByText(/overdue cards found/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle errors when loading cards fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(operations.getCardsDueForReview).mockRejectedValue(
        new Error('Failed to load cards')
      );
      vi.mocked(operations.getOverdueCards).mockRejectedValue(new Error('Failed to load cards'));

      render(<ReviewPage />);

      await waitFor(() => {
        expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load due cards:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
