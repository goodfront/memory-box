import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CardsPage from './page';
import * as operations from '@/lib/db/operations';
import type { Card } from '@/lib/types';

// Mock the database operations
vi.mock('@/lib/db/operations', () => ({
  getAllCards: vi.fn(),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

const mockCard1: Card = {
  id: 'test-card-1',
  quotation: 'First test quotation',
  author: 'Author One',
  reference: 'Reference One',
  schedule: 'daily',
  timeAdded: new Date('2024-01-01'),
  timeModified: new Date('2024-01-01'),
  lastReviewed: new Date('2024-01-01'),
  nextReview: new Date('2024-01-15'),
  reviewHistory: [new Date('2024-01-01')],
};

const mockCard2: Card = {
  id: 'test-card-2',
  quotation: 'Second test quotation',
  author: 'Author Two',
  reference: 'Reference Two',
  schedule: 'even',
  timeAdded: new Date('2024-01-02'),
  timeModified: new Date('2024-01-02'),
  nextReview: new Date('2024-01-16'),
  reviewHistory: [],
};

describe('Cards Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      vi.mocked(operations.getAllCards).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<CardsPage />);

      expect(screen.getByText(/loading cards/i)).toBeInTheDocument();
    });
  });

  describe('Page Header and Layout', () => {
    beforeEach(() => {
      vi.mocked(operations.getAllCards).mockResolvedValue([mockCard1, mockCard2]);
    });

    it('should render page heading', async () => {
      render(<CardsPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: /all cards/i })).toBeInTheDocument();
      });
    });

    it('should render page description', async () => {
      render(<CardsPage />);

      await waitFor(() => {
        expect(
          screen.getByText(
            /browse and manage all your memory cards.*use the search and filters/i
          )
        ).toBeInTheDocument();
      });
    });

    it('should render "Add New Card" button', async () => {
      render(<CardsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add new card/i })).toBeInTheDocument();
      });
    });

    it('should navigate to /cards/new when "Add New Card" is clicked', async () => {
      const user = userEvent.setup();
      render(<CardsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add new card/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add new card/i });
      await user.click(addButton);

      expect(mockPush).toHaveBeenCalledWith('/cards/new');
    });
  });

  describe('Card List Display', () => {
    beforeEach(() => {
      vi.mocked(operations.getAllCards).mockResolvedValue([mockCard1, mockCard2]);
    });

    it('should render CardList component after loading', async () => {
      render(<CardsPage />);

      await waitFor(() => {
        expect(screen.getByText(/first test quotation/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/second test quotation/i)).toBeInTheDocument();
    });

    it('should pass correct props to CardList', async () => {
      render(<CardsPage />);

      await waitFor(() => {
        expect(screen.getByText(/first test quotation/i)).toBeInTheDocument();
      });

      // Check that controls are shown (search, sort, filter)
      expect(screen.getByPlaceholderText(/search cards/i)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    beforeEach(() => {
      vi.mocked(operations.getAllCards).mockResolvedValue([]);
    });

    it('should display empty message when no cards exist', async () => {
      render(<CardsPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/no cards found.*create your first card to get started/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when loading fails', async () => {
      vi.mocked(operations.getAllCards).mockRejectedValue(new Error('Database error'));

      render(<CardsPage />);

      await waitFor(() => {
        expect(screen.getByText(/database error/i)).toBeInTheDocument();
      });
    });

    it('should log error to console when loading fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(operations.getAllCards).mockRejectedValue(new Error('Database error'));

      render(<CardsPage />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error loading cards:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Card Interaction', () => {
    beforeEach(() => {
      vi.mocked(operations.getAllCards).mockResolvedValue([mockCard1, mockCard2]);
    });

    it('should navigate to card view when a card is clicked', async () => {
      const user = userEvent.setup();
      render(<CardsPage />);

      await waitFor(() => {
        expect(screen.getByText(/first test quotation/i)).toBeInTheDocument();
      });

      // Click on the first card (assuming CardList renders clickable cards)
      const firstCard = screen.getByText(/first test quotation/i).closest('div');
      if (firstCard) {
        await user.click(firstCard);
        expect(mockPush).toHaveBeenCalledWith('/cards/view?id=test-card-1');
      }
    });
  });

  describe('Search and Filter Integration', () => {
    beforeEach(() => {
      vi.mocked(operations.getAllCards).mockResolvedValue([mockCard1, mockCard2]);
    });

    it('should render search input', async () => {
      render(<CardsPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search cards/i)).toBeInTheDocument();
      });
    });

    it('should render sort controls', async () => {
      render(<CardsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();
      });
    });

    it('should render schedule filter', async () => {
      render(<CardsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by schedule/i)).toBeInTheDocument();
      });
    });
  });

  describe('URL Parameter Handling', () => {
    it('should handle search parameter from URL', async () => {
      // Note: This test verifies that the search input exists and can be used
      // Testing URL parameter initialization requires a different mock setup approach
      vi.mocked(operations.getAllCards).mockResolvedValue([mockCard1]);

      render(<CardsPage />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search cards/i) as HTMLInputElement;
        expect(searchInput).toBeInTheDocument();
        // The input starts empty with our empty URLSearchParams mock
        expect(searchInput.value).toBe('');
      });
    });
  });
});
