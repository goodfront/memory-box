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
 * WARNING: This will clear all existing data before importing
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

/**
 * Merge import data into the database
 * - Adds new cards (cards with IDs that don't exist)
 * - Updates existing cards (cards with matching IDs)
 * - Preserves cards not in the import file
 * - Same behavior for boxes
 */
export async function mergeImportData(data: { cards: Card[]; boxes: Box[] }): Promise<{
  cardsAdded: number;
  cardsUpdated: number;
  boxesAdded: number;
  boxesUpdated: number;
}> {
  let cardsAdded = 0;
  let cardsUpdated = 0;
  let boxesAdded = 0;
  let boxesUpdated = 0;

  await db.transaction('rw', db.cards, db.boxes, async () => {
    // Process boxes
    for (const box of data.boxes) {
      const existingBox = await db.boxes.get(box.id);
      if (existingBox) {
        await db.boxes.put(box);
        boxesUpdated++;
      } else {
        await db.boxes.add(box);
        boxesAdded++;
      }
    }

    // Process cards
    for (const card of data.cards) {
      const existingCard = await db.cards.get(card.id);
      if (existingCard) {
        await db.cards.put(card);
        cardsUpdated++;
      } else {
        await db.cards.add(card);
        cardsAdded++;
      }
    }
  });

  return { cardsAdded, cardsUpdated, boxesAdded, boxesUpdated };
}
