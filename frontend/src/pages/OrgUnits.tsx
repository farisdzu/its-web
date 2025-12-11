import { useEffect, useMemo, useState } from "react";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import { Modal } from "../components/ui/modal";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
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

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus unit ini? Pastikan tidak ada child/user.")) return;
    try {
      const res = await orgUnitApi.remove(id);
      if (!res.success) throw new Error(res.message || "Gagal menghapus.");
      showSuccess("Unit dihapus.");
      await loadTree();
    } catch (error: any) {
      console.error(error);
    }
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
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-6">Memuat struktur...</div>
        ) : (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            {tree.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">Belum ada data. Tambah root untuk memulai.</div>
            ) : (
              <div className="space-y-2">
                {tree.map((node) => (
                  <TreeNode key={node.id} node={node} onCreate={openCreate} onEdit={openEdit} onDelete={handleDelete} level={0} />
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
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
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
    </>
  );
}

function TreeNode({
  node,
  level,
  onCreate,
  onEdit,
  onDelete,
}: {
  node: OrgUnitTreeNode;
  level: number;
  onCreate: (parentId: number | null) => void;
  onEdit: (node: OrgUnitTreeNode) => void;
  onDelete: (id: number) => void;
}) {
  const indent = level * 16;
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3" style={{ position: 'relative' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2" style={{ paddingLeft: indent }}>
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <div>
            <div className="text-sm font-semibold text-gray-800 dark:text-white/90">{node.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {node.type || "Bagian"} · {node.is_active ? "Aktif" : "Nonaktif"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2" style={{ position: 'relative', zIndex: 10 }}>
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
            onClick={() => onDelete(node.id)}
            type="button"
          >
            Hapus
          </Button>
        </div>
      </div>
      {node.children && node.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} level={level + 1} onCreate={onCreate} onEdit={onEdit} onDelete={onDelete} />
          ))}
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

