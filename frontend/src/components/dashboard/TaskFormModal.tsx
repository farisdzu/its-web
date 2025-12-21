import { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import TextArea from "../form/input/TextArea";
import FormField from "../form/FormField";
import Select from "../form/Select";
import DatePicker from "../form/date-picker";
import { useToast } from "../../context/ToastContext";
import { taskApi, CreateTaskPayload, TaskCardData, taskAttachmentApi, TaskAttachment, TaskDetailData } from "../../services/api";
import { TaskStatus, TaskPriority } from "./TaskCard";
import TaskAttachmentSection from "./TaskAttachmentSection";

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialStatus?: TaskStatus;
  initialTask?: TaskCardData | null;
  duplicateTaskData?: TaskDetailData | null;
}

export default function TaskFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialStatus,
  duplicateTaskData,
  initialTask,
}: TaskFormModalProps) {
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  
  const [form, setForm] = useState<CreateTaskPayload>({
    title: "",
    description: "",
    due_date: "",
    progress: 0,
    priority: "sedang",
    status: "baru",
    assigned_to: null,
    assignee_ids: [],
  });

  // Reset form when modal opens/closes or initialTask changes
  useEffect(() => {
    if (isOpen) {
      if (initialTask) {
        // Edit mode
        setForm({
          title: initialTask.title,
          description: initialTask.description || "",
          due_date: initialTask.dueDate 
            ? new Date(initialTask.dueDate).toISOString().split('T')[0]
            : "",
          progress: initialTask.progress || 0,
          priority: initialTask.priority,
          status: initialTask.status,
          assigned_to: initialTask.assignedTo || null,
          assignee_ids: initialTask.assignedUsers?.map(u => u.id) || [],
        });
        // Load attachments for edit mode
        loadAttachments(Number(initialTask.id));
      } else {
        // Create mode
        setForm({
          title: "",
          description: "",
          due_date: "",
          progress: 0,
          priority: "sedang",
          status: initialStatus || "baru",
          assigned_to: null,
          assignee_ids: [],
        });
        setAttachments([]);
      }
      setErrors({});
    }
  }, [isOpen, initialTask, initialStatus]);

  // Load attachments from task.show endpoint
  const loadAttachments = async (taskId: number) => {
    setLoadingAttachments(true);
    try {
      const res = await taskApi.show(taskId);
      if (res.success && res.data) {
        const taskData = res.data as TaskDetailData;
        setAttachments(taskData.attachments || []);
      } else {
        setAttachments([]);
      }
    } catch (error: any) {
      console.error(error);
      setAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleAttachmentAdded = async (attachment: TaskAttachment) => {
    // Reload attachments to ensure we have the latest data
    if (initialTask) {
      await loadAttachments(Number(initialTask.id));
    }
    onSuccess(); // Refresh task list to update counts
  };

  const handleAttachmentDeleted = async (attachmentId: number) => {
    // Reload attachments to ensure we have the latest data
    if (initialTask) {
      await loadAttachments(Number(initialTask.id));
    }
    onSuccess(); // Refresh task list to update counts
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.title.trim()) {
      newErrors.title = "Judul wajib diisi";
    }

    if (form.progress !== undefined && (form.progress < 0 || form.progress > 100)) {
      newErrors.progress = "Progress harus antara 0-100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Prepare payload - ensure correct data types
      const payload: CreateTaskPayload = {
        title: form.title.trim(),
        description: form.description?.trim() || undefined,
        due_date: form.due_date && form.due_date.trim() ? form.due_date : undefined,
        progress: form.progress ?? 0,
        priority: form.priority || "sedang",
        status: form.status || "baru",
        assigned_to: form.assigned_to || undefined,
        assignee_ids: form.assignee_ids && form.assignee_ids.length > 0 ? form.assignee_ids : undefined,
      };

      let response;
      if (initialTask) {
        // Update existing task
        response = await taskApi.update(Number(initialTask.id), payload);
      } else {
        // Create new task
        response = await taskApi.store(payload);
      }

      if (response.success && response.data) {
        showSuccess(initialTask ? "Task berhasil diperbarui" : "Task berhasil dibuat");
        onSuccess();
        onClose();
      } else {
        showError(response.message || "Gagal menyimpan task");
      }
    } catch (error: any) {
      console.error(error);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const validationErrors: Record<string, string> = {};
        Object.keys(error.response.data.errors).forEach((key) => {
          validationErrors[key] = error.response.data.errors[key][0];
        });
        setErrors(validationErrors);
      } else {
        showError(
          error.response?.data?.message || 
          "Terjadi kesalahan. Silakan coba lagi."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const priorityOptions = [
    { value: "tinggi", label: "Tinggi" },
    { value: "sedang", label: "Sedang" },
    { value: "rendah", label: "Rendah" },
  ];

  const statusOptions = [
    { value: "baru", label: "Baru" },
    { value: "proses", label: "Proses" },
    { value: "review", label: "Review" },
    { value: "selesai", label: "Selesai" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-[95vw] sm:max-w-[600px] md:max-w-[700px] lg:max-w-[800px] my-auto">
      <div className="relative w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto overflow-x-hidden bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="p-4 sm:p-5 md:p-6 lg:p-8">
          <div className="pr-10 sm:pr-12">
            <h4 className="mb-2 text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white/90">
              {initialTask ? "Edit Task" : "Buat Task Personal"}
            </h4>
            <p className="mb-4 sm:mb-5 md:mb-6 text-sm text-gray-500 dark:text-gray-400">
              {initialTask 
                ? "Perbarui detail task Anda."
                : "Buat task personal untuk mengelola tugas Anda sendiri."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col space-y-4 sm:space-y-5">
          {/* Title */}
          <FormField
            label="Judul Task"
            htmlFor="title"
            required
            error={errors.title}
          >
            <Input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Masukkan judul task"
              error={!!errors.title}
              disabled={isLoading}
            />
          </FormField>

          {/* Description */}
          <FormField
            label="Deskripsi"
            htmlFor="description"
            error={errors.description}
          >
            <TextArea
              value={form.description}
              onChange={(value) => setForm({ ...form, description: value })}
              placeholder="Masukkan deskripsi task (opsional)"
              rows={4}
              error={!!errors.description}
            />
          </FormField>

          {/* Due Date */}
          <FormField
            label="Tanggal Deadline"
            htmlFor="due_date"
            error={errors.due_date}
          >
            <Input
              id="due_date"
              type="date"
              value={form.due_date || ""}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              error={!!errors.due_date}
              disabled={isLoading}
            />
          </FormField>

          {/* Priority & Status Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
            <FormField
              label="Prioritas"
              htmlFor="priority"
              error={errors.priority}
            >
              <Select
                options={priorityOptions}
                placeholder="Pilih prioritas"
                onChange={(value) => setForm({ ...form, priority: value as TaskPriority })}
                defaultValue={form.priority}
              />
            </FormField>

            <FormField
              label="Status"
              htmlFor="status"
              error={errors.status}
            >
              <Select
                options={statusOptions}
                placeholder="Pilih status"
                onChange={(value) => setForm({ ...form, status: value as TaskStatus })}
                defaultValue={form.status}
              />
            </FormField>
          </div>

          {/* Progress */}
          <FormField
            label="Progress (%)"
            htmlFor="progress"
            error={errors.progress}
            hint="Progress task dari 0-100"
          >
            <Input
              id="progress"
              type="number"
              value={form.progress || 0}
              onChange={(e) => setForm({ ...form, progress: parseInt(e.target.value) || 0 })}
              min="0"
              max="100"
              error={!!errors.progress}
              disabled={isLoading}
            />
          </FormField>

          {/* Attachments Section - Only show in edit mode */}
          {initialTask && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <TaskAttachmentSection
                taskId={Number(initialTask.id)}
                attachments={attachments}
                onAttachmentAdded={handleAttachmentAdded}
                onAttachmentDeleted={handleAttachmentDeleted}
              />
            </div>
          )}

          {/* Error Summary */}
          {Object.keys(errors).length > 0 && (
            <div className="rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/20 dark:text-error-400">
              <p className="font-medium">Terdapat kesalahan:</p>
              <ul className="mt-1 list-disc list-inside">
                {Object.values(errors).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="mr-2">Menyimpan...</span>
                </>
              ) : (
                initialTask ? "Perbarui" : "Buat Task"
              )}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </Modal>
  );
}

