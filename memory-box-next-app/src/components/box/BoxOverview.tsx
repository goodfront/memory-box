'use client';

import { useEffect, useState } from 'react';
import type { Schedule } from '@/lib/types';
import { getAllScheduleTypes } from '@/lib/utils/scheduling';
import { getAllCards } from '@/lib/db/operations';
import { ScheduleView } from './ScheduleView';

interface ScheduleData {
  schedule: Schedule;
  cardCount: number;
  dueCount: number;
}

export function BoxOverview() {
  const [scheduleData, setScheduleData] = useState<ScheduleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get all cards
        const allCards = await getAllCards();

        // Get today's date at start of day for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all possible schedules
        const allSchedules = getAllScheduleTypes();

        // Count cards and due cards by schedule
        const scheduleMap = new Map<Schedule, { cardCount: number; dueCount: number }>();

        // Initialize all schedules with zero counts
        allSchedules.forEach(schedule => {
          scheduleMap.set(schedule, { cardCount: 0, dueCount: 0 });
        });

        // Count cards for each schedule
        allCards.forEach(card => {
          const data = scheduleMap.get(card.schedule);
          if (data) {
            data.cardCount++;

            // Check if card is due
            const nextReview = new Date(card.nextReview);
            nextReview.setHours(0, 0, 0, 0);
            if (nextReview <= today) {
              data.dueCount++;
            }
          }
        });

        // Convert map to array for rendering
        const data: ScheduleData[] = allSchedules.map(schedule => ({
          schedule,
          cardCount: scheduleMap.get(schedule)?.cardCount || 0,
          dueCount: scheduleMap.get(schedule)?.dueCount || 0,
        }));

        setScheduleData(data);
      } catch (err) {
        console.error('Error loading box data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load box data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">Loading box data...</p>
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

  const totalCards = scheduleData.reduce((sum, data) => sum + data.cardCount, 0);
  const totalDue = scheduleData.reduce((sum, data) => sum + data.dueCount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Cards</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{totalCards}</p>
        </div>
        <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 p-4">
          <p className="text-sm text-indigo-700 dark:text-indigo-300">Due Today</p>
          <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 mt-1">{totalDue}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 col-span-2 sm:col-span-1">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Schedules in Use</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
            {scheduleData.filter(d => d.cardCount > 0).length}
          </p>
        </div>
      </div>

      {/* Schedule Grid - Group by category */}
      <div className="space-y-6">
        {/* Daily, Even, Odd */}
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            Frequency Schedules
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scheduleData.slice(0, 3).map((data) => (
              <ScheduleView
                key={data.schedule}
                schedule={data.schedule}
                cardCount={data.cardCount}
                dueCount={data.dueCount}
              />
            ))}
          </div>
        </div>

        {/* Weekdays */}
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {scheduleData.slice(3, 10).map((data) => (
              <ScheduleView
                key={data.schedule}
                schedule={data.schedule}
                cardCount={data.cardCount}
                dueCount={data.dueCount}
              />
            ))}
          </div>
        </div>

        {/* Monthly Days */}
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {scheduleData.slice(10).map((data) => (
              <ScheduleView
                key={data.schedule}
                schedule={data.schedule}
                cardCount={data.cardCount}
                dueCount={data.dueCount}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
