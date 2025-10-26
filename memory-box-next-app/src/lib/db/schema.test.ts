import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  MemoryBoxDatabase,
  clearDatabase,
  exportData,
  importData
} from './schema';
import { initializeDatabase } from './init';
import type { Card, Box } from '../types';

describe('MemoryBoxDatabase', () => {
  let db: MemoryBoxDatabase;

  beforeEach(() => {
    // Create a new database instance for each test
    db = new MemoryBoxDatabase();
  });

  afterEach(async () => {
    // Clean up after each test
    await db.delete();
    await db.close();
  });

  it('should create database with correct name', () => {
    expect(db.name).toBe('MemoryBoxDB');
  });

  it('should have cards table', () => {
    expect(db.cards).toBeDefined();
  });

  it('should have boxes table', () => {
    expect(db.boxes).toBeDefined();
  });

  it('should open database successfully', async () => {
    await db.open();
    expect(db.isOpen()).toBe(true);
  });

  it('should have correct schema version', () => {
    expect(db.verno).toBe(1);
  });
});

describe('initializeDatabase', () => {
  let db: MemoryBoxDatabase;

  beforeEach(() => {
    db = new MemoryBoxDatabase();
  });

  afterEach(async () => {
    await db.delete();
    await db.close();
  });

  it('should create default box if none exists', async () => {
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

  it('should set createdAt and modifiedAt on default box', async () => {
    const beforeInit = new Date();
    await initializeDatabase();
    const afterInit = new Date();

    const boxes = await db.boxes.toArray();
    const box = boxes[0];

    expect(box.createdAt).toBeInstanceOf(Date);
    expect(box.modifiedAt).toBeInstanceOf(Date);
    expect(box.createdAt.getTime()).toBeGreaterThanOrEqual(beforeInit.getTime());
    expect(box.createdAt.getTime()).toBeLessThanOrEqual(afterInit.getTime());
  });
});

describe('clearDatabase', () => {
  let db: MemoryBoxDatabase;

  beforeEach(async () => {
    db = new MemoryBoxDatabase();
    await initializeDatabase();
  });

  afterEach(async () => {
    await db.delete();
    await db.close();
  });

  it('should clear all cards', async () => {
    // Add a test card
    await db.cards.add({
      id: 'test-1',
      quotation: 'Test quote',
      schedule: 'daily',
      timeAdded: new Date(),
      timeModified: new Date(),
      nextReview: new Date(),
      reviewHistory: []
    });

    await clearDatabase();

    const cards = await db.cards.toArray();
    expect(cards).toHaveLength(0);
  });

  it('should clear all boxes', async () => {
    await clearDatabase();

    const boxes = await db.boxes.toArray();
    expect(boxes).toHaveLength(0);
  });
});

describe('exportData', () => {
  let db: MemoryBoxDatabase;

  beforeEach(async () => {
    db = new MemoryBoxDatabase();
    await initializeDatabase();
  });

  afterEach(async () => {
    await db.delete();
    await db.close();
  });

  it('should export empty data when database is empty', async () => {
    await clearDatabase();
    const data = await exportData();

    expect(data.cards).toHaveLength(0);
    expect(data.boxes).toHaveLength(0);
  });

  it('should export cards and boxes', async () => {
    // Add test card
    const testCard: Card = {
      id: 'test-1',
      quotation: 'Test quote',
      author: 'Test Author',
      schedule: 'daily',
      timeAdded: new Date(),
      timeModified: new Date(),
      nextReview: new Date(),
      reviewHistory: []
    };
    await db.cards.add(testCard);

    const data = await exportData();

    expect(data.cards).toHaveLength(1);
    expect(data.cards[0].id).toBe('test-1');
    expect(data.cards[0].quotation).toBe('Test quote');
    expect(data.boxes).toHaveLength(1);
  });

  it('should export multiple cards', async () => {
    // Add multiple test cards
    await db.cards.bulkAdd([
      {
        id: 'test-1',
        quotation: 'Quote 1',
        schedule: 'daily',
        timeAdded: new Date(),
        timeModified: new Date(),
        nextReview: new Date(),
        reviewHistory: []
      },
      {
        id: 'test-2',
        quotation: 'Quote 2',
        schedule: 'even',
        timeAdded: new Date(),
        timeModified: new Date(),
        nextReview: new Date(),
        reviewHistory: []
      }
    ]);

    const data = await exportData();

    expect(data.cards).toHaveLength(2);
  });
});

describe('importData', () => {
  let db: MemoryBoxDatabase;

  beforeEach(async () => {
    db = new MemoryBoxDatabase();
  });

  afterEach(async () => {
    await db.delete();
    await db.close();
  });

  it('should import cards and boxes', async () => {
    const testData = {
      cards: [
        {
          id: 'test-1',
          quotation: 'Test quote',
          schedule: 'daily' as const,
          timeAdded: new Date(),
          timeModified: new Date(),
          nextReview: new Date(),
          reviewHistory: []
        }
      ],
      boxes: [
        {
          id: 'imported-box',
          name: 'Imported Box',
          createdAt: new Date(),
          modifiedAt: new Date()
        }
      ]
    };

    await importData(testData);

    const cards = await db.cards.toArray();
    const boxes = await db.boxes.toArray();

    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe('test-1');
    expect(boxes).toHaveLength(1);
    expect(boxes[0].id).toBe('imported-box');
  });

  it('should clear existing data before import', async () => {
    // Add initial data
    await initializeDatabase();
    await db.cards.add({
      id: 'existing-1',
      quotation: 'Existing quote',
      schedule: 'daily',
      timeAdded: new Date(),
      timeModified: new Date(),
      nextReview: new Date(),
      reviewHistory: []
    });

    // Import new data
    const testData = {
      cards: [
        {
          id: 'imported-1',
          quotation: 'Imported quote',
          schedule: 'even' as const,
          timeAdded: new Date(),
          timeModified: new Date(),
          nextReview: new Date(),
          reviewHistory: []
        }
      ],
      boxes: [
        {
          id: 'imported-box',
          name: 'Imported Box',
          createdAt: new Date(),
          modifiedAt: new Date()
        }
      ]
    };

    await importData(testData);

    const cards = await db.cards.toArray();
    const boxes = await db.boxes.toArray();

    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe('imported-1');
    expect(boxes).toHaveLength(1);
    expect(boxes[0].id).toBe('imported-box');
  });

  it('should handle import with empty data', async () => {
    await importData({ cards: [], boxes: [] });

    const cards = await db.cards.toArray();
    const boxes = await db.boxes.toArray();

    expect(cards).toHaveLength(0);
    expect(boxes).toHaveLength(0);
  });

  it('should import cards with all fields', async () => {
    const reviewDate = new Date('2024-01-15');
    const testData = {
      cards: [
        {
          id: 'test-1',
          quotation: 'Test quote with all fields',
          author: 'Test Author',
          reference: 'Test Reference',
          schedule: 'monday' as const,
          timeAdded: new Date('2024-01-01'),
          timeModified: new Date('2024-01-10'),
          lastReviewed: reviewDate,
          nextReview: new Date('2024-01-22'),
          reviewHistory: [reviewDate]
        }
      ],
      boxes: [
        {
          id: 'test-box',
          name: 'Test Box',
          createdAt: new Date(),
          modifiedAt: new Date()
        }
      ]
    };

    await importData(testData);

    const cards = await db.cards.toArray();
    expect(cards[0].author).toBe('Test Author');
    expect(cards[0].reference).toBe('Test Reference');
    expect(cards[0].lastReviewed).toEqual(reviewDate);
    expect(cards[0].reviewHistory).toHaveLength(1);
  });
});
