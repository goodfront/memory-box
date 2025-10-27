/**
 * Type definitions for the Memory Box application
 */

/**
 * Schedule types following Charlotte Mason's memory system:
 * - 'daily': Review every day
 * - 'even': Review on even-numbered days (2, 4, 6, 8, etc.)
 * - 'odd': Review on odd-numbered days (1, 3, 5, 7, etc.)
 * - 'sunday' through 'saturday': Review on specific weekday
 * - '1' through '31': Review on specific day of each month
 */
export type Schedule =
  | 'daily'
  | 'even'
  | 'odd'
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
  | '11' | '12' | '13' | '14' | '15' | '16' | '17' | '18' | '19' | '20'
  | '21' | '22' | '23' | '24' | '25' | '26' | '27' | '28' | '29' | '30'
  | '31';

/**
 * Card represents a single quotation to be memorized
 */
export interface Card {
  id: string;
  quotation: string;
  author?: string;
  reference?: string;
  schedule: Schedule;
  timeAdded: Date;
  timeModified: Date;
  lastReviewed?: Date;
  nextReview: Date;
  reviewHistory: Date[];
}

/**
 * Box represents a collection of cards
 * MVP: One box per user
 */
export interface Box {
  id: string;
  name: string;
  createdAt: Date;
  modifiedAt: Date;
}

/**
 * Input type for creating a new card (omits auto-generated fields)
 */
export type CreateCardInput = Omit<Card, 'id' | 'timeAdded' | 'timeModified' | 'nextReview' | 'reviewHistory'> & {
  lastReviewed?: Date;
};

/**
 * Input type for updating a card (partial fields)
 */
export type UpdateCardInput = Partial<Omit<Card, 'id' | 'timeAdded'>>;

/**
 * Box statistics for overview and dashboard
 */
export interface BoxStatistics {
  totalCards: number;
  cardsDue: number;
  cardsNeverReviewed: number;
  totalReviewsCompleted: number;
  lastReviewDate?: Date;
  scheduleBreakdown: Record<string, number>;
}
