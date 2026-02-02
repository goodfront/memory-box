import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ViewCardPage from './page';
import * as operations from '@/lib/db/operations';
import type { Card } from '@/lib/types';

// Mock the database operations
vi.mock('@/lib/db/operations', () => ({
  getCard: vi.fn(),
  deleteCard: vi.fn(),
}));

// Mock next/navigation
const mockPush = vi.fn();
const mockBack = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
  useSearchParams: () => mockSearchParams,
}));

const mockCard: Card = {
  id: 'test-card-1',
  quotation: 'Test quotation for viewing',
  author: 'Test Author',
  reference: 'Test Reference',
  schedule: 'daily',
  timeAdded: new Date('2024-01-01'),
  timeModified: new Date('2024-01-02'),
  lastReviewed: new Date('2024-01-03'),
  nextReview: new Date('2024-01-15'),
  reviewHistory: [new Date('2024-01-01'), new Date('2024-01-03')],
};

describe('View Card Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    mockBack.mockClear();
    mockSearchParams.set('id', 'test-card-1');
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching card', () => {
      vi.mocked(operations.getCard).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<ViewCardPage />);

      expect(screen.getByText(/loading card/i)).toBeInTheDocument();
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Page Header and Navigation', () => {
    beforeEach(() => {
      vi.mocked(operations.getCard).mockResolvedValue(mockCard);
    });

    it('should render page heading', async () => {
      render(<ViewCardPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: /card details/i })).toBeInTheDocument();
      });
    });

    it('should render page description', async () => {
      render(<ViewCardPage />);

      await waitFor(() => {
        expect(screen.getByText(/view and manage this memory card/i)).toBeInTheDocument();
      });
    });

    it('should render back button', async () => {
      render(<ViewCardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      });
    });

    it('should navigate back when back button is clicked', async () => {
      const user = userEvent.setup();
      render(<ViewCardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);

      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe('Card Display', () => {
    beforeEach(() => {
      vi.mocked(operations.getCard).mockResolvedValue(mockCard);
    });

    it('should render CardView component with correct props', async () => {
      render(<ViewCardPage />);

      await waitFor(() => {
        expect(screen.getByText(/test quotation for viewing/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/test author/i)).toBeInTheDocument();
      expect(screen.getByText(/test reference/i)).toBeInTheDocument();
    });

    it('should show action buttons (edit, delete)', async () => {
      render(<ViewCardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('should show metadata', async () => {
      render(<ViewCardPage />);

      await waitFor(() => {
        expect(screen.getByText(/test quotation for viewing/i)).toBeInTheDocument();
      });

      // Metadata should be visible (schedule, dates, etc.)
      expect(screen.getByText(/daily/i)).toBeInTheDocument();
    });
  });

  describe('Card Not Found', () => {
    it('should display error when card does not exist', async () => {
      vi.mocked(operations.getCard).mockResolvedValue(undefined);

      render(<ViewCardPage />);

      await waitFor(() => {
        expect(screen.getByText(/card not found/i)).toBeInTheDocument();
      });

      expect(
        screen.getByText(/the card you are looking for does not exist or has been deleted/i)
      ).toBeInTheDocument();
    });

    it('should show "Back to All Cards" button when card not found', async () => {
      vi.mocked(operations.getCard).mockResolvedValue(undefined);

      render(<ViewCardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to all cards/i })).toBeInTheDocument();
      });
    });

    it('should navigate to /cards when "Back to All Cards" is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(operations.getCard).mockResolvedValue(undefined);

      render(<ViewCardPage />);

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

      render(<ViewCardPage />);

      await waitFor(() => {
        expect(screen.getByText(/no card id provided/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when loading fails', async () => {
      vi.mocked(operations.getCard).mockRejectedValue(new Error('Database connection failed'));

      render(<ViewCardPage />);

      await waitFor(() => {
        expect(screen.getByText(/database connection failed/i)).toBeInTheDocument();
      });
    });

    it('should show "Back to All Cards" button on error', async () => {
      vi.mocked(operations.getCard).mockRejectedValue(new Error('Database error'));

      render(<ViewCardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to all cards/i })).toBeInTheDocument();
      });
    });

    it('should log error to console when loading fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(operations.getCard).mockRejectedValue(new Error('Database error'));

      render(<ViewCardPage />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading card:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edit Action', () => {
    beforeEach(() => {
      vi.mocked(operations.getCard).mockResolvedValue(mockCard);
    });

    it('should navigate to edit page when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<ViewCardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      expect(mockPush).toHaveBeenCalledWith('/cards/edit?id=test-card-1');
    });
  });

  describe('Delete Action', () => {
    beforeEach(() => {
      vi.mocked(operations.getCard).mockResolvedValue(mockCard);
    });

    it('should show confirmation modal when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<ViewCardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/delete card\?/i)).toBeInTheDocument();
      });

      expect(
        screen.getByText(/are you sure you want to delete this card.*cannot be undone/i)
      ).toBeInTheDocument();
    });

    it('should show cancel and confirm buttons in delete modal', async () => {
      const user = userEvent.setup();
      render(<ViewCardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /delete card/i })).toBeInTheDocument();
    });

    it('should close modal when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<ViewCardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /^cancel$/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(/delete card\?/i)).not.toBeInTheDocument();
      });
    });

    it('should delete card and navigate to /cards when confirmed', async () => {
      const user = userEvent.setup();
      vi.mocked(operations.deleteCard).mockResolvedValue(true);

      render(<ViewCardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete card/i })).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /delete card/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(operations.deleteCard).toHaveBeenCalledWith('test-card-1');
      });

      expect(mockPush).toHaveBeenCalledWith('/cards');
    });

    it('should show error if deletion fails', async () => {
      const user = userEvent.setup();
      vi.mocked(operations.deleteCard).mockResolvedValue(false);

      render(<ViewCardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete card/i })).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /delete card/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to delete card/i)).toBeInTheDocument();
      });
    });
  });
});
