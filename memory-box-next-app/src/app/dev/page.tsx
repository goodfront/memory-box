'use client';

import { useState } from 'react';
import Link from 'next/link';
import { injectTestCards, injectCardsDueToday, resetWithTestCards, getTestDataSummary } from '@/lib/db/testData';
import { clearDatabase } from '@/lib/db/schema';

interface Summary {
  total: number;
  dueToday: number;
  overdue: number;
  future: number;
  neverReviewed: number;
}

export default function DevToolsPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [summary, setSummary] = useState<Summary | null>(null);

  const handleInjectTestCards = async () => {
    setLoading(true);
    setMessage('');
    try {
      const cards = await injectTestCards();
      const newSummary = await getTestDataSummary();
      setSummary(newSummary);
      setMessage(`Successfully injected ${cards.length} test cards!`);
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInjectCardsDueToday = async (count: number) => {
    setLoading(true);
    setMessage('');
    try {
      const cards = await injectCardsDueToday(count);
      const newSummary = await getTestDataSummary();
      setSummary(newSummary);
      setMessage(`Successfully injected ${cards.length} cards due today!`);
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetWithTestCards = async () => {
    setLoading(true);
    setMessage('');
    try {
      const cards = await resetWithTestCards();
      const newSummary = await getTestDataSummary();
      setSummary(newSummary);
      setMessage(`Database cleared and ${cards.length} test cards injected!`);
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearDatabase = async () => {
    setLoading(true);
    setMessage('');
    try {
      await clearDatabase();
      const newSummary = await getTestDataSummary();
      setSummary(newSummary);
      setMessage('Database cleared! All cards have been deleted.');
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSummary = async () => {
    setLoading(true);
    try {
      const newSummary = await getTestDataSummary();
      setSummary(newSummary);
      setMessage('Summary refreshed!');
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 min-h-screen py-8">
      <div className="mx-auto w-full max-w-4xl flex flex-col gap-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              ← Back
            </Link>
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
              Developer Tools
            </h1>
          </div>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Inject test cards for development and testing
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div
            className={`rounded-lg border p-4 ${
              message.startsWith('Error')
                ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'
                : 'border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200'
            }`}
          >
            {message}
          </div>
        )}

        {/* Summary Display */}
        {summary && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Current Database Summary
              </h2>
              <button
                onClick={handleRefreshSummary}
                disabled={loading}
                className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {summary.total}
                </span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Total</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {summary.dueToday}
                </span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Due Today</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {summary.overdue}
                </span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Overdue</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {summary.future}
                </span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Future</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {summary.neverReviewed}
                </span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Never Reviewed</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Inject Test Cards
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Adds 10 diverse test cards including cards due today, overdue, future, and never reviewed.
              </p>
            </div>
            <button
              onClick={handleInjectTestCards}
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Inject Test Cards'}
            </button>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Inject Cards Due Today
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Add multiple cards that are all due for review today.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleInjectCardsDueToday(5)}
                disabled={loading}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                5 Cards
              </button>
              <button
                onClick={() => handleInjectCardsDueToday(10)}
                disabled={loading}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                10 Cards
              </button>
              <button
                onClick={() => handleInjectCardsDueToday(20)}
                disabled={loading}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                20 Cards
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border border-red-200 dark:border-red-900 bg-white dark:bg-zinc-950 p-6">
            <div>
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                Clear Database
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400">
                Deletes all cards from the database. This cannot be undone.
              </p>
            </div>
            <button
              onClick={handleClearDatabase}
              disabled={loading}
              className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Clear All Data'}
            </button>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border border-red-200 dark:border-red-900 bg-white dark:bg-zinc-950 p-6">
            <div>
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                Reset Database
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400">
                Clears all existing cards and injects fresh test data. This cannot be undone.
              </p>
            </div>
            <button
              onClick={handleResetWithTestCards}
              disabled={loading}
              className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Clear & Reset Database'}
            </button>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Quick Links
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Navigate to common pages after injecting test data.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/review"
                className="text-center rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                Review Session
              </Link>
              <Link
                href="/cards"
                className="text-center rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                All Cards
              </Link>
              <Link
                href="/box"
                className="text-center rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                Box Overview
              </Link>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Usage Instructions
          </h3>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2 list-disc list-inside">
            <li>Use &quot;Inject Test Cards&quot; to add diverse sample cards with different review schedules</li>
            <li>Use &quot;Inject Cards Due Today&quot; to quickly populate your review session for testing</li>
            <li>Use &quot;Reset Database&quot; when you want to start fresh with clean test data</li>
            <li>The summary updates automatically after each action</li>
            <li>Test cards include quotes from various authors with realistic review histories</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
