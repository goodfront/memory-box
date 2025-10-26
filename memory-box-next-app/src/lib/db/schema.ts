import Dexie, { type EntityTable } from 'dexie';
import type { Card, Box } from '../types';

/**
 * Memory Box Database Schema
 *
 * This database uses Dexie.js as an IndexedDB wrapper to store:
 * - Cards: Quotations to memorize with their review schedules
 * - Boxes: Collections of cards (MVP: single box per user)
 */
export class MemoryBoxDatabase extends Dexie {
  // Typed table properties
  cards!: EntityTable<Card, 'id'>;
  boxes!: EntityTable<Box, 'id'>;

  constructor() {
    super('MemoryBoxDB');

    // Define database schema
    // Version 1: Initial schema
    this.version(1).stores({
      // Cards table
      // Indexed fields: id (primary), schedule, nextReview, lastReviewed
      cards: 'id, schedule, nextReview, lastReviewed, timeAdded',

      // Boxes table
      // Indexed fields: id (primary)
      boxes: 'id, createdAt'
    });
  }
}

// Create and export a singleton database instance
export const db = new MemoryBoxDatabase();

/**
 * Clear all data from the database (useful for testing/reset)
 */
export async function clearDatabase(): Promise<void> {
  await db.cards.clear();
  await db.boxes.clear();
}

/**
 * Export all data from the database as JSON
 * Useful for backup/export functionality
 */
export async function exportData(): Promise<{ cards: Card[]; boxes: Box[] }> {
  const cards = await db.cards.toArray();
  const boxes = await db.boxes.toArray();

  return { cards, boxes };
}

/**
 * Import data into the database from JSON
 * Useful for restore/import functionality
 */
export async function importData(data: { cards: Card[]; boxes: Box[] }): Promise<void> {
  await db.transaction('rw', db.cards, db.boxes, async () => {
    // Clear existing data
    await db.cards.clear();
    await db.boxes.clear();

    // Import new data
    if (data.boxes.length > 0) {
      await db.boxes.bulkAdd(data.boxes);
    }
    if (data.cards.length > 0) {
      await db.cards.bulkAdd(data.cards);
    }
  });
}
