import { memo, useRef, useState, useRef as useRefAlias, useEffect } from "react";
import { createPortal } from "react-dom";
import { useDrag } from "react-dnd";
import Badge from "../ui/badge/Badge";
import { CalenderIcon, UserIcon, FileIcon, PencilIcon, PaperPlaneIcon, CopyIcon } from "../../icons";
import TaskAttachmentsModal from "./TaskAttachmentsModal";
import TaskDetailModal from "./TaskDetailModal";

export type TaskType = "tugas" | "agenda";
export type TaskPriority = "tinggi" | "sedang" | "rendah";
export type TaskStatus = "baru" | "proses" | "review" | "selesai";

export interface TaskCardData {
  id: string | number;
  type: TaskType; // NEW: tugas or agenda
  title: string;
  description?: string;
  dueDate?: string; // For tugas: deadline, for agenda: date
  startTime?: string; // NEW: For agenda (format: "HH:mm")
  endTime?: string; // NEW: For agenda (format: "HH:mm")
  meetingLink?: string; // NEW: For agenda
  progress?: number; // 0-100, only for tugas
  priority: TaskPriority; // Only for tugas
  status: TaskStatus; // Only for tugas
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
  onDuplicate?: (task: TaskCardData) => void;
  onDelete?: (task: TaskCardData) => void;
  onProgressUpdate?: (taskId: string | number, progress: number, immediate?: boolean) => void;
  onRefresh?: () => void; // Callback untuk refresh task list
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

// Circular Progress Component - lebih kecil dan clean dengan modern popover edit
export function CircularProgress({ 
  progress = 0, 
  size = 28,
  onProgressUpdate,
  taskId,
  status,
}: { 
  progress: number; 
  size?: number;
  onProgressUpdate?: (taskId: string | number, progress: number, immediate?: boolean) => void;
  taskId?: string | number;
  status?: TaskStatus;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempProgress, setTempProgress] = useState(progress);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0, arrowLeft: 0 });
  const popoverRef = useRefAlias<HTMLDivElement>(null);
  const triggerRef = useRefAlias<HTMLDivElement>(null);
  
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  
  const getColor = () => {
    if (progress === 100) return "text-success-500";
    if (progress >= 50) return "text-brand-500";
    return "text-warning-500";
  };

  // Sync tempProgress when progress changes externally
  useEffect(() => {
    setTempProgress(progress);
  }, [progress]);

  // Handle click outside - use setTimeout to avoid immediate closing
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Don't close if clicking inside popover
      if (popoverRef.current?.contains(target)) {
        return;
      }
      
      // Don't close if clicking on trigger (circular progress)
      if (triggerRef.current?.contains(target)) {
        return;
      }
      
      // Close if clicking anywhere else
      setIsOpen(false);
    };

    // Use setTimeout to allow click events to complete first
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside, true);
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [isOpen]);

  // Only allow progress edit if task is in "proses" status
  const canEditProgress = status === "proses";

  const handleClick = (e: React.MouseEvent) => {
    if (!canEditProgress) {
      // Don't allow editing if not in "proses" status
      return;
    }

    if (onProgressUpdate && taskId) {
      e.stopPropagation();
      e.preventDefault();
      
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const popoverWidth = 224; // w-56 = 224px
        const popoverHeight = 120; // Approximate height
        const margin = 8; // Space between trigger and popover
        const viewportPadding = 16; // Padding from viewport edges
        
        // Calculate initial popover position (centered above trigger)
        let popoverLeft = rect.left + (rect.width / 2) - (popoverWidth / 2);
        let popoverTop = rect.top - popoverHeight - margin;
        
        // Adjust if popover goes outside viewport horizontally
        if (popoverLeft < viewportPadding) {
          popoverLeft = viewportPadding;
        } else if (popoverLeft + popoverWidth > window.innerWidth - viewportPadding) {
          popoverLeft = window.innerWidth - popoverWidth - viewportPadding;
        }
        
        // Adjust if popover goes outside viewport vertically (top)
        if (popoverTop < viewportPadding) {
          // If not enough space above, show below trigger
          popoverTop = rect.bottom + margin;
        }
        
        // Calculate arrow position (center of popover, pointing to trigger center)
        const triggerCenterX = rect.left + (rect.width / 2);
        const arrowLeft = triggerCenterX - popoverLeft;
        
        setPopoverPosition({
          top: popoverTop,
          left: popoverLeft,
          arrowLeft: Math.max(16, Math.min(arrowLeft, popoverWidth - 16)), // Clamp between 16px and width-16px
        });
      }
      
      setIsOpen((prev) => !prev);
      setTempProgress(progress);
    }
  };

  const handlePreset = (e: React.MouseEvent, value: number) => {
    e.stopPropagation();
    e.preventDefault();
    if (onProgressUpdate && taskId) {
      onProgressUpdate(taskId, value, true); // Immediate save for preset buttons
    }
    setIsOpen(false);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const value = Number(e.target.value);
    setTempProgress(value);
    // Update will be debounced in parent component
    if (onProgressUpdate && taskId) {
      onProgressUpdate(taskId, value);
    }
  };

  const presetValues = [0, 25, 50, 75, 100];

  return (
    <div className="relative inline-flex items-center justify-center">
      <div
        ref={triggerRef}
        className={`relative inline-flex items-center justify-center transition-opacity group ${
          canEditProgress 
            ? "cursor-pointer hover:opacity-80" 
            : "cursor-default opacity-60"
        }`}
        style={{ width: size, height: size }}
        onClick={handleClick}
        title={canEditProgress ? "Klik untuk mengubah progress" : "Progress hanya bisa diubah saat task di section Proses"}
      >
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
        {/* Hover indicator - only show if can edit */}
        {canEditProgress && (
          <div className="absolute inset-0 rounded-full bg-brand-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>

      {/* Simple Popover - Using Portal to avoid clipping */}
      {isOpen && createPortal(
        <>
          {/* Invisible backdrop to catch outside clicks */}
          <div
            className="fixed inset-0 z-99 bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
          <div
            ref={popoverRef}
            className="fixed z-100 w-56 p-3 rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
            style={{
              top: `${popoverPosition.top}px`,
              left: `${popoverPosition.left}px`,
              animation: 'fadeIn 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Arrow pointer pointing down to trigger */}
            <div 
              className="absolute bottom-0 translate-y-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-200 dark:border-t-gray-700"
              style={{ left: `${popoverPosition.arrowLeft}px`, transform: 'translateY(100%) translateX(-50%)', marginLeft: '-6px' }}
            />
            <div 
              className="absolute bottom-0 translate-y-full w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-white dark:border-t-gray-800"
              style={{ left: `${popoverPosition.arrowLeft}px`, transform: 'translateY(100%) translateX(-50%)', marginLeft: '-5px', marginBottom: '1px' }}
            />
          {/* Slider dengan persentase */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {tempProgress}%
              </span>
            </div>
            <div className="relative">
              <div 
                className="absolute top-0 left-0 h-1.5 rounded-full bg-brand-500 transition-all duration-150"
                style={{ width: `${tempProgress}%` }}
              />
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={tempProgress}
                onChange={handleSliderChange}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer dark:bg-gray-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-brand-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-sm [&::-moz-range-thumb]:cursor-pointer"
              />
            </div>
          </div>

          {/* Preset Buttons - Compact */}
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            {presetValues.map((value) => (
              <button
                key={value}
                onClick={(e) => handlePreset(e, value)}
                onMouseDown={(e) => e.stopPropagation()}
                className={`flex-1 px-1.5 py-1.5 rounded-md text-[10px] font-medium transition-all min-w-0 ${
                  progress === value
                    ? "bg-brand-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
                }`}
              >
                {value}%
              </button>
            ))}
          </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

export const TaskCard = memo(function TaskCard({
  task,
  onClick: _onClick, // Keep for compatibility but don't use (we use detail modal instead)
  onEdit,
  onDuplicate,
  onDelete: _onDelete,
  onProgressUpdate,
  onRefresh,
}: TaskCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Drag & Drop - Only for Tugas (Agenda tidak bisa di-drag)
  const [{ isDragging }, drag, preview] = useDrag({
    type: "task",
    item: () => {
      isDraggingRef.current = true;
      return { id: task.id, status: task.status };
    },
    canDrag: task.type === "tugas", // Only tugas can be dragged
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: () => {
      // Delay reset to prevent click after drag
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 100);
    },
  });

  // Use default preview (will be overridden by Preview component in KanbanBoard)
  useEffect(() => {
    preview(null);
  }, [preview]);

  // Attach drag ref to card element
  drag(cardRef);

  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger onClick if dragging
    if (isDraggingRef.current || isDragging) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // Open detail modal when card is clicked
    setShowDetailModal(true);
    // Don't call onClick callback to prevent triggering edit modal
    // onClick?.(task);
  };

  // onEdit and onDelete are kept in props for future use but currently not implemented in UI

  // Only render for Tugas (Agenda should use AgendaList)
  if (task.type === "agenda") {
    return null; // Agenda tidak ditampilkan di TaskCard
  }

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      className={`group relative cursor-move rounded-lg border border-gray-200 bg-white p-3 transition-all duration-200 hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 ${
        isDragging ? "opacity-20" : ""
      }`}
      style={{
        touchAction: 'none', // Prevent scrolling while dragging on mobile - this is enough, no need preventDefault
        userSelect: 'none', // Prevent text selection during drag
        WebkitUserSelect: 'none', // Safari
        MozUserSelect: 'none', // Firefox
        WebkitTouchCallout: 'none', // Disable iOS callout
        WebkitTapHighlightColor: 'transparent', // Remove tap highlight
        pointerEvents: isDragging ? 'none' : 'auto', // Disable pointer events when dragging to allow drop detection
      }}
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}`}
    >
      {/* Action Buttons - Show on hover */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {onDuplicate && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(task);
            }}
            className="p-1.5 rounded-md bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-500 dark:hover:text-brand-400 shadow-sm"
            title="Salin task"
            aria-label="Salin task"
          >
            <CopyIcon className="w-3.5 h-3.5" />
          </button>
        )}
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
            className="p-1.5 rounded-md bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-500 dark:hover:text-brand-400 shadow-sm"
          title="Edit task"
          aria-label="Edit task"
        >
          <PencilIcon className="w-3.5 h-3.5" />
        </button>
      )}
      </div>

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
          <CircularProgress 
            progress={task.progress} 
            size={28}
            onProgressUpdate={onProgressUpdate}
            taskId={task.id}
            status={task.status}
          />
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

          {/* Links & Attachments - Enhanced Badges */}
          {(task.linksCount !== undefined && task.linksCount > 0) ||
          (task.attachmentsCount !== undefined && task.attachmentsCount > 0) ? (
            <div className="flex items-center gap-1">
              {task.linksCount !== undefined && task.linksCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAttachmentsModal(true);
                  }}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-brand-50 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-500/30 hover:bg-brand-100 dark:hover:bg-brand-500/30 transition-colors cursor-pointer"
                  title={`${task.linksCount} link${task.linksCount > 1 ? 's' : ''} - Klik untuk melihat`}
                >
                  <PaperPlaneIcon className="w-3 h-3 shrink-0" />
                  <span className="text-[10px] font-medium">{task.linksCount}</span>
                </button>
              )}
              {task.attachmentsCount !== undefined && task.attachmentsCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAttachmentsModal(true);
                  }}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                  title={`${task.attachmentsCount} file${task.attachmentsCount > 1 ? 's' : ''} - Klik untuk melihat`}
                >
                  <FileIcon className="w-3 h-3 shrink-0" />
                  <span className="text-[10px] font-medium">{task.attachmentsCount}</span>
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Attachments Modal */}
      <TaskAttachmentsModal
        isOpen={showAttachmentsModal}
        onClose={() => setShowAttachmentsModal(false)}
        taskId={Number(task.id)}
        taskTitle={task.title}
        onAttachmentDeleted={() => {
          // Refresh task list to update counts
          onRefresh?.();
        }}
      />

      {/* Detail Modal */}
      <TaskDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        task={task}
        onEdit={(task) => {
          setShowDetailModal(false);
          onEdit?.(task);
        }}
        onDelete={_onDelete}
        onProgressUpdate={onProgressUpdate}
        onRefresh={onRefresh}
      />
    </div>
  );
});

