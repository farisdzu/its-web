import { useEffect, useState, useMemo } from "react";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  userName?: string;
  userRole?: string;
}

export default function DashboardHeader({
  title,
  subtitle = "ITS (Integrated Task System)",
  icon,
  userName = "User",
  userRole = "user",
}: DashboardHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedTime = useMemo(
    () =>
      currentTime.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    [currentTime]
  );

  const formattedDate = useMemo(
    () =>
      currentTime.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [currentTime]
  );

  return (
    <header
      className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/5 sm:p-6"
      role="banner"
      aria-label={`Dashboard header for ${title}`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left Section - Icon, Title, Subtitle */}
        <div className="flex items-start gap-4">
          {/* Icon - sama dengan icon di MetricCard */}
          <div
            className="flex items-center justify-center w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 text-brand-500 dark:text-brand-400 shrink-0"
            aria-hidden="true"
          >
            {icon}
          </div>

          {/* Title & Info */}
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white sm:text-2xl">
              {title}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">
              {subtitle}
            </p>
            <p className="mt-1 text-sm" aria-label={`Masuk sebagai ${userName} dengan role ${userRole}`}>
              <span className="text-gray-400 dark:text-gray-500">Login sebagai: </span>
              <span className="text-success-600 dark:text-success-400 font-medium">
                {userName} ({userRole})
              </span>
            </p>
          </div>
        </div>

        {/* Right Section - Status & Time */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* System Status - background sama dengan card statistik */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-800"
            role="status"
            aria-live="polite"
            aria-label="System status: Online, all services running"
          >
            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success-500"></span>
            </span>
            <div className="text-left">
              <p className="text-sm font-medium text-success-600 dark:text-success-400">
                System Online
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">All Services Running</p>
            </div>
          </div>

          {/* Date & Time - background sama dengan card statistik */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-800"
            role="timer"
            aria-live="polite"
            aria-label={`Current time: ${formattedTime}, Date: ${formattedDate}`}
          >
            <div className="text-right">
              <time
                dateTime={currentTime.toISOString()}
                className="text-sm font-medium text-gray-800 dark:text-white tabular-nums block"
              >
                {formattedTime}
              </time>
              <time
                dateTime={currentTime.toISOString()}
                className="text-xs text-gray-500 dark:text-gray-400 block"
              >
                {formattedDate}
              </time>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
