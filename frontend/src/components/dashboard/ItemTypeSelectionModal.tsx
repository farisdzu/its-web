import { Modal } from "../ui/modal";
import { TaskIcon, CalenderIcon } from "../../icons";
import { TaskType } from "./TaskCard";

interface ItemTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: TaskType) => void;
}

export default function ItemTypeSelectionModal({
  isOpen,
  onClose,
  onSelect,
}: ItemTypeSelectionModalProps) {
  const handleSelect = (type: TaskType) => {
    onSelect(type);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-md my-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white mb-2">
            Pilih Jenis Item
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pilih jenis item yang ingin Anda buat
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tugas Option */}
          <button
            onClick={() => handleSelect("tugas")}
            className="group relative flex flex-col items-center justify-center p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-brand-500 dark:hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/20 transition-all duration-200 cursor-pointer"
          >
            <div className="mb-3 p-3 rounded-lg bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 group-hover:bg-brand-200 dark:group-hover:bg-brand-900/50 transition-colors">
              <TaskIcon className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
              Tugas
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Buat tugas dengan workflow: Baru → Proses → Review → Selesai
            </p>
          </button>

          {/* Agenda Option */}
          <button
            onClick={() => handleSelect("agenda")}
            className="group relative flex flex-col items-center justify-center p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200 cursor-pointer"
          >
            <div className="mb-3 p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
              <CalenderIcon className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
              Agenda
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Buat agenda dengan waktu dan link meeting
            </p>
          </button>
        </div>
      </div>
    </Modal>
  );
}

