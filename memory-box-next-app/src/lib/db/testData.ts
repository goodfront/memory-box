import { db } from './schema';
import type { Card, Schedule } from '../types';
import { calculateNextReview, addDays } from '../utils/scheduling';
import { generateUUID } from '../utils/uuid';

/**
 * Test Data Generation Utilities
 *
 * This module provides utilities for injecting test cards into the database
 * for development and testing purposes.
 */

interface TestCardConfig {
  quotation: string;
  author?: string;
  reference?: string;
  schedule: Schedule;
  daysUntilReview?: number; // Days from now until next review (can be negative for overdue)
  lastReviewed?: Date;
  reviewHistory?: Date[];
}

const SAMPLE_QUOTATIONS = [
  {
    quotation: 'Do not let what you cannot do interfere with what you can do.',
    author: 'John Wooden',
    reference: 'They Call Me Coach'
  },
  {
    quotation: 'Education is an atmosphere, a discipline, a life.',
    author: 'Charlotte Mason',
    reference: 'Volume 6, p. 26'
  },
  {
    quotation: 'The beautiful thing about learning is that no one can take it away from you.',
    author: 'B.B. King',
    reference: undefined
  },
  {
    quotation: 'In learning you will teach, and in teaching you will learn.',
    author: 'Phil Collins',
    reference: 'Son of Man'
  },
  {
    quotation: 'The mind is not a vessel to be filled, but a fire to be kindled.',
    author: 'Plutarch',
    reference: undefined
  },
  {
    quotation: 'Children are born persons.',
    author: 'Charlotte Mason',
    reference: 'Volume 2, p. 3'
  },
  {
    quotation: 'It is not the mountain we conquer, but ourselves.',
    author: 'Edmund Hillary',
    reference: undefined
  },
  {
    quotation: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
    reference: 'Stanford Commencement, 2005'
  },
  {
    quotation: 'Wisdom begins in wonder.',
    author: 'Socrates',
    reference: undefined
  },
  {
    quotation: 'A person who never made a mistake never tried anything new.',
    author: 'Albert Einstein',
    reference: undefined
  }
];

/**
 * Create a test card with specific configuration
 */
export async function createTestCard(config: TestCardConfig): Promise<Card> {
  const now = new Date();
  const timeAdded = config.lastReviewed
    ? addDays(config.lastReviewed, -30) // Added 30 days before last review
    : addDays(now, -7); // Added 7 days ago

  let nextReview: Date;
  if (config.daysUntilReview !== undefined) {
    // Set next review to specific number of days from now
    nextReview = addDays(now, config.daysUntilReview);
  } else {
    // Calculate based on schedule
    const referenceDate = config.lastReviewed || now;
    nextReview = calculateNextReview(config.schedule, referenceDate);
  }

  const card: Card = {
    id: generateUUID(),
    quotation: config.quotation,
    author: config.author,
    reference: config.reference,
    schedule: config.schedule,
    timeAdded,
    timeModified: now,
    lastReviewed: config.lastReviewed,
    nextReview,
    reviewHistory: config.reviewHistory || []
  };

  await db.cards.add(card);
  return card;
}

/**
 * Inject a set of test cards with various schedules and review states
 * Includes cards that are:
 * - Due today
 * - Overdue
 * - Due in the future
 * - Never reviewed
 */
