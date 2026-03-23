/**
 * Unit tests for export/import utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  validateImportFile,
  validateImportDataStructure,
  processCardDates,
  processBoxDates
} from './exportImport';
import type { ExportData } from './exportImport';

describe('validateImportFile', () => {
  // Helper function to create a File from JSON data
  function createJsonFile(data: unknown, filename = 'test.json'): File {
    const jsonString = JSON.stringify(data);
    const blob = new Blob([jsonString], { type: 'application/json' });
    return new File([blob], filename, { type: 'application/json' });
  }

  it('should validate a correct export file', async () => {
    const validData: ExportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      cards: [
        {
          id: 'card-1',
          quotation: 'Test quotation',
          schedule: 'daily',
          timeAdded: new Date().toISOString(),
          timeModified: new Date().toISOString(),
          nextReview: new Date().toISOString(),
          reviewHistory: []
        }
      ],
      boxes: [
        {
          id: 'box-1',
          name: 'My Box',
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString()
        }
      ]
    };

    const file = createJsonFile(validData);
    const result = await validateImportFile(file);

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.stats).toBeDefined();
    expect(result.stats?.cardCount).toBe(1);
    expect(result.stats?.boxCount).toBe(1);
    expect(result.stats?.version).toBe('1.0');
  });

  it('should validate an export file with multiple cards', async () => {
    const validData: ExportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      cards: [
        {
          id: 'card-1',
          quotation: 'Quote 1',
          schedule: 'daily',
          timeAdded: new Date().toISOString(),
          timeModified: new Date().toISOString(),
          nextReview: new Date().toISOString(),
          reviewHistory: []
        },
        {
          id: 'card-2',
          quotation: 'Quote 2',
          schedule: 'even',
          timeAdded: new Date().toISOString(),
          timeModified: new Date().toISOString(),
          nextReview: new Date().toISOString(),
          reviewHistory: []
        }
      ],
      boxes: []
    };

    const file = createJsonFile(validData);
    const result = await validateImportFile(file);

    expect(result.valid).toBe(true);
    expect(result.stats?.cardCount).toBe(2);
    expect(result.stats?.boxCount).toBe(0);
  });

  it('should validate an export file with empty arrays', async () => {
    const validData: ExportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      cards: [],
      boxes: []
    };

    const file = createJsonFile(validData);
    const result = await validateImportFile(file);

    expect(result.valid).toBe(true);
    expect(result.stats?.cardCount).toBe(0);
    expect(result.stats?.boxCount).toBe(0);
  });

  it('should reject invalid JSON', async () => {
    const blob = new Blob(['not valid json {'], { type: 'application/json' });
    const file = new File([blob], 'invalid.json', { type: 'application/json' });

    const result = await validateImportFile(file);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid JSON format');
  });

  it('should reject file missing cards array', async () => {
    const invalidData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      boxes: []
    };

    const file = createJsonFile(invalidData);
    const result = await validateImportFile(file);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid import file: missing or invalid cards array');
  });

  it('should reject file with non-array cards', async () => {
    const invalidData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      cards: 'not an array',
      boxes: []
    };

    const file = createJsonFile(invalidData);
    const result = await validateImportFile(file);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid import file: missing or invalid cards array');
  });

  it('should reject file missing boxes array', async () => {
    const invalidData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      cards: []
    };

    const file = createJsonFile(invalidData);
    const result = await validateImportFile(file);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid import file: missing or invalid boxes array');
  });

  it('should reject file with non-array boxes', async () => {
    const invalidData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      cards: [],
      boxes: 'not an array'
    };

    const file = createJsonFile(invalidData);
    const result = await validateImportFile(file);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid import file: missing or invalid boxes array');
  });

  it('should reject file with invalid card structure (missing id)', async () => {
    const invalidData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      cards: [
        {
          // Missing id field
          quotation: 'Test quotation',
          schedule: 'daily',
          timeAdded: new Date().toISOString(),
          timeModified: new Date().toISOString(),
          nextReview: new Date().toISOString()
        }
      ],
      boxes: []
    };

    const file = createJsonFile(invalidData);
    const result = await validateImportFile(file);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid card structure');
    expect(result.error).toContain('id');
  });

  it('should reject file with invalid card structure (missing quotation)', async () => {
    const invalidData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      cards: [
        {
          id: 'card-1',
          // Missing quotation field
          schedule: 'daily',
          timeAdded: new Date().toISOString(),
          timeModified: new Date().toISOString(),
          nextReview: new Date().toISOString()
        }
      ],
      boxes: []
    };

    const file = createJsonFile(invalidData);
    const result = await validateImportFile(file);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid card structure');
    expect(result.error).toContain('quotation');
  });

  it('should reject file with invalid card structure (missing schedule)', async () => {
    const invalidData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      cards: [
        {
          id: 'card-1',
          quotation: 'Test quotation',
          // Missing schedule field
          timeAdded: new Date().toISOString(),
          timeModified: new Date().toISOString(),
          nextReview: new Date().toISOString()
        }
      ],
      boxes: []
    };

    const file = createJsonFile(invalidData);
    const result = await validateImportFile(file);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid card structure');
    expect(result.error).toContain('schedule');
  });

  it('should reject file with invalid card structure (missing multiple fields)', async () => {
    const invalidData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      cards: [
        {
          id: 'card-1'
          // Missing all other required fields
        }
      ],
      boxes: []
    };

    const file = createJsonFile(invalidData);
    const result = await validateImportFile(file);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid card structure');
  });

  it('should include export metadata in stats when present', async () => {
    const validData: ExportData = {
      version: '2.0',
      exportDate: '2024-01-15T12:00:00.000Z',
      cards: [],
      boxes: []
    };

    const file = createJsonFile(validData);
    const result = await validateImportFile(file);

    expect(result.valid).toBe(true);
    expect(result.stats?.version).toBe('2.0');
    expect(result.stats?.exportDate).toBe('2024-01-15T12:00:00.000Z');
  });

  it('should handle cards with optional fields', async () => {
    const validData: ExportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      cards: [
        {
          id: 'card-1',
          quotation: 'Test quotation',
          author: 'Test Author',
          reference: 'Test Reference',
          schedule: 'daily',
          timeAdded: new Date().toISOString(),
          timeModified: new Date().toISOString(),
          lastReviewed: new Date().toISOString(),
          nextReview: new Date().toISOString(),
          reviewHistory: [new Date().toISOString()]
        }
      ],
      boxes: []
    };

    const file = createJsonFile(validData);
    const result = await validateImportFile(file);

    expect(result.valid).toBe(true);
    expect(result.stats?.cardCount).toBe(1);
  });
});

describe('processCardDates', () => {
  it('should convert date strings to Date objects', () => {
    const timeAddedStr = '2024-01-15T10:00:00.000Z';
    const timeModifiedStr = '2024-01-16T12:00:00.000Z';
    const nextReviewStr = '2024-01-17T14:00:00.000Z';
    const lastReviewedStr = '2024-01-14T08:00:00.000Z';
    const reviewHistoryStr = ['2024-01-10T10:00:00.000Z', '2024-01-11T10:00:00.000Z'];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const card: any = {
      id: 'card-1',
      quotation: 'Test quotation',
      schedule: 'daily',
      timeAdded: timeAddedStr,
      timeModified: timeModifiedStr,
      nextReview: nextReviewStr,
      lastReviewed: lastReviewedStr,
      reviewHistory: reviewHistoryStr
    };

    const processed = processCardDates(card);

    expect(processed.timeAdded).toBeInstanceOf(Date);
    expect(processed.timeAdded.toISOString()).toBe(timeAddedStr);
    expect(processed.timeModified).toBeInstanceOf(Date);
    expect(processed.timeModified.toISOString()).toBe(timeModifiedStr);
    expect(processed.nextReview).toBeInstanceOf(Date);
    expect(processed.nextReview.toISOString()).toBe(nextReviewStr);
    expect(processed.lastReviewed).toBeInstanceOf(Date);
    expect(processed.lastReviewed?.toISOString()).toBe(lastReviewedStr);
    expect(processed.reviewHistory).toHaveLength(2);
    expect(processed.reviewHistory[0]).toBeInstanceOf(Date);
    expect(processed.reviewHistory[0].toISOString()).toBe(reviewHistoryStr[0]);
    expect(processed.reviewHistory[1]).toBeInstanceOf(Date);
    expect(processed.reviewHistory[1].toISOString()).toBe(reviewHistoryStr[1]);
  });

  it('should handle undefined lastReviewed', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const card: any = {
      id: 'card-1',
      quotation: 'Test quotation',
      schedule: 'daily',
      timeAdded: '2024-01-15T10:00:00.000Z',
      timeModified: '2024-01-16T12:00:00.000Z',
      nextReview: '2024-01-17T14:00:00.000Z',
      lastReviewed: undefined,
      reviewHistory: []
    };

    const processed = processCardDates(card);

    expect(processed.lastReviewed).toBeUndefined();
  });

  it('should handle empty review history', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const card: any = {
      id: 'card-1',
      quotation: 'Test quotation',
      schedule: 'daily',
      timeAdded: '2024-01-15T10:00:00.000Z',
      timeModified: '2024-01-16T12:00:00.000Z',
      nextReview: '2024-01-17T14:00:00.000Z',
      reviewHistory: []
    };

    const processed = processCardDates(card);

    expect(processed.reviewHistory).toEqual([]);
  });

  it('should preserve other card properties', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const card: any = {
      id: 'card-1',
      quotation: 'Test quotation',
      author: 'Test Author',
      reference: 'Test Reference',
      schedule: 'daily',
      timeAdded: '2024-01-15T10:00:00.000Z',
      timeModified: '2024-01-16T12:00:00.000Z',
      nextReview: '2024-01-17T14:00:00.000Z',
      reviewHistory: []
    };

    const processed = processCardDates(card);

    expect(processed.id).toBe('card-1');
    expect(processed.quotation).toBe('Test quotation');
    expect(processed.author).toBe('Test Author');
    expect(processed.reference).toBe('Test Reference');
    expect(processed.schedule).toBe('daily');
  });
});

describe('processBoxDates', () => {
  it('should convert date strings to Date objects', () => {
    const createdAtStr = '2024-01-15T10:00:00.000Z';
    const modifiedAtStr = '2024-01-16T12:00:00.000Z';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const box: any = {
      id: 'box-1',
      name: 'My Box',
      createdAt: createdAtStr,
      modifiedAt: modifiedAtStr
    };

    const processed = processBoxDates(box);

    expect(processed.createdAt).toBeInstanceOf(Date);
    expect(processed.createdAt.toISOString()).toBe(createdAtStr);
    expect(processed.modifiedAt).toBeInstanceOf(Date);
    expect(processed.modifiedAt.toISOString()).toBe(modifiedAtStr);
  });

  it('should preserve other box properties', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const box: any = {
      id: 'box-1',
      name: 'My Box',
      createdAt: '2024-01-15T10:00:00.000Z',
      modifiedAt: '2024-01-16T12:00:00.000Z'
    };

    const processed = processBoxDates(box);

    expect(processed.id).toBe('box-1');
    expect(processed.name).toBe('My Box');
  });
});

describe('validateImportDataStructure', () => {
  it('should validate correct structure', () => {
    const validData: ExportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      cards: [
        {
          id: 'card-1',
          quotation: 'Test quotation',
          schedule: 'daily',
          timeAdded: new Date().toISOString(),
          timeModified: new Date().toISOString(),
          nextReview: new Date().toISOString(),
          reviewHistory: []
        }
      ],
      boxes: [
        {
          id: 'box-1',
          name: 'My Box',
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString()
        }
      ]
    };

    const result = validateImportDataStructure(validData);

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data?.cards).toHaveLength(1);
    expect(result.data?.boxes).toHaveLength(1);
  });

  it('should reject non-object input', () => {
    const result = validateImportDataStructure(null);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Import data must be an object');
  });

  it('should reject string input', () => {
    const result = validateImportDataStructure('not an object');

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Import data must be an object');
  });

  it('should reject missing cards array', () => {
    const invalidData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      boxes: []
    };

    const result = validateImportDataStructure(invalidData);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid import file: missing or invalid cards array');
  });

  it('should reject non-array cards', () => {
    const invalidData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      cards: 'not an array',
      boxes: []
    };

    const result = validateImportDataStructure(invalidData);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid import file: missing or invalid cards array');
  });

  it('should reject missing boxes array', () => {
    const invalidData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      cards: []
    };

    const result = validateImportDataStructure(invalidData);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid import file: missing or invalid boxes array');
  });

  it('should reject non-array boxes', () => {
    const invalidData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      cards: [],
      boxes: 'not an array'
    };

    const result = validateImportDataStructure(invalidData);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid import file: missing or invalid boxes array');
  });

  it('should validate card structure when cards exist', () => {
    const invalidData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      cards: [
        {
          id: 'card-1'
          // Missing required fields
        }
      ],
      boxes: []
    };

    const result = validateImportDataStructure(invalidData);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid card structure');
    expect(result.error).toContain('missing fields');
  });

  it('should accept empty cards and boxes arrays', () => {
    const validData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      cards: [],
      boxes: []
    };

    const result = validateImportDataStructure(validData);

    expect(result.valid).toBe(true);
    expect(result.data?.cards).toHaveLength(0);
    expect(result.data?.boxes).toHaveLength(0);
  });

  it('should identify all missing required card fields', () => {
    const invalidData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      cards: [
        {
          id: 'card-1',
          quotation: 'Test'
          // Missing schedule, timeAdded, timeModified, nextReview
        }
      ],
      boxes: []
    };

    const result = validateImportDataStructure(invalidData);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('schedule');
    expect(result.error).toContain('timeAdded');
    expect(result.error).toContain('timeModified');
    expect(result.error).toContain('nextReview');
  });
});
