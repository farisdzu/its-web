import { useEffect, useMemo, useState, useCallback } from "react";
import { useDebounce } from "../hooks/useDebounce";
import PageMeta from "../components/common/PageMeta";
import { PageHeader } from "../components/common";
import Button from "../components/ui/button/Button";
import { Modal, ModalHeader, ModalContent, ModalFooter } from "../components/ui/modal";
import { ConfirmDialog } from "../components/ui/dialog";
import { SpinnerIcon } from "../components/ui/loading";
import { EmptyState } from "../components/ui/empty";
import { StatusIndicator } from "../components/ui/status";
import { ContainerCard, Card } from "../components/ui/card";
import Badge from "../components/ui/badge/Badge";
import Input from "../components/form/input/InputField";
import { FormField } from "../components/form";
import SelectField from "../components/form/input/SelectField";
import Checkbox from "../components/form/input/Checkbox";
import { userApi, orgUnitApi, UserListItem, CreateUserPayload, UpdateUserPayload, OrgUnitTreeNode } from "../services/api";
import ToastContainer from "../components/ui/toast/ToastContainer";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { PencilIcon, TrashBinIcon } from "../icons";
import ImportUserModal from "../components/users/ImportUserModal";
import { UserSkeleton } from "../components/users/UserSkeleton";

type FormState = {
  id?: number;
  name: string;
  email: string;
  username: string;
  phone: string;
  employee_id: string;
  role: 'admin' | 'user';
  password: string;
  password_confirmation: string;
  org_unit_id: string;
  title: string;
  is_active: boolean;
};

