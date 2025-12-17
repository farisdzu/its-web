// Skeleton loading component for Users page - optimized for fast initial render
export function UserSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {/* Generate 5 skeleton cards */}
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Status dot */}
              <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
              
              {/* User info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {/* Name */}
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                  {/* Badge */}
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                </div>
                
                {/* Email and username */}
                <div className="space-y-1.5">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

