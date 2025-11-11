'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Card } from '@/lib/types';
import { CardView } from '@/components/cards/CardView';
import { markCardAsReviewed } from '@/lib/db/operations';

interface ReviewSessionProps {
  /**
   * Cards to review in this session
   */
  cards: Card[];
  /**
   * Called when the review session is completed
   */
  onComplete?: () => void;
  /**
   * Called when a card is successfully reviewed
   */
  onCardReviewed?: (card: Card) => void;
}

export function ReviewSession({ cards, onComplete, onCardReviewed }: ReviewSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewedCards, setReviewedCards] = useState<Set<string>>(new Set());
  const [isReviewing, setIsReviewing] = useState(false);

  const currentCard = cards[currentIndex];
  const totalCards = cards.length;
  const completedCount = reviewedCards.size;
  const progressPercentage = totalCards > 0 ? (completedCount / totalCards) * 100 : 0;

  // Handle marking card as reviewed
  const handleMarkReviewed = useCallback(async () => {
    if (!currentCard || isReviewing) return;

    setIsReviewing(true);
    try {
      const reviewedCard = await markCardAsReviewed(currentCard.id);
      if (reviewedCard) {
        setReviewedCards(prev => new Set(prev).add(currentCard.id));
        onCardReviewed?.(reviewedCard);

        // Auto-advance to next card after short delay
        setTimeout(() => {
          if (currentIndex < totalCards - 1) {
            setCurrentIndex(prev => prev + 1);
          } else {
            // All cards reviewed
            onComplete?.();
          }
          setIsReviewing(false);
        }, 300);
      }
    } catch (error) {
      console.error('Failed to mark card as reviewed:', error);
      setIsReviewing(false);
    }
  }, [currentCard, currentIndex, totalCards, isReviewing, onCardReviewed, onComplete]);

  // Handle navigation
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < totalCards - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, totalCards]);

  const handleSkip = useCallback(() => {
    if (currentIndex < totalCards - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Reached the end
      onComplete?.();
    }
  }, [currentIndex, totalCards, onComplete]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case 'Enter':
          e.preventDefault();
          if (!reviewedCards.has(currentCard?.id)) {
            handleMarkReviewed();
          }
          break;
        case 's':
        case 'S':
          e.preventDefault();
          handleSkip();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCard, reviewedCards, handlePrevious, handleNext, handleSkip, handleMarkReviewed]);

  if (totalCards === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">✓</div>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          No cards to review
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Great job! You&apos;re all caught up for today.
        </p>
      </div>
    );
  }

  const isCurrentCardReviewed = reviewedCards.has(currentCard?.id);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Review Progress
          </div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            {completedCount} of {totalCards} completed
          </div>
        </div>
        <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-600 dark:bg-green-500 transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Card Counter */}
      <div className="text-center mb-4">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Card {currentIndex + 1} of {totalCards}
        </span>
      </div>

      {/* Current Card */}
      {currentCard && (
        <div className="mb-6">
          <CardView
            card={currentCard}
            reviewMode={true}
            showMetadata={true}
            onMarkReviewed={isCurrentCardReviewed ? undefined : handleMarkReviewed}
          />
          {isCurrentCardReviewed && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg text-center">
              <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                ✓ Reviewed
              </span>
            </div>
          )}
        </div>
      )}

      {/* Navigation Controls */}
      <div className="flex gap-3 items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors"
        >
          ← Previous
        </button>

        <button
          onClick={handleSkip}
          className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors"
        >
          Skip
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex === totalCards - 1}
          className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors"
        >
          Next →
        </button>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-800 rounded-lg">
        <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
          <div className="font-medium mb-2">Keyboard Shortcuts:</div>
          <div className="grid grid-cols-2 gap-2">
            <div><kbd className="px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded text-xs">←</kbd> Previous card</div>
            <div><kbd className="px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded text-xs">→</kbd> Next card</div>
            <div><kbd className="px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded text-xs">Enter</kbd> Mark reviewed</div>
            <div><kbd className="px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded text-xs">S</kbd> Skip card</div>
          </div>
        </div>
      </div>
    </div>
  );
}
