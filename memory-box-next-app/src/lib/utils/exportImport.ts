/**
 * Utility functions for exporting and importing database data
 */

import { exportData, importData, mergeImportData } from '../db/schema';
import type { Card, Box, Schedule } from '../types';

/**
 * Card with dates serialized as strings (for JSON export)
 */
export interface CardSerialized {
  id: string;
  quotation: string;
  author?: string;
  reference?: string;
  schedule: Schedule;
  timeAdded: string;
  timeModified: string;
  lastReviewed?: string;
  nextReview: string;
  reviewHistory: string[];
}

/**
 * Box with dates serialized as strings (for JSON export)
 */
export interface BoxSerialized {
  id: string;
  name: string;
  createdAt: string;
  modifiedAt: string;
}

/**
 * Export data structure with serialized dates
 */
export interface ExportData {
  version: string;
  exportDate: string;
  cards: CardSerialized[];
  boxes: BoxSerialized[];
}

/**
 * Convert date strings in a card object to Date objects
 * @param card Card with date strings
 * @returns Card with Date objects
 */
export function processCardDates(card: CardSerialized): Card {
  return {
    ...card,
    timeAdded: new Date(card.timeAdded),
    timeModified: new Date(card.timeModified),
    lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : undefined,
    nextReview: new Date(card.nextReview),
    reviewHistory: card.reviewHistory.map(date => new Date(date))
  };
}

/**
 * Convert date strings in a box object to Date objects
 * @param box Box with date strings
 * @returns Box with Date objects
 */
export function processBoxDates(box: BoxSerialized): Box {
  return {
    ...box,
    createdAt: new Date(box.createdAt),
    modifiedAt: new Date(box.modifiedAt)
  };
}

/**
 * Validate the structure of an import data object
 * @param importObject The object to validate
 * @returns Validation result
 */
export function validateImportDataStructure(importObject: unknown): {
  valid: boolean;
  error?: string;
  data?: ExportData;
} {
  // Type guard to check if it's an object
  if (!importObject || typeof importObject !== 'object') {
    return { valid: false, error: 'Import data must be an object' };
  }

  const data = importObject as Partial<ExportData>;

  // Check for required fields
  if (!data.cards || !Array.isArray(data.cards)) {
    return { valid: false, error: 'Invalid import file: missing or invalid cards array' };
  }
  if (!data.boxes || !Array.isArray(data.boxes)) {
    return { valid: false, error: 'Invalid import file: missing or invalid boxes array' };
  }

  // Validate card structure (spot check first card if exists)
  if (data.cards.length > 0) {
    const firstCard = data.cards[0];
    const requiredCardFields = ['id', 'quotation', 'schedule', 'timeAdded', 'timeModified', 'nextReview'];
    const missingFields = requiredCardFields.filter(field => !(field in firstCard));

    if (missingFields.length > 0) {
      return {
        valid: false,
        error: `Invalid card structure: missing fields ${missingFields.join(', ')}`
      };
    }
  }

  return { valid: true, data: data as ExportData };
}

/**
 * Export database data to a JSON file and download it
 */
export async function exportDatabaseToFile(): Promise<void> {
  try {
    // Get all data from the database
    const data = await exportData();

    // Create export object with metadata
    // Note: JSON.stringify will automatically convert Date objects to ISO strings
    const exportObject = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      cards: data.cards,
      boxes: data.boxes
    };

    // Convert to JSON string (Date objects will be serialized to strings)
    const jsonString = JSON.stringify(exportObject, null, 2);

    // Create blob and download link
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create temporary download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `memory-box-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Import database data from a JSON file
 * @param file The file to import
 * @returns Statistics about the import
 */
export async function importDatabaseFromFile(file: File): Promise<{
  cardsImported: number;
  boxesImported: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const jsonString = event.target?.result as string;
        const importObject: ExportData = JSON.parse(jsonString);

        // Validate the import object structure
        const validation = validateImportDataStructure(importObject);
        if (!validation.valid || !validation.data) {
          throw new Error(validation.error);
        }

        // Convert date strings back to Date objects
        const processedCards = validation.data.cards.map(processCardDates);
        const processedBoxes = validation.data.boxes.map(processBoxDates);

        // Import the data
        await importData({
          cards: processedCards,
          boxes: processedBoxes
        });

        resolve({
          cardsImported: processedCards.length,
          boxesImported: processedBoxes.length
        });
      } catch (error) {
        reject(new Error(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Import database data from a JSON file with merge (preserve existing data)
 * - Adds new cards with IDs that don't exist
 * - Updates cards with matching IDs
 * - Preserves cards not in the import file
 * @param file The file to import
 * @returns Statistics about the import
 */
export async function importDatabaseFromFileMerge(file: File): Promise<{
  cardsAdded: number;
  cardsUpdated: number;
  boxesAdded: number;
  boxesUpdated: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const jsonString = event.target?.result as string;
        const importObject: ExportData = JSON.parse(jsonString);

        // Validate the import object structure
        const validation = validateImportDataStructure(importObject);
        if (!validation.valid || !validation.data) {
          throw new Error(validation.error);
        }

        // Convert date strings back to Date objects
        const processedCards = validation.data.cards.map(processCardDates);
        const processedBoxes = validation.data.boxes.map(processBoxDates);

        // Merge import the data
        const stats = await mergeImportData({
          cards: processedCards,
          boxes: processedBoxes
        });

        resolve(stats);
      } catch (error) {
        reject(new Error(`Failed to merge import data: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Validate a JSON file before importing
 * @param file The file to validate
 * @returns Validation result with details
 */
export async function validateImportFile(file: File): Promise<{
  valid: boolean;
  error?: string;
  stats?: {
    cardCount: number;
    boxCount: number;
    exportDate?: string;
    version?: string;
  };
}> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const jsonString = event.target?.result as string;
        const importObject: ExportData = JSON.parse(jsonString);

        // Validate structure
        const validation = validateImportDataStructure(importObject);
        if (!validation.valid || !validation.data) {
          resolve({ valid: false, error: validation.error });
          return;
        }

        resolve({
          valid: true,
          stats: {
            cardCount: validation.data.cards.length,
            boxCount: validation.data.boxes.length,
            exportDate: validation.data.exportDate,
            version: validation.data.version
          }
        });
      } catch (error) {
        resolve({
          valid: false,
          error: `Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    };

    reader.onerror = () => {
      resolve({ valid: false, error: 'Failed to read file' });
    };

    reader.readAsText(file);
  });
}
