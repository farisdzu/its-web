import { useState } from "react";
import { ChevronDownIcon } from "../../icons";
import Button from "../ui/button/Button";
import { FormField } from "../form";
import SelectField from "../form/input/SelectField";
import Checkbox from "../form/input/Checkbox";

export type FilterStatus = "all" | "baru" | "proses" | "review" | "selesai";
export type FilterPriority = "all" | "tinggi" | "sedang" | "rendah";
export type FilterType = "all" | "assigned_to_me" | "created_by_me";

export interface TaskFilters {
  status: FilterStatus;
  priority: FilterPriority;
  type: FilterType;
  search: string;
}

interface TaskFilterProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  className?: string;
}

export default function TaskFilter({
  filters,
  onFiltersChange,
  className = "",
}: TaskFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: keyof TaskFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const activeFiltersCount = [
    filters.status !== "all",
    filters.priority !== "all",
    filters.type !== "all",
    filters.search.length > 0,
  ].filter(Boolean).length;

  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      {/* Search */}
      <div className="flex-1">
        <input
          type="text"
          placeholder="Cari tugas..."
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white/90 dark:placeholder-gray-500 dark:focus:border-brand-500"
        />
      </div>

      {/* Filter Dropdown */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="relative"
        >
          Filter
          {activeFiltersCount > 0 && (
            <span className="ml-2 rounded-full bg-brand-500 px-1.5 py-0.5 text-xs font-medium text-white">
              {activeFiltersCount}
            </span>
          )}
          <ChevronDownIcon className={`ml-2 w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </Button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            {/* Dropdown */}
            <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-theme-lg dark:border-gray-700 dark:bg-gray-800">
              <div className="space-y-4">
                {/* Status Filter */}
                <FormField label="Status" htmlFor="filter-status">
                  <SelectField
                    id="filter-status"
                    value={filters.status}
                    onChange={(e) => handleFilterChange("status", e.target.value)}
                  >
                    <option value="all">Semua Status</option>
                    <option value="baru">Baru</option>
                    <option value="proses">Proses</option>
                    <option value="review">Review</option>
                    <option value="selesai">Selesai</option>
                  </SelectField>
                </FormField>

                {/* Priority Filter */}
                <FormField label="Prioritas" htmlFor="filter-priority">
                  <SelectField
                    id="filter-priority"
                    value={filters.priority}
                    onChange={(e) => handleFilterChange("priority", e.target.value)}
                  >
                    <option value="all">Semua Prioritas</option>
                    <option value="tinggi">Tinggi</option>
                    <option value="sedang">Sedang</option>
                    <option value="rendah">Rendah</option>
                  </SelectField>
                </FormField>

                {/* Type Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tipe
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={filters.type === "all"}
                        onChange={() => handleFilterChange("type", "all")}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Semua</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={filters.type === "assigned_to_me"}
                        onChange={() => handleFilterChange("type", "assigned_to_me")}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Ditugaskan ke Saya</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={filters.type === "created_by_me"}
                        onChange={() => handleFilterChange("type", "created_by_me")}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Saya Buat</span>
                    </label>
                  </div>
                </div>

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onFiltersChange({
                        status: "all",
                        priority: "all",
                        type: "all",
                        search: "",
                      });
                    }}
                    className="w-full"
                  >
                    Reset Filter
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

