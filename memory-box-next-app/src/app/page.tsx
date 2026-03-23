'use client';

import Link from "next/link";
import ExportImportSection from "@/components/dev/ExportImportSection";

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
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 p-4">
            <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
              Important: Your Data is Stored Locally
            </h2>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              All your cards are saved in your browser&apos;s local storage, not on any server.
              This means your data only exists on this device. We strongly recommend exporting
              a backup after adding or updating cards to prevent data loss.
            </p>
          </div>

          <ExportImportSection />
        </div>
      </div>
    </div>
  );
}
