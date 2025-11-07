export default function OfflinePage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
      <div className="mb-8">
        <svg
          className="mx-auto h-24 w-24 text-zinc-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
          />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
        You&apos;re Offline
      </h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
        It looks like you&apos;re not connected to the internet. Don&apos;t worry - Memory Box works offline!
      </p>
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6 text-left">
        <h2 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-3">
          What you can do offline:
        </h2>
        <ul className="space-y-2 text-indigo-700 dark:text-indigo-300">
          <li className="flex items-start">
            <svg className="h-6 w-6 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Review your memory cards</span>
          </li>
          <li className="flex items-start">
            <svg className="h-6 w-6 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Create new cards</span>
          </li>
          <li className="flex items-start">
            <svg className="h-6 w-6 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Edit existing cards</span>
          </li>
          <li className="flex items-start">
            <svg className="h-6 w-6 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Browse your box overview</span>
          </li>
        </ul>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-8">
        All your data is stored locally on your device. When you reconnect to the internet,
        everything will continue working seamlessly.
      </p>
    </div>
  );
}
