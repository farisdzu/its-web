import { useEffect, useMemo, useState, useCallback } from "react";
import { useDebounce } from "../hooks/useDebounce";
import PageMeta from "../components/common/PageMeta";
import { PageHeader, SectionHeader } from "../components/common";
import { UserListItem as UserCard } from "../components/user";
import Button from "../components/ui/button/Button";
import { Modal, ModalHeader, ModalContent, ModalFooter } from "../components/ui/modal";
import { ConfirmDialog } from "../components/ui/dialog";
import { LoadingSpinner, SpinnerIcon } from "../components/ui/loading";
import { EmptyState } from "../components/ui/empty";
import { ContainerCard } from "../components/ui/card";
import { TreeSkeleton, TreeNode } from "../components/org-units";
import Input from "../components/form/input/InputField";
import { FormField } from "../components/form";
import Checkbox from "../components/form/input/Checkbox";
import MultiSelect from "../components/form/MultiSelect";
import { orgUnitApi, userApi, OrgUnitPayload, OrgUnitTreeNode, UserListItem, AssignUserPayload } from "../services/api";
import ToastContainer from "../components/ui/toast/ToastContainer";
import { useToast } from "../context/ToastContext";
import { LockIcon } from "../icons";

type FormState = {
  id?: number;
  name: string;
  parent_id: number | null; // Backward compatibility
  parent_ids: number[]; // Multiple parents
  type?: string | null;
  code?: string | null;
  order?: number | null;
  is_active?: boolean;
};

