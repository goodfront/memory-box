import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DatabaseProvider, useDatabaseContext } from './DatabaseProvider';
import * as useDatabase from '@/lib/db/useDatabase';
import type { UseDatabaseResult } from '@/lib/db/useDatabase';
import type { DatabaseInitState } from '@/lib/db/init';

// Mock the useDatabase hook
vi.mock('@/lib/db/useDatabase', () => ({
  useDatabase: vi.fn(),
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

// Test component that uses the context
function TestConsumer() {
  const { isReady, isInitializing, error } = useDatabaseContext();
  return (
    <div>
      <div data-testid="ready">{isReady ? 'ready' : 'not-ready'}</div>
      <div data-testid="initializing">{isInitializing ? 'initializing' : 'not-initializing'}</div>
      <div data-testid="error">{error ? error.message : 'no-error'}</div>
    </div>
  );
}

describe('DatabaseProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization State', () => {
    it('should show loading state during initialization', () => {
      vi.mocked(useDatabase.useDatabase).mockReturnValue(createMockDatabaseResult({
        isReady: false,
        isInitializing: true,
      }));

      render(
        <DatabaseProvider>
          <TestConsumer />
        </DatabaseProvider>
      );

      expect(screen.getByText(/initializing memory box/i)).toBeInTheDocument();
      expect(screen.getByText(/setting up your local database/i)).toBeInTheDocument();
    });

    it('should show loading spinner during initialization', () => {
      vi.mocked(useDatabase.useDatabase).mockReturnValue(createMockDatabaseResult({
        isReady: false,
        isInitializing: true,
      }));

      const { container } = render(
        <DatabaseProvider>
          <TestConsumer />
        </DatabaseProvider>
      );

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    it('should render children when database is ready', () => {
      vi.mocked(useDatabase.useDatabase).mockReturnValue(createMockDatabaseResult({
        isReady: true,
      }));

      render(
        <DatabaseProvider>
          <TestConsumer />
        </DatabaseProvider>
      );

      expect(screen.getByTestId('ready')).toHaveTextContent('ready');
      expect(screen.queryByText(/initializing memory box/i)).not.toBeInTheDocument();
    });

    it('should provide database context to children', () => {
      vi.mocked(useDatabase.useDatabase).mockReturnValue(createMockDatabaseResult({
        isReady: true,
      }));

      render(
        <DatabaseProvider>
          <TestConsumer />
        </DatabaseProvider>
      );

      expect(screen.getByTestId('ready')).toHaveTextContent('ready');
      expect(screen.getByTestId('initializing')).toHaveTextContent('not-initializing');
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });
  });

  describe('Error State', () => {
    it('should show error message when initialization fails', () => {
      vi.mocked(useDatabase.useDatabase).mockReturnValue(createMockDatabaseResult({
        isReady: false,
        error: new Error('Failed to initialize database'),
      }));

      render(
        <DatabaseProvider>
          <TestConsumer />
        </DatabaseProvider>
      );

      expect(screen.getByText(/database initialization failed/i)).toBeInTheDocument();
      expect(screen.getByText(/failed to initialize database/i)).toBeInTheDocument();
    });

    it('should show retry button on error', () => {
      vi.mocked(useDatabase.useDatabase).mockReturnValue(createMockDatabaseResult({
        error: new Error('Failed to initialize database'),
      }));

      render(
        <DatabaseProvider>
          <TestConsumer />
        </DatabaseProvider>
      );

      expect(screen.getByRole('button', { name: /retry initialization/i })).toBeInTheDocument();
    });

    it('should call retry function when retry button is clicked', async () => {
      const user = userEvent.setup();
      const retryFn = vi.fn();

      vi.mocked(useDatabase.useDatabase).mockReturnValue(createMockDatabaseResult({
        error: new Error('Failed to initialize database'),
        retry: retryFn,
      }));

      render(
        <DatabaseProvider>
          <TestConsumer />
        </DatabaseProvider>
      );

      const retryButton = screen.getByRole('button', { name: /retry initialization/i });
      await user.click(retryButton);

      expect(retryFn).toHaveBeenCalled();
    });

    it('should show browser compatibility error details', () => {
      const error = new Error('IndexedDB not supported');
      error.name = 'BrowserCompatibilityError';

      vi.mocked(useDatabase.useDatabase).mockReturnValue(createMockDatabaseResult({
        error,
      }));

      render(
        <DatabaseProvider>
          <TestConsumer />
        </DatabaseProvider>
      );

      expect(screen.getByText(/browser not supported/i)).toBeInTheDocument();
      expect(
        screen.getByText(/memory box requires a modern browser with indexeddb support/i)
      ).toBeInTheDocument();
    });

    it('should show storage quota error details', () => {
      const error = new Error('Storage quota exceeded');
      error.name = 'StorageQuotaError';

      vi.mocked(useDatabase.useDatabase).mockReturnValue(createMockDatabaseResult({
        error,
      }));

      render(
        <DatabaseProvider>
          <TestConsumer />
        </DatabaseProvider>
      );

      expect(screen.getByText(/insufficient storage/i)).toBeInTheDocument();
      expect(
        screen.getByText(/your device is running low on storage space/i)
      ).toBeInTheDocument();
    });

    it('should not show children when error occurs and not ready', () => {
      vi.mocked(useDatabase.useDatabase).mockReturnValue(createMockDatabaseResult({
        error: new Error('Database error'),
      }));

      render(
        <DatabaseProvider>
          <TestConsumer />
        </DatabaseProvider>
      );

      expect(screen.queryByTestId('ready')).not.toBeInTheDocument();
    });
  });

  describe('Context Hook', () => {
    it('should throw error when useDatabaseContext is used outside provider', () => {
      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useDatabaseContext must be used within DatabaseProvider');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Error Recovery', () => {
    it('should allow recovery from error state by clicking retry', async () => {
      const user = userEvent.setup();
      const retryFn = vi.fn();

      // Start with error state
      const { rerender } = render(
        <DatabaseProvider>
          <TestConsumer />
        </DatabaseProvider>
      );

      vi.mocked(useDatabase.useDatabase).mockReturnValue(createMockDatabaseResult({
        error: new Error('Initial error'),
        retry: retryFn,
      }));

      rerender(
        <DatabaseProvider>
          <TestConsumer />
        </DatabaseProvider>
      );

      const retryButton = screen.getByRole('button', { name: /retry initialization/i });
      await user.click(retryButton);

      // Simulate successful retry
      vi.mocked(useDatabase.useDatabase).mockReturnValue(createMockDatabaseResult({
        isReady: true,
        retry: retryFn,
      }));

      rerender(
        <DatabaseProvider>
          <TestConsumer />
        </DatabaseProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText(/database initialization failed/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Visual Elements', () => {
    it('should render error icon in error state', () => {
      vi.mocked(useDatabase.useDatabase).mockReturnValue(createMockDatabaseResult({
        error: new Error('Database error'),
      }));

      const { container: errorContainer } = render(
        <DatabaseProvider>
          <TestConsumer />
        </DatabaseProvider>
      );

      const errorIcon = errorContainer.querySelector('svg');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should apply proper styling to error state', () => {
      vi.mocked(useDatabase.useDatabase).mockReturnValue(createMockDatabaseResult({
        error: new Error('Database error'),
      }));

      const { container } = render(
        <DatabaseProvider>
          <TestConsumer />
        </DatabaseProvider>
      );

      const errorContainer = container.querySelector('.bg-red-100');
      expect(errorContainer).toBeInTheDocument();
    });
  });
});
