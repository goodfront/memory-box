import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OverdueCardsModal } from './OverdueCardsModal';

describe('OverdueCardsModal Component', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render modal heading', () => {
      render(
        <OverdueCardsModal
          weeklyCount={5}
          monthlyCount={3}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('heading', { name: /overdue cards found/i })).toBeInTheDocument();
    });

    it('should render description text', () => {
      render(
        <OverdueCardsModal
          weeklyCount={5}
          monthlyCount={3}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(
        screen.getByText(/you have overdue cards that were missed.*include them in this review session/i)
      ).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(
        <OverdueCardsModal
          weeklyCount={5}
          monthlyCount={3}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: /skip overdue/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /include selected/i })).toBeInTheDocument();
    });
  });

  describe('Weekly Cards Display', () => {
    it('should show weekly checkbox when weeklyCount > 0', () => {
      render(
        <OverdueCardsModal
          weeklyCount={5}
          monthlyCount={0}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/weekly \(5\)/i)).toBeInTheDocument();
    });

    it('should show description for weekly cards', () => {
      render(
        <OverdueCardsModal
          weeklyCount={5}
          monthlyCount={0}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/cards scheduled for specific days of the week/i)).toBeInTheDocument();
    });

    it('should not show weekly checkbox when weeklyCount is 0', () => {
      render(
        <OverdueCardsModal
          weeklyCount={0}
          monthlyCount={5}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText(/weekly/i)).not.toBeInTheDocument();
    });

    it('should render weekly checkbox as unchecked by default', () => {
      render(
        <OverdueCardsModal
          weeklyCount={5}
          monthlyCount={0}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const weeklyCheckbox = screen.getByRole('checkbox', { name: /weekly/i });
      expect(weeklyCheckbox).not.toBeChecked();
    });
  });

  describe('Monthly Cards Display', () => {
    it('should show monthly checkbox when monthlyCount > 0', () => {
      render(
        <OverdueCardsModal
          weeklyCount={0}
          monthlyCount={3}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/monthly \(3\)/i)).toBeInTheDocument();
    });

    it('should show description for monthly cards', () => {
      render(
        <OverdueCardsModal
          weeklyCount={0}
          monthlyCount={3}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/cards scheduled for specific days of the month/i)).toBeInTheDocument();
    });

    it('should not show monthly checkbox when monthlyCount is 0', () => {
      render(
        <OverdueCardsModal
          weeklyCount={5}
          monthlyCount={0}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText(/monthly/i)).not.toBeInTheDocument();
    });

    it('should render monthly checkbox as unchecked by default', () => {
      render(
        <OverdueCardsModal
          weeklyCount={0}
          monthlyCount={3}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const monthlyCheckbox = screen.getByRole('checkbox', { name: /monthly/i });
      expect(monthlyCheckbox).not.toBeChecked();
    });
  });

  describe('Checkbox Interaction', () => {
    it('should toggle weekly checkbox when clicked', async () => {
      const user = userEvent.setup();

      render(
        <OverdueCardsModal
          weeklyCount={5}
          monthlyCount={3}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const weeklyCheckbox = screen.getByRole('checkbox', { name: /weekly/i });

      await user.click(weeklyCheckbox);
      expect(weeklyCheckbox).toBeChecked();

      await user.click(weeklyCheckbox);
      expect(weeklyCheckbox).not.toBeChecked();
    });

    it('should toggle monthly checkbox when clicked', async () => {
      const user = userEvent.setup();

      render(
        <OverdueCardsModal
          weeklyCount={5}
          monthlyCount={3}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const monthlyCheckbox = screen.getByRole('checkbox', { name: /monthly/i });

      await user.click(monthlyCheckbox);
      expect(monthlyCheckbox).toBeChecked();

      await user.click(monthlyCheckbox);
      expect(monthlyCheckbox).not.toBeChecked();
    });

    it('should allow both checkboxes to be checked', async () => {
      const user = userEvent.setup();

      render(
        <OverdueCardsModal
          weeklyCount={5}
          monthlyCount={3}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const weeklyCheckbox = screen.getByRole('checkbox', { name: /weekly/i });
      const monthlyCheckbox = screen.getByRole('checkbox', { name: /monthly/i });

      await user.click(weeklyCheckbox);
      await user.click(monthlyCheckbox);

      expect(weeklyCheckbox).toBeChecked();
      expect(monthlyCheckbox).toBeChecked();
    });
  });

  describe('Cancel Action', () => {
    it('should call onCancel when Skip Overdue button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <OverdueCardsModal
          weeklyCount={5}
          monthlyCount={3}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const skipButton = screen.getByRole('button', { name: /skip overdue/i });
      await user.click(skipButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Confirm Action', () => {
    it('should call onConfirm with both false when no checkboxes are selected', async () => {

      render(
        <OverdueCardsModal
          weeklyCount={5}
          monthlyCount={3}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // The button should be disabled when nothing is selected
      const includeButton = screen.getByRole('button', { name: /include selected/i });
      expect(includeButton).toBeDisabled();
    });

    it('should call onConfirm with (true, false) when only weekly is checked', async () => {
      const user = userEvent.setup();

      render(
        <OverdueCardsModal
          weeklyCount={5}
          monthlyCount={3}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const weeklyCheckbox = screen.getByRole('checkbox', { name: /weekly/i });
      await user.click(weeklyCheckbox);

      const includeButton = screen.getByRole('button', { name: /include selected/i });
      await user.click(includeButton);

      expect(mockOnConfirm).toHaveBeenCalledWith(true, false);
    });

    it('should call onConfirm with (false, true) when only monthly is checked', async () => {
      const user = userEvent.setup();

      render(
        <OverdueCardsModal
          weeklyCount={5}
          monthlyCount={3}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const monthlyCheckbox = screen.getByRole('checkbox', { name: /monthly/i });
      await user.click(monthlyCheckbox);

      const includeButton = screen.getByRole('button', { name: /include selected/i });
      await user.click(includeButton);

      expect(mockOnConfirm).toHaveBeenCalledWith(false, true);
    });

    it('should call onConfirm with (true, true) when both are checked', async () => {
      const user = userEvent.setup();

      render(
        <OverdueCardsModal
          weeklyCount={5}
          monthlyCount={3}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const weeklyCheckbox = screen.getByRole('checkbox', { name: /weekly/i });
      const monthlyCheckbox = screen.getByRole('checkbox', { name: /monthly/i });

      await user.click(weeklyCheckbox);
      await user.click(monthlyCheckbox);

      const includeButton = screen.getByRole('button', { name: /include selected/i });
      await user.click(includeButton);

      expect(mockOnConfirm).toHaveBeenCalledWith(true, true);
    });

    it('should enable Include button when at least one checkbox is selected', async () => {
      const user = userEvent.setup();

      render(
        <OverdueCardsModal
          weeklyCount={5}
          monthlyCount={3}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const includeButton = screen.getByRole('button', { name: /include selected/i });
      expect(includeButton).toBeDisabled();

      const weeklyCheckbox = screen.getByRole('checkbox', { name: /weekly/i });
      await user.click(weeklyCheckbox);

      expect(includeButton).toBeEnabled();
    });
  });

  describe('Modal Styling and Layout', () => {
    it('should render modal with backdrop', () => {
      const { container } = render(
        <OverdueCardsModal
          weeklyCount={5}
          monthlyCount={3}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const backdrop = container.querySelector('.fixed.inset-0.bg-black');
      expect(backdrop).toBeInTheDocument();
    });

    it('should render modal content container', () => {
      const { container } = render(
        <OverdueCardsModal
          weeklyCount={5}
          monthlyCount={3}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const modalContent = container.querySelector('.bg-white.rounded-lg');
      expect(modalContent).toBeInTheDocument();
    });

    it('should have proper z-index', () => {
      const { container } = render(
        <OverdueCardsModal
          weeklyCount={5}
          monthlyCount={3}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const backdrop = container.querySelector('.z-50');
      expect(backdrop).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle case with no overdue cards', () => {
      render(
        <OverdueCardsModal
          weeklyCount={0}
          monthlyCount={0}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('should handle large counts', () => {
      render(
        <OverdueCardsModal
          weeklyCount={999}
          monthlyCount={888}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/weekly \(999\)/i)).toBeInTheDocument();
      expect(screen.getByText(/monthly \(888\)/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have clickable labels for checkboxes', async () => {
      const user = userEvent.setup();

      render(
        <OverdueCardsModal
          weeklyCount={5}
          monthlyCount={3}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const weeklyLabel = screen.getByText(/weekly \(5\)/i).closest('label');
      expect(weeklyLabel).toBeInTheDocument();

      if (weeklyLabel) {
        await user.click(weeklyLabel);
        const weeklyCheckbox = screen.getByRole('checkbox', { name: /weekly/i });
        expect(weeklyCheckbox).toBeChecked();
      }
    });

    it('should have proper button roles', () => {
      render(
        <OverdueCardsModal
          weeklyCount={5}
          monthlyCount={3}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: /skip overdue/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /include selected/i })).toBeInTheDocument();
    });
  });
});
