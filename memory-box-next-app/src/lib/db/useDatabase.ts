'use client';

/**
 * React Hook for Database Initialization
 *
 * Provides a hook to initialize and monitor database status in React components
 */

import { useEffect, useState, useCallback } from 'react';
import {
  initializeDatabase,
  isDatabaseReady,
  getInitializationState,
  performHealthCheck,
  type DatabaseInitState
} from './init';

export interface UseDatabaseResult {
  /** Whether the database is ready for use */
  isReady: boolean;
  /** Whether initialization is in progress */
  isInitializing: boolean;
  /** Error that occurred during initialization, if any */
  error: Error | undefined;
  /** Current database initialization state */
  state: DatabaseInitState;
  /** Retry initialization after a failure */
  retry: () => Promise<void>;
  /** Perform a health check on the database */
  healthCheck: () => ReturnType<typeof performHealthCheck>;
}

/**
 * Hook to initialize and monitor database status
 *
 * @param autoInitialize - Whether to automatically initialize on mount (default: true)
 * @returns Database status and control functions
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isReady, isInitializing, error, retry } = useDatabase();
 *
 *   if (isInitializing) {
 *     return <div>Loading database...</div>;
 *   }
 *
 *   if (error) {
 *     return (
 *       <div>
 *         Error: {error.message}
 *         <button onClick={retry}>Retry</button>
 *       </div>
 *     );
 *   }
 *
 *   if (!isReady) {
 *     return <div>Database not ready</div>;
 *   }
 *
 *   return <div>Database ready!</div>;
 * }
 * ```
 */
export function useDatabase(autoInitialize = true): UseDatabaseResult {
  const [isInitializing, setIsInitializing] = useState(false);
  const [state, setState] = useState<DatabaseInitState>(() => getInitializationState());

  const initialize = useCallback(async () => {
    if (isInitializing) {
      return; // Already initializing
    }

    setIsInitializing(true);

    try {
      await initializeDatabase();
      setState(getInitializationState());
    } catch (error) {
      console.error('[useDatabase] Initialization failed:', error);
      setState(getInitializationState());
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing]);

  const retry = useCallback(async () => {
    await initialize();
  }, [initialize]);

  const healthCheck = useCallback(async () => {
    return await performHealthCheck();
  }, []);

  useEffect(() => {
    if (autoInitialize && !state.isInitialized && !isInitializing) {
      initialize();
    }
  }, [autoInitialize, state.isInitialized, isInitializing, initialize]);

  const isReady = isDatabaseReady();

  return {
    isReady,
    isInitializing,
    error: state.error,
    state,
    retry,
    healthCheck
  };
}

/**
 * Hook to get database ready status without automatic initialization
 * Useful for components that don't need to trigger initialization
 *
 * @example
 * ```tsx
 * function StatusIndicator() {
 *   const isReady = useDatabaseStatus();
 *   return <div>DB Status: {isReady ? '✓' : '✗'}</div>;
 * }
 * ```
 */
export function useDatabaseStatus(): boolean {
  const [isReady, setIsReady] = useState(isDatabaseReady());

  useEffect(() => {
    // Poll database status periodically
    const interval = setInterval(() => {
      setIsReady(isDatabaseReady());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return isReady;
}
