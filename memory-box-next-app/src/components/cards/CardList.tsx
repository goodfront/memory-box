'use client';

import { useState, useMemo } from 'react';
import type { Card, Schedule } from '@/lib/types';
import { getScheduleLabel } from '@/lib/utils/scheduling';

interface CardListProps {
  /**
   * Array of cards to display
   */
  cards: Card[];
  /**
   * Whether to show a loading state
   */
  loading?: boolean;
  /**
   * Error message to display
   */
  error?: string | null;
  /**
   * Called when a card is clicked
   */
  onCardClick?: (card: Card) => void;
  /**
   * Whether to show search/filter controls
   */
  showControls?: boolean;
  /**
   * Empty state message
   */
  emptyMessage?: string;
  /**
   * Initial search term (from URL params)
   */
  initialSearchTerm?: string;
  /**
   * Initial sort option (from URL params)
   */
  initialSortBy?: SortOption;
  /**
   * Initial schedule filter (from URL params)
   */
  initialFilterSchedule?: Schedule | 'all';
  /**
   * Called when search term changes
   */
  onSearchChange?: (searchTerm: string) => void;
  /**
   * Called when sort option changes
   */
  onSortChange?: (sortBy: SortOption) => void;
  /**
   * Called when schedule filter changes
   */
  onScheduleFilterChange?: (schedule: Schedule | 'all') => void;
}

export type SortOption = 'timeAdded' | 'timeAddedDesc' | 'author' | 'authorDesc';

export function CardList({
  cards,
  loading = false,
  error = null,
  onCardClick,
  showControls = true,
  emptyMessage = 'No cards found',
  initialSearchTerm = '',
  initialSortBy = 'timeAdded',
  initialFilterSchedule = 'all',
  onSearchChange,
  onSortChange,
  onScheduleFilterChange
}: CardListProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [sortBy, setSortBy] = useState<SortOption>(initialSortBy);
  const [filterSchedule, setFilterSchedule] = useState<Schedule | 'all'>(initialFilterSchedule);

  // Get unique schedules from cards for filter dropdown
  const availableSchedules = useMemo(() => {
    const schedules = new Set(cards.map(card => card.schedule));
    return Array.from(schedules).sort();
  }, [cards]);

  // Filter and sort cards
  const filteredAndSortedCards = useMemo(() => {
    let result = [...cards];

    // Apply search filter
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(card =>
        card.quotation.toLowerCase().includes(lowerSearch) ||
        card.author?.toLowerCase().includes(lowerSearch) ||
        card.reference?.toLowerCase().includes(lowerSearch)
      );
    }

    // Apply schedule filter
    if (filterSchedule !== 'all') {
      result = result.filter(card => card.schedule === filterSchedule);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'timeAdded':
          return new Date(a.timeAdded).getTime() - new Date(b.timeAdded).getTime();
        case 'timeAddedDesc':
          return new Date(b.timeAdded).getTime() - new Date(a.timeAdded).getTime();
        case 'author':
          return (a.author || '').localeCompare(b.author || '');
        case 'authorDesc':
          return (b.author || '').localeCompare(a.author || '');
        default:
          return 0;
      }
    });

    return result;
  }, [cards, searchTerm, sortBy, filterSchedule]);

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const isOverdue = (nextReview: Date): boolean => {
    return new Date(nextReview) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">Loading cards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4">
        <p className="text-sm text-red-900 dark:text-red-100">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      {showControls && cards.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by content, author, or source..."
              value={searchTerm}
              onChange={(e) => {
                const value = e.target.value;
                setSearchTerm(value);
                onSearchChange?.(value);
              }}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent text-sm"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => {
              const value = e.target.value as SortOption;
              setSortBy(value);
              onSortChange?.(value);
            }}
            className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent text-sm"
          >
            <option value="timeAdded">Date Added (Oldest First)</option>
            <option value="timeAddedDesc">Date Added (Newest First)</option>
            <option value="author">Author (A-Z)</option>
            <option value="authorDesc">Author (Z-A)</option>
          </select>

          {/* Filter by Schedule */}
          <select
            value={filterSchedule}
            onChange={(e) => {
              const value = e.target.value as Schedule | 'all';
              setFilterSchedule(value);
              onScheduleFilterChange?.(value);
            }}
            className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent text-sm"
          >
            <option value="all">All Schedules</option>
            {availableSchedules.map((schedule) => (
              <option key={schedule} value={schedule}>
                {getScheduleLabel(schedule)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Results count */}
      {showControls && cards.length > 0 && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Showing {filteredAndSortedCards.length} of {cards.length} cards
        </p>
      )}

      {/* Card List */}
      {filteredAndSortedCards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-500 dark:text-zinc-400">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedCards.map((card) => (
            <div
              key={card.id}
              onClick={() => onCardClick?.(card)}
              className={`rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 ${
                onCardClick ? 'cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all' : ''
              }`}
            >
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Card Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-900 dark:text-zinc-100 mb-2 leading-relaxed">
                      {truncateText(card.quotation)}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {card.author && <span>By {card.author}</span>}
                      {card.reference && <span>({card.reference})</span>}
                    </div>
                  </div>

                  {/* Card Metadata */}
                  <div className="flex flex-col sm:items-end gap-1 text-sm flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 font-medium text-xs">
                        {getScheduleLabel(card.schedule)}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {card.reviewHistory.length} reviews
                      </span>
                    </div>
                  </div>
                </div>

                {/* Date Added */}
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Added {formatDate(card.timeAdded)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
