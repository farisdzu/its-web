import { ReactNode, useRef } from "react";
import { useDrop } from "react-dnd";
import { PlusIcon } from "../../icons";
import { TaskCard, TaskCardData } from "./TaskCard";

export type TaskStatus = "baru" | "proses" | "review" | "selesai";

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  icon?: ReactNode;
  tasks: TaskCardData[];
  onAddTask?: () => void;
  onTaskClick?: (task: TaskCardData) => void;
  onTaskEdit?: (task: TaskCardData) => void;
  onTaskDelete?: (task: TaskCardData) => void;
  onTaskMove?: (taskId: string | number, newStatus: TaskStatus) => void;
  onProgressUpdate?: (taskId: string | number, progress: number) => void;
  onRefresh?: () => void;
  className?: string;
}

const statusColors: Record<TaskStatus, string> = {
  baru: "border-blue-light-100 bg-blue-light-50/50 dark:border-blue-light-800/50 dark:bg-blue-light-950/10",
  proses: "border-warning-100 bg-warning-50/50 dark:border-warning-800/50 dark:bg-warning-950/10",
  review: "border-brand-100 bg-brand-50/50 dark:border-brand-800/50 dark:bg-brand-950/10",
  selesai: "border-success-100 bg-success-50/50 dark:border-success-800/50 dark:bg-success-950/10",
};

const statusIconColors: Record<TaskStatus, string> = {
  baru: "text-blue-light-600 dark:text-blue-light-400",
  proses: "text-warning-600 dark:text-warning-400",
  review: "text-brand-600 dark:text-brand-400",
  selesai: "text-success-600 dark:text-success-400",
};

export default function KanbanColumn({
  status,
  title,
  icon,
  tasks,
  onAddTask,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
  onTaskMove,
  onProgressUpdate,
  onRefresh,
  className = "",
}: KanbanColumnProps) {
  const columnRef = useRef<HTMLDivElement>(null);

  // Drop zone for drag & drop
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "task",
    drop: (item: { id: string | number; status: TaskStatus }) => {
      // Only move if dropped in this column and status is different
      if (item.status !== status && onTaskMove) {
        onTaskMove(item.id, status);
        return { dropped: true, status };
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Attach drop ref to column element
  drop(columnRef);

  return (
    <div
      ref={columnRef}
      className={`flex h-full min-h-[500px] flex-col rounded-xl border ${statusColors[status]} bg-white/50 p-3 transition-all duration-300 dark:bg-gray-800/30 ${
        isOver && canDrop 
          ? "border-brand-400 bg-brand-50/90 dark:border-brand-500 dark:bg-brand-950/40 scale-[1.01] shadow-md ring-2 ring-brand-200 dark:ring-brand-800" 
          : ""
      } ${className}`}
      style={{
        touchAction: 'none', // Allow drag and drop on mobile
      }}
    >
      {/* Column Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className={`${statusIconColors[status]}`}>{icon}</span>}
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</h3>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            {tasks.length}
          </span>
        </div>
        {onAddTask && (
          <button
            onClick={onAddTask}
            className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label={`Add task to ${title}`}
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tasks List */}
      <div className="flex-1 space-y-2.5  overflow-y-auto overflow-x-visible min-h-[200px]">
        {tasks.length === 0 ? (
          <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-400 dark:text-gray-500">Tidak ada tugas</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={onTaskClick}
              onEdit={onTaskEdit}
              onDelete={onTaskDelete}
              onProgressUpdate={onProgressUpdate}
              onRefresh={onRefresh}
            />
          ))
        )}
      </div>
    </div>
  );
}

