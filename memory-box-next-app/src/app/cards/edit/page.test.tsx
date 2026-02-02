import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditCardPage from './page';
import * as operations from '@/lib/db/operations';
import type { Card } from '@/lib/types';

// Mock the database operations
vi.mock('@/lib/db/operations', () => ({
  getCard: vi.fn(),
  updateCard: vi.fn(),
}));

// Mock next/navigation
const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

const mockCard: Card = {
  id: 'test-card-1',
  quotation: 'Original quotation',
  author: 'Original Author',
  reference: 'Original Reference',
  schedule: 'daily',
  timeAdded: new Date('2024-01-01'),
  timeModified: new Date('2024-01-02'),
  lastReviewed: new Date('2024-01-03'),
  nextReview: new Date('2024-01-15'),
  reviewHistory: [new Date('2024-01-01')],
};

describe('Edit Card Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    mockSearchParams.set('id', 'test-card-1');
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching card', () => {
      vi.mocked(operations.getCard).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<EditCardPage />);

      expect(screen.getByText(/loading card/i)).toBeInTheDocument();
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Page Header and Navigation', () => {
    beforeEach(() => {
      vi.mocked(operations.getCard).mockResolvedValue(mockCard);
    });

    it('should render page heading', async () => {
      render(<EditCardPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: /edit card/i })).toBeInTheDocument();
      });
    });

    it('should render page description', async () => {
      render(<EditCardPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/update the quotation, author, reference, or review schedule/i)
        ).toBeInTheDocument();
      });
    });

    it('should render back button', async () => {
      render(<EditCardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      });
    });

    it('should navigate to card view when back button is clicked', async () => {
      const user = userEvent.setup();
      render(<EditCardPage />);

      await waitFor(() => {
        const backButtons = screen.getAllByRole('button', { name: /back/i });
        expect(backButtons.length).toBeGreaterThan(0);
      });

      // Get the back button in the header (first one)
      const backButtons = screen.getAllByRole('button', { name: /back/i });
      await user.click(backButtons[0]);

      expect(mockPush).toHaveBeenCalledWith('/cards/view?id=test-card-1');
    });
  });

  describe('Card Form', () => {
    beforeEach(() => {
      vi.mocked(operations.getCard).mockResolvedValue(mockCard);
    });

    it('should render CardForm component', async () => {
      render(<EditCardPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/quotation/i)).toBeInTheDocument();
      });
    });

    it('should pre-populate form with existing card data', async () => {
      render(<EditCardPage />);

      await waitFor(() => {
        const quotationInput = screen.getByLabelText(/quotation/i) as HTMLTextAreaElement;
        expect(quotationInput.value).toBe('Original quotation');
      });

      const authorInput = screen.getByLabelText(/author/i) as HTMLInputElement;
      expect(authorInput.value).toBe('Original Author');

      const referenceInput = screen.getByLabelText(/reference/i) as HTMLInputElement;
      expect(referenceInput.value).toBe('Original Reference');
    });

    it('should render "Update Card" submit button', async () => {
      render(<EditCardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /update card/i })).toBeInTheDocument();
      });
    });

    it('should render cancel button', async () => {
      render(<EditCardPage />);

      await waitFor(() => {
        const cancelButtons = screen.getAllByRole('button', { name: /cancel|back/i });
        expect(cancelButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Card Not Found', () => {
    it('should display error when card does not exist', async () => {
      vi.mocked(operations.getCard).mockResolvedValue(undefined);

      render(<EditCardPage />);

      await waitFor(() => {
        expect(screen.getByText(/card not found/i)).toBeInTheDocument();
      });

      expect(
        screen.getByText(/the card you are trying to edit does not exist or has been deleted/i)
      ).toBeInTheDocument();
    });

    it('should show "Back to All Cards" button when card not found', async () => {
      vi.mocked(operations.getCard).mockResolvedValue(undefined);

      render(<EditCardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to all cards/i })).toBeInTheDocument();
      });
    });

    it('should navigate to /cards when "Back to All Cards" is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(operations.getCard).mockResolvedValue(undefined);

      render(<EditCardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to all cards/i })).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /back to all cards/i });
      await user.click(backButton);

      expect(mockPush).toHaveBeenCalledWith('/cards');
    });
  });

  describe('No ID Provided', () => {
    it('should display error when no ID is provided', async () => {
      mockSearchParams.delete('id');

      render(<EditCardPage />);

      await waitFor(() => {
        expect(screen.getByText(/no card id provided/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when loading fails', async () => {
      vi.mocked(operations.getCard).mockRejectedValue(new Error('Database connection failed'));

      render(<EditCardPage />);

      await waitFor(() => {
        expect(screen.getByText(/database connection failed/i)).toBeInTheDocument();
      });
    });

    it('should show "Back to All Cards" button on error', async () => {
      vi.mocked(operations.getCard).mockRejectedValue(new Error('Database error'));

      render(<EditCardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to all cards/i })).toBeInTheDocument();
      });
    });

    it('should log error to console when loading fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(operations.getCard).mockRejectedValue(new Error('Database error'));

      render(<EditCardPage />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading card:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      vi.mocked(operations.getCard).mockResolvedValue(mockCard);
    });

    it('should update card and navigate to view page on successful submit', async () => {
      const user = userEvent.setup();
      const updatedCard = { ...mockCard, quotation: 'Updated quotation' };
      vi.mocked(operations.updateCard).mockResolvedValue(updatedCard);

      render(<EditCardPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/quotation/i)).toBeInTheDocument();
      });

      const quotationInput = screen.getByLabelText(/quotation/i);
      await user.clear(quotationInput);
      await user.type(quotationInput, 'Updated quotation');

      const submitButton = screen.getByRole('button', { name: /update card/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(operations.updateCard).toHaveBeenCalledWith(
          'test-card-1',
          expect.objectContaining({
            quotation: 'Updated quotation',
          })
        );
      });

      expect(mockPush).toHaveBeenCalledWith('/cards/view?id=test-card-1');
    });

    it('should handle update errors', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(operations.updateCard).mockRejectedValue(new Error('Update failed'));

      render(<EditCardPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/quotation/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /update card/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating card:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle case when updateCard returns null', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(operations.updateCard).mockResolvedValue(undefined);

      render(<EditCardPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/quotation/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /update card/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating card:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Cancel Action', () => {
    beforeEach(() => {
      vi.mocked(operations.getCard).mockResolvedValue(mockCard);
    });

    it('should navigate to card view when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<EditCardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /update card/i })).toBeInTheDocument();
      });

      // Find the cancel button (it's within the CardForm)
      const cancelButtons = screen.getAllByRole('button', { name: /cancel|back/i });
      // The cancel button in the form should be the last one
      const cancelButton = cancelButtons[cancelButtons.length - 1];
      await user.click(cancelButton);

      expect(mockPush).toHaveBeenCalledWith('/cards/view?id=test-card-1');
    });

    it('should navigate to /cards when cancel is clicked and no ID exists', async () => {
      const user = userEvent.setup();
      mockSearchParams.delete('id');

      render(<EditCardPage />);

      // When there's no ID, an error state is shown with a "Back to All Cards" button
      await waitFor(() => {
        expect(screen.getByText(/no card id provided/i)).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /back to all cards/i });
      await user.click(backButton);

      expect(mockPush).toHaveBeenCalledWith('/cards');
    });
  });
});
