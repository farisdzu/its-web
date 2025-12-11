import PageMeta from "../../../components/common/PageMeta";
import MetricCard from "../../../components/common/MetricCard";
import ProgressBar from "../../../components/common/ProgressBar";
import ActivityList, { ActivityItem } from "../../../components/common/ActivityList";
import TaskTable, { Task } from "../../../components/dashboard/TaskTable";
import TaskChart from "../../../components/dashboard/TaskChart";
import DashboardHeader from "../../../components/dashboard/DashboardHeader";
import { useAuth } from "../../../context/AuthContext";
import {
  TaskIcon,
  CheckCircleIcon,
  GroupIcon,
  TimeIcon,
  PlugInIcon,
  UserCircleIcon,
  GridIcon,
} from "../../../icons";

// Mock Data untuk Dashboard Admin
const mockMetrics = {
  totalUsers: 13,
  totalTugas: 234,
  tugasSelesai: 156,
  tugasTertunda: 18,
  totalUnit: 8,
  activeSessions: 12,
};

const mockTugasBaru: Task[] = [
  {
    id: 1,
    title: "Review Proposal Penelitian Fakultas",
    assignee: { name: "Unit Penelitian", unit: "Litbang" },
    priority: "tinggi",
    status: "baru",
    deadline: "5 Des 2025",
    createdAt: "28 Nov 2025",
  },
  {
    id: 2,
    title: "Evaluasi Kinerja Dosen Semester Ganjil",
    assignee: { name: "Unit SDM", unit: "Kepegawaian" },
    priority: "tinggi",
    status: "proses",
    deadline: "10 Des 2025",
    createdAt: "25 Nov 2025",
  },
  {
    id: 3,
    title: "Penyusunan Anggaran Tahun 2026",
    assignee: { name: "Unit Keuangan", unit: "Administrasi" },
    priority: "sedang",
    status: "review",
    deadline: "15 Des 2025",
    createdAt: "20 Nov 2025",
  },
  {
    id: 4,
    title: "Akreditasi Program Studi Baru",
    assignee: { name: "Unit Akademik", unit: "Pendidikan" },
    priority: "tinggi",
    status: "proses",
    deadline: "20 Des 2025",
    createdAt: "15 Nov 2025",
  },
  {
    id: 5,
    title: "Laporan Pengabdian Masyarakat",
    assignee: { name: "Unit LPPM", unit: "Pengabdian" },
    priority: "rendah",
    status: "selesai",
    deadline: "25 Nov 2025",
    createdAt: "10 Nov 2025",
  },
];

const mockPerformanceUnit = [
  { name: "Unit Akademik", progress: 92, tasks: "23/25 tugas" },
  { name: "Unit Penelitian", progress: 78, tasks: "18/23 tugas" },
  { name: "Unit SDM", progress: 85, tasks: "17/20 tugas" },
  { name: "Unit Keuangan", progress: 65, tasks: "13/20 tugas" },
  { name: "Unit LPPM", progress: 88, tasks: "15/17 tugas" },
];

const mockChartData = {
  data: [15, 22, 18, 28, 25, 20, 23, 30, 27, 32, 28, 25],
  categories: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
};

const mockNotifikasi: ActivityItem[] = [
  {
    id: 1,
    user: {
      name: "Prof. Dr. Ahmad Dahlan",
      avatar: "/images/user/user-01.jpg",
      status: "online",
    },
    action: "menyelesaikan tugas",
    target: "Laporan Akreditasi",
    time: "5 menit lalu",
    category: "Dekan",
  },
  {
    id: 2,
    user: {
      name: "Dr. Ahmad Yani",
      avatar: "/images/user/user-02.jpg",
      status: "online",
    },
    action: "mengajukan review untuk",
    target: "Proposal Hibah Penelitian",
    time: "15 menit lalu",
    category: "Unit Penelitian",
  },
  {
    id: 3,
    user: {
      name: "Dr. Budi Santoso",
      avatar: "/images/user/user-03.jpg",
      status: "busy",
    },
    action: "memperbarui status",
    target: "Rekrutmen Dosen Baru",
    time: "1 jam lalu",
    category: "Unit SDM",
  },
  {
    id: 4,
    user: {
      name: "Ir. Dewi Lestari",
      avatar: "/images/user/user-04.jpg",
      status: "offline",
    },
    action: "mengunggah dokumen untuk",
    target: "Laporan Keuangan Q3",
    time: "2 jam lalu",
    category: "Unit Keuangan",
  },
];

export default function DashboardAdmin() {
  const { user } = useAuth();

  return (
    <>
      <PageMeta
        title="Dashboard Admin | ITS (Integrated Task System)"
        description="Dashboard untuk Admin - Manajemen sistem dan monitoring keseluruhan"
      />

      <div className="space-y-6">
        {/* Header Card */}
        <DashboardHeader
          title="Dashboard Admin"
          icon={<GridIcon className="size-7" />}
          userName={user?.name || "Admin"}
          userRole="admin"
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 md:gap-6">
          <MetricCard
            title="Total Pengguna"
            value={mockMetrics.totalUsers}
            icon={<UserCircleIcon className="size-6" />}
          />
          <MetricCard
            title="Total Tugas"
            value={mockMetrics.totalTugas}
            icon={<TaskIcon className="size-6" />}
            trend={{ value: 15.2, isPositive: true }}
          />
          <MetricCard
            title="Tugas Selesai"
            value={mockMetrics.tugasSelesai}
            icon={<CheckCircleIcon className="size-6" />}
            trend={{ value: 10.5, isPositive: true }}
          />
          <MetricCard
            title="Tugas Tertunda"
            value={mockMetrics.tugasTertunda}
            icon={<TimeIcon className="size-6" />}
            trend={{ value: 5.3, isPositive: false }}
          />
          <MetricCard
            title="Total Unit"
            value={mockMetrics.totalUnit}
            icon={<GroupIcon className="size-6" />}
          />
          <MetricCard
            title="Sesi Aktif"
            value={mockMetrics.activeSessions}
            icon={<PlugInIcon className="size-6" />}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12 xl:col-span-8">
            <TaskChart
              title="Progres Tugas Bulanan"
              subtitle="Jumlah tugas yang diselesaikan per bulan"
              data={mockChartData.data}
              categories={mockChartData.categories}
              type="bar"
              height={300}
            />
          </div>

          {/* Performance Unit */}
          <div className="col-span-12 xl:col-span-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/5 sm:p-6 h-full">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-5">
                Kinerja Unit
              </h3>
              <div className="space-y-5">
                {mockPerformanceUnit.map((unit, index) => (
                  <ProgressBar
                    key={index}
                    label={unit.name}
                    value={unit.progress}
                    sublabel={unit.tasks}
                    color={
                      unit.progress >= 80
                        ? "success"
                        : unit.progress >= 60
                        ? "warning"
                        : "error"
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Table and Activity Row */}
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12 xl:col-span-7">
            <TaskTable
              tasks={mockTugasBaru}
              title="Tugas Terbaru"
              showAssignee={true}
              showPriority={true}
              onViewAll={() => {
                // TODO: Navigate to all tasks page
              }}
            />
          </div>

          <div className="col-span-12 xl:col-span-5">
            <ActivityList
              items={mockNotifikasi}
              title="Aktivitas Terbaru"
              maxItems={4}
              onViewAll={() => {
                // TODO: Navigate to all activities page
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