export async function injectTestCards(): Promise<Card[]> {
  const now = new Date();
  const yesterday = addDays(now, -1);
  const twoDaysAgo = addDays(now, -2);
  const weekAgo = addDays(now, -7);

  const testConfigs: TestCardConfig[] = [
    // Cards due TODAY
    {
      ...SAMPLE_QUOTATIONS[0],
      schedule: 'daily',
      daysUntilReview: 0,
      lastReviewed: yesterday,
      reviewHistory: [weekAgo, yesterday]
    },
    {
      ...SAMPLE_QUOTATIONS[1],
      schedule: 'even',
      daysUntilReview: 0,
      lastReviewed: twoDaysAgo,
      reviewHistory: [twoDaysAgo]
    },
    {
      ...SAMPLE_QUOTATIONS[2],
      schedule: 'monday',
      daysUntilReview: 0, // This will create a card due today regardless of day
      lastReviewed: weekAgo,
      reviewHistory: [weekAgo]
    },

    // OVERDUE cards (past due date)
    {
      ...SAMPLE_QUOTATIONS[3],
      schedule: 'daily',
      daysUntilReview: -2,
      lastReviewed: addDays(now, -3),
      reviewHistory: [addDays(now, -3)]
    },
    {
      ...SAMPLE_QUOTATIONS[4],
      schedule: 'odd',
      daysUntilReview: -1,
      lastReviewed: addDays(now, -3),
      reviewHistory: [addDays(now, -3)]
    },

    // Cards due in the FUTURE
    {
      ...SAMPLE_QUOTATIONS[5],
      schedule: 'daily',
      daysUntilReview: 1,
      lastReviewed: now,
      reviewHistory: [addDays(now, -7), now]
    },
    {
      ...SAMPLE_QUOTATIONS[6],
      schedule: 'wednesday',
      daysUntilReview: 2,
      lastReviewed: now,
      reviewHistory: [now]
    },

    // Cards NEVER reviewed
    {
      ...SAMPLE_QUOTATIONS[7],
      schedule: 'daily',
      daysUntilReview: 0, // New cards due today
      lastReviewed: undefined,
      reviewHistory: []
    },
    {
      ...SAMPLE_QUOTATIONS[8],
      schedule: 'even',
      daysUntilReview: -3, // New cards that are overdue
      lastReviewed: undefined,
      reviewHistory: []
    },
    {
      ...SAMPLE_QUOTATIONS[9],
      schedule: '15',
      lastReviewed: undefined,
      reviewHistory: []
    }
  ];

  const cards: Card[] = [];
  for (const config of testConfigs) {
    const card = await createTestCard(config);
    cards.push(card);
  }

  return cards;
}

/**
 * Inject a specific number of cards all due today
 * Useful for testing review sessions with many cards
 */
export async function injectCardsDueToday(count: number = 5): Promise<Card[]> {
  const now = new Date();
  const yesterday = addDays(now, -1);
  const cards: Card[] = [];

  for (let i = 0; i < count; i++) {
    const quotationIndex = i % SAMPLE_QUOTATIONS.length;
    const schedules: Schedule[] = ['daily', 'even', 'odd', 'monday', 'tuesday'];
    const schedule = schedules[i % schedules.length];

    const card = await createTestCard({
      ...SAMPLE_QUOTATIONS[quotationIndex],
      quotation: `${SAMPLE_QUOTATIONS[quotationIndex].quotation} [Test ${i + 1}]`,
      schedule,
      daysUntilReview: 0,
      lastReviewed: yesterday,
      reviewHistory: [yesterday]
    });

    cards.push(card);
  }

  return cards;
}

/**
 * Clear all cards and inject fresh test data
 */
export async function resetWithTestCards(): Promise<Card[]> {
  await db.cards.clear();
  return await injectTestCards();
}

/**
 * Get a summary of cards by their review status
 */
export async function getTestDataSummary(): Promise<{
  total: number;
  dueToday: number;
  overdue: number;
  future: number;
  neverReviewed: number;
}> {
  const allCards = await db.cards.toArray();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = addDays(today, 1);

  let dueToday = 0;
  let overdue = 0;
  let future = 0;
  let neverReviewed = 0;

  for (const card of allCards) {
    if (!card.lastReviewed) {
      neverReviewed++;
      // Check if never-reviewed card is due
      if (card.nextReview < tomorrow) {
        if (card.nextReview < today) {
          overdue++;
        } else {
          dueToday++;
        }
      }
      continue;
    }

    const nextReviewDate = new Date(
      card.nextReview.getFullYear(),
      card.nextReview.getMonth(),
      card.nextReview.getDate()
    );

    if (nextReviewDate < today) {
      overdue++;
    } else if (nextReviewDate < tomorrow) {
      dueToday++;
    } else {
      future++;
    }
  }

  return {
    total: allCards.length,
    dueToday,
    overdue,
    future,
    neverReviewed
  };
}
