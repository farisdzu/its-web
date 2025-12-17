import { useState, useMemo, useCallback, useEffect } from "react";
import PageMeta from "../../../components/common/PageMeta";
import MetricCard from "../../../components/common/MetricCard";
import DashboardHeaderEnhanced from "../../../components/dashboard/DashboardHeaderEnhanced";
import KanbanBoard from "../../../components/dashboard/KanbanBoard";
import TaskFilter, { TaskFilters } from "../../../components/dashboard/TaskFilter";
import { KanbanSkeleton } from "../../../components/dashboard/KanbanSkeleton";
import { TaskCardData, TaskStatus } from "../../../components/dashboard/TaskCard";
import { useAuth } from "../../../context/AuthContext";
import {
  TaskIcon,
  CheckCircleIcon,
  TimeIcon,
  UserCircleIcon,
} from "../../../icons";

// Mock Data untuk Dashboard User
const mockMetrics = {
  tugasAktif: 8,
  selesaiBulanIni: 15,
  deadline: 3,
  tertunda: 2,
};

// Mock tasks data
const mockTasks: TaskCardData[] = [
  {
    id: 1,
    title: "Review dokumen akreditasi prodi",
    description: "Compile competitor landing page designs for inspiration. Gather best practices...",
    dueDate: "12 Nov 2025",
    progress: 0,
    priority: "tinggi",
    status: "baru",
    assignedUsers: [
      { id: 1, name: "John Doe", avatar: undefined },
      { id: 2, name: "Jane Smith", avatar: undefined },
      { id: 3, name: "Bob Wilson", avatar: undefined },
    ],
    linksCount: 2,
    attachmentsCount: 2,
    createdBy: 1,
    assignedTo: 1,
  },
  {
    id: 2,
    title: "Upload laporan penelitian semester ganjil",
    description: "Complete research report for odd semester. Include methodology and findings...",
    dueDate: "15 Nov 2025",
    progress: 50,
    priority: "tinggi",
    status: "proses",
    assignedUsers: [
      { id: 1, name: "John Doe", avatar: undefined },
    ],
    linksCount: 1,
    attachmentsCount: 3,
    createdBy: 2,
    assignedTo: 1,
  },
  {
    id: 3,
    title: "Revisi RPS mata kuliah Kalkulus",
    description: "Update course plan for Calculus. Review learning outcomes and assessment methods...",
    dueDate: "18 Nov 2025",
    progress: 80,
    priority: "sedang",
    status: "proses",
    assignedUsers: [
      { id: 2, name: "Jane Smith", avatar: undefined },
      { id: 3, name: "Bob Wilson", avatar: undefined },
    ],
    linksCount: 0,
    attachmentsCount: 1,
    createdBy: 1,
    assignedTo: 2,
  },
  {
    id: 4,
    title: "Input nilai UTS mahasiswa",
    description: "Enter midterm exam scores for all students. Verify data accuracy...",
    dueDate: "20 Nov 2025",
    progress: 75,
    priority: "sedang",
    status: "proses",
    assignedUsers: [
      { id: 1, name: "John Doe", avatar: undefined },
    ],
    linksCount: 1,
    attachmentsCount: 0,
    createdBy: 3,
    assignedTo: 1,
  },
  {
    id: 5,
    title: "Bimbingan skripsi mahasiswa",
    description: "Schedule thesis guidance sessions. Review student progress and provide feedback...",
    dueDate: "22 Nov 2025",
    progress: 100,
    priority: "rendah",
    status: "selesai",
    assignedUsers: [
      { id: 1, name: "John Doe", avatar: undefined },
      { id: 2, name: "Jane Smith", avatar: undefined },
    ],
    linksCount: 0,
    attachmentsCount: 2,
    createdBy: 1,
    assignedTo: 1,
  },
  {
    id: 6,
    title: "Persiapan materi kuliah minggu depan",
    description: "Prepare lecture materials for next week. Create slides and handouts...",
    dueDate: "25 Nov 2025",
    progress: 0,
    priority: "rendah",
    status: "baru",
    assignedUsers: [],
    linksCount: 0,
    attachmentsCount: 0,
    createdBy: 1,
    assignedTo: 1,
  },
  {
    id: 7,
    title: "Laporan BKD Semester Genap 2024",
    description: "Complete BKD report for even semester 2024. Include teaching, research, and service activities...",
    dueDate: "25 Nov 2025",
    progress: 100,
    priority: "tinggi",
    status: "selesai",
    assignedUsers: [
      { id: 1, name: "John Doe", avatar: undefined },
    ],
    linksCount: 2,
    attachmentsCount: 5,
    createdBy: 2,
    assignedTo: 1,
  },
  {
    id: 8,
    title: "Review Paper Mahasiswa",
    description: "Review student research paper. Provide constructive feedback and suggestions...",
    dueDate: "28 Nov 2025",
    progress: 60,
    priority: "sedang",
    status: "review",
    assignedUsers: [
      { id: 1, name: "John Doe", avatar: undefined },
      { id: 3, name: "Bob Wilson", avatar: undefined },
    ],
    linksCount: 1,
    attachmentsCount: 1,
    createdBy: 3,
    assignedTo: 1,
  },
];

export default function DashboardUser() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [tasks, setTasks] = useState<TaskCardData[]>(mockTasks);
  const [filters, setFilters] = useState<TaskFilters>({
    status: "all",
    priority: "all",
    type: "all",
    search: "",
  });

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

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

  const handleTaskMove = useCallback((taskId: string | number, newStatus: TaskStatus) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  }, []);

  const handleTaskClick = useCallback((task: TaskCardData) => {
    // TODO: Open task detail modal
    console.log("Task clicked:", task);
  }, []);

  const handleTaskEdit = useCallback((task: TaskCardData) => {
    // TODO: Open task edit modal
    console.log("Task edit:", task);
  }, []);

  const handleTaskDelete = useCallback((task: TaskCardData) => {
    // TODO: Confirm and delete task
    setTasks((prevTasks) => prevTasks.filter((t) => t.id !== task.id));
  }, []);

  const handleAddTask = useCallback((status: TaskStatus) => {
    // TODO: Open add task modal with pre-selected status
    console.log("Add task to status:", status);
  }, []);

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
          searchValue={filters.search}
          onSearchChange={(value) => setFilters({ ...filters, search: value })}
          onAddNew={() => handleAddTask("baru")}
          onShare={() => console.log("Share")}
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
          />
        )}
      </div>
    </>
  );
}

