import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryBoxDatabase } from './schema';
import {
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
  getDueCardsCount,
  getTotalCardCount,
  getCardsNeverReviewed,
  getLastReviewDate,
  getTotalReviewCount,
  getBoxStatistics
} from './operations';
import type { CreateCardInput } from '../types';

// Import db singleton used by operations
import { db } from './schema';

describe('Card CRUD Operations', () => {
  beforeEach(async () => {
    // Clear database before each test
    await db.cards.clear();
    await db.boxes.clear();
  });

  afterEach(async () => {
    // Clean up after each test
    vi.restoreAllMocks();
  });

  describe('createCard', () => {
    it('should create a card with required fields', async () => {
      const input: CreateCardInput = {
        quotation: 'To be or not to be',
        schedule: 'daily'
      };

      const card = await createCard(input);

      expect(card.id).toBeDefined();
      expect(card.quotation).toBe('To be or not to be');
      expect(card.schedule).toBe('daily');
      expect(card.timeAdded).toBeInstanceOf(Date);
      expect(card.timeModified).toBeInstanceOf(Date);
      expect(card.nextReview).toBeInstanceOf(Date);
      expect(card.reviewHistory).toEqual([]);
    });

    it('should create a card with optional fields', async () => {
      const input: CreateCardInput = {
        quotation: 'Test quote',
        author: 'Shakespeare',
        reference: 'Hamlet',
        schedule: 'monday'
      };

      const card = await createCard(input);

      expect(card.author).toBe('Shakespeare');
      expect(card.reference).toBe('Hamlet');
    });

    it('should generate unique IDs for cards', async () => {
      const input: CreateCardInput = {
        quotation: 'Test quote',
        schedule: 'daily'
      };

      const card1 = await createCard(input);
      const card2 = await createCard(input);

      expect(card1.id).not.toBe(card2.id);
    });

    it('should calculate nextReview based on schedule', async () => {
      const now = new Date('2024-01-15T12:00:00Z');
      vi.setSystemTime(now);

      const input: CreateCardInput = {
        quotation: 'Test quote',
        schedule: 'daily'
      };

      const card = await createCard(input);

      // Daily schedule should add 1 day
      const expectedNextReview = new Date('2024-01-16T12:00:00Z');
      expect(card.nextReview.toDateString()).toBe(expectedNextReview.toDateString());
    });

    it('should set timeAdded and timeModified to same value on creation', async () => {
      const input: CreateCardInput = {
        quotation: 'Test quote',
        schedule: 'daily'
      };

      const card = await createCard(input);

      expect(card.timeAdded.getTime()).toBe(card.timeModified.getTime());
    });

    it('should persist card to database', async () => {
      const input: CreateCardInput = {
        quotation: 'Persisted quote',
        schedule: 'even'
      };

      const card = await createCard(input);
      const retrieved = await db.cards.get(card.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.quotation).toBe('Persisted quote');
    });
  });

  describe('getCard', () => {
    it('should retrieve an existing card', async () => {
      const input: CreateCardInput = {
        quotation: 'Test quote',
        schedule: 'daily'
      };

      const created = await createCard(input);
      const retrieved = await getCard(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.quotation).toBe('Test quote');
    });

    it('should return undefined for non-existent card', async () => {
      const result = await getCard('non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('getAllCards', () => {
    it('should return empty array when no cards exist', async () => {
      const cards = await getAllCards();
      expect(cards).toEqual([]);
    });

    it('should return all cards', async () => {
      await createCard({ quotation: 'Quote 1', schedule: 'daily' });
      await createCard({ quotation: 'Quote 2', schedule: 'even' });
      await createCard({ quotation: 'Quote 3', schedule: 'odd' });

      const cards = await getAllCards();

      expect(cards).toHaveLength(3);
    });

    it('should return cards with all fields', async () => {
      await createCard({
        quotation: 'Full quote',
        author: 'Author',
        reference: 'Reference',
        schedule: 'monday'
      });

      const cards = await getAllCards();

      expect(cards[0].author).toBe('Author');
      expect(cards[0].reference).toBe('Reference');
    });
  });

  describe('getCardsBySchedule', () => {
    beforeEach(async () => {
      await createCard({ quotation: 'Daily 1', schedule: 'daily' });
      await createCard({ quotation: 'Daily 2', schedule: 'daily' });
      await createCard({ quotation: 'Even 1', schedule: 'even' });
      await createCard({ quotation: 'Monday 1', schedule: 'monday' });
    });

    it('should filter cards by schedule type', async () => {
      const dailyCards = await getCardsBySchedule('daily');

      expect(dailyCards).toHaveLength(2);
      expect(dailyCards.every(c => c.schedule === 'daily')).toBe(true);
    });

    it('should return empty array for unused schedule', async () => {
      const sundayCards = await getCardsBySchedule('sunday');
      expect(sundayCards).toEqual([]);
    });

    it('should handle monthly schedule filters', async () => {
      await createCard({ quotation: 'Monthly 15', schedule: '15' });

      const monthlyCards = await getCardsBySchedule('15');

      expect(monthlyCards).toHaveLength(1);
      expect(monthlyCards[0].schedule).toBe('15');
    });
  });

  describe('getCardsDueForReview', () => {
    it('should return cards due today', async () => {
      const today = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(today);

      // Create a card that's due today
      const card = await createCard({ quotation: 'Due today', schedule: 'daily' });

      // Manually set nextReview to today
      await db.cards.update(card.id, { nextReview: today });

      const dueCards = await getCardsDueForReview(today);

      expect(dueCards).toHaveLength(1);
      expect(dueCards[0].id).toBe(card.id);
    });

    it('should return cards due in the past', async () => {
      const today = new Date('2024-01-15T10:00:00Z');
      const yesterday = new Date('2024-01-14T10:00:00Z');

      const card = await createCard({ quotation: 'Overdue', schedule: 'daily' });
      await db.cards.update(card.id, { nextReview: yesterday });

      const dueCards = await getCardsDueForReview(today);

      expect(dueCards).toHaveLength(1);
    });

    it('should not return cards due in the future', async () => {
      const today = new Date('2024-01-15T10:00:00Z');
      const tomorrow = new Date('2024-01-16T10:00:00Z');

      const card = await createCard({ quotation: 'Future', schedule: 'daily' });
      await db.cards.update(card.id, { nextReview: tomorrow });

      const dueCards = await getCardsDueForReview(today);

      expect(dueCards).toEqual([]);
    });

    it('should use current date as default', async () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      const card = await createCard({ quotation: 'Due now', schedule: 'daily' });
      await db.cards.update(card.id, { nextReview: yesterday });

      const dueCards = await getCardsDueForReview();

      expect(dueCards).toHaveLength(1);
    });

    it('should return multiple due cards', async () => {
      const today = new Date('2024-01-15T10:00:00Z');

      const card1 = await createCard({ quotation: 'Due 1', schedule: 'daily' });
      const card2 = await createCard({ quotation: 'Due 2', schedule: 'even' });
      const card3 = await createCard({ quotation: 'Not due', schedule: 'odd' });

      await db.cards.update(card1.id, { nextReview: today });
      await db.cards.update(card2.id, { nextReview: today });
      await db.cards.update(card3.id, { nextReview: new Date('2024-01-20') });

      const dueCards = await getCardsDueForReview(today);

      expect(dueCards).toHaveLength(2);
    });
  });

  describe('updateCard', () => {
    it('should update card quotation', async () => {
      const card = await createCard({ quotation: 'Original', schedule: 'daily' });

      const updated = await updateCard(card.id, { quotation: 'Updated' });

      expect(updated?.quotation).toBe('Updated');
    });

    it('should update optional fields', async () => {
      const card = await createCard({ quotation: 'Test', schedule: 'daily' });

      const updated = await updateCard(card.id, {
        author: 'New Author',
        reference: 'New Reference'
      });

      expect(updated?.author).toBe('New Author');
      expect(updated?.reference).toBe('New Reference');
    });

    it('should update timeModified', async () => {
      const beforeUpdate = new Date();
      const card = await createCard({ quotation: 'Test', schedule: 'daily' });

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await updateCard(card.id, { quotation: 'Updated' });
      const afterUpdate = new Date();

      expect(updated?.timeModified.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      expect(updated?.timeModified.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
    });

    it('should recalculate nextReview when schedule changes', async () => {
      // Set to Jan 15, 2024 (Monday) to get predictable results
      const testDate = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(testDate);

      const card = await createCard({ quotation: 'Test', schedule: 'daily' });
      // Daily schedule: should be Jan 16

      const updated = await updateCard(card.id, { schedule: 'sunday' });
      // Sunday schedule: should be Jan 21 (next Sunday)

      expect(updated?.schedule).toBe('sunday');
      expect(updated?.nextReview.getDate()).toBe(21);

      vi.useRealTimers();
    });

    it('should not modify timeAdded', async () => {
      const card = await createCard({ quotation: 'Test', schedule: 'daily' });
      const originalTimeAdded = card.timeAdded;

      await updateCard(card.id, { quotation: 'Updated' });
      const updated = await getCard(card.id);

      expect(updated?.timeAdded).toEqual(originalTimeAdded);
    });

    it('should return undefined for non-existent card', async () => {
      const result = await updateCard('non-existent', { quotation: 'Test' });
      expect(result).toBeUndefined();
    });

    it('should allow partial updates', async () => {
      const card = await createCard({
        quotation: 'Test',
        author: 'Author',
        schedule: 'daily'
      });

      const updated = await updateCard(card.id, { author: 'New Author' });

      expect(updated?.quotation).toBe('Test'); // Unchanged
      expect(updated?.author).toBe('New Author'); // Changed
    });
  });

  describe('markCardAsReviewed', () => {
    it('should update lastReviewed date', async () => {
      const card = await createCard({ quotation: 'Test', schedule: 'daily' });
      const reviewDate = new Date('2024-01-15T10:00:00Z');

      const updated = await markCardAsReviewed(card.id, reviewDate);

      expect(updated?.lastReviewed).toEqual(reviewDate);
    });

    it('should add date to reviewHistory', async () => {
      const card = await createCard({ quotation: 'Test', schedule: 'daily' });
      const reviewDate = new Date('2024-01-15T10:00:00Z');

      const updated = await markCardAsReviewed(card.id, reviewDate);

      expect(updated?.reviewHistory).toHaveLength(1);
      expect(updated?.reviewHistory[0]).toEqual(reviewDate);
    });

    it('should append to existing reviewHistory', async () => {
      const card = await createCard({ quotation: 'Test', schedule: 'daily' });

      const review1 = new Date('2024-01-15T10:00:00Z');
      const review2 = new Date('2024-01-16T10:00:00Z');

      await markCardAsReviewed(card.id, review1);
      const updated = await markCardAsReviewed(card.id, review2);

      expect(updated?.reviewHistory).toHaveLength(2);
      expect(updated?.reviewHistory[0]).toEqual(review1);
      expect(updated?.reviewHistory[1]).toEqual(review2);
    });

    it('should calculate nextReview based on schedule', async () => {
      const card = await createCard({ quotation: 'Test', schedule: 'daily' });
      const reviewDate = new Date('2024-01-15T10:00:00Z');

      const updated = await markCardAsReviewed(card.id, reviewDate);

      // Daily schedule should set next review to next day
      expect(updated?.nextReview.getDate()).toBe(16);
    });

    it('should update timeModified', async () => {
      const card = await createCard({ quotation: 'Test', schedule: 'daily' });
      const reviewDate = new Date('2024-01-15T10:00:00Z');

      const updated = await markCardAsReviewed(card.id, reviewDate);

      expect(updated?.timeModified).toEqual(reviewDate);
    });

    it('should use current date as default', async () => {
      const beforeReview = new Date();
      const card = await createCard({ quotation: 'Test', schedule: 'daily' });

      const updated = await markCardAsReviewed(card.id);
      const afterReview = new Date();

      expect(updated?.lastReviewed).toBeDefined();
      expect(updated?.lastReviewed!.getTime()).toBeGreaterThanOrEqual(beforeReview.getTime());
      expect(updated?.lastReviewed!.getTime()).toBeLessThanOrEqual(afterReview.getTime());
    });

    it('should return undefined for non-existent card', async () => {
      const result = await markCardAsReviewed('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('deleteCard', () => {
    it('should delete an existing card', async () => {
      const card = await createCard({ quotation: 'Test', schedule: 'daily' });

      const result = await deleteCard(card.id);

      expect(result).toBe(true);

      const retrieved = await getCard(card.id);
      expect(retrieved).toBeUndefined();
    });

    it('should return false for non-existent card', async () => {
      const result = await deleteCard('non-existent');
      expect(result).toBe(false);
    });

    it('should only delete specified card', async () => {
      const card1 = await createCard({ quotation: 'Keep', schedule: 'daily' });
      const card2 = await createCard({ quotation: 'Delete', schedule: 'even' });

      await deleteCard(card2.id);

      const remaining = await getAllCards();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(card1.id);
    });
  });

  describe('searchCards', () => {
    beforeEach(async () => {
      await createCard({
        quotation: 'To be or not to be',
        author: 'Shakespeare',
        reference: 'Hamlet',
        schedule: 'daily'
      });
      await createCard({
        quotation: 'All the world\'s a stage',
        author: 'Shakespeare',
        reference: 'As You Like It',
        schedule: 'even'
      });
      await createCard({
        quotation: 'I think, therefore I am',
        author: 'Descartes',
        reference: 'Meditations',
        schedule: 'odd'
      });
    });

    it('should find cards by quotation text', async () => {
      const results = await searchCards('stage');

      expect(results).toHaveLength(1);
      expect(results[0].quotation).toContain('stage');
    });

    it('should find cards by author', async () => {
      const results = await searchCards('Shakespeare');

      expect(results).toHaveLength(2);
    });

    it('should find cards by reference', async () => {
      const results = await searchCards('Hamlet');

      expect(results).toHaveLength(1);
      expect(results[0].reference).toBe('Hamlet');
    });

    it('should be case-insensitive', async () => {
      const results = await searchCards('SHAKESPEARE');

      expect(results).toHaveLength(2);
    });

    it('should return empty array for no matches', async () => {
      const results = await searchCards('nonexistent');

      expect(results).toEqual([]);
    });

    it('should find partial matches', async () => {
      const results = await searchCards('think');

      expect(results).toHaveLength(1);
      expect(results[0].quotation).toContain('think');
    });

    it('should search across multiple fields', async () => {
      // "be" appears in quotation
      const results = await searchCards('be');

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('getCardCountsBySchedule', () => {
    it('should return empty object when no cards exist', async () => {
      const counts = await getCardCountsBySchedule();

      expect(counts).toEqual({});
    });

    it('should count cards by schedule type', async () => {
      await createCard({ quotation: 'Daily 1', schedule: 'daily' });
      await createCard({ quotation: 'Daily 2', schedule: 'daily' });
      await createCard({ quotation: 'Even 1', schedule: 'even' });
      await createCard({ quotation: 'Monday 1', schedule: 'monday' });

      const counts = await getCardCountsBySchedule();

      expect(counts['daily']).toBe(2);
      expect(counts['even']).toBe(1);
      expect(counts['monday']).toBe(1);
    });

    it('should handle monthly schedules', async () => {
      await createCard({ quotation: 'Monthly 15', schedule: '15' });
      await createCard({ quotation: 'Monthly 15 again', schedule: '15' });

      const counts = await getCardCountsBySchedule();

      expect(counts['15']).toBe(2);
    });

    it('should only include schedules that have cards', async () => {
      await createCard({ quotation: 'Daily', schedule: 'daily' });

      const counts = await getCardCountsBySchedule();

      expect(Object.keys(counts)).toEqual(['daily']);
    });
  });

  describe('getDueCardsCount', () => {
    it('should return 0 when no cards are due', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const card = await createCard({ quotation: 'Future', schedule: 'daily' });
      await db.cards.update(card.id, { nextReview: tomorrow });

      const count = await getDueCardsCount();

      expect(count).toBe(0);
    });

    it('should count cards due today', async () => {
      const today = new Date();

      const card1 = await createCard({ quotation: 'Due 1', schedule: 'daily' });
      const card2 = await createCard({ quotation: 'Due 2', schedule: 'even' });

      await db.cards.update(card1.id, { nextReview: today });
      await db.cards.update(card2.id, { nextReview: today });

      const count = await getDueCardsCount();

      expect(count).toBe(2);
    });

    it('should count overdue cards', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const card = await createCard({ quotation: 'Overdue', schedule: 'daily' });
      await db.cards.update(card.id, { nextReview: yesterday });

      const count = await getDueCardsCount();

      expect(count).toBe(1);
    });
  });

  describe('Box Management Functions', () => {
    describe('getTotalCardCount', () => {
      it('should return 0 when no cards exist', async () => {
        const count = await getTotalCardCount();
        expect(count).toBe(0);
      });

      it('should return correct count of cards', async () => {
        await createCard({ quotation: 'Card 1', schedule: 'daily' });
        await createCard({ quotation: 'Card 2', schedule: 'even' });
        await createCard({ quotation: 'Card 3', schedule: 'odd' });

        const count = await getTotalCardCount();
        expect(count).toBe(3);
      });

      it('should update count after adding cards', async () => {
        const count1 = await getTotalCardCount();
        expect(count1).toBe(0);

        await createCard({ quotation: 'New card', schedule: 'daily' });

        const count2 = await getTotalCardCount();
        expect(count2).toBe(1);
      });

      it('should update count after deleting cards', async () => {
        const card = await createCard({ quotation: 'Delete me', schedule: 'daily' });
        const count1 = await getTotalCardCount();
        expect(count1).toBe(1);

        await deleteCard(card.id);

        const count2 = await getTotalCardCount();
        expect(count2).toBe(0);
      });
    });

    describe('getCardsNeverReviewed', () => {
      it('should return empty array when no cards exist', async () => {
        const cards = await getCardsNeverReviewed();
        expect(cards).toEqual([]);
      });

      it('should return all cards when none have been reviewed', async () => {
        await createCard({ quotation: 'Card 1', schedule: 'daily' });
        await createCard({ quotation: 'Card 2', schedule: 'even' });

        const cards = await getCardsNeverReviewed();
        expect(cards).toHaveLength(2);
      });

      it('should not return cards that have been reviewed', async () => {
        const card1 = await createCard({ quotation: 'Reviewed', schedule: 'daily' });
        const card2 = await createCard({ quotation: 'Not reviewed', schedule: 'even' });

        await markCardAsReviewed(card1.id);

        const cards = await getCardsNeverReviewed();
        expect(cards).toHaveLength(1);
        expect(cards[0].id).toBe(card2.id);
      });

      it('should return empty array when all cards have been reviewed', async () => {
        const card1 = await createCard({ quotation: 'Card 1', schedule: 'daily' });
        const card2 = await createCard({ quotation: 'Card 2', schedule: 'even' });

        await markCardAsReviewed(card1.id);
        await markCardAsReviewed(card2.id);

        const cards = await getCardsNeverReviewed();
        expect(cards).toEqual([]);
      });
    });

    describe('getLastReviewDate', () => {
      it('should return undefined when no cards exist', async () => {
        const date = await getLastReviewDate();
        expect(date).toBeUndefined();
      });

      it('should return undefined when no cards have been reviewed', async () => {
        await createCard({ quotation: 'Card 1', schedule: 'daily' });
        await createCard({ quotation: 'Card 2', schedule: 'even' });

        const date = await getLastReviewDate();
        expect(date).toBeUndefined();
      });

      it('should return the review date when one card has been reviewed', async () => {
        const card = await createCard({ quotation: 'Card 1', schedule: 'daily' });
        const reviewDate = new Date('2024-01-15T10:00:00Z');

        await markCardAsReviewed(card.id, reviewDate);

        const lastDate = await getLastReviewDate();
        expect(lastDate).toEqual(reviewDate);
      });

      it('should return the most recent review date when multiple cards reviewed', async () => {
        const card1 = await createCard({ quotation: 'Card 1', schedule: 'daily' });
        const card2 = await createCard({ quotation: 'Card 2', schedule: 'even' });
        const card3 = await createCard({ quotation: 'Card 3', schedule: 'odd' });

        const date1 = new Date('2024-01-15T10:00:00Z');
        const date2 = new Date('2024-01-17T10:00:00Z');
        const date3 = new Date('2024-01-16T10:00:00Z');

        await markCardAsReviewed(card1.id, date1);
        await markCardAsReviewed(card2.id, date2);
        await markCardAsReviewed(card3.id, date3);

        const lastDate = await getLastReviewDate();
        expect(lastDate).toEqual(date2); // Most recent
      });

      it('should ignore unreviewed cards', async () => {
        const card1 = await createCard({ quotation: 'Reviewed', schedule: 'daily' });
        await createCard({ quotation: 'Not reviewed', schedule: 'even' });

        const reviewDate = new Date('2024-01-15T10:00:00Z');
        await markCardAsReviewed(card1.id, reviewDate);

        const lastDate = await getLastReviewDate();
        expect(lastDate).toEqual(reviewDate);
      });
    });

    describe('getTotalReviewCount', () => {
      it('should return 0 when no cards exist', async () => {
        const count = await getTotalReviewCount();
        expect(count).toBe(0);
      });

      it('should return 0 when cards exist but none reviewed', async () => {
        await createCard({ quotation: 'Card 1', schedule: 'daily' });
        await createCard({ quotation: 'Card 2', schedule: 'even' });

        const count = await getTotalReviewCount();
        expect(count).toBe(0);
      });

      it('should count single review', async () => {
        const card = await createCard({ quotation: 'Card 1', schedule: 'daily' });
        await markCardAsReviewed(card.id);

        const count = await getTotalReviewCount();
        expect(count).toBe(1);
      });

      it('should count multiple reviews on same card', async () => {
        const card = await createCard({ quotation: 'Card 1', schedule: 'daily' });

        await markCardAsReviewed(card.id, new Date('2024-01-15'));
        await markCardAsReviewed(card.id, new Date('2024-01-16'));
        await markCardAsReviewed(card.id, new Date('2024-01-17'));

        const count = await getTotalReviewCount();
        expect(count).toBe(3);
      });

      it('should count reviews across multiple cards', async () => {
        const card1 = await createCard({ quotation: 'Card 1', schedule: 'daily' });
        const card2 = await createCard({ quotation: 'Card 2', schedule: 'even' });
        const card3 = await createCard({ quotation: 'Card 3', schedule: 'odd' });

        await markCardAsReviewed(card1.id);
        await markCardAsReviewed(card1.id);
        await markCardAsReviewed(card2.id);
        await markCardAsReviewed(card3.id);
        await markCardAsReviewed(card3.id);
        await markCardAsReviewed(card3.id);

        const count = await getTotalReviewCount();
        expect(count).toBe(6); // 2 + 1 + 3
      });
    });

    describe('getBoxStatistics', () => {
      it('should return empty statistics when no cards exist', async () => {
        const stats = await getBoxStatistics();

        expect(stats.totalCards).toBe(0);
        expect(stats.cardsDue).toBe(0);
        expect(stats.cardsNeverReviewed).toBe(0);
        expect(stats.totalReviewsCompleted).toBe(0);
        expect(stats.lastReviewDate).toBeUndefined();
        expect(stats.scheduleBreakdown).toEqual({});
      });

      it('should return correct statistics for cards with no reviews', async () => {
        await createCard({ quotation: 'Daily 1', schedule: 'daily' });
        await createCard({ quotation: 'Daily 2', schedule: 'daily' });
        await createCard({ quotation: 'Even 1', schedule: 'even' });

        const stats = await getBoxStatistics();

        expect(stats.totalCards).toBe(3);
        expect(stats.cardsNeverReviewed).toBe(3);
        expect(stats.totalReviewsCompleted).toBe(0);
        expect(stats.lastReviewDate).toBeUndefined();
        expect(stats.scheduleBreakdown).toEqual({
          daily: 2,
          even: 1
        });
      });

      it('should return correct statistics with reviews', async () => {
        const today = new Date('2024-01-15T10:00:00Z');
        vi.setSystemTime(today);

        const card1 = await createCard({ quotation: 'Daily', schedule: 'daily' });
        const card2 = await createCard({ quotation: 'Even', schedule: 'even' });
        const card3 = await createCard({ quotation: 'Not reviewed', schedule: 'odd' });

        const reviewDate1 = new Date('2024-01-14T10:00:00Z');
        const reviewDate2 = new Date('2024-01-15T10:00:00Z');

        await markCardAsReviewed(card1.id, reviewDate1);
        await markCardAsReviewed(card1.id, reviewDate2);
        await markCardAsReviewed(card2.id, reviewDate2);

        const stats = await getBoxStatistics();

        expect(stats.totalCards).toBe(3);
        expect(stats.cardsNeverReviewed).toBe(1);
        expect(stats.totalReviewsCompleted).toBe(3); // 2 + 1
        expect(stats.lastReviewDate).toEqual(reviewDate2);
        expect(stats.scheduleBreakdown).toEqual({
          daily: 1,
          even: 1,
          odd: 1
        });

        vi.useRealTimers();
      });

      it('should count due cards correctly', async () => {
        const today = new Date('2024-01-15T10:00:00Z');
        vi.setSystemTime(today);

        const tomorrow = new Date('2024-01-16T10:00:00Z');

        const card1 = await createCard({ quotation: 'Due today', schedule: 'daily' });
        const card2 = await createCard({ quotation: 'Due tomorrow', schedule: 'even' });

        await db.cards.update(card1.id, { nextReview: today });
        await db.cards.update(card2.id, { nextReview: tomorrow });

        const stats = await getBoxStatistics();

        expect(stats.totalCards).toBe(2);
        expect(stats.cardsDue).toBe(1);

        vi.useRealTimers();
      });

      it('should handle complex box with mixed schedules', async () => {
        await createCard({ quotation: 'Daily 1', schedule: 'daily' });
        await createCard({ quotation: 'Daily 2', schedule: 'daily' });
        await createCard({ quotation: 'Even', schedule: 'even' });
        await createCard({ quotation: 'Odd', schedule: 'odd' });
        await createCard({ quotation: 'Monday', schedule: 'monday' });
        await createCard({ quotation: 'Monthly 15', schedule: '15' });
        await createCard({ quotation: 'Monthly 15 again', schedule: '15' });

        const stats = await getBoxStatistics();

        expect(stats.totalCards).toBe(7);
        expect(stats.scheduleBreakdown).toEqual({
          daily: 2,
          even: 1,
          odd: 1,
          monday: 1,
          '15': 2
        });
      });
    });
  });
});
