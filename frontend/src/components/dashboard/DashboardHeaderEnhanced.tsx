import { ReactNode } from "react";
import Button from "../ui/button/Button";
import { PlusIcon, HorizontaLDots } from "../../icons";
import Input from "../form/input/InputField";

interface DashboardHeaderEnhancedProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  userName?: string;
  userRole?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onAddNew?: () => void;
  onShare?: () => void;
  onFilter?: () => void;
  className?: string;
}

export default function DashboardHeaderEnhanced({
  title,
  subtitle = "ITS (Integrated Task System)",
  icon,
  userName = "User",
  userRole = "user",
  searchValue = "",
  onSearchChange,
  onAddNew,
  onShare,
  onFilter,
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
          {onShare && (
            <Button
              variant="outline"
              size="sm"
              onClick={onShare}
              className="hidden sm:flex"
            >
              Share
            </Button>
          )}
          {onAddNew && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAddNew}
              className="flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Tugas</span>
              <span className="sm:hidden">Tambah</span>
            </Button>
          )}
        </div>
      </div>

      {/* Bottom Section: Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search Bar */}
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Cari tugas..."
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Filter Button */}
        {onFilter && (
          <Button
            variant="outline"
            size="sm"
            onClick={onFilter}
            className="shrink-0"
          >
            <HorizontaLDots className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Filter</span>
          </Button>
        )}
      </div>
    </header>
  );
}

