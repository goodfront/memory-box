'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ReviewSession } from '@/components/review/ReviewSession';
import { getCardsDueForReview } from '@/lib/db/operations';
import type { Card } from '@/lib/types';

export default function ReviewPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  useEffect(() => {
    loadDueCards();
  }, []);

  async function loadDueCards() {
    try {
      setLoading(true);
      const dueCards = await getCardsDueForReview();
      setCards(dueCards);
    } catch (error) {
      console.error('Failed to load due cards:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleCardReviewed() {
    setReviewedCount(prev => prev + 1);
  }

  function handleSessionComplete() {
    setSessionComplete(true);
  }

  function handleStartNewSession() {
    setSessionComplete(false);
    setReviewedCount(0);
    loadDueCards();
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent mb-4"></div>
            <p className="text-zinc-600 dark:text-zinc-400">Loading review session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Session Complete!
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
            You reviewed {reviewedCount} {reviewedCount === 1 ? 'card' : 'cards'} today.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleStartNewSession}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors"
            >
              Start Another Session
            </button>
            <Link
              href="/box"
              className="px-6 py-3 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors inline-block"
            >
              View Box
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Review Session
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {cards.length === 0
            ? "No cards are due for review today."
            : `You have ${cards.length} ${cards.length === 1 ? 'card' : 'cards'} to review today.`}
        </p>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            All Caught Up!
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            No cards are due for review today. Check back tomorrow!
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/cards/new"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors inline-block"
            >
              Add New Card
            </Link>
            <Link
              href="/box"
              className="px-6 py-3 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors inline-block"
            >
              View Box
            </Link>
          </div>
        </div>
      ) : (
        <ReviewSession
          cards={cards}
          onComplete={handleSessionComplete}
          onCardReviewed={handleCardReviewed}
        />
      )}
    </div>
  );
}
