'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CardView } from '@/components/cards/CardView';
import { getCard, deleteCard } from '@/lib/db/operations';
import type { Card } from '@/lib/types';

function ViewCardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleEdit = () => {
    router.push(`/cards/edit?id=${id}`);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!id) return;

    try {
      setIsDeleting(true);
      const success = await deleteCard(id);
      if (success) {
        router.push('/cards');
      } else {
        setError('Failed to delete card');
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      console.error('Error deleting card:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete card');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Card Not Found
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            The card you are looking for does not exist or has been deleted.
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium mb-4 inline-flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Card Details
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          View and manage this memory card
        </p>
      </div>

      {/* Card Display */}
      <CardView
        card={card}
        reviewMode={false}
        showMetadata={true}
        showActions={true}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              Delete Card?
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Are you sure you want to delete this card? This action cannot be undone, and all review history will be lost.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete Card'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ViewCardPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center" role="status" aria-live="polite">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent mb-4"></div>
            <p className="text-zinc-600 dark:text-zinc-400">Loading card...</p>
          </div>
        </div>
      </div>
    }>
      <ViewCardContent />
    </Suspense>
  );
}
