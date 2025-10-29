import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewCardPage from './page';
import * as dbOperations from '@/lib/db/operations';
import * as schedulingUtils from '@/lib/utils/scheduling';

// Mock the database operations
vi.mock('@/lib/db/operations', () => ({
  createCard: vi.fn(),
}));

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

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('NewCardPage', () => {
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

  it('should render the page with title and form', () => {
    render(<NewCardPage />);

    expect(screen.getByText('Create New Card')).toBeInTheDocument();
    expect(screen.getByText('Add a new quotation to your Memory Box.')).toBeInTheDocument();
    expect(screen.getByLabelText(/quotation/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create card/i })).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    render(<NewCardPage />);

    const boxLink = screen.getByText('← Back to Box');
    const cardsLink = screen.getByText('View All Cards');

    expect(boxLink).toBeInTheDocument();
    expect(boxLink).toHaveAttribute('href', '/box');
    expect(cardsLink).toBeInTheDocument();
    expect(cardsLink).toHaveAttribute('href', '/cards');
  });

  it('should create a card and show success message', async () => {
    const user = userEvent.setup();
    const mockCreatedCard = {
      id: '123',
      quotation: 'Test quotation',
      schedule: 'daily',
      timeAdded: new Date(),
      timeModified: new Date(),
      nextReview: new Date(),
      reviewHistory: [],
    };

    vi.mocked(dbOperations.createCard).mockResolvedValue(mockCreatedCard);

    render(<NewCardPage />);

    // Fill in the form
    await user.type(screen.getByLabelText(/quotation/i), 'Test quotation');
    await user.click(screen.getByRole('button', { name: /create card/i }));

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('Card created successfully!')).toBeInTheDocument();
    });

    expect(dbOperations.createCard).toHaveBeenCalledWith({
      quotation: 'Test quotation',
      author: undefined,
      reference: undefined,
      schedule: 'daily',
    });

    // Success message should have additional text
    expect(screen.getByText(/your quotation has been added to your memory box/i)).toBeInTheDocument();
  });

  it('should show error message when card creation fails', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Database error';
    vi.mocked(dbOperations.createCard).mockRejectedValue(new Error(errorMessage));

    render(<NewCardPage />);

    // Fill in the form
    await user.type(screen.getByLabelText(/quotation/i), 'Test quotation');
    await user.click(screen.getByRole('button', { name: /create card/i }));

    // Wait for error message (there will be two - one from page, one from CardForm)
    await waitFor(() => {
      const errorMessages = screen.getAllByText(errorMessage);
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    expect(dbOperations.createCard).toHaveBeenCalled();
  });

  it('should allow creating multiple cards in succession', async () => {
    const user = userEvent.setup();
    const mockCreatedCard = {
      id: '123',
      quotation: 'First quotation',
      schedule: 'daily',
      timeAdded: new Date(),
      timeModified: new Date(),
      nextReview: new Date(),
      reviewHistory: [],
    };

    vi.mocked(dbOperations.createCard).mockResolvedValue(mockCreatedCard);

    render(<NewCardPage />);

    // Create first card
    await user.type(screen.getByLabelText(/quotation/i), 'First quotation');
    await user.click(screen.getByRole('button', { name: /create card/i }));

    await waitFor(() => {
      expect(screen.getByText('Card created successfully!')).toBeInTheDocument();
    });

    // Form should be cleared, allowing for a second card
    expect(screen.getByLabelText(/quotation/i)).toHaveValue('');

    // Create second card
    await user.type(screen.getByLabelText(/quotation/i), 'Second quotation');
    await user.click(screen.getByRole('button', { name: /create card/i }));

    await waitFor(() => {
      expect(dbOperations.createCard).toHaveBeenCalledTimes(2);
    });
  });

  it('should show success message when card is created', async () => {
    const user = userEvent.setup();

    const mockCreatedCard = {
      id: '123',
      quotation: 'Test quotation',
      schedule: 'daily',
      timeAdded: new Date(),
      timeModified: new Date(),
      nextReview: new Date(),
      reviewHistory: [],
    };

    vi.mocked(dbOperations.createCard).mockResolvedValue(mockCreatedCard);

    render(<NewCardPage />);

    // Verify no success message initially
    expect(screen.queryByText('Card created successfully!')).not.toBeInTheDocument();

    // Fill and submit
    await user.type(screen.getByLabelText(/quotation/i), 'Test quotation');
    await user.click(screen.getByRole('button', { name: /create card/i }));

    // Success message should appear
    await waitFor(() => {
      expect(screen.getByText('Card created successfully!')).toBeInTheDocument();
    });
  });

  it('should clear error when creating a new card after a failed attempt', async () => {
    const user = userEvent.setup();

    // First attempt fails
    vi.mocked(dbOperations.createCard).mockRejectedValueOnce(new Error('First error'));

    render(<NewCardPage />);

    await user.type(screen.getByLabelText(/quotation/i), 'Test quotation');
    await user.click(screen.getByRole('button', { name: /create card/i }));

    // Wait for first error to appear
    await waitFor(() => {
      const errors = screen.getAllByText('First error');
      expect(errors.length).toBeGreaterThan(0);
    });

    // Second attempt succeeds
    const mockCreatedCard = {
      id: '123',
      quotation: 'Test quotation retry',
      schedule: 'daily',
      timeAdded: new Date(),
      timeModified: new Date(),
      nextReview: new Date(),
      reviewHistory: [],
    };

    vi.mocked(dbOperations.createCard).mockResolvedValueOnce(mockCreatedCard);

    // Clear the form and try again
    const quotationInput = screen.getByLabelText(/quotation/i);
    await user.clear(quotationInput);
    await user.type(quotationInput, 'Test quotation retry');

    // Wait for button to be ready
    await waitFor(() => {
      const button = screen.getByRole('button', { name: /create card/i });
      expect(button).not.toBeDisabled();
    });

    await user.click(screen.getByRole('button', { name: /create card/i }));

    // Error should be cleared and success should show
    await waitFor(() => {
      expect(screen.queryByText('First error')).not.toBeInTheDocument();
      expect(screen.getByText('Card created successfully!')).toBeInTheDocument();
    });
  });
});
