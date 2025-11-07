'use client';

import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 py-8">
      <div className="mx-auto w-full max-w-4xl flex flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
            Memory Box
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Memorize quotations using spaced repetition
          </p>
        </div>

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

          <Link
            href="/dev"
            className="flex flex-col gap-2 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 p-6 transition-colors hover:bg-amber-100 dark:hover:bg-amber-900"
          >
            <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-100">
              Dev Tools
            </h2>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Inject test cards for development
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
