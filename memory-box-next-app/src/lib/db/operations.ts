import { db } from './schema';
import type { Card, CreateCardInput, UpdateCardInput, BoxStatistics } from '../types';
import { calculateNextReview } from '../utils/scheduling';
import { generateUUID } from '../utils/uuid';

/**
 * CRUD Operations for Cards
 */

/**
 * Create a new card
 * @param input Card data without auto-generated fields
 * @returns The created card with all fields populated
 */
export async function createCard(input: CreateCardInput): Promise<Card> {
  const now = new Date();
  const nextReview = calculateNextReview(input.schedule, input.lastReviewed || now);

  const card: Card = {
    id: generateUUID(),
    ...input,
    timeAdded: now,
    timeModified: now,
    nextReview,
    reviewHistory: []
  };

  await db.cards.add(card);
  return card;
}

/**
 * Get a card by ID
 * @param id Card ID
 * @returns The card or undefined if not found
 */
export async function getCard(id: string): Promise<Card | undefined> {
  return await db.cards.get(id);
}

/**
 * Get all cards
 * @returns Array of all cards
 */
export async function getAllCards(): Promise<Card[]> {
  return await db.cards.toArray();
}

/**
 * Get cards by schedule type
 * @param schedule The schedule type to filter by
 * @returns Array of cards with the specified schedule
 */
export async function getCardsBySchedule(schedule: string): Promise<Card[]> {
  return await db.cards.where('schedule').equals(schedule).toArray();
}

/**
 * Get cards due for review on a specific date
 * @param date The date to check (defaults to today)
 * @returns Array of cards due for review
 */
export async function getCardsDueForReview(date: Date = new Date()): Promise<Card[]> {
  // Set time to end of day for comparison
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return await db.cards
    .where('nextReview')
    .belowOrEqual(endOfDay)
    .toArray();
}

/**
 * Update a card
 * @param id Card ID
 * @param updates Partial card data to update
 * @returns The updated card or undefined if not found
 */
export async function updateCard(id: string, updates: UpdateCardInput): Promise<Card | undefined> {
  const card = await db.cards.get(id);
  if (!card) {
    return undefined;
  }

  const now = new Date();
  const updateData: Partial<Card> = {
    ...updates,
    timeModified: now,
    // Recalculate next review if schedule changed
    nextReview: updates.schedule
      ? calculateNextReview(updates.schedule, card.lastReviewed || now)
      : updates.nextReview
  };

  await db.cards.update(id, updateData);

  // Return the updated card
  const updatedCard = await db.cards.get(id);
  return updatedCard;
}

/**
 * Mark a card as reviewed (successful recall)
 * Updates lastReviewed, adds to review history, and calculates next review date
 * @param id Card ID
 * @param reviewDate The date of review (defaults to now)
 * @returns The updated card or undefined if not found
 */
export async function markCardAsReviewed(id: string, reviewDate: Date = new Date()): Promise<Card | undefined> {
  const card = await db.cards.get(id);
  if (!card) {
    return undefined;
  }

  const nextReview = calculateNextReview(card.schedule, reviewDate);
  const updateData: Partial<Card> = {
    lastReviewed: reviewDate,
    timeModified: reviewDate,
    nextReview,
    reviewHistory: [...card.reviewHistory, reviewDate]
  };

  await db.cards.update(id, updateData);

  // Return the updated card
  const updatedCard = await db.cards.get(id);
  return updatedCard;
}

/**
 * Delete a card
 * @param id Card ID
 * @returns True if deleted, false if not found
 */
export async function deleteCard(id: string): Promise<boolean> {
  const count = await db.cards.where('id').equals(id).delete();
  return count > 0;
}

/**
 * Search cards by quotation text
 * @param searchTerm Text to search for (case-insensitive)
 * @returns Array of matching cards
 */
export async function searchCards(searchTerm: string): Promise<Card[]> {
  const allCards = await db.cards.toArray();
  const lowerSearchTerm = searchTerm.toLowerCase();

  return allCards.filter(card =>
    card.quotation.toLowerCase().includes(lowerSearchTerm) ||
    card.author?.toLowerCase().includes(lowerSearchTerm) ||
    card.reference?.toLowerCase().includes(lowerSearchTerm)
  );
}

/**
 * Get count of cards by schedule type
 * @returns Object with schedule types as keys and counts as values
 */
export async function getCardCountsBySchedule(): Promise<Record<string, number>> {
  const allCards = await db.cards.toArray();
  const counts: Record<string, number> = {};

  for (const card of allCards) {
    counts[card.schedule] = (counts[card.schedule] || 0) + 1;
  }

  return counts;
}

/**
 * Get count of cards due for review today
 * @returns Number of cards due today
 */
export async function getDueCardsCount(): Promise<number> {
  const dueCards = await getCardsDueForReview();
  return dueCards.length;
}

/**
 * Box Management Functions
 */

/**
 * Get total count of all cards in the box
 * @returns Total number of cards
 */
export async function getTotalCardCount(): Promise<number> {
  return await db.cards.count();
}

/**
 * Get cards that have never been reviewed
 * @returns Array of cards with no review history
 */
export async function getCardsNeverReviewed(): Promise<Card[]> {
  const allCards = await db.cards.toArray();
  return allCards.filter(card => !card.lastReviewed);
}

/**
 * Get the most recent review date across all cards
 * @returns The most recent review date, or undefined if no cards have been reviewed
 */
export async function getLastReviewDate(): Promise<Date | undefined> {
  const allCards = await db.cards.toArray();
  const reviewedCards = allCards.filter(card => card.lastReviewed);

  if (reviewedCards.length === 0) {
    return undefined;
  }

  return reviewedCards.reduce((latest, card) => {
    if (!card.lastReviewed) return latest;
    return !latest || card.lastReviewed > latest ? card.lastReviewed : latest;
  }, undefined as Date | undefined);
}

/**
 * Get total number of reviews completed across all cards
 * @returns Total count of all reviews in history
 */
export async function getTotalReviewCount(): Promise<number> {
  const allCards = await db.cards.toArray();
  return allCards.reduce((total, card) => total + card.reviewHistory.length, 0);
}

/**
 * Get comprehensive box statistics
 * Provides an overview of all cards, reviews, and schedule distribution
 * @returns BoxStatistics object with aggregated data
 */
export async function getBoxStatistics(): Promise<BoxStatistics> {
  const [
    totalCards,
    cardsDue,
    cardsNeverReviewed,
    totalReviewsCompleted,
    lastReviewDate,
    scheduleBreakdown
  ] = await Promise.all([
    getTotalCardCount(),
    getDueCardsCount(),
    getCardsNeverReviewed().then(cards => cards.length),
    getTotalReviewCount(),
    getLastReviewDate(),
    getCardCountsBySchedule()
  ]);

  return {
    totalCards,
    cardsDue,
    cardsNeverReviewed,
    totalReviewsCompleted,
    lastReviewDate,
    scheduleBreakdown
  };
}
