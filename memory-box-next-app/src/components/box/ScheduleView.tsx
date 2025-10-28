import type { Schedule } from '@/lib/types';
import { getScheduleLabel, getScheduleDescription } from '@/lib/utils/scheduling';

interface ScheduleViewProps {
  schedule: Schedule;
  cardCount: number;
  dueCount: number;
}

export function ScheduleView({ schedule, cardCount, dueCount }: ScheduleViewProps) {
  const hasCards = cardCount > 0;
  const hasDueCards = dueCount > 0;

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        hasCards
          ? hasDueCards
            ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/30'
            : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
          : 'border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3
            className={`text-sm font-semibold truncate ${
              hasCards
                ? hasDueCards
                  ? 'text-indigo-900 dark:text-indigo-100'
                  : 'text-zinc-900 dark:text-zinc-100'
                : 'text-zinc-500 dark:text-zinc-600'
            }`}
          >
            {getScheduleLabel(schedule)}
          </h3>
          <p
            className={`text-xs mt-0.5 truncate ${
              hasCards
                ? hasDueCards
                  ? 'text-indigo-700 dark:text-indigo-300'
                  : 'text-zinc-600 dark:text-zinc-400'
                : 'text-zinc-400 dark:text-zinc-700'
            }`}
          >
            {getScheduleDescription(schedule)}
          </p>
        </div>

        <div className="ml-3 flex flex-col items-end gap-1">
          <span
            className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              hasCards
                ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-600'
            }`}
          >
            {cardCount}
          </span>

          {hasDueCards && (
            <span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium bg-indigo-600 dark:bg-indigo-500 text-white">
              {dueCount} due
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
