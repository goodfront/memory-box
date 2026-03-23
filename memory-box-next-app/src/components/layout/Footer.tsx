'use client';

import Link from "next/link";
import { useDatabaseContext } from "@/components/providers";

export function Footer() {
  const { isReady } = useDatabaseContext();

  return (
    <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Memory Box <Link href="/dev" className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300">(dev)</Link>
          </p>
          {isReady && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-500">
              <svg
                className="h-3 w-3 text-green-600 dark:text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Database Ready</span>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
