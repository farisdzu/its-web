import { useEffect, useMemo, useState, useCallback } from "react";
import PageMeta from "../components/common/PageMeta";
import { PageHeader } from "../components/common";
import Button from "../components/ui/button/Button";
import { Modal, ModalHeader, ModalContent, ModalFooter } from "../components/ui/modal";
import { ConfirmDialog } from "../components/ui/dialog";
import { LoadingSpinner, SpinnerIcon } from "../components/ui/loading";
import { EmptyState } from "../components/ui/empty";
import { StatusIndicator } from "../components/ui/status";
import { Card, ContainerCard } from "../components/ui/card";
import { ExpandButton } from "../components/ui/tree";
import Badge from "../components/ui/badge/Badge";
import Input from "../components/form/input/InputField";
import { FormField } from "../components/form";
import Checkbox from "../components/form/input/Checkbox";
import SelectField from "../components/form/input/SelectField";
import { orgUnitApi, OrgUnitPayload, OrgUnitTreeNode } from "../services/api";
import ToastContainer from "../components/ui/toast/ToastContainer";
import { useToast } from "../context/ToastContext";

type FormState = {
  id?: number;
  name: string;
  parent_id: number | null;
  type?: string | null;
  code?: string | null;
  order?: number | null;
  is_active?: boolean;
};

