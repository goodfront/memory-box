import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initializeDatabase,
  checkBrowserCompatibility,
  checkStorageQuota,
  testDatabaseConnection,
  getInitializationState,
  isDatabaseReady,
  performHealthCheck,
  resetInitializationState,
  BrowserCompatibilityError,
  StorageQuotaError,
  DatabaseConnectionError
} from './init';
import { db } from './schema';

describe('checkBrowserCompatibility', () => {
  it('should return supported true in browser environment with IndexedDB', () => {
    const result = checkBrowserCompatibility();
    expect(result.supported).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should detect missing IndexedDB', () => {
    const originalIndexedDB = window.indexedDB;
    // @ts-expect-error - Testing missing IndexedDB
    delete window.indexedDB;

    const result = checkBrowserCompatibility();
    expect(result.supported).toBe(false);
    expect(result.error).toContain('IndexedDB is not supported');

    // Restore
    window.indexedDB = originalIndexedDB;
  });

  it('should detect missing crypto API', () => {
    const originalCrypto = window.crypto;
    // @ts-expect-error - Testing missing crypto
    delete window.crypto;

    const result = checkBrowserCompatibility();
    expect(result.supported).toBe(false);
    expect(result.error).toContain('Crypto API');

    // Restore
    window.crypto = originalCrypto;
  });
});

describe('checkStorageQuota', () => {
  it('should check storage quota when API is available', async () => {
    const result = await checkStorageQuota();

    // In test environment, may or may not be available
    expect(result).toHaveProperty('available');
    expect(typeof result.available).toBe('boolean');
  });

  it('should return available true when estimation not supported', async () => {
    const originalStorage = navigator.storage;
    // @ts-expect-error - Testing missing storage API
    delete navigator.storage;

    const result = await checkStorageQuota();
    expect(result.available).toBe(true);
    expect(result.error).toContain('not supported');

    // Restore
    Object.defineProperty(navigator, 'storage', {
      value: originalStorage,
      writable: true,
      configurable: true
    });
  });

  it('should detect insufficient storage', async () => {
    const originalStorage = navigator.storage;

    // Mock storage API to return insufficient space
    Object.defineProperty(navigator, 'storage', {
      value: {
        estimate: vi.fn().mockResolvedValue({
          quota: 5 * 1024 * 1024, // 5MB
          usage: 4.5 * 1024 * 1024 // 4.5MB used, only 0.5MB available
        })
      },
      writable: true,
      configurable: true
    });

    const result = await checkStorageQuota();
    expect(result.available).toBe(false);
    expect(result.error).toContain('Insufficient storage');

    // Restore
    Object.defineProperty(navigator, 'storage', {
      value: originalStorage,
      writable: true,
      configurable: true
    });
  });

  it('should report storage percentage', async () => {
    const originalStorage = navigator.storage;

    // Mock storage API with known values
    Object.defineProperty(navigator, 'storage', {
      value: {
        estimate: vi.fn().mockResolvedValue({
          quota: 100 * 1024 * 1024, // 100MB
          usage: 50 * 1024 * 1024 // 50MB used
        })
      },
      writable: true,
      configurable: true
    });

    const result = await checkStorageQuota();
    expect(result.percentage).toBe(50);

    // Restore
    Object.defineProperty(navigator, 'storage', {
      value: originalStorage,
      writable: true,
      configurable: true
    });
  });
});

describe('testDatabaseConnection', () => {
  afterEach(async () => {
    await db.delete();
    await db.close();
  });

  it('should return true when connection is successful', async () => {
    const result = await testDatabaseConnection();
    expect(result).toBe(true);
  });

  it('should return false when connection fails', async () => {
    // Close and delete the database to simulate connection failure
    await db.close();
    await db.delete();

    // Mock db.open to throw error
    const originalOpen = db.open;
    db.open = vi.fn().mockRejectedValue(new Error('Connection failed'));

    const result = await testDatabaseConnection();
    expect(result).toBe(false);

    // Restore
    db.open = originalOpen;
  });
});

