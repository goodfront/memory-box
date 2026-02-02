'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CardForm } from '@/components/cards/CardForm';
import { getCard, updateCard } from '@/lib/db/operations';
import type { Card, UpdateCardInput } from '@/lib/types';

function EditCardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCard = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const fetchedCard = await getCard(id);
      setCard(fetchedCard || null);
    } catch (err) {
      console.error('Error loading card:', err);
      setError(err instanceof Error ? err.message : 'Failed to load card');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      setError('No card ID provided');
      setLoading(false);
      return;
    }
    loadCard();
  }, [id, loadCard]);

  const handleSubmit = async (data: UpdateCardInput) => {
    if (!id) return;

    try {
      const updatedCard = await updateCard(id, data);
      if (updatedCard) {
        // Navigate back to the card view page
        router.push(`/cards/view?id=${id}`);
      } else {
        throw new Error('Failed to update card');
      }
    } catch (err) {
      console.error('Error updating card:', err);
      throw err; // Re-throw to let CardForm handle the error display
    }
  };

  const handleCancel = () => {
    if (id) {
      router.push(`/cards/view?id=${id}`);
    } else {
      router.push('/cards');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center" role="status" aria-live="polite">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent mb-4"></div>
            <p className="text-zinc-600 dark:text-zinc-400">Loading card...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-6">
          <h2 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
            Error
          </h2>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={() => router.push('/cards')}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors"
          >
            Back to All Cards
          </button>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Card Not Found
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            The card you are trying to edit does not exist or has been deleted.
          </p>
          <button
            onClick={() => router.push('/cards')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors"
          >
            Back to All Cards
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={handleCancel}
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium mb-4 inline-flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Edit Card
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Update the quotation, author, reference, or review schedule
        </p>
      </div>

      {/* Card Form */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        <CardForm
          card={card}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitButtonText="Update Card"
        />
      </div>
    </div>
  );
}

export default function EditCardPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center" role="status" aria-live="polite">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent mb-4"></div>
            <p className="text-zinc-600 dark:text-zinc-400">Loading card...</p>
          </div>
        </div>
      </div>
    }>
      <EditCardContent />
    </Suspense>
  );
}
