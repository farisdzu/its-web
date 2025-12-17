// Skeleton loading component for Kanban Board - optimized for fast initial render
export function KanbanSkeleton() {
  return (
    <div className="w-full">
      <div className="overflow-x-auto pb-4">
        <div className="inline-flex min-w-full gap-4">
          {/* Generate 4 skeleton columns */}
          {Array.from({ length: 4 }).map((_, colIndex) => (
            <div key={colIndex} className="w-80 shrink-0">
              <div className="flex h-full min-h-[600px] flex-col rounded-lg border-2 border-gray-200 bg-gray-50 p-4 animate-pulse dark:border-gray-700 dark:bg-gray-800/50">
                {/* Column Header Skeleton */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-gray-300 dark:bg-gray-600" />
                    <div className="h-5 w-16 rounded bg-gray-300 dark:bg-gray-600" />
                    <div className="h-5 w-6 rounded-full bg-gray-300 dark:bg-gray-600" />
                  </div>
                  <div className="h-7 w-7 rounded-lg bg-gray-300 dark:bg-gray-600" />
                </div>

                {/* Task Cards Skeleton */}
                <div className="flex-1 space-y-3">
                  {Array.from({ length: 3 }).map((_, cardIndex) => (
                    <div
                      key={cardIndex}
                      className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                    >
                      {/* Title */}
                      <div className="mb-3 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                      {/* Description */}
                      <div className="mb-3 space-y-1.5">
                        <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                      </div>
                      {/* Due Date */}
                      <div className="mb-3 flex items-center gap-1.5">
                        <div className="h-3.5 w-3.5 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                      </div>
                      {/* Progress & Priority */}
                      <div className="mb-3 flex items-center justify-between">
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
                      </div>
                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700" />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <div className="h-3.5 w-3.5 rounded bg-gray-200 dark:bg-gray-700" />
                          <div className="h-3.5 w-3.5 rounded bg-gray-200 dark:bg-gray-700" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

