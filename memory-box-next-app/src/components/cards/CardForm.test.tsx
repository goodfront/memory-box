import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CardForm } from './CardForm';
import type { Card, CreateCardInput } from '@/lib/types';
import * as schedulingUtils from '@/lib/utils/scheduling';

// Mock the scheduling utils
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

describe('CardForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(schedulingUtils.getAllScheduleTypes).mockReturnValue([
      'daily',
      'even',
      'odd',
      'sunday',
      'monday',
      '1',
      '2',
    ]);
  });

  describe('create mode', () => {
    it('should render an empty form', () => {
      const mockOnSubmit = vi.fn();
      render(<CardForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/quotation/i)).toHaveValue('');
      expect(screen.getByLabelText(/author/i)).toHaveValue('');
      expect(screen.getByLabelText(/reference/i)).toHaveValue('');
      expect(screen.getByLabelText(/schedule/i)).toHaveValue('daily');
    });

    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
      render(<CardForm onSubmit={mockOnSubmit} />);

      // Fill in the form
      await user.type(screen.getByLabelText(/quotation/i), 'Test quotation');
      await user.type(screen.getByLabelText(/author/i), 'Test Author');
      await user.type(screen.getByLabelText(/reference/i), 'Test Reference');
      await user.selectOptions(screen.getByLabelText(/schedule/i), 'even');

      // Submit
      await user.click(screen.getByRole('button', { name: /save card/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          quotation: 'Test quotation',
          author: 'Test Author',
          reference: 'Test Reference',
          schedule: 'even',
        });
      });
    });

    it('should handle optional fields correctly', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
      render(<CardForm onSubmit={mockOnSubmit} />);

      // Only fill required fields
      await user.type(screen.getByLabelText(/quotation/i), 'Test quotation');

      // Submit
      await user.click(screen.getByRole('button', { name: /save card/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          quotation: 'Test quotation',
          author: undefined,
          reference: undefined,
          schedule: 'daily',
        });
      });
    });

    it('should not submit when quotation is empty (HTML5 validation)', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      render(<CardForm onSubmit={mockOnSubmit} />);

      // Try to submit without filling quotation
      await user.click(screen.getByRole('button', { name: /save card/i }));

      // HTML5 validation should prevent submission
      // Wait a bit to make sure onSubmit is not called
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should trim whitespace from inputs', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
      render(<CardForm onSubmit={mockOnSubmit} />);

      await user.type(screen.getByLabelText(/quotation/i), '  Test quotation  ');
      await user.type(screen.getByLabelText(/author/i), '  Test Author  ');
      await user.type(screen.getByLabelText(/reference/i), '  Test Reference  ');

      await user.click(screen.getByRole('button', { name: /save card/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          quotation: 'Test quotation',
          author: 'Test Author',
          reference: 'Test Reference',
          schedule: 'daily',
        });
      });
    });

    it('should reset form after successful submission', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
      render(<CardForm onSubmit={mockOnSubmit} />);

      // Fill and submit
      await user.type(screen.getByLabelText(/quotation/i), 'Test quotation');
      await user.type(screen.getByLabelText(/author/i), 'Test Author');
      await user.click(screen.getByRole('button', { name: /save card/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      // Form should be reset
      expect(screen.getByLabelText(/quotation/i)).toHaveValue('');
      expect(screen.getByLabelText(/author/i)).toHaveValue('');
    });

    it('should show error when submission fails', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'));
      render(<CardForm onSubmit={mockOnSubmit} />);

      await user.type(screen.getByLabelText(/quotation/i), 'Test quotation');
      await user.click(screen.getByRole('button', { name: /save card/i }));

      await waitFor(() => {
        expect(screen.getByText(/submission failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('edit mode', () => {
    const mockCard: Card = {
      id: '1',
      quotation: 'Existing quotation',
      author: 'Existing Author',
      reference: 'Existing Reference',
      schedule: 'even',
      timeAdded: new Date('2025-01-01'),
      timeModified: new Date('2025-01-01'),
      lastReviewed: new Date('2025-01-01'),
      nextReview: new Date('2025-01-02'),
      reviewHistory: [],
    };

    it('should pre-populate form with card data', () => {
      const mockOnSubmit = vi.fn();
      render(<CardForm card={mockCard} onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/quotation/i)).toHaveValue('Existing quotation');
      expect(screen.getByLabelText(/author/i)).toHaveValue('Existing Author');
      expect(screen.getByLabelText(/reference/i)).toHaveValue('Existing Reference');
      expect(screen.getByLabelText(/schedule/i)).toHaveValue('even');
    });

    it('should not reset form after successful submission in edit mode', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
      render(<CardForm card={mockCard} onSubmit={mockOnSubmit} />);

      await user.clear(screen.getByLabelText(/quotation/i));
      await user.type(screen.getByLabelText(/quotation/i), 'Updated quotation');
      await user.click(screen.getByRole('button', { name: /save card/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      // Form should NOT be reset in edit mode
      expect(screen.getByLabelText(/quotation/i)).toHaveValue('Updated quotation');
    });

    it('should handle card without optional fields', () => {
      const cardWithoutOptionals: Card = {
        ...mockCard,
        author: undefined,
        reference: undefined,
      };

      const mockOnSubmit = vi.fn();
      render(<CardForm card={cardWithoutOptionals} onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/author/i)).toHaveValue('');
      expect(screen.getByLabelText(/reference/i)).toHaveValue('');
    });
  });

  describe('cancel button', () => {
    it('should render cancel button when onCancel is provided', () => {
      const mockOnSubmit = vi.fn();
      const mockOnCancel = vi.fn();
      render(<CardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should not render cancel button when onCancel is not provided', () => {
      const mockOnSubmit = vi.fn();
      render(<CardForm onSubmit={mockOnSubmit} />);

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnCancel = vi.fn();
      render(<CardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should disable buttons during submission', async () => {
      const user = userEvent.setup();
      let resolveSubmit: () => void;
      const mockOnSubmit = vi.fn().mockImplementation(() =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        })
      );
      const mockOnCancel = vi.fn();
      render(<CardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await user.type(screen.getByLabelText(/quotation/i), 'Test');
      await user.click(screen.getByRole('button', { name: /save card/i }));

      // Buttons should be disabled during submission
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();

      // Resolve the submission
      resolveSubmit!();

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /saving/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('custom submit button text', () => {
    it('should use custom submit button text when provided', () => {
      const mockOnSubmit = vi.fn();
      render(<CardForm onSubmit={mockOnSubmit} submitButtonText="Create Card" />);

      expect(screen.getByRole('button', { name: /create card/i })).toBeInTheDocument();
    });
  });
});
