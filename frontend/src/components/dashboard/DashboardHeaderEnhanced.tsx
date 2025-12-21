import { ReactNode } from "react";
import Button from "../ui/button/Button";
import { PlusIcon } from "../../icons";

interface DashboardHeaderEnhancedProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  onAddNew?: () => void;
  className?: string;
}

export default function DashboardHeaderEnhanced({
  title,
  subtitle = "ITS (Integrated Task System)",
  icon,
  onAddNew,
  className = "",
}: DashboardHeaderEnhancedProps) {
  return (
    <header
      className={`rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/5 sm:p-6 ${className}`}
      role="banner"
    >
      {/* Top Section: Title & Actions */}
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Icon & Title */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-brand-500 dark:text-brand-400">
            {icon}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white sm:text-2xl">
              {title}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          {onAddNew && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAddNew}
              startIcon={<PlusIcon className="w-5 h-5 text-white fill-white" />}
            >
              Tambah Item
            </Button>
          )}
        </div>
      </div>

    </header>
  );
}

