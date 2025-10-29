'use client';

import { useState, useEffect, FormEvent } from 'react';
import type { Card, Schedule, CreateCardInput, UpdateCardInput } from '@/lib/types';
import { getAllScheduleTypes, getScheduleLabel, getScheduleDescription } from '@/lib/utils/scheduling';

interface CardFormProps {
  /**
   * If provided, the form will be in edit mode and pre-populate with this card's data
   */
  card?: Card;
  /**
   * Called when the form is submitted successfully
   */
  onSubmit: (data: CreateCardInput | UpdateCardInput) => Promise<void>;
  /**
   * Called when the user cancels the form
   */
  onCancel?: () => void;
  /**
   * Text to display on the submit button
   */
  submitButtonText?: string;
}

export function CardForm({ card, onSubmit, onCancel, submitButtonText = 'Save Card' }: CardFormProps) {
  const [quotation, setQuotation] = useState(card?.quotation || '');
  const [author, setAuthor] = useState(card?.author || '');
  const [reference, setReference] = useState(card?.reference || '');
  const [schedule, setSchedule] = useState<Schedule>(card?.schedule || 'daily');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSchedules = getAllScheduleTypes();

  // Group schedules for easier selection
  const frequencySchedules = allSchedules.slice(0, 3); // daily, even, odd
  const weekdaySchedules = allSchedules.slice(3, 10); // sunday-saturday
  const monthlySchedules = allSchedules.slice(10); // 1-31

  useEffect(() => {
    if (card) {
      setQuotation(card.quotation);
      setAuthor(card.author || '');
      setReference(card.reference || '');
      setSchedule(card.schedule);
    }
  }, [card]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!quotation.trim()) {
      setError('Quotation is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const data: CreateCardInput | UpdateCardInput = {
        quotation: quotation.trim(),
        author: author.trim() || undefined,
        reference: reference.trim() || undefined,
        schedule,
      };

      await onSubmit(data);

      // If creating a new card (not editing), reset the form
      if (!card) {
        setQuotation('');
        setAuthor('');
        setReference('');
        setSchedule('daily');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err instanceof Error ? err.message : 'Failed to save card');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4">
          <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
        </div>
      )}

      {/* Quotation */}
      <div>
        <label htmlFor="quotation" className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          Quotation <span className="text-red-500">*</span>
        </label>
        <textarea
          id="quotation"
          name="quotation"
          value={quotation}
          onChange={(e) => setQuotation(e.target.value)}
          required
          rows={6}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
          placeholder="Enter the quotation to memorize..."
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          The text you want to memorize
        </p>
      </div>

      {/* Author */}
      <div>
        <label htmlFor="author" className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          Author
        </label>
        <input
          type="text"
          id="author"
          name="author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
          placeholder="Who wrote or said this?"
        />
      </div>

      {/* Reference */}
      <div>
        <label htmlFor="reference" className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          Reference
        </label>
        <input
          type="text"
          id="reference"
          name="reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
          placeholder="Book title, chapter, verse, etc."
        />
      </div>

      {/* Schedule */}
      <div>
        <label htmlFor="schedule" className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          Review Schedule <span className="text-red-500">*</span>
        </label>
        <select
          id="schedule"
          name="schedule"
          value={schedule}
          onChange={(e) => setSchedule(e.target.value as Schedule)}
          required
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
        >
          <optgroup label="Frequency">
            {frequencySchedules.map((s) => (
              <option key={s} value={s}>
                {getScheduleLabel(s)} - {getScheduleDescription(s)}
              </option>
            ))}
          </optgroup>
          <optgroup label="Weekly">
            {weekdaySchedules.map((s) => (
              <option key={s} value={s}>
                {getScheduleLabel(s)} - {getScheduleDescription(s)}
              </option>
            ))}
          </optgroup>
          <optgroup label="Monthly">
            {monthlySchedules.map((s) => (
              <option key={s} value={s}>
                {getScheduleLabel(s)} - {getScheduleDescription(s)}
              </option>
            ))}
          </optgroup>
        </select>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          How often you want to review this quotation
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors"
        >
          {isSubmitting ? 'Saving...' : submitButtonText}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
