import { useEffect, useMemo, useState } from "react";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import { Modal } from "../components/ui/modal";
import { ConfirmDialog } from "../components/ui/dialog";
import { LoadingSpinner, SpinnerIcon } from "../components/ui/loading";
import { EmptyState } from "../components/ui/empty";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Checkbox from "../components/form/input/Checkbox";
import SelectField from "../components/form/input/SelectField";
import { ChevronDownIcon } from "../icons";
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

  const flatUnits = useMemo(() => flattenTree(tree), [tree]);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: OrgUnitPayload = {
        name: form.name,
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
      alert(errorMessage); // Temporary fallback, bisa diganti dengan toast error nanti
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: number, name: string) => {
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
      showSuccess(error?.message || "Gagal menghapus unit.");
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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">Struktur Organisasi</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tambah/pindah/hapus bagian secara dinamis. Role tetap generik, jabatan jadi title user.
            </p>
          </div>
          <Button variant="primary" onClick={() => openCreate(null)}>
            + Tambah Root
          </Button>
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-8">
            <LoadingSpinner size="md" text="Memuat struktur..." />
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
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
              <div className="space-y-1.5">
                {tree.map((node) => (
                  <TreeNode key={node.id} node={node} onCreate={openCreate} onEdit={openEdit} onDelete={handleDeleteClick} level={0} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Form */}
      <Modal isOpen={isModalOpen} onClose={closeModal} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {form.id ? "Edit Bagian" : "Tambah Bagian"}
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {form.id 
                ? "Perbarui informasi bagian organisasi."
                : "Tambahkan bagian baru ke struktur organisasi."}
            </p>
          </div>
          
          <form 
            className="flex flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="px-2 pb-3 space-y-5">
              <div>
                <Label htmlFor="name">
                  Nama Bagian <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Nama bagian"
                  disabled={saving}
                  required
                />
              </div>

              <div>
                <Label htmlFor="parent_id">Parent</Label>
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
              </div>

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

            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button 
                size="sm" 
                variant="outline" 
                type="button"
                onClick={closeModal}
                disabled={saving}
              >
                Batal
              </Button>
              <Button 
                size="sm" 
                type="submit"
                disabled={saving || !form.name.trim()}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <SpinnerIcon size="sm" />
                    Menyimpan...
                  </span>
                ) : (
                  'Simpan'
                )}
              </Button>
            </div>
          </form>
        </div>
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
        description="Pastikan tidak ada child atau user yang terhubung dengan unit ini. Tindakan ini tidak dapat dibatalkan."
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
  const indentSize = 20;

  return (
    <div className="relative">
      <div className="relative flex items-start">
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <button
            type="button"
            className="flex items-center justify-center w-5 h-5 min-w-5 min-h-5 mt-0.5 rounded-md transition-all duration-200 shrink-0 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            style={{ marginLeft: `${level * indentSize}px` }}
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Tutup" : "Buka"}
            aria-label={isExpanded ? "Tutup" : "Buka"}
          >
            <ChevronDownIcon 
              className={`w-4 h-4 text-gray-600 dark:text-gray-400 shrink-0 transition-transform duration-200 ${
                isExpanded ? 'rotate-0' : '-rotate-90'
              }`}
            />
          </button>
        ) : (
          <div
            className="w-5 h-5 shrink-0 mr-2"
            style={{ marginLeft: `${level * indentSize}px` }}
          />
        )}

        {/* Content Card */}
        <div className="flex-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-2.5 hover:border-brand-300 dark:hover:border-brand-700 transition-colors ml-1">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              {/* Status Indicator */}
              <div className={`h-2 w-2 rounded-full shrink-0 ${node.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              
              {/* Unit Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <div className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                    {node.name}
                  </div>
                  {level > 0 && (
                    <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 shrink-0">
                      L{level + 1}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {node.type || "Bagian"} · {node.is_active ? "Aktif" : "Nonaktif"}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0" style={{ position: 'relative', zIndex: 10 }}>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onCreate(node.id)}
                type="button"
              >
                + Child
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onEdit(node)}
                type="button"
              >
                Edit
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onDelete(node.id, node.name)}
                type="button"
              >
                Hapus
              </Button>
            </div>
          </div>
        </div>
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
            <div className="space-y-1.5">
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

