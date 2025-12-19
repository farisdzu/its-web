import { ArrowUpIcon, ArrowDownIcon } from "../../icons";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export default function MetricCard({
  title,
  value,
  icon,
  trend,
  className = "",
}: MetricCardProps) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 transition-shadow hover:shadow-sm ${className}`}
    >
      {/* Icon - Circular */}
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 mb-3">
        <span className="text-gray-600 dark:text-gray-400">{icon}</span>
      </div>

      {/* Title */}
      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            {title}
      </p>

      {/* Value and Trend */}
      <div className="flex items-center justify-between">
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums leading-none">
          {value}
        </h3>
        {trend && (
          <div
            className={`flex items-center gap-0.5 rounded-md px-2 py-1 text-[10px] font-medium whitespace-nowrap ${
              trend.isPositive
                ? "bg-success-50 text-success-600 dark:bg-success-950/30 dark:text-success-500"
                : "bg-error-50 text-error-600 dark:bg-error-950/30 dark:text-error-500"
            }`}
          >
            {trend.isPositive ? (
              <ArrowUpIcon className="w-2.5 h-2.5" />
            ) : (
              <ArrowDownIcon className="w-2.5 h-2.5" />
            )}
            <span>{Math.abs(trend.value).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
