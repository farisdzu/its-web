import { useState, useRef } from "react";
import { FileIcon, PaperPlaneIcon, CloseIcon } from "../../icons";
import { taskAttachmentApi, TaskAttachment, AddLinkPayload } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";

interface TaskAttachmentSectionProps {
  taskId: number;
  attachments: TaskAttachment[];
  onAttachmentAdded: (attachment: TaskAttachment) => void;
  onAttachmentDeleted: (attachmentId: number) => void;
}

export default function TaskAttachmentSection({
  taskId,
  attachments,
  onAttachmentAdded,
  onAttachmentDeleted,
}: TaskAttachmentSectionProps) {
  const { showSuccess, showError } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [linkForm, setLinkForm] = useState<AddLinkPayload>({ url: "", name: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      showError("Ukuran file maksimal 10MB.");
      return;
    }

    setIsUploading(true);
    try {
      const res = await taskAttachmentApi.uploadFile(taskId, file);
      if (res.success && res.data) {
        onAttachmentAdded(res.data);
        showSuccess("File berhasil diupload.");
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        showError(res.message || "Gagal mengupload file.");
      }
    } catch (error: any) {
      console.error(error);
      showError(error.response?.data?.message || "Terjadi kesalahan saat mengupload file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddLink = async () => {
    if (!linkForm.url.trim()) {
      showError("URL wajib diisi.");
      return;
    }

    // Basic URL validation
    try {
      new URL(linkForm.url);
    } catch {
      showError("URL tidak valid.");
      return;
    }

    setIsUploading(true);
    try {
      const res = await taskAttachmentApi.addLink(taskId, linkForm);
      if (res.success && res.data) {
        onAttachmentAdded(res.data);
        showSuccess("Link berhasil ditambahkan.");
        setLinkForm({ url: "", name: "" });
        setShowAddLink(false);
      } else {
        showError(res.message || "Gagal menambahkan link.");
      }
    } catch (error: any) {
      console.error(error);
      showError(error.response?.data?.message || "Terjadi kesalahan saat menambahkan link.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (attachmentId: number) => {
    if (!confirm("Yakin ingin menghapus attachment ini?")) return;

    try {
      const res = await taskAttachmentApi.delete(taskId, attachmentId);
      if (res.success) {
        onAttachmentDeleted(attachmentId);
        showSuccess("Attachment berhasil dihapus.");
      } else {
        showError(res.message || "Gagal menghapus attachment.");
      }
    } catch (error: any) {
      console.error(error);
      showError(error.response?.data?.message || "Terjadi kesalahan saat menghapus attachment.");
    }
  };

  const formatFileSize = (bytes: number | null | undefined): string => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Attachments & Links
        </h4>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            <FileIcon className="w-3.5 h-3.5" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setShowAddLink(!showAddLink)}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            <PaperPlaneIcon className="w-3.5 h-3.5" />
            Add Link
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
      />

      {/* Add Link Form */}
      {showAddLink && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
          <Input
            type="url"
            placeholder="https://example.com"
            value={linkForm.url}
            onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
            className="text-sm"
          />
          <Input
            type="text"
            placeholder="Nama link (opsional)"
            value={linkForm.name}
            onChange={(e) => setLinkForm({ ...linkForm, name: e.target.value })}
            className="text-sm"
          />
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddLink}
              disabled={isUploading || !linkForm.url.trim()}
            >
              {isUploading ? "Menambahkan..." : "Tambahkan"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowAddLink(false);
                setLinkForm({ url: "", name: "" });
              }}
              disabled={isUploading}
            >
              Batal
            </Button>
          </div>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2 max-h-[200px] sm:max-h-[300px] overflow-y-auto">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-2.5 sm:p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
                {attachment.type === "file" ? (
                  <FileIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400 shrink-0" />
                ) : (
                  <PaperPlaneIcon className="w-4 h-4 sm:w-5 sm:h-5 text-brand-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                    {attachment.name}
                  </p>
                  {attachment.type === "file" && attachment.size && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(attachment.size)}
                    </p>
                  )}
                  {attachment.type === "link" && attachment.url && (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 truncate block"
                      title={attachment.url}
                    >
                      {attachment.url.length > 50 
                        ? `${attachment.url.substring(0, 50)}...` 
                        : attachment.url}
                    </a>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(attachment.id)}
                className="p-1 sm:p-1.5 text-gray-400 hover:text-error-500 dark:hover:text-error-400 transition-colors shrink-0 ml-2"
                title="Hapus"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {attachments.length === 0 && !showAddLink && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
          Belum ada attachments atau links
        </p>
      )}
    </div>
  );
}

