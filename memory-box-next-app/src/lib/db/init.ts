/**
 * Database Initialization Module
 *
 * Provides comprehensive database initialization logic including:
 * - Browser compatibility checks
 * - Storage quota checks
 * - Connection state management
 * - Error handling with custom error types
 * - Database health checks
 */

import { db } from './schema';

/**
 * Custom error types for database initialization
 */
export class DatabaseError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class BrowserCompatibilityError extends DatabaseError {
  constructor(message: string) {
    super(message, 'BROWSER_INCOMPATIBLE');
    this.name = 'BrowserCompatibilityError';
  }
}

export class StorageQuotaError extends DatabaseError {
  constructor(message: string, public readonly available?: number, public readonly required?: number) {
    super(message, 'STORAGE_QUOTA_EXCEEDED');
    this.name = 'StorageQuotaError';
  }
}

export class DatabaseConnectionError extends DatabaseError {
  constructor(message: string, public readonly originalError?: Error) {
    super(message, 'CONNECTION_FAILED');
    this.name = 'DatabaseConnectionError';
  }
}

/**
 * Database initialization state
 */
export interface DatabaseInitState {
  isInitialized: boolean;
  isConnected: boolean;
  error?: Error;
  lastChecked?: Date;
}

let initState: DatabaseInitState = {
  isInitialized: false,
  isConnected: false
};

/**
 * Check if IndexedDB is supported in the current browser
 */
export function checkBrowserCompatibility(): { supported: boolean; error?: string } {
  // Check for IndexedDB support
  if (typeof window === 'undefined') {
    return { supported: false, error: 'Not running in browser environment' };
  }

  if (!window.indexedDB) {
    return {
      supported: false,
      error: 'IndexedDB is not supported in this browser. Please use a modern browser like Chrome, Firefox, Safari, or Edge.'
    };
  }

  // Check for crypto.getRandomValues (needed for UUID generation polyfill)
  // Note: We don't require crypto.randomUUID as we have a polyfill for that
  if (!window.crypto || !window.crypto.getRandomValues) {
    return {
      supported: false,
      error: 'Crypto API (getRandomValues) is not supported in this browser. Please use a modern browser.'
    };
  }

  return { supported: true };
}

/**
 * Check storage quota availability
 * Returns estimated available storage in bytes
 */
