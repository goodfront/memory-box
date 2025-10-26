'use client';

/**
 * Database Provider Component
 *
 * Initializes the database on app startup and provides database status
 * to all child components via React Context.
 */

import { createContext, useContext, type ReactNode } from 'react';
import { useDatabase, type UseDatabaseResult } from '@/lib/db';

/**
 * Context for accessing database status throughout the app
 */
const DatabaseContext = createContext<UseDatabaseResult | null>(null);

/**
 * Hook to access database status in any component
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isReady, error } = useDatabaseContext();
 *
 *   if (!isReady) {
 *     return <div>Loading...</div>;
 *   }
 *
 *   // Use database
 * }
 * ```
 */
export function useDatabaseContext() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabaseContext must be used within DatabaseProvider');
  }
  return context;
}

interface DatabaseProviderProps {
  children: ReactNode;
}

/**
 * Database Provider Component
 *
 * Wraps the app and handles database initialization.
 * Shows loading state during initialization and error state if it fails.
 */
export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const database = useDatabase(true); // Auto-initialize on mount
  const { isReady, isInitializing, error, retry } = database;

  // Loading state
  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="flex flex-col items-center gap-4 p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
          <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Initializing Memory Box...
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Setting up your local database
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="flex flex-col items-center gap-6 p-8 max-w-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <svg
              className="h-8 w-8 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Database Initialization Failed
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-1">
              {error.message}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              Please try again or check your browser settings.
            </p>
          </div>

          <button
            onClick={retry}
            className="px-6 py-3 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
          >
            Retry Initialization
          </button>

          {error.name === 'BrowserCompatibilityError' && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium mb-1">Browser Not Supported</p>
              <p>
                Memory Box requires a modern browser with IndexedDB support. Please use
                Chrome, Firefox, Safari, or Edge.
              </p>
            </div>
          )}

          {error.name === 'StorageQuotaError' && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium mb-1">Insufficient Storage</p>
              <p>
                Your device is running low on storage space. Please free up some space
                and try again.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Success state - render app
  return (
    <DatabaseContext.Provider value={database}>
      {children}
    </DatabaseContext.Provider>
  );
}
