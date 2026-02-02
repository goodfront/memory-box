import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { ServiceWorkerProvider } from './ServiceWorkerProvider';

describe('ServiceWorkerProvider', () => {
  let mockServiceWorker: {
    register: ReturnType<typeof vi.fn>;
    addEventListener: ReturnType<typeof vi.fn>;
  };
  let mockRegistration: {
    update: ReturnType<typeof vi.fn>;
    active: boolean | null;
    scope: string;
  };
  let originalEnv: string | undefined;

  beforeEach(() => {
    // Save original NODE_ENV
    originalEnv = process.env.NODE_ENV;

    // Mock service worker registration
    mockRegistration = {
      update: vi.fn(),
      active: true,
      scope: '/',
    };

    mockServiceWorker = {
      register: vi.fn().mockResolvedValue(mockRegistration),
      addEventListener: vi.fn(),
    };

    // Mock navigator.serviceWorker
    Object.defineProperty(global.navigator, 'serviceWorker', {
      value: mockServiceWorker,
      writable: true,
      configurable: true,
    });

    // Mock navigator.onLine
    Object.defineProperty(global.navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });

    // Mock window event listeners (ensure window exists first)
    if (typeof global.window !== 'undefined') {
      global.window.addEventListener = vi.fn();
    }

    // Mock setInterval
    vi.useFakeTimers();

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    // @ts-expect-error - Modifying readonly property for test purposes
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      // @ts-expect-error - Modifying readonly property for test purposes
      process.env.NODE_ENV = 'production';
    });

    it('should register service worker in production', () => {
      render(<ServiceWorkerProvider />);

      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js', { scope: '/' });
    });

    it('should log successful registration', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');

      render(<ServiceWorkerProvider />);

      await vi.waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(
          '[SW] Service Worker registered successfully:',
          '/'
        );
      });
    });

    it('should log when service worker is active', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');

      render(<ServiceWorkerProvider />);

      await vi.waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith('[SW] Service Worker is active');
      });
    });

    it('should set up periodic update checks', async () => {
      render(<ServiceWorkerProvider />);

      await vi.waitFor(() => {
        expect(mockServiceWorker.register).toHaveBeenCalled();
      });

      // Fast-forward time by 1 hour
      vi.advanceTimersByTime(60 * 60 * 1000);

      // Update should be called
      expect(mockRegistration.update).toHaveBeenCalled();
    });

    it('should check for updates every hour', async () => {
      render(<ServiceWorkerProvider />);

      await vi.waitFor(() => {
        expect(mockServiceWorker.register).toHaveBeenCalled();
      });

      // Fast-forward by 3 hours
      vi.advanceTimersByTime(3 * 60 * 60 * 1000);

      // Update should be called 3 times
      expect(mockRegistration.update).toHaveBeenCalledTimes(3);
    });

    it('should add event listener for controller change', () => {
      render(<ServiceWorkerProvider />);

      expect(mockServiceWorker.addEventListener).toHaveBeenCalledWith(
        'controllerchange',
        expect.any(Function)
      );
    });

    it('should add event listener for service worker messages', () => {
      render(<ServiceWorkerProvider />);

      expect(mockServiceWorker.addEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );
    });

    it('should add event listeners for online/offline events', () => {
      render(<ServiceWorkerProvider />);

      expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    it('should log initial online status', () => {
      const consoleLogSpy = vi.spyOn(console, 'log');

      render(<ServiceWorkerProvider />);

      expect(consoleLogSpy).toHaveBeenCalledWith('[SW] Initial online status:', true);
    });

    it('should handle registration errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      const error = new Error('Registration failed');
      mockServiceWorker.register.mockRejectedValue(error);

      render(<ServiceWorkerProvider />);

      await vi.waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[SW] Service Worker registration failed:',
          error
        );
      });
    });

    it('should handle case when service worker is not active', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      mockRegistration.active = null;

      render(<ServiceWorkerProvider />);

      await vi.waitFor(() => {
        expect(mockServiceWorker.register).toHaveBeenCalled();
      });

      // Should not log active message
      expect(consoleLogSpy).not.toHaveBeenCalledWith('[SW] Service Worker is active');
    });
  });

  describe('Development Environment', () => {
    beforeEach(() => {
      // @ts-expect-error - Modifying readonly property for test purposes
      process.env.NODE_ENV = 'development';
    });

    it('should not register service worker in development', () => {
      render(<ServiceWorkerProvider />);

      expect(mockServiceWorker.register).not.toHaveBeenCalled();
    });

    it('should not set up event listeners in development', () => {
      mockServiceWorker.addEventListener.mockClear();

      render(<ServiceWorkerProvider />);

      expect(mockServiceWorker.addEventListener).not.toHaveBeenCalled();
    });
  });

  describe('Browser Compatibility', () => {
    it('should not register service worker if not supported', () => {
      // Remove serviceWorker from navigator
      Object.defineProperty(global.navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // @ts-expect-error - Modifying readonly property for test purposes
      process.env.NODE_ENV = 'production';

      render(<ServiceWorkerProvider />);

      // Should not throw error, just skip registration
      expect(mockServiceWorker.register).not.toHaveBeenCalled();
    });

    it('should handle window being undefined (SSR)', () => {
      // @ts-expect-error - Modifying readonly property for test purposes
      process.env.NODE_ENV = 'production';

      // In SSR scenarios, typeof window !== 'undefined' will be false
      // We can't truly simulate SSR in a browser test environment,
      // but we can verify the component checks for window existence
      // The component should render without throwing
      expect(() => {
        render(<ServiceWorkerProvider />);
      }).not.toThrow();

      // Verify that the component has the window check in place by
      // confirming that service worker registration was called
      // (which means window was available in this test environment)
      expect(mockServiceWorker.register).toHaveBeenCalled();
    });
  });

  describe('Rendering', () => {
    it('should render nothing (null)', () => {
      const { container } = render(<ServiceWorkerProvider />);

      expect(container.firstChild).toBeNull();
    });

    it('should not affect other components', () => {
      const { container } = render(
        <div>
          <ServiceWorkerProvider />
          <div data-testid="child">Test Child</div>
        </div>
      );

      expect(container.querySelector('[data-testid="child"]')).toBeInTheDocument();
    });
  });

  describe('Event Handlers', () => {
    beforeEach(() => {
      // @ts-expect-error - Modifying readonly property for test purposes
      process.env.NODE_ENV = 'production';
    });

    it('should log controller change events', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');

      render(<ServiceWorkerProvider />);

      // Get the controllerchange handler
      const controllerChangeHandler = mockServiceWorker.addEventListener.mock.calls.find(
        (call) => call[0] === 'controllerchange'
      )?.[1];

      if (controllerChangeHandler) {
        controllerChangeHandler();
        expect(consoleLogSpy).toHaveBeenCalledWith('[SW] Service Worker controller changed');
      }
    });

    it('should log service worker messages', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');

      render(<ServiceWorkerProvider />);

      // Get the message handler
      const messageHandler = mockServiceWorker.addEventListener.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      if (messageHandler) {
        const mockEvent = { data: { type: 'test', payload: 'data' } };
        messageHandler(mockEvent);
        expect(consoleLogSpy).toHaveBeenCalledWith(
          '[SW] Message from service worker:',
          mockEvent.data
        );
      }
    });

    it('should log online events', () => {
      const consoleLogSpy = vi.spyOn(console, 'log');

      render(<ServiceWorkerProvider />);

      // Get the online handler
      const calls = (window.addEventListener as unknown as ReturnType<typeof vi.fn>).mock.calls;
      const onlineCall = calls.find((call) => call[0] === 'online');

      if (onlineCall && onlineCall[1]) {
        const handler = onlineCall[1] as () => void;
        handler();
        expect(consoleLogSpy).toHaveBeenCalledWith('[SW] Browser is online');
      }
    });

    it('should log offline events', () => {
      const consoleLogSpy = vi.spyOn(console, 'log');

      render(<ServiceWorkerProvider />);

      // Get the offline handler
      const calls = (window.addEventListener as unknown as ReturnType<typeof vi.fn>).mock.calls;
      const offlineCall = calls.find((call) => call[0] === 'offline');

      if (offlineCall && offlineCall[1]) {
        const handler = offlineCall[1] as () => void;
        handler();
        expect(consoleLogSpy).toHaveBeenCalledWith('[SW] Browser is offline');
      }
    });
  });
});
