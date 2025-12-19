import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import PageMeta from "../../../components/common/PageMeta";
import MetricCard from "../../../components/common/MetricCard";
import DashboardHeaderEnhanced from "../../../components/dashboard/DashboardHeaderEnhanced";
import KanbanBoard from "../../../components/dashboard/KanbanBoard";
import TaskFilter, { TaskFilters } from "../../../components/dashboard/TaskFilter";
import { KanbanSkeleton } from "../../../components/dashboard/KanbanSkeleton";
import TaskFormModal from "../../../components/dashboard/TaskFormModal";
import { TaskCardData, TaskStatus } from "../../../components/dashboard/TaskCard";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { taskApi } from "../../../services/api";
import {
  TaskIcon,
  CheckCircleIcon,
  TimeIcon,
  UserCircleIcon,
} from "../../../icons";

export default function DashboardUser() {
  const { user } = useAuth();
  const { showError } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [tasks, setTasks] = useState<TaskCardData[]>([]);
  const [filters, setFilters] = useState<TaskFilters>({
    status: "all",
    priority: "all",
    type: "all",
    search: "",
  });
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskCardData | null>(null);
  const [initialStatus, setInitialStatus] = useState<TaskStatus | undefined>();

  // Load tasks from API
  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await taskApi.list({
        status: filters.status !== "all" ? filters.status : undefined,
        priority: filters.priority !== "all" ? filters.priority : undefined,
        type: filters.type !== "all" ? filters.type : undefined,
        search: filters.search || undefined,
      });
      
      if (res.success && res.data) {
        setTasks(res.data);
      } else {
        showError(res.message || "Gagal memuat tasks");
      }
    } catch (error: any) {
      console.error(error);
      showError(error.response?.data?.message || "Terjadi kesalahan saat memuat tasks");
    } finally {
      setLoading(false);
    }
  }, [filters, showError]);

  // Load tasks on mount and when filters change
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Filter tasks based on filters
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((task) => task.status === filters.status);
    }

    // Priority filter
    if (filters.priority !== "all") {
      filtered = filtered.filter((task) => task.priority === filters.priority);
    }

    // Type filter
    if (filters.type === "assigned_to_me") {
      filtered = filtered.filter((task) => task.assignedTo === user?.id);
    } else if (filters.type === "created_by_me") {
      filtered = filtered.filter((task) => task.createdBy === user?.id);
    }

    return filtered;
  }, [tasks, filters, user?.id]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const activeTasks = tasks.filter(
      (task) => task.status !== "selesai"
    ).length;
    const completedThisMonth = tasks.filter(
      (task) => task.status === "selesai"
    ).length;
    const deadlineThisWeek = tasks.filter((task) => {
      // Simple check - in real app, parse date properly
      return task.status !== "selesai" && task.dueDate;
    }).length;
    const pending = tasks.filter((task) => task.status === "review").length;

    return {
      tugasAktif: activeTasks,
      selesaiBulanIni: completedThisMonth,
      deadline: deadlineThisWeek,
      tertunda: pending,
    };
  }, [tasks]);

  const handleTaskMove = useCallback(async (taskId: string | number, newStatus: TaskStatus) => {
    try {
      // Find current task to check progress
      const currentTask = tasks.find((t) => t.id === taskId);
      const currentProgress = currentTask?.progress || 0;

      // Auto-set progress based on status
      let newProgress = currentProgress;
      if (newStatus === "proses" && currentProgress === 0) {
        // Set to 25% when moved to "proses" if still 0%
        newProgress = 25;
      } else if (newStatus === "review" && currentProgress < 75) {
        // Set to 75% when moved to "review"
        newProgress = 75;
      } else if (newStatus === "selesai") {
        // Always set to 100% when moved to "selesai"
        newProgress = 100;
      }

      // Update both status and progress if needed
      const updates: Promise<any>[] = [
        taskApi.updateStatus(Number(taskId), newStatus),
      ];

      if (newProgress !== currentProgress) {
        updates.push(taskApi.update(Number(taskId), { progress: newProgress }));
      }

      const results = await Promise.all(updates);
      const statusRes = results[0];

      if (statusRes.success) {
        // Update local state
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId
              ? { ...task, status: newStatus, progress: newProgress }
              : task
          )
        );
      } else {
        showError(statusRes.message || "Gagal memperbarui status task");
      }
    } catch (error: any) {
      console.error(error);
      showError(error.response?.data?.message || "Terjadi kesalahan saat memperbarui status");
    }
  }, [tasks, showError]);

  const handleTaskClick = useCallback((task: TaskCardData) => {
    // Open edit modal when task is clicked
    setSelectedTask(task);
    setInitialStatus(undefined);
    setIsModalOpen(true);
  }, []);

  const handleTaskEdit = useCallback((task: TaskCardData) => {
    setSelectedTask(task);
    setInitialStatus(undefined);
    setIsModalOpen(true);
  }, []);

  const handleTaskDelete = useCallback(async (task: TaskCardData) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus task ini?")) {
      return;
    }

    try {
      const res = await taskApi.destroy(Number(task.id));
      if (res.success) {
        // Remove from local state
        setTasks((prevTasks) => prevTasks.filter((t) => t.id !== task.id));
      } else {
        showError(res.message || "Gagal menghapus task");
      }
    } catch (error: any) {
      console.error(error);
      showError(error.response?.data?.message || "Terjadi kesalahan saat menghapus task");
    }
  }, [showError]);

  const handleAddTask = useCallback((status: TaskStatus) => {
    setSelectedTask(null);
    setInitialStatus(status);
    setIsModalOpen(true);
  }, []);

  const handleTaskSuccess = useCallback(() => {
    // Refresh tasks after create/update
    loadTasks();
  }, [loadTasks]);

  // Track pending progress updates to prevent multiple concurrent requests
  const progressUpdateRefs = useRef<Map<string | number, NodeJS.Timeout>>(new Map());
  const progressUpdateInProgress = useRef<Set<string | number>>(new Set());
  const previousProgressRef = useRef<Map<string | number, number>>(new Map());

  const handleProgressUpdate = useCallback(async (taskId: string | number, progress: number, immediate = false) => {
    // Clear any pending debounce for this task
    const existingTimeout = progressUpdateRefs.current.get(taskId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Store previous progress for potential revert
    setTasks((prevTasks) => {
      const currentTask = prevTasks.find((t) => t.id === taskId);
      if (currentTask && !previousProgressRef.current.has(taskId)) {
        previousProgressRef.current.set(taskId, currentTask.progress || 0);
      }
      return prevTasks.map((task) =>
        task.id === taskId ? { ...task, progress } : task
      );
    });

    // For preset buttons, save immediately; for slider, debounce
    const saveProgress = async () => {
      // Check if another update is already in progress for this task
      if (progressUpdateInProgress.current.has(taskId)) {
        return;
      }

      progressUpdateInProgress.current.add(taskId);

      try {
        const res = await taskApi.update(Number(taskId), { progress });
        if (!res.success) {
          // Revert local state on error
          const previousProgress = previousProgressRef.current.get(taskId) || 0;
          setTasks((prevTasks) =>
            prevTasks.map((task) =>
              task.id === taskId ? { ...task, progress: previousProgress } : task
            )
          );
          previousProgressRef.current.delete(taskId);
          showError(res.message || "Gagal memperbarui progress");
        } else {
          // Update previous progress on success
          previousProgressRef.current.set(taskId, progress);
        }
      } catch (error: any) {
        console.error(error);
        // Revert local state on error
        const previousProgress = previousProgressRef.current.get(taskId) || 0;
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId ? { ...task, progress: previousProgress } : task
          )
        );
        previousProgressRef.current.delete(taskId);
        // Only show error if it's not a network error or cancellation
        if (error.code !== 'ERR_CANCELED' && !error.message?.includes('canceled')) {
          showError(error.response?.data?.message || "Terjadi kesalahan saat memperbarui progress");
        }
      } finally {
        progressUpdateInProgress.current.delete(taskId);
        progressUpdateRefs.current.delete(taskId);
      }
    };

    if (immediate) {
      // Save immediately for preset buttons
      saveProgress();
    } else {
      // Debounce for slider
      const timeoutId = setTimeout(saveProgress, 500);
      progressUpdateRefs.current.set(taskId, timeoutId);
    }
  }, [showError]);

  return (
    <>
      <PageMeta
        title="Dashboard User | ITS (Integrated Task System)"
        description="Dashboard untuk User - Kanban board untuk manajemen tugas"
      />

      <div className="space-y-6">
        {/* Header */}
        <DashboardHeaderEnhanced
          title="Dashboard User"
          icon={<UserCircleIcon className="size-7" />}
          userName={user?.name || "User"}
          userRole={user?.role || "user"}
          onAddNew={() => handleAddTask("baru")}
          onShare={() => {
            // TODO: Implement share functionality
          }}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
          <MetricCard
            title="Tugas Aktif"
            value={metrics.tugasAktif}
            icon={<TaskIcon className="size-6" />}
          />
          <MetricCard
            title="Selesai Bulan Ini"
            value={metrics.selesaiBulanIni}
            icon={<CheckCircleIcon className="size-6" />}
            trend={{ value: 25.0, isPositive: true }}
          />
          <MetricCard
            title="Deadline Minggu Ini"
            value={metrics.deadline}
            icon={<TimeIcon className="size-6" />}
            trend={{ value: 10.0, isPositive: false }}
          />
          <MetricCard
            title="Tertunda"
            value={metrics.tertunda}
            icon={<TimeIcon className="size-6" />}
          />
        </div>

        {/* Filter */}
        <TaskFilter filters={filters} onFiltersChange={setFilters} />

        {/* Kanban Board */}
        {loading ? (
          <KanbanSkeleton />
        ) : (
          <KanbanBoard
            tasks={filteredTasks}
            onAddTask={handleAddTask}
            onTaskClick={handleTaskClick}
            onTaskEdit={handleTaskEdit}
            onTaskDelete={handleTaskDelete}
            onTaskMove={handleTaskMove}
            onProgressUpdate={handleProgressUpdate}
            onRefresh={loadTasks}
          />
        )}

        {/* Task Form Modal */}
        <TaskFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
            setInitialStatus(undefined);
          }}
          onSuccess={handleTaskSuccess}
          initialStatus={initialStatus}
          initialTask={selectedTask}
        />
      </div>
    </>
  );
}

