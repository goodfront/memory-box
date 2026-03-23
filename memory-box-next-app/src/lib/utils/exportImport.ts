/**
 * Utility functions for exporting and importing database data
 */

import { exportData, importData, mergeImportData } from '../db/schema';
import type { Card, Box } from '../types';

export interface ExportData {
  version: string;
  exportDate: string;
  cards: Card[];
  boxes: Box[];
}

/**
 * Export database data to a JSON file and download it
 */
export async function exportDatabaseToFile(): Promise<void> {
  try {
    // Get all data from the database
    const data = await exportData();

    // Create export object with metadata
    const exportObject: ExportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      cards: data.cards,
      boxes: data.boxes
    };

    // Convert to JSON string
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
        if (!importObject.cards || !Array.isArray(importObject.cards)) {
          throw new Error('Invalid import file: missing or invalid cards array');
        }
        if (!importObject.boxes || !Array.isArray(importObject.boxes)) {
          throw new Error('Invalid import file: missing or invalid boxes array');
        }

        // Convert date strings back to Date objects
        const processedCards = importObject.cards.map(card => ({
          ...card,
          timeAdded: new Date(card.timeAdded),
          timeModified: new Date(card.timeModified),
          lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : undefined,
          nextReview: new Date(card.nextReview),
          reviewHistory: card.reviewHistory.map(date => new Date(date))
        }));

        const processedBoxes = importObject.boxes.map(box => ({
          ...box,
          createdAt: new Date(box.createdAt),
          modifiedAt: new Date(box.modifiedAt)
        }));

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
        if (!importObject.cards || !Array.isArray(importObject.cards)) {
          throw new Error('Invalid import file: missing or invalid cards array');
        }
        if (!importObject.boxes || !Array.isArray(importObject.boxes)) {
          throw new Error('Invalid import file: missing or invalid boxes array');
        }

        // Convert date strings back to Date objects
        const processedCards = importObject.cards.map(card => ({
          ...card,
          timeAdded: new Date(card.timeAdded),
          timeModified: new Date(card.timeModified),
          lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : undefined,
          nextReview: new Date(card.nextReview),
          reviewHistory: card.reviewHistory.map(date => new Date(date))
        }));

        const processedBoxes = importObject.boxes.map(box => ({
          ...box,
          createdAt: new Date(box.createdAt),
          modifiedAt: new Date(box.modifiedAt)
        }));

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

        // Check for required fields
        if (!importObject.cards || !Array.isArray(importObject.cards)) {
          resolve({ valid: false, error: 'Missing or invalid cards array' });
          return;
        }
        if (!importObject.boxes || !Array.isArray(importObject.boxes)) {
          resolve({ valid: false, error: 'Missing or invalid boxes array' });
          return;
        }

        // Validate card structure (spot check first card if exists)
        if (importObject.cards.length > 0) {
          const firstCard = importObject.cards[0];
          const requiredCardFields = ['id', 'quotation', 'schedule', 'timeAdded', 'timeModified', 'nextReview'];
          const missingFields = requiredCardFields.filter(field => !(field in firstCard));

          if (missingFields.length > 0) {
            resolve({
              valid: false,
              error: `Invalid card structure: missing fields ${missingFields.join(', ')}`
            });
            return;
          }
        }

        resolve({
          valid: true,
          stats: {
            cardCount: importObject.cards.length,
            boxCount: importObject.boxes.length,
            exportDate: importObject.exportDate,
            version: importObject.version
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