describe('initializeDatabase', () => {
  beforeEach(() => {
    resetInitializationState();
  });

  afterEach(async () => {
    await db.delete();
    await db.close();
    resetInitializationState();
  });

  it('should successfully initialize database', async () => {
    await initializeDatabase();

    const state = getInitializationState();
    expect(state.isInitialized).toBe(true);
    expect(state.isConnected).toBe(true);
    expect(state.error).toBeUndefined();
    expect(state.lastChecked).toBeInstanceOf(Date);
  });

  it('should create default box on first initialization', async () => {
    await initializeDatabase();

    const boxes = await db.boxes.toArray();
    expect(boxes).toHaveLength(1);
    expect(boxes[0].id).toBe('default-box');
    expect(boxes[0].name).toBe('My Memory Box');
  });

  it('should not create duplicate default box', async () => {
    await initializeDatabase();
    await initializeDatabase();

    const boxes = await db.boxes.toArray();
    expect(boxes).toHaveLength(1);
  });

  it('should throw BrowserCompatibilityError when browser is incompatible', async () => {
    const originalIndexedDB = window.indexedDB;
    // @ts-expect-error - Testing missing IndexedDB
    delete window.indexedDB;

    await expect(initializeDatabase()).rejects.toThrow(BrowserCompatibilityError);

    const state = getInitializationState();
    expect(state.isInitialized).toBe(false);
    expect(state.error).toBeInstanceOf(BrowserCompatibilityError);

    // Restore
    window.indexedDB = originalIndexedDB;
  });

  it('should throw StorageQuotaError when storage is insufficient', async () => {
    const originalStorage = navigator.storage;

    // Mock insufficient storage
    Object.defineProperty(navigator, 'storage', {
      value: {
        estimate: vi.fn().mockResolvedValue({
          quota: 5 * 1024 * 1024,
          usage: 4.9 * 1024 * 1024
        })
      },
      writable: true,
      configurable: true
    });

    await expect(initializeDatabase()).rejects.toThrow(StorageQuotaError);

    const state = getInitializationState();
    expect(state.isInitialized).toBe(false);
    expect(state.error).toBeInstanceOf(StorageQuotaError);

    // Restore
    Object.defineProperty(navigator, 'storage', {
      value: originalStorage,
      writable: true,
      configurable: true
    });
  });

  it('should throw DatabaseConnectionError when connection fails', async () => {
    // Mock db.open to throw error
    const originalOpen = db.open;
    db.open = vi.fn().mockRejectedValue(new Error('Connection failed'));

    await expect(initializeDatabase()).rejects.toThrow(DatabaseConnectionError);

    const state = getInitializationState();
    expect(state.isInitialized).toBe(false);
    expect(state.error).toBeInstanceOf(DatabaseConnectionError);

    // Restore
    db.open = originalOpen;
  });

  it('should update lastChecked timestamp', async () => {
    const beforeInit = new Date();
    await initializeDatabase();
    const afterInit = new Date();

    const state = getInitializationState();
    expect(state.lastChecked).toBeInstanceOf(Date);
    expect(state.lastChecked!.getTime()).toBeGreaterThanOrEqual(beforeInit.getTime());
    expect(state.lastChecked!.getTime()).toBeLessThanOrEqual(afterInit.getTime());
  });
});

describe('isDatabaseReady', () => {
  beforeEach(() => {
    resetInitializationState();
  });

  afterEach(async () => {
    await db.delete();
    await db.close();
    resetInitializationState();
  });

  it('should return false before initialization', () => {
    expect(isDatabaseReady()).toBe(false);
  });

  it('should return true after successful initialization', async () => {
    await initializeDatabase();
    expect(isDatabaseReady()).toBe(true);
  });

  it('should return false after failed initialization', async () => {
    const originalIndexedDB = window.indexedDB;
    // @ts-expect-error - Testing missing IndexedDB
    delete window.indexedDB;

    try {
      await initializeDatabase();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      // Expected error
    }

    expect(isDatabaseReady()).toBe(false);

    // Restore
    window.indexedDB = originalIndexedDB;
  });
});

