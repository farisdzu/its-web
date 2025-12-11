import { useEffect, useMemo, useState } from "react";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
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

  const openCreate = (parentId: number | null) => {
    resetForm();
    setForm((prev) => ({ ...prev, parent_id: parentId }));
    // Scroll to form
    setTimeout(() => {
      const formElement = document.querySelector('[data-org-form]');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
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

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3" data-org-form>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {form.id ? "Edit Bagian" : "Tambah Bagian"}
            </h2>
            {form.id && (
              <Button variant="ghost" size="sm" onClick={resetForm}>
                + Baru
              </Button>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama</label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Nama bagian"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Parent</label>
            <select
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              value={form.parent_id ?? ""}
              onChange={(e) => {
                const val = e.target.value === "" ? null : Number(e.target.value);
                setForm((prev) => ({ ...prev, parent_id: val }));
              }}
            >
              <option value="">(Root)</option>
              {flatUnits
                .filter((u) => u.id !== form.id)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.indentLabel}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="is_active"
              type="checkbox"
              checked={form.is_active ?? true}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
            />
            <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
              Aktif
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetForm}>
              Reset
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </div>
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCreate(node.id);
            }}
            type="button"
          >
            + Child
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(node);
            }}
            type="button"
          >
            Edit
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(node.id);
            }}
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

