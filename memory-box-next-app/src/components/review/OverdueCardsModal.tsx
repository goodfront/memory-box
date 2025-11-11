'use client';

import { useState } from 'react';

interface OverdueCardsModalProps {
  weeklyCount: number;
  monthlyCount: number;
  onConfirm: (includeWeekly: boolean, includeMonthly: boolean) => void;
  onCancel: () => void;
}

export function OverdueCardsModal({
  weeklyCount,
  monthlyCount,
  onConfirm,
  onCancel
}: OverdueCardsModalProps) {
  const [includeWeekly, setIncludeWeekly] = useState(false);
  const [includeMonthly, setIncludeMonthly] = useState(false);

  const handleConfirm = () => {
    onConfirm(includeWeekly, includeMonthly);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          Overdue Cards Found
        </h2>

        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          You have overdue cards that were missed. Would you like to include them in this review session?
        </p>

        <div className="space-y-4 mb-6">
          {weeklyCount > 0 && (
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeWeekly}
                onChange={(e) => setIncludeWeekly(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 dark:bg-zinc-800"
              />
              <div className="flex-1">
                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                  Weekly ({weeklyCount})
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  Cards scheduled for specific days of the week
                </div>
              </div>
            </label>
          )}

          {monthlyCount > 0 && (
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeMonthly}
                onChange={(e) => setIncludeMonthly(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 dark:bg-zinc-800"
              />
              <div className="flex-1">
                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                  Monthly ({monthlyCount})
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  Cards scheduled for specific days of the month
                </div>
              </div>
            </label>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors"
          >
            Skip Overdue
          </button>
          <button
            onClick={handleConfirm}
            disabled={!includeWeekly && !includeMonthly}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 disabled:dark:bg-zinc-700 disabled:cursor-not-allowed text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors"
          >
            Include Selected
          </button>
        </div>
      </div>
    </div>
  );
}
