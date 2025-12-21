import { TaskCardData } from "./TaskCard";
import { CalenderIcon, TimeIcon, PaperPlaneIcon, FileIcon, UserIcon, PencilIcon, CopyIcon } from "../../icons";
import Badge from "../ui/badge/Badge";
import { useMemo } from "react";

interface AgendaListProps {
  agendas: TaskCardData[];
  onEdit?: (agenda: TaskCardData) => void;
  onDuplicate?: (agenda: TaskCardData) => void;
  onDelete?: (agenda: TaskCardData) => void;
  className?: string;
}

export default function AgendaList({
  agendas,
  onEdit,
  onDuplicate,
  onDelete,
  className = "",
}: AgendaListProps) {
  // Group agendas by date
  const agendasByDate = useMemo(() => {
    const grouped: Record<string, TaskCardData[]> = {};
    
    agendas.forEach((agenda) => {
      const date = agenda.dueDate || "Tanpa Tanggal";
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(agenda);
    });

    // Sort dates
    const sortedDates = Object.keys(grouped).sort((a, b) => {
      if (a === "Tanpa Tanggal") return 1;
      if (b === "Tanpa Tanggal") return -1;
      return new Date(a).getTime() - new Date(b).getTime();
    });

    return { grouped, sortedDates };
  }, [agendas]);

  if (agendas.length === 0) {
    return (
      <div className={`rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800 ${className}`}>
        <div className="flex flex-col items-center justify-center text-center">
          <CalenderIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Belum ada agenda
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Klik "Tambah Item" untuk membuat agenda baru
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {agendasByDate.sortedDates.map((date) => (
        <div key={date} className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <CalenderIcon className="w-4 h-4" />
            {date}
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {agendasByDate.grouped[date].map((agenda) => (
              <AgendaCard
                key={agenda.id}
                agenda={agenda}
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface AgendaCardProps {
  agenda: TaskCardData;
  onEdit?: (agenda: TaskCardData) => void;
  onDuplicate?: (agenda: TaskCardData) => void;
  onDelete?: (agenda: TaskCardData) => void;
}

function AgendaCard({ agenda, onEdit, onDuplicate, onDelete }: AgendaCardProps) {
  return (
    <div className="group relative rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800/50 dark:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all">
      {/* Action Buttons */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {onDuplicate && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(agenda);
            }}
            className="p-1.5 rounded-md bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-500 dark:hover:text-brand-400 shadow-sm"
            title="Salin agenda"
            aria-label="Salin agenda"
          >
            <CopyIcon className="w-3.5 h-3.5" />
          </button>
        )}
        {onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(agenda);
            }}
            className="p-1.5 rounded-md bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-500 dark:hover:text-brand-400 shadow-sm"
            title="Edit agenda"
            aria-label="Edit agenda"
          >
            <PencilIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Title & Description */}
      <div className="mb-3 pr-16">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
          {agenda.title}
        </h4>
        {agenda.description && (
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
            {agenda.description}
          </p>
        )}
      </div>

      {/* Time */}
      {agenda.startTime && (
        <div className="mb-3 flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400">
          <TimeIcon className="w-3.5 h-3.5 shrink-0" />
          <span className="font-medium">
            {agenda.startTime}
          </span>
        </div>
      )}

      {/* Meeting Link */}
      {agenda.meetingLink && (
        <div className="mb-3">
          <a
            href={agenda.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-xs font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            <PaperPlaneIcon className="w-3 h-3" />
            Join Meeting
          </a>
        </div>
      )}

      {/* Footer: Users & Attachments */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-blue-200 dark:border-blue-800">
        {/* Assigned Users */}
        <div className="flex items-center">
          {agenda.assignedUsers && agenda.assignedUsers.length > 0 ? (
            <div className="flex items-center -space-x-1.5">
              {agenda.assignedUsers.slice(0, 3).map((user, index) => (
                <div
                  key={user.id}
                  className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-white bg-blue-500 text-[10px] font-semibold text-white shadow-sm dark:border-gray-800"
                  style={{ zIndex: 10 - index }}
                  title={user.name}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
              ))}
              {agenda.assignedUsers.length > 3 && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-[10px] font-medium text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  +{agenda.assignedUsers.length - 3}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-white bg-gray-100 dark:border-gray-800 dark:bg-gray-700">
              <UserIcon className="w-3 h-3 text-gray-400" />
            </div>
          )}
        </div>

        {/* Attachments */}
        {(agenda.linksCount !== undefined && agenda.linksCount > 0) ||
        (agenda.attachmentsCount !== undefined && agenda.attachmentsCount > 0) ? (
          <div className="flex items-center gap-1">
            {agenda.linksCount !== undefined && agenda.linksCount > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                <PaperPlaneIcon className="w-3 h-3 shrink-0" />
                <span className="text-[10px] font-medium">{agenda.linksCount}</span>
              </div>
            )}
            {agenda.attachmentsCount !== undefined && agenda.attachmentsCount > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                <FileIcon className="w-3 h-3 shrink-0" />
                <span className="text-[10px] font-medium">{agenda.attachmentsCount}</span>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

