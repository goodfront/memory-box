'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CardList, type SortOption } from '@/components/cards/CardList';
import { getAllCards } from '@/lib/db/operations';
import type { Card, Schedule } from '@/lib/types';

function CardsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get initial values from URL params
  const initialSearch = searchParams.get('search') || '';
  const initialSort = (searchParams.get('sort') as SortOption) || 'timeAdded';
  const initialSchedule = (searchParams.get('schedule') as Schedule | 'all') || 'all';

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      setLoading(true);
      setError(null);
      const allCards = await getAllCards();
      setCards(allCards);
    } catch (err) {
      console.error('Error loading cards:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (card: Card) => {
    router.push(`/cards/view?id=${card.id}`);
  };

  // Update URL when filters change
  const updateUrlParams = (params: { search?: string; sort?: string; schedule?: string }) => {
    const newParams = new URLSearchParams(searchParams.toString());

    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== '' && value !== 'all' && value !== 'timeAdded') {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });

    const paramString = newParams.toString();
    const newUrl = paramString ? `/cards?${paramString}` : '/cards';
    router.push(newUrl, { scroll: false });
  };

  const handleSearchChange = (search: string) => {
    updateUrlParams({ search, sort: searchParams.get('sort') || undefined, schedule: searchParams.get('schedule') || undefined });
  };

  const handleSortChange = (sort: SortOption) => {
    updateUrlParams({ search: searchParams.get('search') || undefined, sort, schedule: searchParams.get('schedule') || undefined });
  };

  const handleScheduleFilterChange = (schedule: Schedule | 'all') => {
    updateUrlParams({ search: searchParams.get('search') || undefined, sort: searchParams.get('sort') || undefined, schedule });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            All Cards
          </h1>
          <button
            onClick={() => router.push('/cards/new')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors"
          >
            Add New Card
          </button>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400">
          Browse and manage all your memory cards. Use the search and filters below to find specific cards.
        </p>
      </div>

      <CardList
        cards={cards}
        loading={loading}
        error={error}
        onCardClick={handleCardClick}
        showControls={true}
        emptyMessage="No cards found. Create your first card to get started!"
        initialSearchTerm={initialSearch}
        initialSortBy={initialSort}
        initialFilterSchedule={initialSchedule}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        onScheduleFilterChange={handleScheduleFilterChange}
      />
    </div>
  );
}

export default function CardsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              All Cards
            </h1>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Loading cards...
          </p>
        </div>
      </div>
    }>
      <CardsPageContent />
    </Suspense>
  );
}
