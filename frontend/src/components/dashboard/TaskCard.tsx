import { memo, useRef } from "react";
import { useDrag } from "react-dnd";
import Badge from "../ui/badge/Badge";
import { CalenderIcon, UserIcon, FileIcon, DocsIcon } from "../../icons";

export type TaskPriority = "tinggi" | "sedang" | "rendah";
export type TaskStatus = "baru" | "proses" | "review" | "selesai";

export interface TaskCardData {
  id: string | number;
  title: string;
  description?: string;
  dueDate?: string;
  progress?: number; // 0-100
  priority: TaskPriority;
  status: TaskStatus; // Add status for Kanban grouping
  assignedUsers?: Array<{
    id: number;
    name: string;
    avatar?: string;
  }>;
  linksCount?: number;
  attachmentsCount?: number;
  createdAt?: string;
  assignedBy?: string;
  createdBy?: number; // User ID who created this task
  assignedTo?: number; // User ID who is assigned to this task
}

interface TaskCardProps {
  task: TaskCardData;
  onClick?: (task: TaskCardData) => void;
  onEdit?: (task: TaskCardData) => void;
  onDelete?: (task: TaskCardData) => void;
}

const priorityColors: Record<TaskPriority, "error" | "warning" | "success"> = {
  tinggi: "error",
  sedang: "warning",
  rendah: "success",
};

const priorityLabels: Record<TaskPriority, string> = {
  tinggi: "Tinggi",
  sedang: "Sedang",
  rendah: "Rendah",
};

// Circular Progress Component - lebih kecil dan clean
function CircularProgress({ progress = 0, size = 28 }: { progress: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  
  const getColor = () => {
    if (progress === 100) return "text-success-500";
    if (progress >= 50) return "text-brand-500";
    return "text-warning-500";
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-300 ${getColor()}`}
        />
      </svg>
      {/* Percentage text */}
      <span className={`absolute text-[10px] font-medium ${getColor()}`}>
        {progress}%
      </span>
    </div>
  );
}

export const TaskCard = memo(function TaskCard({
  task,
  onClick,
  onEdit: _onEdit,
  onDelete: _onDelete,
}: TaskCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Drag & Drop
  const [{ isDragging }, drag] = useDrag({
    type: "task",
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Attach drag ref to card element
  drag(cardRef);

  const handleClick = () => {
    onClick?.(task);
  };

  // onEdit and onDelete are kept in props for future use but currently not implemented in UI

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      className={`group cursor-move rounded-lg border border-gray-200 bg-white p-3 transition-all hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 ${
        isDragging ? "opacity-50" : ""
      }`}
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}`}
    >
      {/* Title & Description */}
      <div className="mb-2.5">
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 dark:text-white">
          {task.title}
        </h4>
        {task.description && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2 dark:text-gray-400">
            {task.description}
          </p>
        )}
      </div>

      {/* Due Date & Progress Row */}
      <div className="mb-2.5 flex items-center justify-between">
        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <CalenderIcon className="w-3 h-3 shrink-0" />
            <span>{task.dueDate}</span>
          </div>
        )}
        {task.progress !== undefined && (
          <CircularProgress progress={task.progress} size={28} />
        )}
      </div>

      {/* Footer: Priority, Users, Links */}
      <div className="flex items-center justify-between gap-2">
        {/* Priority Badge */}
        <Badge size="sm" color={priorityColors[task.priority]}>
          {priorityLabels[task.priority]}
        </Badge>

        {/* Right Side: Users & Attachments */}
        <div className="flex items-center gap-2">
          {/* Assigned Users */}
          {task.assignedUsers && task.assignedUsers.length > 0 ? (
            <div className="flex items-center -space-x-1.5">
              {task.assignedUsers.slice(0, 3).map((user, index) => (
                <div
                  key={user.id}
                  className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-white bg-brand-500 text-[10px] font-semibold text-white shadow-sm dark:border-gray-800"
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
              {task.assignedUsers.length > 3 && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-[10px] font-medium text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  +{task.assignedUsers.length - 3}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-white bg-gray-100 dark:border-gray-800 dark:bg-gray-700">
              <UserIcon className="w-3 h-3 text-gray-400" />
            </div>
          )}

          {/* Links & Attachments */}
          {(task.linksCount !== undefined && task.linksCount > 0) ||
          (task.attachmentsCount !== undefined && task.attachmentsCount > 0) ? (
            <div className="flex items-center gap-1.5">
              {task.linksCount !== undefined && task.linksCount > 0 && (
                <div className="flex items-center gap-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                  <FileIcon className="w-3 h-3" />
                  <span>{task.linksCount}</span>
                </div>
              )}
              {task.attachmentsCount !== undefined && task.attachmentsCount > 0 && (
                <div className="flex items-center gap-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                  <DocsIcon className="w-3 h-3" />
                  <span>{task.attachmentsCount}</span>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
});

