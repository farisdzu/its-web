import { useMemo } from "react";
import { DndProvider } from "react-dnd";
import { MultiBackend } from "react-dnd-multi-backend";
import { Preview } from "react-dnd-multi-backend";
import { HTML5DragTransition, TouchTransition } from "dnd-multi-backend";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import KanbanColumn, { TaskStatus } from "./KanbanColumn";
import { TaskCardData } from "./TaskCard";
import {
  TaskIcon,
  CheckCircleIcon,
  TimeIcon,
  GridIcon,
} from "../../icons";

interface KanbanBoardProps {
  tasks: TaskCardData[];
  onAddTask?: (status: TaskStatus) => void;
  onTaskClick?: (task: TaskCardData) => void;
  onTaskEdit?: (task: TaskCardData) => void;
  onTaskDuplicate?: (task: TaskCardData) => void;
  onTaskDelete?: (task: TaskCardData) => void;
  onTaskMove?: (taskId: string | number, newStatus: TaskStatus) => void;
  onProgressUpdate?: (taskId: string | number, progress: number) => void;
  onRefresh?: () => void;
  className?: string;
}

const columns: Array<{
  status: TaskStatus;
  title: string;
  icon: React.ReactNode;
}> = [
  {
    status: "baru",
    title: "Baru",
    icon: <TaskIcon className="w-4 h-4" />,
  },
  {
    status: "proses",
    title: "Proses",
    icon: <TimeIcon className="w-4 h-4" />,
  },
  {
    status: "review",
    title: "Review",
    icon: <GridIcon className="w-4 h-4" />,
  },
  {
    status: "selesai",
    title: "Selesai",
    icon: <CheckCircleIcon className="w-4 h-4" />,
  },
];

export default function KanbanBoard({
  tasks,
  onAddTask,
  onTaskClick,
  onTaskEdit,
  onTaskDuplicate,
  onTaskDelete,
  onTaskMove,
  onProgressUpdate,
  onRefresh,
  className = "",
}: KanbanBoardProps) {
  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, TaskCardData[]> = {
      baru: [],
      proses: [],
      review: [],
      selesai: [],
    };

    tasks.forEach((task) => {
      const status = task.status as TaskStatus;
      if (status && status in grouped) {
        grouped[status].push(task);
      }
    });

    return grouped;
  }, [tasks]);

  // Configure multi-backend for both mouse and touch
  const backendOptions = useMemo(() => ({
    backends: [
      {
        id: 'html5',
        backend: HTML5Backend,
        transition: HTML5DragTransition,
      },
      {
        id: 'touch',
        backend: TouchBackend,
        options: { 
          enableMouseEvents: true, // Enable for hybrid devices
          enableKeyboardEvents: true,
          delay: 0,
          delayTouchStart: 0,
          touchSlop: 5,
          ignoreContextMenu: true,
          rootElement: typeof window !== 'undefined' ? document.body : undefined,
        },
        preview: true,
        transition: TouchTransition,
      },
    ],
  }), []);

  return (
    <DndProvider backend={MultiBackend} options={backendOptions}>
      <Preview>
        {({ item, style }) => {
          const dragItem = item as { id: string | number; status: TaskStatus };
          const task = tasks.find((t) => t.id === dragItem.id);
          
          if (!task) {
            // Return empty div instead of null
            return <div style={{ display: 'none' }} />;
          }
          
          return (
            <div
              style={{
                ...style,
                opacity: 0.95,
                transform: style.transform ? `${style.transform} rotate(2deg) scale(1.05)` : undefined,
                pointerEvents: 'none',
                zIndex: 9999,
                position: 'fixed',
              }}
              className="w-72 rounded-lg border-2 border-brand-500 bg-white p-3 shadow-2xl dark:bg-gray-800"
            >
              <div className="mb-2">
                <h4 className="text-sm font-medium text-gray-900 line-clamp-2 dark:text-white">
                  {task.title}
                </h4>
                {task.description && (
                  <p className="mt-1 text-xs text-gray-500 line-clamp-1 dark:text-gray-400">
                    {task.description}
                  </p>
                )}
              </div>
              {task.dueDate && (
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>{task.dueDate}</span>
                </div>
              )}
            </div>
          );
        }}
      </Preview>
      <div className={`w-full ${className}`}>
        {/* Horizontal Scroll Container */}
        <div className="overflow-x-auto overflow-y-visible pb-4">
          <div className="inline-flex min-w-full gap-4 px-2">
            {columns.map((column) => (
              <div key={column.status} className="w-80 shrink-0">
                <KanbanColumn
                  status={column.status}
                  title={column.title}
                  icon={column.icon}
                  tasks={tasksByStatus[column.status] || []}
                  onAddTask={() => onAddTask?.(column.status)}
                  onTaskClick={onTaskClick}
                  onTaskEdit={onTaskEdit}
                  onTaskDuplicate={onTaskDuplicate}
                  onTaskDelete={onTaskDelete}
                  onTaskMove={onTaskMove}
                  onProgressUpdate={onProgressUpdate}
                  onRefresh={onRefresh}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

