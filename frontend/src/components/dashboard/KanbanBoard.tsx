import { useMemo } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
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
  onTaskDelete?: (task: TaskCardData) => void;
  onTaskMove?: (taskId: string | number, newStatus: TaskStatus) => void;
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
  onTaskDelete,
  onTaskMove,
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

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`w-full ${className}`}>
        {/* Horizontal Scroll Container */}
        <div className="overflow-x-auto pb-4">
          <div className="inline-flex min-w-full gap-4">
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
                  onTaskDelete={onTaskDelete}
                  onTaskMove={onTaskMove}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

