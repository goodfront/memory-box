/**
 * Database module exports
 * Provides easy access to database schema, operations, and utilities
 */

// Export database instance and schema functions
export {
  db,
  initializeDatabase,
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