export default function OrgUnits() {
  const { showSuccess } = useToast();
  const [tree, setTree] = useState<OrgUnitTreeNode[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: number | null; name: string }>({
    isOpen: false,
    id: null,
    name: "",
  });
  const [deleting, setDeleting] = useState<boolean>(false);
  const [form, setForm] = useState<FormState>({
    name: "",
    parent_id: null,
    type: null,
    code: null,
    order: null,
    is_active: true,
  });
  const [formError, setFormError] = useState<string>("");

  const flatUnits = useMemo(() => flattenTree(tree), [tree]);

  // Helper function to find node in tree by ID
  const findNodeById = useCallback((id: number, nodes: OrgUnitTreeNode[]): OrgUnitTreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children && node.children.length > 0) {
        const found = findNodeById(id, node.children);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const loadTree = async () => {
    setLoading(true);
    try {
      const res = await orgUnitApi.getTree();
      if (res.success && res.data) {
        setTree(res.data);
      }
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTree();
  }, []);

  const resetForm = () => {
    setForm({
      id: undefined,
      name: "",
      parent_id: null,
      type: null,
      code: null,
      order: null,
      is_active: true,
    });
    setFormError("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const openCreate = (parentId: number | null) => {
    resetForm();
    setForm((prev) => ({ ...prev, parent_id: parentId }));
    setIsModalOpen(true);
  };

  const openEdit = (node: OrgUnitTreeNode) => {
    setForm({
      id: node.id,
      name: node.name,
      parent_id: node.parent_id,
      type: node.type,
      code: node.code,
      order: node.order,
      is_active: node.is_active,
    });
    setIsModalOpen(true);
  };

  // Helper function to get all unit names from tree
  const getAllUnitNames = useCallback((nodes: OrgUnitTreeNode[]): { id: number; name: string }[] => {
    const result: { id: number; name: string }[] = [];
    nodes.forEach((node) => {
      result.push({ id: node.id, name: node.name });
      if (node.children && node.children.length > 0) {
        result.push(...getAllUnitNames(node.children));
      }
    });
    return result;
  }, []);

  const handleSave = async () => {
    // Clear previous error
    setFormError("");

    // Check for duplicate name in frontend (case-insensitive)
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setFormError("Nama bagian wajib diisi.");
      return;
    }

    const allUnits = getAllUnitNames(tree);
    const existingUnit = allUnits.find(
      (unit) => unit.id !== form.id && unit.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingUnit) {
      setFormError(`Nama bagian "${trimmedName}" sudah digunakan. Gunakan nama lain.`);
      return;
    }

    setSaving(true);
    try {
      const payload: OrgUnitPayload = {
        name: trimmedName,
        parent_id: form.parent_id ?? null,
        type: form.type ?? null,
        code: form.code ?? null,
        order: form.order ?? 0,
        is_active: form.is_active ?? true,
      };

      if (form.id) {
        const res = await orgUnitApi.update(form.id, payload);
        if (!res.success) throw new Error(res.message || "Gagal memperbarui unit.");
        showSuccess("Unit diperbarui.");
      } else {
        const res = await orgUnitApi.create(payload);
        if (!res.success) throw new Error(res.message || "Gagal membuat unit.");
        showSuccess("Unit dibuat.");
      }

      resetForm();
      setIsModalOpen(false);
      await loadTree();
    } catch (error: any) {
      const errorMessage = error?.message || "Gagal menyimpan.";
      console.error("Error saving org unit:", error);
      
      // Check if error is about duplicate name
      if (errorMessage.toLowerCase().includes("nama") || errorMessage.toLowerCase().includes("unique") || errorMessage.toLowerCase().includes("sudah digunakan")) {
        setFormError(errorMessage);
      } else {
        // For other errors, show toast
        showSuccess(errorMessage, 5000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: number, name: string) => {
    // Check if node has children
    const node = findNodeById(id, tree);
    const hasChildren = Boolean(node && node.children && node.children.length > 0);

    if (hasChildren) {
      // If has children, show immediate feedback without dialog
      const childCount = node?.children?.length || 0;
      showSuccess(
        `Tidak bisa menghapus "${name}": masih ada ${childCount} bagian di bawahnya. Hapus atau pindahkan bagian-bagian tersebut terlebih dahulu.`,
        5000
      );
      return;
    }

    // If no children, show confirmation dialog
    // Backend will still check for users
    setDeleteConfirm({ isOpen: true, id, name });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.id) return;

    setDeleting(true);
    try {
      const res = await orgUnitApi.remove(deleteConfirm.id);
      if (!res.success) throw new Error(res.message || "Gagal menghapus.");
      showSuccess("Unit dihapus.");
      setDeleteConfirm({ isOpen: false, id: null, name: "" });
      await loadTree();
    } catch (error: any) {
      console.error(error);
      // Show error message from backend (e.g., if there are users)
      showSuccess(error?.message || "Gagal menghapus unit.", 5000);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, id: null, name: "" });
  };

  return (
    <>
      <PageMeta title="Struktur Organisasi" description="Kelola struktur org dinamis" />
      <ToastContainer />

      <div className="space-y-3 sm:space-y-4 px-2 sm:px-0">
        <PageHeader
          title="Struktur Organisasi"
          description="Tambah/pindah/hapus bagian secara dinamis. Role tetap generik, jabatan jadi title user."
          action={
            <Button variant="primary" onClick={() => openCreate(null)}>
              + Tambah Root
            </Button>
          }
        />

        {loading ? (
          <ContainerCard padding="lg">
            <LoadingSpinner size="md" text="Memuat struktur..." />
          </ContainerCard>
        ) : (
          <ContainerCard padding="sm">
            {tree.length === 0 ? (
              <EmptyState
                title="Belum ada data"
                description="Tambahkan root untuk memulai struktur organisasi"
                action={
                  <Button variant="primary" size="sm" onClick={() => openCreate(null)}>
                    + Tambah Root
                  </Button>
                }
              />
            ) : (
              <div className="space-y-1 sm:space-y-1.5">
                {tree.map((node) => (
                  <TreeNode key={node.id} node={node} onCreate={openCreate} onEdit={openEdit} onDelete={handleDeleteClick} level={0} />
                ))}
              </div>
            )}
          </ContainerCard>
        )}
      </div>

      {/* Modal Form */}
      <Modal isOpen={isModalOpen} onClose={closeModal} className="max-w-[600px] m-2 sm:m-4">
        <ModalContent maxWidth="600px">
          <ModalHeader
            title={form.id ? "Edit Bagian" : "Tambah Bagian"}
            description={
              form.id
                ? "Perbarui informasi bagian organisasi."
                : "Tambahkan bagian baru ke struktur organisasi."
            }
          />

          <form
            className="flex flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="px-0 sm:px-2 pb-3 space-y-4 sm:space-y-5">
              <FormField
                label="Nama Bagian"
                htmlFor="name"
                required
                error={formError}
              >
                <Input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, name: e.target.value }));
                    // Clear error when user types
                    if (formError) setFormError("");
                  }}
                  placeholder="Nama bagian"
                  disabled={saving}
                  required
                  error={!!formError}
                />
              </FormField>

              <FormField
                label="Parent"
                htmlFor="parent_id"
              >
                <SelectField
                  id="parent_id"
                  value={form.parent_id}
                  onChange={(e) => {
                    const val = e.target.value === "" ? null : Number(e.target.value);
                    setForm((prev) => ({ ...prev, parent_id: val }));
                  }}
                  options={[
                    { value: "", label: "(Root)" },
                    ...flatUnits
                      .filter((u) => u.id !== form.id)
                      .map((u) => ({
                        value: u.id,
                        label: u.indentLabel,
                      })),
                  ]}
                  placeholder="(Root)"
                  disabled={saving}
                />
              </FormField>

              <div>
                <Checkbox
                  id="is_active"
                  label="Aktif"
                  checked={form.is_active ?? true}
                  onChange={(checked) => setForm((prev) => ({ ...prev, is_active: checked }))}
                  disabled={saving}
                />
              </div>
            </div>

            <ModalFooter>
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button
                size="sm"
                type="submit"
                disabled={saving || !form.name.trim()}
                className="w-full sm:w-auto"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <SpinnerIcon size="sm" />
                    Menyimpan...
                  </span>
                ) : (
                  "Simpan"
                )}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Hapus Unit Organisasi"
        message={
          <>
            Apakah Anda yakin ingin menghapus unit{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              "{deleteConfirm.name}"
            </span>
            ?
          </>
        }
        description="Pastikan tidak ada user yang terhubung dengan unit ini. Jika masih ada user, unit tidak dapat dihapus. Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={deleting}
      />
    </>
  );
}

