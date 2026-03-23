'use client';

import { useServiceWorkerUpdate } from '@/components/providers/ServiceWorkerUpdateProvider';
import { useState } from 'react';

export function UpdateNotification() {
  const { updateAvailable, updateAndReload } = useServiceWorkerUpdate();
  const [dismissed, setDismissed] = useState(false);

  if (!updateAvailable || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-indigo-600 text-white rounded-lg shadow-lg p-4 flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="font-medium">Update Available</p>
          <p className="text-sm text-indigo-100 mt-1">
            A new version is ready. Reload to update.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setDismissed(true)}
            className="px-3 py-1.5 text-sm font-medium text-indigo-100 hover:text-white transition-colors"
            aria-label="Dismiss update notification"
          >
            Later
          </button>
          <button
            onClick={updateAndReload}
            className="px-4 py-1.5 text-sm font-medium bg-white text-indigo-600 rounded hover:bg-indigo-50 transition-colors"
            aria-label="Reload to update"
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  );
}