export async function checkStorageQuota(): Promise<{
  available: boolean;
  quota?: number;
  usage?: number;
  percentage?: number;
  error?: string;
}> {
  if (typeof window === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
    return {
      available: true, // Assume available if we can't check
      error: 'Storage estimation not supported'
    };
  }

  try {
    const estimate = await navigator.storage.estimate();
    const quota = estimate.quota ?? 0;
    const usage = estimate.usage ?? 0;
    const available = quota - usage;
    const percentage = quota > 0 ? (usage / quota) * 100 : 0;

    // Require at least 10MB available
    const MIN_REQUIRED_BYTES = 10 * 1024 * 1024; // 10MB

    return {
      available: available > MIN_REQUIRED_BYTES,
      quota,
      usage,
      percentage,
      error: available <= MIN_REQUIRED_BYTES
        ? `Insufficient storage: ${Math.round(available / 1024 / 1024)}MB available, ${Math.round(MIN_REQUIRED_BYTES / 1024 / 1024)}MB required`
        : undefined
    };
  } catch (error) {
    console.warn('Error checking storage quota:', error);
    return {
      available: true, // Assume available if check fails
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test database connection by performing a simple operation
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    // Try to open the database
    await db.open();

    // Test a simple read operation
    await db.boxes.count();

    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

/**
 * Get current database initialization state
 */
export function getInitializationState(): DatabaseInitState {
  return { ...initState };
}

/**
 * Initialize the database with comprehensive checks and error handling
 *
 * This function:
 * 1. Checks browser compatibility
 * 2. Checks storage quota availability
 * 3. Opens database connection
 * 4. Tests database connectivity
 * 5. Creates default box if needed
 * 6. Updates initialization state
 *
 * @throws {BrowserCompatibilityError} If browser doesn't support IndexedDB
 * @throws {StorageQuotaError} If insufficient storage is available
 * @throws {DatabaseConnectionError} If database connection fails
 */
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('[DB Init] Starting database initialization...');

    // 1. Check browser compatibility
    const compatibility = checkBrowserCompatibility();
    if (!compatibility.supported) {
      throw new BrowserCompatibilityError(compatibility.error ?? 'Browser not supported');
    }
    console.log('[DB Init] ✓ Browser compatibility check passed');

    // 2. Check storage quota
    const storageCheck = await checkStorageQuota();
    if (!storageCheck.available) {
      throw new StorageQuotaError(
        storageCheck.error ?? 'Insufficient storage available',
        storageCheck.quota ? storageCheck.quota - (storageCheck.usage ?? 0) : undefined,
        10 * 1024 * 1024 // 10MB minimum required
      );
    }
    if (storageCheck.quota && storageCheck.usage !== undefined) {
      console.log(
        `[DB Init] ✓ Storage check passed (${Math.round(storageCheck.usage / 1024 / 1024)}MB used / ${Math.round(storageCheck.quota / 1024 / 1024)}MB available)`
      );
    }

    // 3. Open database connection
    try {
      await db.open();
      console.log('[DB Init] ✓ Database connection opened');
    } catch (error) {
      throw new DatabaseConnectionError(
        'Failed to open database connection',
        error instanceof Error ? error : undefined
      );
    }

    // 4. Test database connectivity
    const connectionOk = await testDatabaseConnection();
    if (!connectionOk) {
      throw new DatabaseConnectionError('Database connection test failed');
    }
    console.log('[DB Init] ✓ Database connection test passed');

    // 5. Create default box if needed
    const boxCount = await db.boxes.count();
    if (boxCount === 0) {
      const now = new Date();
      await db.boxes.add({
        id: 'default-box',
        name: 'My Memory Box',
        createdAt: now,
        modifiedAt: now
      });
      console.log('[DB Init] ✓ Default box created');
    } else {
      console.log(`[DB Init] ✓ Found ${boxCount} existing box(es)`);
    }

    // 6. Update initialization state
    initState = {
      isInitialized: true,
      isConnected: true,
      lastChecked: new Date()
    };

    console.log('[DB Init] ✓ Database initialization complete');
  } catch (error) {
    // Update state with error
    initState = {
      isInitialized: false,
      isConnected: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
      lastChecked: new Date()
    };

    console.error('[DB Init] ✗ Database initialization failed:', error);

    // Re-throw the error for the caller to handle
    throw error;
  }
}

/**
 * Check if database is ready for use
 * Returns true if initialized and connected, false otherwise
 */
export function isDatabaseReady(): boolean {
  return initState.isInitialized && initState.isConnected && !initState.error;
}

/**
 * Perform a health check on the database
 * Useful for periodic checks or debugging
 */
export async function performHealthCheck(): Promise<{
  healthy: boolean;
  checks: {
    browserCompatible: boolean;
    storageAvailable: boolean;
    connected: boolean;
    tablesAccessible: boolean;
  };
  errors: string[];
}> {
  const errors: string[] = [];
  const checks = {
    browserCompatible: false,
    storageAvailable: false,
    connected: false,
    tablesAccessible: false
  };

  // Check browser compatibility
  const compatibility = checkBrowserCompatibility();
  checks.browserCompatible = compatibility.supported;
  if (!compatibility.supported && compatibility.error) {
    errors.push(`Browser: ${compatibility.error}`);
  }

  // Check storage
  const storage = await checkStorageQuota();
  checks.storageAvailable = storage.available;
  if (!storage.available && storage.error) {
    errors.push(`Storage: ${storage.error}`);
  }

  // Check connection
  checks.connected = await testDatabaseConnection();
  if (!checks.connected) {
    errors.push('Connection: Database connection test failed');
  }

  // Check table accessibility
  try {
    await db.boxes.count();
    await db.cards.count();
    checks.tablesAccessible = true;
  } catch (error) {
    checks.tablesAccessible = false;
    errors.push(`Tables: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  const healthy = Object.values(checks).every(check => check === true);

  return { healthy, checks, errors };
}

/**
 * Reset initialization state
 * Useful for testing or forced re-initialization
 */
export function resetInitializationState(): void {
  initState = {
    isInitialized: false,
    isConnected: false
  };
}
