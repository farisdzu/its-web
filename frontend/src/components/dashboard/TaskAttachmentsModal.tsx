import { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import { FileIcon, PaperPlaneIcon, CloseIcon, DownloadIcon, ArrowRightIcon } from "../../icons";
import { taskApi, taskAttachmentApi, TaskAttachment, TaskDetailData } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import Button from "../ui/button/Button";

interface TaskAttachmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: number;
  taskTitle: string;
  onAttachmentDeleted?: () => void;
}

export default function TaskAttachmentsModal({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  onAttachmentDeleted,
}: TaskAttachmentsModalProps) {
  const { showSuccess, showError } = useToast();
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAttachments();
    } else {
      setAttachments([]);
    }
  }, [isOpen, taskId]);

  const loadAttachments = async () => {
    setLoading(true);
    try {
      const res = await taskApi.show(taskId);
      if (res.success && res.data) {
        const taskData = res.data as TaskDetailData;
        setAttachments(taskData.attachments || []);
      }
    } catch (error: any) {
      console.error(error);
      showError(error.response?.data?.message || "Gagal memuat attachments.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (attachmentId: number) => {
    if (!confirm("Yakin ingin menghapus attachment ini?")) return;

    setDeletingId(attachmentId);
    try {
      const res = await taskAttachmentApi.delete(taskId, attachmentId);
      if (res.success) {
        setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
        showSuccess("Attachment berhasil dihapus.");
        onAttachmentDeleted?.();
      } else {
        showError(res.message || "Gagal menghapus attachment.");
      }
    } catch (error: any) {
      console.error(error);
      showError(error.response?.data?.message || "Terjadi kesalahan saat menghapus attachment.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (attachment: TaskAttachment) => {
    if (attachment.type === "file" && attachment.url) {
      window.open(attachment.url, "_blank");
    }
  };

  const handleOpenLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const formatFileSize = (bytes: number | null | undefined): string => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string | null | undefined) => {
    if (!mimeType) return <FileIcon className="w-5 h-5" />;
    
    if (mimeType.startsWith("image/")) {
      return "🖼️";
    } else if (mimeType.includes("pdf")) {
      return "📄";
    } else if (mimeType.includes("word") || mimeType.includes("document")) {
      return "📝";
    } else if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) {
      return "📊";
    } else if (mimeType.includes("zip") || mimeType.includes("rar")) {
      return "📦";
    }
    return <FileIcon className="w-5 h-5" />;
  };

  const links = attachments.filter((a) => a.type === "link");
  const files = attachments.filter((a) => a.type === "file");

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-[95vw] sm:max-w-[500px] md:max-w-[600px] my-auto">
      <div className="relative w-full max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">
              Attachments & Links
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {taskTitle}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
          ) : attachments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Belum ada attachments atau links
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Links Section */}
              {links.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <PaperPlaneIcon className="w-4 h-4 text-brand-500" />
                    Links ({links.length})
                  </h4>
                  <div className="space-y-2">
                    {links.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center">
                            <PaperPlaneIcon className="w-5 h-5 text-brand-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {attachment.name}
                            </p>
                            <a
                              href={attachment.url || ""}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenLink(attachment.url || "");
                              }}
                              className="text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 truncate block mt-0.5"
                            >
                              {attachment.url && attachment.url.length > 60
                                ? `${attachment.url.substring(0, 60)}...`
                                : attachment.url}
                            </a>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            type="button"
                            onClick={() => handleOpenLink(attachment.url || "")}
                            className="p-1.5 text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
                            title="Buka link"
                          >
                            <ArrowRightIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(attachment.id)}
                            disabled={deletingId === attachment.id}
                            className="p-1.5 text-gray-400 hover:text-error-500 dark:hover:text-error-400 transition-colors disabled:opacity-50"
                            title="Hapus"
                          >
                            <CloseIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files Section */}
              {files.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <FileIcon className="w-4 h-4 text-gray-500" />
                    Files ({files.length})
                  </h4>
                  <div className="space-y-2">
                    {files.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg">
                            {getFileIcon(attachment.mime_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {attachment.name}
                            </p>
                            {attachment.size && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {formatFileSize(attachment.size)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {attachment.url && (
                            <button
                              type="button"
                              onClick={() => handleDownload(attachment)}
                              className="p-1.5 text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
                              title="Download"
                            >
                              <DownloadIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(attachment.id)}
                            disabled={deletingId === attachment.id}
                            className="p-1.5 text-gray-400 hover:text-error-500 dark:hover:text-error-400 transition-colors disabled:opacity-50"
                            title="Hapus"
                          >
                            <CloseIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Tutup
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