function TreeNode({
  node,
  level,
  onCreate,
  onEdit,
  onDelete,
  isLast = false,
  parentPath = [],
}: {
  node: OrgUnitTreeNode;
  level: number;
  onCreate: (parentId: number | null) => void;
  onEdit: (node: OrgUnitTreeNode) => void;
  onDelete: (id: number, name: string) => void;
  isLast?: boolean;
  parentPath?: boolean[];
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = Boolean(node.children && node.children.length > 0);
  // Responsive indent: smaller on mobile (16px), larger on desktop (20px)
  const indentSize = 16; // Base mobile size

  return (
    <div className="relative">
      <div className="relative flex items-start">
        {/* Expand/Collapse Button */}
        <ExpandButton
          isExpanded={isExpanded}
          onClick={() => setIsExpanded(!isExpanded)}
          hasChildren={hasChildren}
          level={level}
          indentSize={indentSize}
        />

        {/* Content Card */}
        <Card padding="sm" hover className="flex-1 ml-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
              {/* Status Indicator */}
              <StatusIndicator
                status={node.is_active ? "active" : "inactive"}
                size="sm"
              />

              {/* Unit Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                  <div className="text-xs sm:text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                    {node.name}
                  </div>
                  {level > 0 && (
                    <Badge variant="light" color="light" size="sm">
                      L{level + 1}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {node.type || "Bagian"}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">·</span>
                  <Badge
                    variant="light"
                    color={node.is_active ? "success" : "light"}
                    size="sm"
                  >
                    {node.is_active ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div
              className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-wrap"
              style={{ position: "relative", zIndex: 10 }}
            >
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCreate(node.id)}
                type="button"
                className="text-xs sm:text-sm px-2 sm:px-3"
              >
                <span className="hidden sm:inline">+ Child</span>
                <span className="sm:hidden">+</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(node)}
                type="button"
                className="text-xs sm:text-sm px-2 sm:px-3"
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(node.id, node.name)}
                type="button"
                className="text-xs sm:text-sm px-2 sm:px-3"
              >
                Hapus
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Children */}
      {hasChildren && (
        <div
          className="relative overflow-hidden"
          style={{
            display: 'grid',
            gridTemplateRows: isExpanded ? '1fr' : '0fr',
            transition: 'grid-template-rows 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            marginTop: isExpanded ? '0.5rem' : '0',
          }}
        >
          <div
            className="overflow-hidden min-h-0"
            style={{
              opacity: isExpanded ? 1 : 0,
              transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDelay: isExpanded ? '0.05s' : '0s',
            }}
          >
            <div className="space-y-1 sm:space-y-1.5">
              {node.children.map((child, index) => (
                <TreeNode
                  key={child.id}
                  node={child}
                  level={level + 1}
                  onCreate={onCreate}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isLast={index === node.children!.length - 1}
                  parentPath={[...parentPath, !isLast]}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function flattenTree(tree: OrgUnitTreeNode[], prefix = "", level = 0): { id: number; indentLabel: string }[] {
  const result: { id: number; indentLabel: string }[] = [];
  tree.forEach((node, idx) => {
    const label = `${"-- ".repeat(level)}${node.name}`;
    result.push({ id: node.id, indentLabel: label });
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, `${prefix}${idx}-`, level + 1));
    }
  });
  return result;
}

