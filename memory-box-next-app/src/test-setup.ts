/**
 * Test setup file for Vitest
 * Configures fake-indexeddb for testing IndexedDB operations
 */

import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import Dexie from 'dexie';

// Ensure Dexie uses the fake IndexedDB
Dexie.dependencies.indexedDB = new IDBFactory();