describe('performHealthCheck', () => {
  beforeEach(() => {
    resetInitializationState();
  });

  afterEach(async () => {
    await db.delete();
    await db.close();
    resetInitializationState();
  });

  it('should return healthy when all checks pass', async () => {
    await initializeDatabase();

    const health = await performHealthCheck();
    expect(health.healthy).toBe(true);
    expect(health.checks.browserCompatible).toBe(true);
    expect(health.checks.storageAvailable).toBe(true);
    expect(health.checks.connected).toBe(true);
    expect(health.checks.tablesAccessible).toBe(true);
    expect(health.errors).toHaveLength(0);
  });

  it('should detect browser compatibility issues', async () => {
    const originalIndexedDB = window.indexedDB;
    // @ts-expect-error - Testing missing IndexedDB
    delete window.indexedDB;

    const health = await performHealthCheck();
    expect(health.healthy).toBe(false);
    expect(health.checks.browserCompatible).toBe(false);
    expect(health.errors.length).toBeGreaterThan(0);

    // Restore
    window.indexedDB = originalIndexedDB;
  });

  it('should detect storage issues', async () => {
    const originalStorage = navigator.storage;

    // Mock insufficient storage
    Object.defineProperty(navigator, 'storage', {
      value: {
        estimate: vi.fn().mockResolvedValue({
          quota: 1 * 1024 * 1024,
          usage: 0.99 * 1024 * 1024
        })
      },
      writable: true,
      configurable: true
    });

    const health = await performHealthCheck();
    expect(health.checks.storageAvailable).toBe(false);
    expect(health.errors.some(e => e.includes('Storage'))).toBe(true);

    // Restore
    Object.defineProperty(navigator, 'storage', {
      value: originalStorage,
      writable: true,
      configurable: true
    });
  });

  it('should detect connection issues', async () => {
    // Mock db.open to simulate connection failure
    const originalOpen = db.open;
    db.open = vi.fn().mockRejectedValue(new Error('Cannot connect'));

    const health = await performHealthCheck();

    // Connection check should fail when database cannot connect
    expect(health.healthy).toBe(false);
    expect(health.checks.connected).toBe(false);
    expect(health.errors.some(e => e.includes('Connection'))).toBe(true);

    // Restore
    db.open = originalOpen;
  });
});

describe('getInitializationState', () => {
  beforeEach(() => {
    resetInitializationState();
  });

  afterEach(async () => {
    await db.delete();
    await db.close();
    resetInitializationState();
  });

  it('should return initial state before initialization', () => {
    const state = getInitializationState();
    expect(state.isInitialized).toBe(false);
    expect(state.isConnected).toBe(false);
    expect(state.error).toBeUndefined();
    expect(state.lastChecked).toBeUndefined();
  });

  it('should return updated state after initialization', async () => {
    await initializeDatabase();

    const state = getInitializationState();
    expect(state.isInitialized).toBe(true);
    expect(state.isConnected).toBe(true);
  });

  it('should return a copy of state (not reference)', async () => {
    await initializeDatabase();

    const state1 = getInitializationState();
    const state2 = getInitializationState();

    expect(state1).not.toBe(state2);
    expect(state1).toEqual(state2);
  });
});

describe('resetInitializationState', () => {
  afterEach(async () => {
    await db.delete();
    await db.close();
    resetInitializationState();
  });

  it('should reset state to initial values', async () => {
    await initializeDatabase();

    let state = getInitializationState();
    expect(state.isInitialized).toBe(true);

    resetInitializationState();

    state = getInitializationState();
    expect(state.isInitialized).toBe(false);
    expect(state.isConnected).toBe(false);
    expect(state.error).toBeUndefined();
    expect(state.lastChecked).toBeUndefined();
  });
});

describe('Error Classes', () => {
  it('should create BrowserCompatibilityError with correct properties', () => {
    const error = new BrowserCompatibilityError('Test message');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BrowserCompatibilityError);
    expect(error.message).toBe('Test message');
    expect(error.code).toBe('BROWSER_INCOMPATIBLE');
    expect(error.name).toBe('BrowserCompatibilityError');
  });

  it('should create StorageQuotaError with correct properties', () => {
    const error = new StorageQuotaError('Test message', 1000, 2000);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(StorageQuotaError);
    expect(error.message).toBe('Test message');
    expect(error.code).toBe('STORAGE_QUOTA_EXCEEDED');
    expect(error.name).toBe('StorageQuotaError');
    expect(error.available).toBe(1000);
    expect(error.required).toBe(2000);
  });

  it('should create DatabaseConnectionError with correct properties', () => {
    const originalError = new Error('Original error');
    const error = new DatabaseConnectionError('Test message', originalError);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DatabaseConnectionError);
    expect(error.message).toBe('Test message');
    expect(error.code).toBe('CONNECTION_FAILED');
    expect(error.name).toBe('DatabaseConnectionError');
    expect(error.originalError).toBe(originalError);
  });
});
