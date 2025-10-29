'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CardForm } from '@/components/cards/CardForm';
import { createCard } from '@/lib/db/operations';
import type { CreateCardInput, UpdateCardInput } from '@/lib/types';

export default function NewCardPage() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: CreateCardInput | UpdateCardInput) {
    try {
      setError(null);
      // In the context of creating a new card, data will always be CreateCardInput
      await createCard(data as CreateCardInput);
      setShowSuccess(true);

      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Failed to create card:', err);
      setError(err instanceof Error ? err.message : 'Failed to create card');
      throw err; // Re-throw to let CardForm handle the error state
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Create New Card
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Add a new quotation to your Memory Box.
        </p>
      </div>

      {showSuccess && (
        <div className="mb-6 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">✓</div>
            <div className="flex-1">
              <p className="font-medium text-green-900 dark:text-green-100 mb-1">
                Card created successfully!
              </p>
              <p className="text-sm text-green-800 dark:text-green-200">
                Your quotation has been added to your Memory Box and will appear in your review schedule.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4">
          <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
        <CardForm
          onSubmit={handleSubmit}
          submitButtonText="Create Card"
        />
      </div>

      <div className="flex gap-4 justify-center text-sm">
        <Link
          href="/box"
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
        >
          ← Back to Box
        </Link>
        <Link
          href="/cards"
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
        >
          View All Cards
        </Link>
      </div>
    </div>
  );
}