export default function Users() {
  const { showSuccess, showError } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  // Optimize: Start with loading=true to show skeleton immediately (better LCP)
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: number | null; name: string }>({
    isOpen: false,
    id: null,
    name: "",
  });
  const [deleting, setDeleting] = useState<boolean>(false);
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    username: "",
    phone: "",
    employee_id: "",
    role: "user",
    password: "",
    password_confirmation: "",
    org_unit_id: "",
    title: "",
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [originalUser, setOriginalUser] = useState<UserListItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<{
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  }>({
    current_page: 1,
    last_page: 1,
    per_page: 50,
    total: 0,
  });
  const [orgUnits, setOrgUnits] = useState<OrgUnitTreeNode[]>([]);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Flatten org units for select dropdown
  const flatOrgUnits = useMemo(() => {
    const flatten = (nodes: OrgUnitTreeNode[], level = 0): { id: number; label: string }[] => {
      const result: { id: number; label: string }[] = [];
      nodes.forEach((n) => {
        result.push({ id: n.id, label: `${"-- ".repeat(level)}${n.name}` });
        if (n.children && n.children.length > 0) {
          result.push(...flatten(n.children, level + 1));
        }
      });
      return result;
    };
    return flatten(orgUnits);
  }, [orgUnits]);

  const loadUsers = useCallback(async () => {
    // Don't set loading to true if already loading (optimize re-renders)
    setLoading((prev) => prev ? prev : true);
    try {
      // Optimize: Fetch users immediately
      const res = await userApi.list({
        search: debouncedSearchQuery || undefined,
        role: roleFilter || undefined,
        page: currentPage,
        per_page: 50,
        include_admin: true, // Always include admin
        include_inactive: true, // Always include inactive users
      });
      if (res.success && res.data) {
        // Optimize: Set users and loading state together for single render
        setUsers(res.data);
        // Check if res has meta property (PaginatedResponse)
        if ('meta' in res && res.meta) {
          setPagination({
            current_page: res.meta.current_page,
            last_page: res.meta.last_page,
            per_page: res.meta.per_page,
            total: res.meta.total,
          });
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (error: any) {
      console.error(error);
      showError(error.response?.data?.message || "Gagal memuat data user.");
      setLoading(false);
    }
  }, [debouncedSearchQuery, roleFilter, currentPage, showError]);

  const loadOrgUnits = useCallback(async () => {
    try {
      const res = await orgUnitApi.getTree();
      if (res.success && res.data) {
        setOrgUnits(res.data);
      }
    } catch (error: any) {
      console.error("Error loading org units:", error);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadOrgUnits();
  }, [loadOrgUnits]);

  const resetForm = () => {
    setForm({
      id: undefined,
      name: "",
      email: "",
      username: "",
      phone: "",
      employee_id: "",
      role: "user",
      password: "",
      password_confirmation: "",
      org_unit_id: "",
      title: "",
      is_active: true,
    });
    setFormErrors({});
    setOriginalUser(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const openCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEdit = (user: UserListItem) => {
    setForm({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username || "",
      phone: user.phone || "",
      employee_id: user.employee_id || "",
      role: user.role,
      password: "",
      password_confirmation: "",
      org_unit_id: user.org_unit_id?.toString() || "",
      title: user.title || "",
      is_active: user.is_active ?? true,
    });
    setFormErrors({});
    setOriginalUser(user); // Simpan data asli untuk perbandingan
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setFormErrors({});
    setSaving(true);

    try {
      // Validation
      const errors: Record<string, string> = {};
      if (!form.name.trim()) errors.name = "Nama wajib diisi.";
      if (!form.email.trim()) errors.email = "Email wajib diisi.";
      if (!form.email.includes("@")) errors.email = "Email tidak valid.";
      if (form.role !== "admin" && form.role !== "user") errors.role = "Role tidak valid.";
      
      if (!form.id) {
        // Create mode - password required
        if (!form.password) errors.password = "Password wajib diisi.";
        if (form.password.length < 8) errors.password = "Password minimal 8 karakter.";
        if (form.password !== form.password_confirmation) {
          errors.password_confirmation = "Password tidak cocok.";
        }
      } else {
        // Edit mode - password optional
        if (form.password && form.password.length < 8) {
          errors.password = "Password minimal 8 karakter.";
        }
        if (form.password && form.password !== form.password_confirmation) {
          errors.password_confirmation = "Password tidak cocok.";
        }
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        setSaving(false);
        return;
      }

      const payload: CreateUserPayload | UpdateUserPayload = {
        name: form.name.trim(),
        email: form.email.trim(),
        username: form.username.trim() || null,
        phone: form.phone.trim() || null,
        employee_id: form.employee_id.trim() || null,
        role: form.role,
        org_unit_id: form.org_unit_id ? parseInt(form.org_unit_id) : null,
        title: form.title.trim() || null,
        is_active: form.is_active,
      };

      if (!form.id) {
        // Create
        (payload as CreateUserPayload).password = form.password;
        const res = await userApi.store(payload as CreateUserPayload);
        if (res.success) {
          showSuccess("User berhasil dibuat.");
          closeModal();
          loadUsers();
        }
      } else {
        // Update
        if (form.password) {
          (payload as UpdateUserPayload).password = form.password;
        }
        const res = await userApi.update(form.id, payload as UpdateUserPayload);
        if (res.success) {
          showSuccess("User berhasil diperbarui.");
          closeModal();
          loadUsers();
        }
      }
    } catch (error: any) {
      console.error('Error saving user:', error);
      const errorMessage = error.response?.data?.message || "Terjadi kesalahan saat menyimpan user.";
      const errors = error.response?.data?.errors;
      
      if (errors) {
        // Convert Laravel validation errors format (array of messages) to string
        const formattedErrors: Record<string, string> = {};
        Object.keys(errors).forEach((key) => {
          const errorMessages = errors[key];
          if (Array.isArray(errorMessages)) {
            formattedErrors[key] = errorMessages[0]; // Take first error message
          } else if (typeof errorMessages === 'string') {
            formattedErrors[key] = errorMessages;
          }
        });
        setFormErrors(formattedErrors);
        // Show error message for first field error or general message
        const firstErrorKey = Object.keys(formattedErrors)[0];
        if (firstErrorKey) {
          showError(`${firstErrorKey}: ${formattedErrors[firstErrorKey]}`);
        } else if (errorMessage && errorMessage !== "Terjadi kesalahan saat menyimpan user.") {
          showError(errorMessage);
        }
      } else {
        showError(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: number, name: string) => {
    if (id === currentUser?.id) {
      showError("Anda tidak dapat menghapus akun sendiri.");
      return;
    }
    setDeleteConfirm({ isOpen: true, id, name });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.id) return;
    setDeleting(true);
    try {
      const res = await userApi.destroy(deleteConfirm.id);
      if (res.success) {
        showSuccess("User berhasil dihapus.");
        setDeleteConfirm({ isOpen: false, id: null, name: "" });
        loadUsers();
      }
    } catch (error: any) {
      showError(error.response?.data?.message || "Gagal menghapus user.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, id: null, name: "" });
  };

  const getRoleDisplayName = (role: string) => {
    return role === "admin" ? "Admin" : "User";
  };


  // Check if form has changes (only for edit mode)
  const hasChanges = useMemo(() => {
    if (!form.id || !originalUser) {
      // Create mode - always allow save
      return true;
    }

    // Compare all fields except password (password is optional in edit)
    const hasNameChange = form.name.trim() !== originalUser.name;
    const hasEmailChange = form.email.trim() !== originalUser.email;
    const hasUsernameChange = (form.username.trim() || null) !== (originalUser.username || null);
    const hasPhoneChange = (form.phone.trim() || null) !== (originalUser.phone || null);
    const hasEmployeeIdChange = (form.employee_id.trim() || null) !== (originalUser.employee_id || null);
    const hasRoleChange = form.role !== originalUser.role;
    const hasOrgUnitChange = (form.org_unit_id ? parseInt(form.org_unit_id) : null) !== originalUser.org_unit_id;
    const hasTitleChange = (form.title.trim() || null) !== (originalUser.title || null);
    const hasIsActiveChange = form.is_active !== originalUser.is_active;
    const hasPasswordChange = form.password.trim() !== ""; // Password change is optional

    return (
      hasNameChange ||
      hasEmailChange ||
      hasUsernameChange ||
      hasPhoneChange ||
      hasEmployeeIdChange ||
      hasRoleChange ||
      hasOrgUnitChange ||
      hasTitleChange ||
      hasIsActiveChange ||
      hasPasswordChange
    );
  }, [form, originalUser]);

  return (
    <>
      <PageMeta title="Kelola User" description="Tambah, edit, dan hapus user" />
      <ToastContainer />

      <div className="space-y-3 sm:space-y-4 px-2 sm:px-0">
        <PageHeader
          title="Kelola User"
          description="Tambah, edit, dan hapus user serta admin"
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
                Import Excel
              </Button>
            <Button variant="primary" onClick={openCreate}>
              + Tambah User
            </Button>
            </div>
          }
        />

        {/* Filters */}
        <ContainerCard padding="sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Cari" htmlFor="search">
              <Input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari nama, email, username..."
              />
            </FormField>
            <FormField label="Role" htmlFor="role-filter">
              <SelectField
                id="role-filter"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Semua Role</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </SelectField>
            </FormField>
          </div>
        </ContainerCard>

        {/* Users List */}
        {loading ? (
          <ContainerCard padding="sm">
            <UserSkeleton />
          </ContainerCard>
        ) : users.length === 0 ? (
          <ContainerCard padding="lg">
            <EmptyState
              title="Belum ada user"
              description="Tambahkan user baru untuk memulai"
              action={
                <Button variant="primary" size="sm" onClick={openCreate}>
                  + Tambah User
                </Button>
              }
            />
          </ContainerCard>
        ) : (
          <>
            <ContainerCard padding="sm">
              <div className="space-y-2">
                {users.map((user) => (
                  <Card key={user.id} padding="sm" hover className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <StatusIndicator
                        status={user.is_active ? "active" : "inactive"}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                            {user.name}
                          </div>
                          <Badge variant="light" color={user.role === "admin" ? "warning" : "info"} size="sm">
                            {getRoleDisplayName(user.role)}
                          </Badge>
                          {!user.is_active && (
                            <Badge variant="light" color="light" size="sm">
                              Nonaktif
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-gray-500 dark:text-gray-400">
                          <span className="truncate">{user.email}</span>
                          {user.username && (
                            <>
                              <span className="hidden sm:inline">·</span>
                              <span className="truncate">{user.username}</span>
                            </>
                          )}
                          {user.org_unit_name && (
                            <>
                              <span className="hidden sm:inline">·</span>
                              <span className="truncate">{user.org_unit_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(user)}
                        type="button"
                        className="text-xs sm:text-sm"
                      >
                        <PencilIcon className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">Edit</span>
                      </Button>
                      <div title={user.id === currentUser?.id ? "Tidak dapat menghapus akun sendiri" : undefined}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteClick(user.id, user.name)}
                          type="button"
                          disabled={user.id === currentUser?.id}
                          className="text-xs sm:text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-500/10"
                        >
                          <TrashBinIcon className="w-4 h-4" />
                          <span className="hidden sm:inline ml-1">Hapus</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ContainerCard>

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <ContainerCard padding="sm">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Menampilkan {((pagination.current_page - 1) * pagination.per_page) + 1} - {Math.min(pagination.current_page * pagination.per_page, pagination.total)} dari {pagination.total} user
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={pagination.current_page === 1}
                      type="button"
                    >
                      Sebelumnya
                    </Button>
                    <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
                      {pagination.current_page} / {pagination.last_page}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.min(pagination.last_page, p + 1))}
                      disabled={pagination.current_page === pagination.last_page}
                      type="button"
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              </ContainerCard>
            )}
          </>
        )}

        {/* Create/Edit Modal */}
        <Modal isOpen={isModalOpen} onClose={closeModal} className="max-w-2xl m-2 sm:m-4">
          <ModalContent maxWidth="800px">
            <ModalHeader
              title={form.id ? "Edit User" : "Tambah User"}
              description={form.id ? "Perbarui informasi user" : "Tambahkan user baru ke sistem"}
            />

            <form
              className="flex flex-col"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Nama Lengkap"
                    htmlFor="name"
                    required
                    error={formErrors.name}
                  >
                    <Input
                      id="name"
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Nama lengkap"
                      disabled={saving}
                    />
                  </FormField>

                  <FormField
                    label="Email"
                    htmlFor="email"
                    required
                    error={formErrors.email}
                  >
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="email@example.com"
                      disabled={saving}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Username"
                    htmlFor="username"
                    error={formErrors.username}
                  >
                    <Input
                      id="username"
                      type="text"
                      value={form.username}
                      onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                      placeholder="Username (opsional)"
                      disabled={saving}
                    />
                  </FormField>

                  <FormField
                    label="No. Telepon"
                    htmlFor="phone"
                    error={formErrors.phone}
                  >
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="+62 812-3456-7890"
                      disabled={saving}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Employee ID"
                    htmlFor="employee_id"
                    error={formErrors.employee_id}
                  >
                    <Input
                      id="employee_id"
                      type="text"
                      value={form.employee_id}
                      onChange={(e) => setForm((prev) => ({ ...prev, employee_id: e.target.value }))}
                      placeholder="Employee ID (opsional)"
                      disabled={saving}
                    />
                  </FormField>

                  <FormField
                    label="Role"
                    htmlFor="role"
                    required
                    error={formErrors.role}
                  >
                    <SelectField
                      id="role"
                      value={form.role}
                      onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as 'admin' | 'user' }))}
                      disabled={saving}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </SelectField>
                  </FormField>
                </div>

                {!form.id && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      label="Password"
                      htmlFor="password"
                      required={!form.id}
                      error={formErrors.password}
                    >
                      <Input
                        id="password"
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                        placeholder="Minimal 8 karakter"
                        disabled={saving}
                      />
                    </FormField>

                    <FormField
                      label="Konfirmasi Password"
                      htmlFor="password_confirmation"
                      required={!form.id}
                      error={formErrors.password_confirmation}
                    >
                      <Input
                        id="password_confirmation"
                        type="password"
                        value={form.password_confirmation}
                        onChange={(e) => setForm((prev) => ({ ...prev, password_confirmation: e.target.value }))}
                        placeholder="Ulangi password"
                        disabled={saving}
                      />
                    </FormField>
                  </div>
                )}

                {form.id && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      label="Password Baru (opsional)"
                      htmlFor="password"
                      error={formErrors.password}
                    >
                      <Input
                        id="password"
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                        placeholder="Kosongkan jika tidak ingin mengubah"
                        disabled={saving}
                      />
                    </FormField>

                    <FormField
                      label="Konfirmasi Password Baru"
                      htmlFor="password_confirmation"
                      error={formErrors.password_confirmation}
                    >
                      <Input
                        id="password_confirmation"
                        type="password"
                        value={form.password_confirmation}
                        onChange={(e) => setForm((prev) => ({ ...prev, password_confirmation: e.target.value }))}
                        placeholder="Ulangi password baru"
                        disabled={saving}
                      />
                    </FormField>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Bagian Organisasi"
                    htmlFor="org_unit_id"
                    error={formErrors.org_unit_id}
                  >
                    <SelectField
                      id="org_unit_id"
                      value={form.org_unit_id}
                      onChange={(e) => setForm((prev) => ({ ...prev, org_unit_id: e.target.value }))}
                      disabled={saving}
                    >
                      <option value="">Pilih Bagian (opsional)</option>
                      {flatOrgUnits.map((unit) => (
                        <option key={unit.id} value={unit.id.toString()}>
                          {unit.label}
                        </option>
                      ))}
                    </SelectField>
                  </FormField>

                  <FormField
                    label="Jabatan/Title"
                    htmlFor="title"
                    error={formErrors.title}
                  >
                    <Input
                      id="title"
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Contoh: Dekan, Kaprodi, dll"
                      disabled={saving}
                    />
                  </FormField>
                </div>

                <div>
                  <Checkbox
                    id="is_active"
                    label="Aktif"
                    checked={form.is_active}
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
                  disabled={saving || !hasChanges}
                  className="w-full sm:w-auto"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <SpinnerIcon size="sm" />
                      Menyimpan...
                    </span>
                  ) : (
                    form.id ? "Perbarui" : "Simpan"
                  )}
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Hapus User"
          message={
            <>
              Apakah Anda yakin ingin menghapus user{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                "{deleteConfirm.name}"
              </span>
              ?
            </>
          }
          description="Tindakan ini tidak dapat dibatalkan. Semua data user akan dihapus secara permanen."
          confirmText="Hapus"
          cancelText="Batal"
          variant="danger"
          isLoading={deleting}
        />

        {/* Import User Modal */}
        <ImportUserModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportSuccess={() => {
            loadUsers();
            setIsImportModalOpen(false);
          }}
        />

      </div>
    </>
  );
}

