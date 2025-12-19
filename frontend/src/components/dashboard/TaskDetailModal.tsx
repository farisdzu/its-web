import { useState, useEffect, useCallback } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import { 
  CalenderIcon, 
  UserIcon, 
  FileIcon, 
  PaperPlaneIcon, 
  PencilIcon, 
  CloseIcon,
  DownloadIcon,
  ArrowRightIcon
} from "../../icons";
import { taskApi, taskAttachmentApi, TaskAttachment, TaskDetailData, TaskCardData } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import TaskAttachmentSection from "./TaskAttachmentSection";
import { CircularProgress, TaskStatus, TaskPriority } from "./TaskCard";

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskCardData | null;
  onEdit?: (task: TaskCardData) => void;
  onDelete?: (task: TaskCardData) => void;
  onProgressUpdate?: (taskId: string | number, progress: number) => void;
  onRefresh?: () => void;
}

const priorityColors: Record<TaskPriority, "error" | "warning" | "success" | "info"> = {
  tinggi: "error",
  sedang: "warning",
  rendah: "success",
};

const priorityLabels: Record<TaskPriority, string> = {
  tinggi: "Tinggi",
  sedang: "Sedang",
  rendah: "Rendah",
};

const statusLabels: Record<TaskStatus, string> = {
  baru: "Baru",
  proses: "Proses",
  review: "Review",
  selesai: "Selesai",
};

export default function TaskDetailModal({
  isOpen,
  onClose,
  task,
  onEdit,
  onDelete,
  onProgressUpdate,
  onRefresh,
}: TaskDetailModalProps) {
  const { showSuccess, showError } = useToast();
  const [taskDetail, setTaskDetail] = useState<TaskDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);

  useEffect(() => {
    if (isOpen && task) {
      loadTaskDetail();
    } else {
      setTaskDetail(null);
      setAttachments([]);
    }
  }, [isOpen, task]);

  const loadTaskDetail = async () => {
    if (!task) return;
    
    setLoading(true);
    try {
      const res = await taskApi.show(Number(task.id));
      if (res.success && res.data) {
        const detail = res.data as TaskDetailData;
        setTaskDetail(detail);
        setAttachments(detail.attachments || []);
      }
    } catch (error: any) {
      console.error(error);
      showError(error.response?.data?.message || "Gagal memuat detail task.");
    } finally {
      setLoading(false);
    }
  };

  const handleAttachmentAdded = useCallback((attachment: TaskAttachment) => {
    setAttachments((prev) => [...prev, attachment]);
    onRefresh?.();
  }, [onRefresh]);

  const handleAttachmentDeleted = useCallback((attachmentId: number) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    onRefresh?.();
  }, [onRefresh]);

  const handleProgressUpdate = async (newProgress: number) => {
    if (!task) return;
    
    try {
      await taskApi.update(Number(task.id), { progress: newProgress });
      if (taskDetail) {
        setTaskDetail({ ...taskDetail, progress: newProgress });
      }
      onProgressUpdate?.(Number(task.id), newProgress);
      showSuccess("Progress berhasil diperbarui.");
    } catch (error: any) {
      showError(error.response?.data?.message || "Gagal memperbarui progress.");
    }
  };

  const handleDelete = () => {
    if (!task || !onDelete) return;
    
    if (confirm("Apakah Anda yakin ingin menghapus task ini?")) {
      onDelete(task);
      onClose();
    }
  };

  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-[95vw] sm:max-w-[600px] md:max-w-[700px] my-auto">
      <div className="relative w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
          </div>
        ) : taskDetail ? (
          <div className="p-5 sm:p-6">
            {/* Header */}
            <div className="mb-5">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {taskDetail.title}
              </h3>
              {taskDetail.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap mb-3">
                  {taskDetail.description}
                </p>
              )}

              {/* Status & Priority Badges */}
              <div className="flex items-center gap-2">
                <Badge size="sm" color={priorityColors[taskDetail.priority]}>
                  {priorityLabels[taskDetail.priority]}
                </Badge>
                <Badge size="sm" color="info">
                  {statusLabels[taskDetail.status]}
                </Badge>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {/* Due Date */}
              {taskDetail.dueDate && (
                <div className="flex items-center gap-2.5 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                    <CalenderIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5 uppercase">
                      Deadline
                    </p>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                      {taskDetail.dueDate}
                    </p>
                  </div>
                </div>
              )}

              {/* Progress */}
              <div className="flex items-center gap-2.5 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="shrink-0">
                  <CircularProgress 
                    progress={taskDetail.progress || 0} 
                    size={40}
                    onProgressUpdate={handleProgressUpdate}
                    taskId={taskDetail.id}
                    status={taskDetail.status}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5 uppercase">
                    Progress
                  </p>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">
                    {taskDetail.progress || 0}%
                  </p>
                </div>
              </div>

              {/* Assigned Users */}
              <div className="flex items-start gap-2.5 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase">
                    Assigned To
                  </p>
                  {taskDetail.assignedUsers && taskDetail.assignedUsers.length > 0 ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {taskDetail.assignedUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                        >
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center text-white text-[10px] font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">
                            {user.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Tidak ada assignee
                    </p>
                  )}
                </div>
              </div>

              {/* Attachments Count */}
              <div className="flex items-center gap-2.5 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 shrink-0">
                  <FileIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase">
                    Attachments
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {taskDetail.linksCount !== undefined && taskDetail.linksCount > 0 && (
                      <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1">
                        <PaperPlaneIcon className="w-3 h-3" />
                        {taskDetail.linksCount}
                      </span>
                    )}
                    {taskDetail.attachmentsCount !== undefined && taskDetail.attachmentsCount > 0 && (
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <FileIcon className="w-3 h-3" />
                        {taskDetail.attachmentsCount}
                      </span>
                    )}
                    {(!taskDetail.linksCount || taskDetail.linksCount === 0) && 
                     (!taskDetail.attachmentsCount || taskDetail.attachmentsCount === 0) && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        -
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Attachments Section */}
            <div className="mb-5 pt-5 border-t border-gray-200 dark:border-gray-700">
              <TaskAttachmentSection
                taskId={Number(task.id)}
                attachments={attachments}
                onAttachmentAdded={handleAttachmentAdded}
                onAttachmentDeleted={handleAttachmentDeleted}
              />
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="text-error-600 dark:text-error-400 border-error-200 dark:border-error-800 hover:bg-error-50 dark:hover:bg-error-900/20"
                >
                  Hapus
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onEdit(task);
                  }}
                >
                  Edit
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gagal memuat detail task
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

