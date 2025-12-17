// Skeleton loading component for better LCP - optimized for fast initial render
export function TreeSkeleton() {
  return (
    <div className="space-y-1.5 sm:space-y-1.5 animate-pulse">
      {/* Root level skeleton - simplified for faster render */}
      <div className="flex items-start">
        <div className="w-6 h-6 shrink-0" />
        <div className="flex-1 ml-1 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
              <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1.5" />
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-14" />
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            </div>
          </div>
        </div>
      </div>

      {/* Level 2 skeleton */}
      <div className="flex items-start ml-7">
        <div className="w-6 h-6 shrink-0" />
        <div className="flex-1 ml-1 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
              <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-1.5" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8" />
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-14" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-14" />
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            </div>
          </div>
        </div>
      </div>

      {/* Level 3 skeleton */}
      <div className="flex items-start ml-14">
        <div className="w-6 h-6 shrink-0" />
        <div className="flex-1 ml-1 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
              <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1.5" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8" />
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-14" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-14" />
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

