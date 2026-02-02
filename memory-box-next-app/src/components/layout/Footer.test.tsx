import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';
import * as DatabaseProvider from '@/components/providers/DatabaseProvider';
import type { UseDatabaseResult } from '@/lib/db/useDatabase';
import type { DatabaseInitState } from '@/lib/db/init';

// Mock the useDatabaseContext hook
vi.mock('@/components/providers/DatabaseProvider', () => ({
  useDatabaseContext: vi.fn(),
}));

// Helper to create mock database result
const createMockDatabaseResult = (overrides: Partial<UseDatabaseResult> = {}): UseDatabaseResult => {
  const defaultState: DatabaseInitState = {
    isInitialized: false,
    isConnected: false,
  };

  return {
    isReady: false,
    isInitializing: false,
    error: undefined,
    state: defaultState,
    retry: vi.fn(),
    healthCheck: vi.fn(),
    ...overrides,
  };
};

describe('Footer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    beforeEach(() => {
      vi.mocked(DatabaseProvider.useDatabaseContext).mockReturnValue(createMockDatabaseResult({
        isReady: true,
      }));
    });

    it('should render the footer text', () => {
      render(<Footer />);
      expect(screen.getByText('Memory Box')).toBeInTheDocument();
    });

    it('should render as a footer element', () => {
      const { container } = render(<Footer />);
      const footer = container.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });

    it('should have proper styling classes', () => {
      const { container } = render(<Footer />);
      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('border-t');
    });
  });

  describe('Database Status Indicator', () => {
    it('should show database ready indicator when database is ready', () => {
      vi.mocked(DatabaseProvider.useDatabaseContext).mockReturnValue(createMockDatabaseResult({
        isReady: true,
      }));

      render(<Footer />);

      expect(screen.getByText(/database ready/i)).toBeInTheDocument();
    });

    it('should show green check icon when database is ready', () => {
      vi.mocked(DatabaseProvider.useDatabaseContext).mockReturnValue(createMockDatabaseResult({
        isReady: true,
      }));

      const { container } = render(<Footer />);

      const checkIcon = container.querySelector('.text-green-600');
      expect(checkIcon).toBeInTheDocument();
    });

    it('should not show database indicator when database is not ready', () => {
      vi.mocked(DatabaseProvider.useDatabaseContext).mockReturnValue(createMockDatabaseResult({
        isInitializing: true,
      }));

      render(<Footer />);

      expect(screen.queryByText(/database ready/i)).not.toBeInTheDocument();
    });

    it('should not show database indicator when there is an error', () => {
      vi.mocked(DatabaseProvider.useDatabaseContext).mockReturnValue(createMockDatabaseResult({
        error: new Error('Database error'),
      }));

      render(<Footer />);

      expect(screen.queryByText(/database ready/i)).not.toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    beforeEach(() => {
      vi.mocked(DatabaseProvider.useDatabaseContext).mockReturnValue(createMockDatabaseResult({
        isReady: true,
      }));
    });

    it('should center content', () => {
      const { container } = render(<Footer />);
      const contentContainer = container.querySelector('.flex.flex-col.items-center');
      expect(contentContainer).toBeInTheDocument();
    });

    it('should have max-width container', () => {
      const { container } = render(<Footer />);
      const maxWidthContainer = container.querySelector('.max-w-7xl');
      expect(maxWidthContainer).toBeInTheDocument();
    });

    it('should have proper spacing', () => {
      const { container } = render(<Footer />);
      const contentContainer = container.querySelector('.gap-2');
      expect(contentContainer).toBeInTheDocument();
    });

    it('should have border at top', () => {
      const { container } = render(<Footer />);
      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('border-t');
    });

    it('should use proper text colors', () => {
      render(<Footer />);

      const memoryBoxText = screen.getByText('Memory Box');
      expect(memoryBoxText).toHaveClass('text-zinc-600');
    });

    it('should have proper padding', () => {
      const { container } = render(<Footer />);
      const paddingContainer = container.querySelector('.py-4');
      expect(paddingContainer).toBeInTheDocument();
    });
  });

  describe('Database Status Icon', () => {
    it('should render SVG icon with correct attributes', () => {
      vi.mocked(DatabaseProvider.useDatabaseContext).mockReturnValue(createMockDatabaseResult({
        isReady: true,
      }));

      const { container } = render(<Footer />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 20 20');
      expect(svg).toHaveAttribute('fill', 'currentColor');
    });

    it('should have proper icon size', () => {
      vi.mocked(DatabaseProvider.useDatabaseContext).mockReturnValue(createMockDatabaseResult({
        isReady: true,
      }));

      const { container } = render(<Footer />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-3', 'w-3');
    });

    it('should use green color for ready state', () => {
      vi.mocked(DatabaseProvider.useDatabaseContext).mockReturnValue(createMockDatabaseResult({
        isReady: true,
      }));

      const { container } = render(<Footer />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-green-600');
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      vi.mocked(DatabaseProvider.useDatabaseContext).mockReturnValue(createMockDatabaseResult({
        isReady: true,
      }));
    });

    it('should have responsive padding', () => {
      const { container } = render(<Footer />);
      const responsiveContainer = container.querySelector('.px-4.sm\\:px-6.lg\\:px-8');
      expect(responsiveContainer).toBeInTheDocument();
    });

    it('should have full width', () => {
      const { container } = render(<Footer />);
      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('w-full');
    });
  });

  describe('Dark Mode Support', () => {
    beforeEach(() => {
      vi.mocked(DatabaseProvider.useDatabaseContext).mockReturnValue(createMockDatabaseResult({
        isReady: true,
      }));
    });

    it('should have dark mode classes for background', () => {
      const { container } = render(<Footer />);
      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('dark:bg-zinc-950');
    });

    it('should have dark mode classes for border', () => {
      const { container } = render(<Footer />);
      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('dark:border-zinc-800');
    });

    it('should have dark mode classes for text', () => {
      render(<Footer />);
      const memoryBoxText = screen.getByText('Memory Box');
      expect(memoryBoxText).toHaveClass('dark:text-zinc-400');
    });

    it('should have dark mode classes for status text', () => {
      const { container } = render(<Footer />);
      const statusText = container.querySelector('.text-zinc-500');
      expect(statusText).toHaveClass('dark:text-zinc-500');
    });

    it('should have dark mode classes for icon', () => {
      const { container } = render(<Footer />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('dark:text-green-400');
    });
  });

  describe('Context Integration', () => {
    it('should call useDatabaseContext hook', () => {
      vi.mocked(DatabaseProvider.useDatabaseContext).mockReturnValue(createMockDatabaseResult({
        isReady: true,
      }));

      render(<Footer />);

      expect(DatabaseProvider.useDatabaseContext).toHaveBeenCalled();
    });

    it('should handle context value correctly', () => {
      vi.mocked(DatabaseProvider.useDatabaseContext).mockReturnValue(createMockDatabaseResult({
        isReady: false,
      }));

      render(<Footer />);

      expect(screen.queryByText(/database ready/i)).not.toBeInTheDocument();
    });
  });
});
