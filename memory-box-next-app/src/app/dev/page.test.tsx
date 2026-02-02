import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DevToolsPage from './page';
import * as testData from '@/lib/db/testData';
import * as schema from '@/lib/db/schema';
import type { Card } from '@/lib/types';

// Mock the database operations
vi.mock('@/lib/db/testData', () => ({
  injectTestCards: vi.fn(),
  injectCardsDueToday: vi.fn(),
  injectOverdueCards: vi.fn(),
  resetWithTestCards: vi.fn(),
  getTestDataSummary: vi.fn(),
}));

vi.mock('@/lib/db/schema', () => ({
  clearDatabase: vi.fn(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockSummary = {
  total: 10,
  dueToday: 3,
  overdue: 2,
  future: 4,
  neverReviewed: 1,
};

describe('Dev Tools Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(testData.getTestDataSummary).mockResolvedValue(mockSummary);
  });

  describe('Page Header and Layout', () => {
    it('should render page heading', () => {
      render(<DevToolsPage />);
      expect(
        screen.getByRole('heading', { level: 1, name: /developer tools/i })
      ).toBeInTheDocument();
    });

    it('should render page description', () => {
      render(<DevToolsPage />);
      expect(screen.getByText(/inject test cards for development and testing/i)).toBeInTheDocument();
    });

    it('should render back link', () => {
      render(<DevToolsPage />);
      expect(screen.getByRole('link', { name: /← back/i })).toHaveAttribute('href', '/');
    });
  });

  describe('Action Buttons', () => {
    it('should render "Inject Test Cards" button', () => {
      render(<DevToolsPage />);
      expect(screen.getByRole('button', { name: /inject test cards/i })).toBeInTheDocument();
    });

    it('should render "Inject Cards Due Today" buttons', () => {
      render(<DevToolsPage />);
      expect(screen.getByRole('button', { name: /5 cards/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /10 cards/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /20 cards/i })).toBeInTheDocument();
    });

    it('should render "Inject Overdue Cards" button', () => {
      render(<DevToolsPage />);
      expect(screen.getByRole('button', { name: /inject overdue cards/i })).toBeInTheDocument();
    });

    it('should render "Clear All Data" button', () => {
      render(<DevToolsPage />);
      expect(screen.getByRole('button', { name: /clear all data/i })).toBeInTheDocument();
    });

    it('should render "Clear & Reset Database" button', () => {
      render(<DevToolsPage />);
      expect(screen.getByRole('button', { name: /clear & reset database/i })).toBeInTheDocument();
    });
  });

  describe('Inject Test Cards', () => {
    it('should inject test cards when button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(testData.injectTestCards).mockResolvedValue([
        { id: '1' } as Card,
        { id: '2' } as Card,
      ]);

      render(<DevToolsPage />);

      const button = screen.getByRole('button', { name: /inject test cards/i });
      await user.click(button);

      await waitFor(() => {
        expect(testData.injectTestCards).toHaveBeenCalled();
      });

      expect(
        screen.getByText(/successfully injected 2 test cards/i)
      ).toBeInTheDocument();
    });

    it('should display error message on failure', async () => {
      const user = userEvent.setup();
      vi.mocked(testData.injectTestCards).mockRejectedValue(new Error('Injection failed'));

      render(<DevToolsPage />);

      const button = screen.getByRole('button', { name: /inject test cards/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/error.*injection failed/i)).toBeInTheDocument();
      });
    });

    it('should update summary after injection', async () => {
      const user = userEvent.setup();
      vi.mocked(testData.injectTestCards).mockResolvedValue([{ id: '1' } as Card]);

      render(<DevToolsPage />);

      const button = screen.getByRole('button', { name: /inject test cards/i });
      await user.click(button);

      await waitFor(() => {
        expect(testData.getTestDataSummary).toHaveBeenCalled();
      });
    });
  });

  describe('Inject Cards Due Today', () => {
    it('should inject 5 cards when "5 Cards" button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(testData.injectCardsDueToday).mockResolvedValue([
        { id: '1' } as Card,
        { id: '2' } as Card,
        { id: '3' } as Card,
        { id: '4' } as Card,
        { id: '5' } as Card,
      ]);

      render(<DevToolsPage />);

      const button = screen.getByRole('button', { name: /5 cards/i });
      await user.click(button);

      await waitFor(() => {
        expect(testData.injectCardsDueToday).toHaveBeenCalledWith(5);
      });

      expect(
        screen.getByText(/successfully injected 5 cards due today/i)
      ).toBeInTheDocument();
    });

    it('should inject 10 cards when "10 Cards" button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(testData.injectCardsDueToday).mockResolvedValue(
        Array(10).fill({ id: '1' } as Card)
      );

      render(<DevToolsPage />);

      const button = screen.getByRole('button', { name: /10 cards/i });
      await user.click(button);

      await waitFor(() => {
        expect(testData.injectCardsDueToday).toHaveBeenCalledWith(10);
      });
    });

    it('should inject 20 cards when "20 Cards" button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(testData.injectCardsDueToday).mockResolvedValue(
        Array(20).fill({ id: '1' } as Card)
      );

      render(<DevToolsPage />);

      const button = screen.getByRole('button', { name: /20 cards/i });
      await user.click(button);

      await waitFor(() => {
        expect(testData.injectCardsDueToday).toHaveBeenCalledWith(20);
      });
    });
  });

  describe('Inject Overdue Cards', () => {
    it('should inject overdue cards when button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(testData.injectOverdueCards).mockResolvedValue(
        Array(12).fill({ id: '1' } as Card)
      );

      render(<DevToolsPage />);

      const button = screen.getByRole('button', { name: /inject overdue cards/i });
      await user.click(button);

      await waitFor(() => {
        expect(testData.injectOverdueCards).toHaveBeenCalled();
      });

      expect(
        screen.getByText(/successfully injected 12 overdue cards.*7 weekly.*5 monthly/i)
      ).toBeInTheDocument();
    });
  });

  describe('Clear Database', () => {
    it('should clear database when button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(schema.clearDatabase).mockResolvedValue(undefined);

      render(<DevToolsPage />);

      const button = screen.getByRole('button', { name: /clear all data/i });
      await user.click(button);

      await waitFor(() => {
        expect(schema.clearDatabase).toHaveBeenCalled();
      });

      expect(
        screen.getByText(/database cleared.*all cards have been deleted/i)
      ).toBeInTheDocument();
    });

    it('should update summary after clearing', async () => {
      const user = userEvent.setup();
      vi.mocked(schema.clearDatabase).mockResolvedValue(undefined);
      vi.mocked(testData.getTestDataSummary).mockResolvedValue({
        total: 0,
        dueToday: 0,
        overdue: 0,
        future: 0,
        neverReviewed: 0,
      });

      render(<DevToolsPage />);

      const button = screen.getByRole('button', { name: /clear all data/i });
      await user.click(button);

      await waitFor(() => {
        expect(testData.getTestDataSummary).toHaveBeenCalled();
      });
    });
  });

  describe('Reset Database', () => {
    it('should reset database when button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(testData.resetWithTestCards).mockResolvedValue(
        Array(10).fill({ id: '1' } as Card)
      );

      render(<DevToolsPage />);

      const button = screen.getByRole('button', { name: /clear & reset database/i });
      await user.click(button);

      await waitFor(() => {
        expect(testData.resetWithTestCards).toHaveBeenCalled();
      });

      expect(
        screen.getByText(/database cleared and 10 test cards injected/i)
      ).toBeInTheDocument();
    });
  });

  describe('Summary Display', () => {
    it('should display summary after successful operation', async () => {
      const user = userEvent.setup();
      vi.mocked(testData.injectTestCards).mockResolvedValue([{ id: '1' } as Card]);

      render(<DevToolsPage />);

      const button = screen.getByRole('button', { name: /inject test cards/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/current database summary/i)).toBeInTheDocument();
      });

      expect(screen.getByText('10')).toBeInTheDocument(); // Total
      expect(screen.getByText('3')).toBeInTheDocument(); // Due Today
      expect(screen.getByText('2')).toBeInTheDocument(); // Overdue
      expect(screen.getByText('4')).toBeInTheDocument(); // Future
      expect(screen.getByText('1')).toBeInTheDocument(); // Never Reviewed
    });

    it('should have refresh button in summary', async () => {
      const user = userEvent.setup();
      vi.mocked(testData.injectTestCards).mockResolvedValue([{ id: '1' } as Card]);

      render(<DevToolsPage />);

      const button = screen.getByRole('button', { name: /inject test cards/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      });
    });

    it('should refresh summary when refresh button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(testData.injectTestCards).mockResolvedValue([{ id: '1' } as Card]);

      render(<DevToolsPage />);

      const injectButton = screen.getByRole('button', { name: /inject test cards/i });
      await user.click(injectButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      });

      vi.mocked(testData.getTestDataSummary).mockClear();

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(testData.getTestDataSummary).toHaveBeenCalled();
      });
    });
  });

  describe('Quick Links', () => {
    it('should render quick links section', () => {
      render(<DevToolsPage />);
      expect(screen.getByRole('heading', { name: /quick links/i })).toBeInTheDocument();
    });

    it('should have link to review session', () => {
      render(<DevToolsPage />);
      expect(screen.getByRole('link', { name: /review session/i })).toHaveAttribute(
        'href',
        '/review'
      );
    });

    it('should have link to all cards', () => {
      render(<DevToolsPage />);
      expect(screen.getByRole('link', { name: /^all cards$/i })).toHaveAttribute('href', '/cards');
    });

    it('should have link to box overview', () => {
      render(<DevToolsPage />);
      expect(screen.getByRole('link', { name: /box overview/i })).toHaveAttribute('href', '/box');
    });
  });

  describe('Usage Instructions', () => {
    it('should render usage instructions section', () => {
      render(<DevToolsPage />);
      expect(screen.getByRole('heading', { name: /usage instructions/i })).toBeInTheDocument();
    });

    it('should list all usage instructions', () => {
      render(<DevToolsPage />);

      expect(
        screen.getByText(/use "inject test cards" to add diverse sample cards/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/use "inject cards due today" to quickly populate/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/use "reset database" when you want to start fresh/i)
      ).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should disable buttons while loading', async () => {
      const user = userEvent.setup();
      vi.mocked(testData.injectTestCards).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<DevToolsPage />);

      const button = screen.getByRole('button', { name: /inject test cards/i });
      await user.click(button);

      // All buttons showing "Loading..." should be disabled
      const loadingButtons = screen.getAllByRole('button', { name: /loading/i });
      expect(loadingButtons.length).toBeGreaterThan(0);
      loadingButtons.forEach(btn => {
        expect(btn).toBeDisabled();
      });
    });
  });
});