export default function OrgUnits() {
  const { showSuccess, showError } = useToast();
  const [tree, setTree] = useState<OrgUnitTreeNode[]>([]);
  // Optimize: Start with loading=true to show skeleton immediately (better LCP)
  const [loading, setLoading] = useState<boolean>(true);
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
    parent_ids: [],
    type: null,
    code: null,
    order: null,
    is_active: true,
  });
  const [formError, setFormError] = useState<string>("");
  const [manageUsers, setManageUsers] = useState<{ isOpen: boolean; orgUnitId: number | null; orgUnitName: string }>({
    isOpen: false,
    orgUnitId: null,
    orgUnitName: "",
  });
  const [orgUnitUsers, setOrgUnitUsers] = useState<UserListItem[]>([]);
  const [allUsers, setAllUsers] = useState<UserListItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [assigning, setAssigning] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(true); // Default locked untuk safety
  const [unlockConfirm, setUnlockConfirm] = useState<boolean>(false);

  const flatUnits = useMemo(() => flattenTree(tree), [tree]);

  // Optimized: Create index map for O(1) node lookup instead of O(n) recursive search
  const nodeMap = useMemo(() => {
    const map = new Map<number, OrgUnitTreeNode>();
    const buildMap = (nodes: OrgUnitTreeNode[]) => {
      nodes.forEach((node) => {
        map.set(node.id, node);
        if (node.children && node.children.length > 0) {
          buildMap(node.children);
        }
      });
    };
    buildMap(tree);
    return map;
  }, [tree]);

  // Optimized: O(1) lookup instead of O(n) recursive search
  const findNodeById = useCallback((id: number): OrgUnitTreeNode | null => {
    return nodeMap.get(id) || null;
  }, [nodeMap]);

  const loadTree = useCallback(async () => {
    setLoading(true);
    try {
      // Optimize: Fetch tree data immediately, backend has 5min cache
      const res = await orgUnitApi.getTree();
      if (res.success && res.data) {
        // Optimize: Set tree immediately in same tick for faster render
        setTree(res.data);
      }
    } catch (error: any) {
      console.error(error);
    } finally {
      // Set loading to false in next tick to allow render to complete
      setLoading(false);
    }
  }, []);

  // Optimize: Start loading immediately on mount, don't wait for render
  useEffect(() => {
    // Start API call immediately - this is the critical path for LCP
    loadTree();
  }, [loadTree]);

  const resetForm = () => {
    setForm({
      id: undefined,
      name: "",
      parent_id: null,
      parent_ids: [],
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
    if (isLocked) {
      showError("Struktur organisasi terkunci. Buka kunci terlebih dahulu untuk menambah bagian.");
      return;
    }
    resetForm();
    
    // Find the parent node to inherit its parents (O(1) lookup with nodeMap)
    let parentIds: number[] = [];
    if (parentId) {
      const parentNode = findNodeById(parentId);
      if (parentNode) {
        // If parent has multiple parents, child inherits all of them
        // This means child will appear under all the same parents as its direct parent
        if (parentNode.parent_ids && parentNode.parent_ids.length > 0) {
          // Parent has multiple parents, child inherits all of them
          parentIds = [...parentNode.parent_ids];
        } else {
          // Parent only has one parent (or none), child just has parent as direct parent
          parentIds = [parentId];
        }
      } else {
        // Fallback: if node not found, just use parentId
        parentIds = [parentId];
      }
    }
    
    setForm((prev) => ({ 
      ...prev, 
      parent_id: parentId, // Backward compatibility (use first parent or parentId)
      parent_ids: parentIds
    }));
    setIsModalOpen(true);
  };

  const openEdit = (node: OrgUnitTreeNode) => {
    if (isLocked) {
      showError("Struktur organisasi terkunci. Buka kunci terlebih dahulu untuk mengedit bagian.");
      return;
    }
    setForm({
      id: node.id,
      name: node.name,
      parent_id: node.parent_id, // Backward compatibility
      parent_ids: node.parent_ids || (node.parent_id ? [node.parent_id] : []),
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
        parent_id: form.parent_id ?? null, // Backward compatibility
        parent_ids: form.parent_ids.length > 0 ? form.parent_ids : undefined,
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
        // For other errors, show error toast (red)
        showError(errorMessage, 5000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: number, name: string) => {
    if (isLocked) {
      showError("Struktur organisasi terkunci. Buka kunci terlebih dahulu untuk menghapus bagian.");
      return;
    }
    // Check if node has children or users BEFORE showing modal (O(1) lookup)
    const node = findNodeById(id);
    const hasChildren = Boolean(node && node.children && node.children.length > 0);
    const hasUsers = Boolean(node && node.user_count && node.user_count > 0);

    if (hasChildren) {
      // If has children, show immediate feedback without dialog
      const childCount = node?.children?.length || 0;
      showError(
        `Tidak bisa menghapus "${name}": masih ada ${childCount} bagian di bawahnya. Hapus atau pindahkan bagian-bagian tersebut terlebih dahulu.`,
        5000
      );
      return;
    }

    if (hasUsers) {
      // If has users, show immediate feedback without dialog
      const userCount = node?.user_count || 0;
      showError(
        `Tidak bisa menghapus "${name}": masih ada ${userCount} user di bagian ini. Unassign atau pindahkan user tersebut terlebih dahulu.`,
        5000
      );
      return;
    }

    // If no children and no users, show confirmation dialog
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
      showError(error?.message || "Gagal menghapus unit.", 5000);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, id: null, name: "" });
  };

  const handleUnlockConfirm = () => {
    setIsLocked(false);
    setUnlockConfirm(false);
    showSuccess("Struktur organisasi dibuka. Anda sekarang dapat mengelola bagian.");
  };

  const handleUnlockCancel = () => {
    setUnlockConfirm(false);
  };

  const openManageUsers = async (orgUnitId: number, orgUnitName: string) => {
    if (isLocked) {
      showError("Struktur organisasi terkunci. Buka kunci terlebih dahulu untuk mengelola user.");
      return;
    }
    setManageUsers({ isOpen: true, orgUnitId, orgUnitName });
    setLoadingUsers(true);
    try {
      // Load users in this org unit
      const orgUnitRes = await orgUnitApi.getUsers(orgUnitId);
      if (orgUnitRes.success && orgUnitRes.data) {
        setOrgUnitUsers(orgUnitRes.data.users || []);
      }

      // Load all users for assignment
      const usersRes = await userApi.list();
      if (usersRes.success && usersRes.data) {
        setAllUsers(usersRes.data || []);
      }
    } catch (error: any) {
      console.error("Error loading users:", error);
      showError(error?.message || "Gagal memuat data user.", 5000);
    } finally {
      setLoadingUsers(false);
    }
  };

  const closeManageUsers = () => {
    setManageUsers({ isOpen: false, orgUnitId: null, orgUnitName: "" });
    setOrgUnitUsers([]);
    setAllUsers([]);
    setSearchQuery("");
  };

  const handleAssignUser = async (userId: number, title?: string) => {
    if (!manageUsers.orgUnitId) return;

    setAssigning(userId);
    try {
      const payload: AssignUserPayload = {
        org_unit_id: manageUsers.orgUnitId,
        title: title || null,
      };

      const res = await userApi.assign(userId, payload);
      if (!res.success) throw new Error(res.message || "Gagal assign user.");

      // Refresh tree FIRST to update user count badge (cache sudah di-clear di backend)
      await loadTree();
      
      // Then reload users in modal
      await openManageUsers(manageUsers.orgUnitId, manageUsers.orgUnitName);
    } catch (error: any) {
      console.error("Error assigning user:", error);
      showError(error?.message || "Gagal assign user.", 5000);
    } finally {
      setAssigning(null);
    }
  };

  const handleUnassignUser = async (userId: number) => {
    try {
      const res = await userApi.unassign(userId);
      if (!res.success) throw new Error(res.message || "Gagal unassign user.");

      // Refresh tree FIRST to update user count badge (cache sudah di-clear di backend)
      await loadTree();
      
      // Then reload users in modal
      if (manageUsers.orgUnitId) {
        await openManageUsers(manageUsers.orgUnitId, manageUsers.orgUnitName);
      }
    } catch (error: any) {
      console.error("Error unassigning user:", error);
      showError(error?.message || "Gagal unassign user.", 5000);
    }
  };

  // Filter users for assignment (exclude already assigned users)
  const availableUsers = useMemo(() => {
    const assignedUserIds = new Set(orgUnitUsers.map(u => u.id));
    return allUsers.filter(u => !assignedUserIds.has(u.id));
  }, [allUsers, orgUnitUsers]);

  // Debounce search query to reduce API calls (300ms delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Load users from API when search query changes (debounced)
  useEffect(() => {
    if (!manageUsers.isOpen) return;

    const loadSearchResults = async () => {
      if (!debouncedSearchQuery.trim()) {
        // If search is empty, reload all users
        const usersRes = await userApi.list({ per_page: 100 });
        if (usersRes.success && usersRes.data) {
          setAllUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
        }
        return;
      }

      setLoadingUsers(true);
      try {
        const usersRes = await userApi.list({ 
          search: debouncedSearchQuery,
          per_page: 100 
        });
        if (usersRes.success && usersRes.data) {
          setAllUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
        }
      } catch (error: any) {
        console.error("Error searching users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadSearchResults();
  }, [debouncedSearchQuery, manageUsers.isOpen]);

  // Filter by search query (client-side filter for instant feedback)
  const filteredAvailableUsers = useMemo(() => {
    if (!searchQuery.trim()) return availableUsers;
    const query = searchQuery.toLowerCase();
    return availableUsers.filter(u =>
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.username?.toLowerCase().includes(query) ||
      u.employee_id?.toLowerCase().includes(query)
    );
  }, [availableUsers, searchQuery]);

  return (
    <>
      <PageMeta title="Struktur Organisasi" description="Kelola struktur org dinamis" />
      <ToastContainer />

      <div className="space-y-3 sm:space-y-4 px-2 sm:px-0">
        <PageHeader
          title="Struktur Organisasi"
          description={
            isLocked 
              ? "Struktur terkunci. Buka kunci untuk mengelola bagian."
              : "Tambah/pindah/hapus bagian secara dinamis. Role tetap generik, jabatan jadi title user."
          }
          action={
            <div className="flex items-center gap-2">
              <Button
                variant={isLocked ? "primary" : "outline"}
                onClick={() => {
                  if (isLocked) {
                    setUnlockConfirm(true);
                  } else {
                    setIsLocked(true);
                    showSuccess("Struktur organisasi dikunci. Perubahan tidak dapat dilakukan.");
                  }
                }}
                className="flex items-center gap-1.5"
              >
                <LockIcon className={`w-4 h-4 ${isLocked ? "" : "opacity-60"}`} />
                {isLocked ? "Buka Kunci" : "Kunci"}
              </Button>
              {!isLocked && (
                <Button variant="primary" onClick={() => openCreate(null)}>
                  + Tambah Root
                </Button>
              )}
            </div>
          }
        />

        {loading ? (
          <ContainerCard padding="sm">
            <TreeSkeleton />
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
                  <TreeNode 
                    key={node.id} 
                    node={node} 
                    onCreate={openCreate} 
                    onEdit={openEdit} 
                    onDelete={handleDeleteClick}
                    onManageUsers={openManageUsers}
                    isLocked={isLocked}
                    level={0} 
                  />
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
                label="Atasan (Parent)"
                htmlFor="parent_ids"
              >
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Pilih satu atau lebih atasan untuk bagian ini. Kosongkan jika ini adalah root.
                  </p>
                  <MultiSelect
                    label=""
                    options={flatUnits
                      .filter((u) => u.id !== form.id)
                      .map((u) => ({
                        value: String(u.id),
                        text: u.indentLabel,
                      }))}
                    value={form.parent_ids.map(id => String(id))}
                    onChange={(selected) => {
                      const parentIds = selected.map(id => Number(id));
                      setForm((prev) => ({ 
                        ...prev, 
                        parent_ids: parentIds,
                        parent_id: parentIds.length === 1 ? parentIds[0] : (parentIds.length > 0 ? parentIds[0] : null) // Backward compatibility
                      }));
                    }}
                    placeholder="Pilih atasan (bisa lebih dari satu)..."
                    disabled={saving}
                  />
                </div>
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
              <div title={isLocked ? "Buka kunci struktur terlebih dahulu" : undefined}>
                <Button
                  size="sm"
                  type="submit"
                  disabled={saving || !form.name.trim() || isLocked}
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
              </div>
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

      {/* Unlock Confirmation Dialog */}
      <ConfirmDialog
        isOpen={unlockConfirm}
        onClose={handleUnlockCancel}
        onConfirm={handleUnlockConfirm}
        title="Buka Kunci Struktur Organisasi"
        message="Anda yakin ingin membuka kunci struktur organisasi?"
        description="Ini akan memungkinkan perubahan pada struktur (tambah, edit, hapus bagian)."
        confirmText="Buka Kunci"
        cancelText="Batal"
        variant="default"
      />

      {/* Manage Users Modal */}
      <Modal isOpen={manageUsers.isOpen} onClose={closeManageUsers} className="max-w-2xl m-2 sm:m-4">
        <ModalContent maxWidth="700px">
          <ModalHeader
            title={`Kelola User - ${manageUsers.orgUnitName}`}
            description="Assign atau unassign user ke bagian ini"
          />

          {loadingUsers ? (
            <div className="py-8">
              <LoadingSpinner size="md" text="Memuat data user..." />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Section 1: Users di Bagian Ini */}
              <div>
                <SectionHeader
                  title="User di Bagian Ini"
                  count={orgUnitUsers.length}
                />
                {orgUnitUsers.length === 0 ? (
                  <EmptyState
                    title="Belum ada user"
                    description="Belum ada user yang di-assign ke bagian ini."
                    className="py-4"
                  />
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {orgUnitUsers.map((user) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        onAction={handleUnassignUser}
                        actionLabel="Unassign"
                        actionVariant="outline"
                        showTitle={true}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Tambah User */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                <SectionHeader
                  title="Tambah User"
                />
                <FormField
                  label="Cari User"
                  htmlFor="search-user"
                >
                  <Input
                    id="search-user"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari berdasarkan nama, email, username, atau employee ID..."
                  />
                </FormField>

                {filteredAvailableUsers.length === 0 ? (
                  <EmptyState
                    title={searchQuery.trim() ? "Tidak ada user yang cocok" : "Semua user sudah di-assign"}
                    description={searchQuery.trim() ? "Coba gunakan kata kunci lain." : "Semua user sudah ter-assign ke bagian lain."}
                    className="mt-3 py-4"
                  />
                ) : (
                  <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto">
                    {filteredAvailableUsers.map((user) => {
                      const hasOrgUnit = user.org_unit_id !== null && user.org_unit_id !== undefined;
                      const isAssigning = assigning === user.id;

                      return (
                        <UserCard
                          key={user.id}
                          user={user}
                          onAction={handleAssignUser}
                          actionLabel="Assign"
                          actionVariant="primary"
                          isLoading={isAssigning}
                          isDisabled={hasOrgUnit}
                          disabledTooltip="User sudah memiliki bagian. Unassign dulu dari bagian sebelumnya."
                          showOrgUnit={true}
                          showTitle={false}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <ModalFooter>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={closeManageUsers}
              className="w-full sm:w-auto"
            >
              Tutup
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
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


