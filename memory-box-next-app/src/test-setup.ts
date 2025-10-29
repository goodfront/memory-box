/**
 * Test setup file for Vitest
 * Configures fake-indexeddb for testing IndexedDB operations
 * Sets up browser globals for testing
 * Configures React Testing Library
 */

import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import Dexie from 'dexie';

// Ensure Dexie uses the fake IndexedDB
Dexie.dependencies.indexedDB = new IDBFactory();

// Mock browser globals for testing
if (typeof global.window === 'undefined') {
  // @ts-expect-error - Setting up test environment
  global.window = global;
}

// Mock window.crypto.randomUUID if not available
if (!global.crypto || !global.crypto.randomUUID) {
  global.crypto = {
    ...global.crypto,
    randomUUID: () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }
  } as Crypto;
}

// Mock navigator.storage for testing
if (!global.navigator) {
  // @ts-expect-error - Setting up test environment
  global.navigator = {};
}

if (!global.navigator.storage) {
  Object.defineProperty(global.navigator, 'storage', {
    value: {
      estimate: async () => ({
        quota: 100 * 1024 * 1024, // 100MB
        usage: 10 * 1024 * 1024 // 10MB
      }),
      persist: async () => false,
      persisted: async () => false
    } as StorageManager,
    writable: true,
    configurable: true
  });
}
