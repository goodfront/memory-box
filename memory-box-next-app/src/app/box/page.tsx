import { BoxOverview } from '@/components/box';

export const metadata = {
  title: 'Box Overview - Memory Box',
  description: 'View all your memory cards organized by schedule',
};

export default function BoxPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Box Overview
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          View all your memory cards organized by their review schedules. Cards highlighted in blue are due for review today.
        </p>
      </div>

      {/* Box Overview Component */}
      <BoxOverview />
    </div>
  );
}
