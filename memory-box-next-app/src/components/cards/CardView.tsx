'use client';

import { useState } from 'react';
import type { Card } from '@/lib/types';
import { getScheduleLabel, getScheduleDescription } from '@/lib/utils/scheduling';

interface CardViewProps {
  /**
   * The card to display
   */
  card: Card;
  /**
   * Whether to show the card in review mode (can toggle quotation visibility)
   * Default: false
   */
  reviewMode?: boolean;
  /**
   * Whether to show metadata (author, reference, schedule, dates)
   * Default: true
   */
  showMetadata?: boolean;
  /**
   * Whether to show action buttons (edit, delete)
   * Default: false
   */
  showActions?: boolean;
  /**
   * Called when the edit button is clicked
   */
  onEdit?: () => void;
  /**
   * Called when the delete button is clicked
   */
  onDelete?: () => void;
  /**
   * Called when the card is marked as reviewed
   */
  onMarkReviewed?: () => void;
}

export function CardView({
  card,
  reviewMode = false,
  showMetadata = true,
  showActions = false,
  onEdit,
  onDelete,
  onMarkReviewed
}: CardViewProps) {
  const [isQuotationVisible, setIsQuotationVisible] = useState(!reviewMode);

  const formatDate = (date: Date | undefined): string => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = new Date(card.nextReview) < new Date();

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
      {/* Card Content */}
      <div className="p-6">
        {/* Quotation */}
        {reviewMode ? (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Quotation
              </h3>
              <button
                onClick={() => setIsQuotationVisible(!isQuotationVisible)}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
              >
                {isQuotationVisible ? 'Hide' : 'Show'}
              </button>
            </div>
            {isQuotationVisible ? (
              <blockquote className="text-lg leading-relaxed text-zinc-900 dark:text-zinc-100 italic border-l-4 border-indigo-500 pl-4 py-2 whitespace-pre-wrap">
                {card.quotation}
              </blockquote>
            ) : (
              <div className="h-24 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Try to recall the quotation, then click Show
                </p>
              </div>
            )}
          </div>
        ) : (
          <blockquote className="text-lg leading-relaxed text-zinc-900 dark:text-zinc-100 italic border-l-4 border-indigo-500 pl-4 py-2 mb-6 whitespace-pre-wrap">
            {card.quotation}
          </blockquote>
        )}

        {/* Metadata */}
        {showMetadata && (
          <div className="space-y-3 text-sm">
            {/* Author */}
            {card.author && (
              <div className="flex items-start">
                <span className="text-zinc-500 dark:text-zinc-400 w-24 flex-shrink-0">Author:</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-medium">{card.author}</span>
              </div>
            )}

            {/* Reference */}
            {card.reference && (
              <div className="flex items-start">
                <span className="text-zinc-500 dark:text-zinc-400 w-24 flex-shrink-0">Reference:</span>
                <span className="text-zinc-900 dark:text-zinc-100">{card.reference}</span>
              </div>
            )}

            {/* Schedule */}
            <div className="flex items-start">
              <span className="text-zinc-500 dark:text-zinc-400 w-24 flex-shrink-0">Schedule:</span>
              <div>
                <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                  {getScheduleLabel(card.schedule)}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 ml-2">
                  ({getScheduleDescription(card.schedule)})
                </span>
              </div>
            </div>

            {/* Next Review */}
            <div className="flex items-start">
              <span className="text-zinc-500 dark:text-zinc-400 w-24 flex-shrink-0">Next Review:</span>
              <span className={`font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                {formatDate(card.nextReview)}
                {isOverdue && ' (Overdue)'}
              </span>
            </div>

            {/* Last Reviewed */}
            <div className="flex items-start">
              <span className="text-zinc-500 dark:text-zinc-400 w-24 flex-shrink-0">Last Reviewed:</span>
              <span className="text-zinc-900 dark:text-zinc-100">{formatDate(card.lastReviewed)}</span>
            </div>

            {/* Review Count */}
            <div className="flex items-start">
              <span className="text-zinc-500 dark:text-zinc-400 w-24 flex-shrink-0">Review Count:</span>
              <span className="text-zinc-900 dark:text-zinc-100">{card.reviewHistory.length}</span>
            </div>

            {/* Time Added */}
            <div className="flex items-start">
              <span className="text-zinc-500 dark:text-zinc-400 w-24 flex-shrink-0">Added:</span>
              <span className="text-zinc-600 dark:text-zinc-300 text-xs">{formatDate(card.timeAdded)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {(showActions || onMarkReviewed) && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-950/30">
          <div className="flex gap-3 flex-wrap">
            {onMarkReviewed && (
              <button
                onClick={onMarkReviewed}
                className="flex-1 min-w-[140px] px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors"
              >
                Mark as Reviewed
              </button>
            )}
            {showActions && onEdit && (
              <button
                onClick={onEdit}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors"
              >
                Edit
              </button>
            )}
            {showActions && onDelete && (
              <button
                onClick={onDelete}
                className="px-4 py-2 border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-700 dark:text-red-300 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
