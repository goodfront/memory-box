'use client';

import Link from "next/link";
import { useDatabaseContext } from "@/components/providers";

export default function Home() {
  const { isReady, state } = useDatabaseContext();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <main className="flex w-full max-w-3xl flex-col gap-8 p-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
            Memory Box
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Charlotte Mason memory system for memorizing quotations using spaced repetition
          </p>
        </div>

        {isReady && (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-green-600 dark:text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium text-green-900 dark:text-green-100">
                Database Ready
              </span>
            </div>
            <p className="mt-1 text-sm text-green-700 dark:text-green-300">
              Last checked: {state.lastChecked?.toLocaleTimeString()}
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/cards"
            className="flex flex-col gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              All Cards
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Browse and manage your memory cards
            </p>
          </Link>

          <Link
            href="/review"
            className="flex flex-col gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Review Session
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Review your cards due today
            </p>
          </Link>

          <Link
            href="/cards/new"
            className="flex flex-col gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              New Card
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Add a new quotation to memorize
            </p>
          </Link>

          <Link
            href="/box"
            className="flex flex-col gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Box Overview
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              View schedule levels and card counts
            </p>
          </Link>
        </div>

        <div className="mt-8 border-t border-zinc-200 dark:border-zinc-800 pt-8">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            About the Charlotte Mason Schedule
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            This app implements Charlotte Mason&apos;s memory system with 41 different review schedules:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
            <li><strong>Daily:</strong> Review every day</li>
            <li><strong>Even/Odd:</strong> Review on even or odd-numbered days</li>
            <li><strong>Weekdays:</strong> Review on specific days of the week</li>
            <li><strong>Monthly:</strong> Review on specific days of each month (1-31)</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
