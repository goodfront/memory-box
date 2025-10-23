/**
 * Database module exports
 * Provides easy access to database schema, operations, and utilities
 */

// Export database instance and schema functions
export {
  db,
  clearDatabase,
  exportData,
  importData,
  MemoryBoxDatabase
} from './schema';

// Export all CRUD operations
export {
  createCard,
  getCard,
  getAllCards,
  getCardsBySchedule,
  getCardsDueForReview,
  updateCard,
  markCardAsReviewed,
  deleteCard,
  searchCards,
  getCardCountsBySchedule,
  getDueCardsCount
} from './operations';

// Export initialization functions and utilities
export {
  initializeDatabase,
  checkBrowserCompatibility,
  checkStorageQuota,
  testDatabaseConnection,
  getInitializationState,
  isDatabaseReady,
  performHealthCheck,
  resetInitializationState,
  DatabaseError,
  BrowserCompatibilityError,
  StorageQuotaError,
  DatabaseConnectionError,
  type DatabaseInitState
} from './init';

// Export React hooks
export { useDatabase, useDatabaseStatus, type UseDatabaseResult } from './useDatabase';
