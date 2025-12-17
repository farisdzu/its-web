# Development Guide - ITS Web Application

Panduan standar untuk mengembangkan fitur dan halaman baru yang optimal dan konsisten.

## 📋 Table of Contents

1. [Performance Optimization](#performance-optimization)
2. [Component Structure](#component-structure)
3. [Page Development Pattern](#page-development-pattern)
4. [API Integration](#api-integration)
5. [State Management](#state-management)
6. [Loading States](#loading-states)
7. [Error Handling](#error-handling)
8. [Code Organization](#code-organization)

---

## ⚡ Performance Optimization

### 1. Initial Loading State

**✅ DO:**
```typescript
// Always start with loading = true untuk immediate skeleton display
const [loading, setLoading] = useState<boolean>(true);
```

**❌ DON'T:**
```typescript
// Jangan mulai dengan false - skeleton akan muncul terlambat
const [loading, setLoading] = useState<boolean>(false);
```

**Alasan:** Skeleton muncul segera, meningkatkan LCP (Largest Contentful Paint).

### 2. Skeleton Loading Components

**✅ DO:**
- Buat skeleton component terpisah di `src/components/{feature}/`
- Skeleton harus mirip struktur konten asli
- Gunakan `animate-pulse` untuk animasi
- Minimal 3-5 skeleton items

**Contoh:**
```typescript
// src/components/users/UserSkeleton.tsx
export function UserSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="p-4 bg-white dark:bg-gray-800 rounded-lg">
          {/* Skeleton structure mirip user card */}
        </div>
      ))}
    </div>
  );
}
```

### 3. Optimize State Updates

**✅ DO:**
```typescript
const loadData = useCallback(async () => {
  setLoading((prev) => prev ? prev : true); // Prevent unnecessary re-render
  try {
    const res = await api.getData();
    if (res.success && res.data) {
      // Set state together untuk single render
      setData(res.data);
      setLoading(false);
    } else {
      setLoading(false);
    }
  } catch (error) {
    setLoading(false);
    // Handle error
  }
}, [dependencies]);
```

**❌ DON'T:**
```typescript
// Jangan set loading di finally - bisa menyebabkan double render
setLoading(true);
try {
  // ...
} finally {
  setLoading(false); // Bisa conflict dengan setLoading di success
}
```

### 4. Preconnect Links

**✅ DO:**
- Preconnect sudah otomatis via `PreconnectLinks` component di `main.tsx`
- Tidak perlu setup manual - otomatis detect dari `VITE_API_URL`

**Note:** Preconnect sudah di-handle otomatis, tidak perlu setup manual.

---

## 🏗️ Component Structure

### 1. File Organization

```
src/
├── components/
│   ├── {feature}/           # Feature-specific components
│   │   ├── {Feature}Skeleton.tsx
│   │   ├── {Feature}Card.tsx
│   │   └── index.ts          # Export semua components
│   └── common/              # Shared components
├── pages/
│   └── {Feature}.tsx         # Main page component
└── services/
    └── api.ts                # API service
```

### 2. Component Naming

- **Skeleton:** `{Feature}Skeleton.tsx` (e.g., `UserSkeleton.tsx`)
- **Card/Item:** `{Feature}Card.tsx` atau `{Feature}Item.tsx`
- **Modal:** `{Feature}Modal.tsx` atau `{Action}{Feature}Modal.tsx`

### 3. Export Pattern

**✅ DO:**
```typescript
// src/components/users/index.ts
export { UserSkeleton } from "./UserSkeleton";
export { default as UserCard } from "./UserCard";
```

**Usage:**
```typescript
import { UserSkeleton, UserCard } from "../components/users";
```

---

## 📄 Page Development Pattern

### 1. Standard Page Structure

```typescript
import { useEffect, useMemo, useState, useCallback } from "react";
import { useDebounce } from "../hooks/useDebounce";
import PageMeta from "../components/common/PageMeta";
import { PageHeader } from "../components/common";
import { ContainerCard } from "../components/ui/card";
import { {Feature}Skeleton } from "../components/{feature}";
import { featureApi } from "../services/api";
import { useToast } from "../context/ToastContext";

export default function {Feature}() {
  const { showSuccess, showError } = useToast();
  
  // State
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // ✅ Start with true
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Debounce search
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Load data
  const loadData = useCallback(async () => {
    setLoading((prev) => prev ? prev : true);
    try {
      const res = await featureApi.list({
        search: debouncedSearchQuery || undefined,
      });
      if (res.success && res.data) {
        setData(res.data);
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (error: any) {
      console.error(error);
      showError(error.response?.data?.message || "Gagal memuat data.");
      setLoading(false);
    }
  }, [debouncedSearchQuery, showError]);
  
  // Load on mount
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  return (
    <>
      <PageMeta title="{Feature}" description="..." />
      
      <div className="space-y-3 sm:space-y-4 px-2 sm:px-0">
        <PageHeader
          title="{Feature}"
          description="..."
          action={
            <Button variant="primary" onClick={handleCreate}>
              + Tambah
            </Button>
          }
        />
        
        {/* Search/Filter */}
        <ContainerCard padding="sm">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari..."
          />
        </ContainerCard>
        
        {/* Content */}
        {loading ? (
          <ContainerCard padding="sm">
            <{Feature}Skeleton />
          </ContainerCard>
        ) : data.length === 0 ? (
          <ContainerCard padding="sm">
            <EmptyState
              title="Belum ada data"
              description="..."
              action={
                <Button variant="primary" size="sm" onClick={handleCreate}>
                  + Tambah
                </Button>
              }
            />
          </ContainerCard>
        ) : (
          <ContainerCard padding="sm">
            {/* Render data */}
          </ContainerCard>
        )}
      </div>
    </>
  );
}
```

### 2. Required Imports

**Always include:**
- `useEffect, useMemo, useState, useCallback` from React
- `useDebounce` hook untuk search
- `PageMeta` untuk SEO
- `PageHeader` untuk header konsisten
- `ContainerCard` untuk container
- `useToast` untuk notifications
- Skeleton component untuk loading state

---

## 🔌 API Integration

### 1. API Service Pattern

**✅ DO:**
```typescript
// services/api.ts
export const featureApi = {
  list: async (params?: { search?: string; page?: number }): Promise<PaginatedResponse<FeatureItem[]>> => {
    const response = await api.get<PaginatedResponse<FeatureItem[]>>('/features', { params });
    return response.data;
  },
  store: async (payload: CreateFeaturePayload): Promise<ApiResponse<FeatureItem>> => {
    const response = await api.post<ApiResponse<FeatureItem>>('/features', payload);
    return response.data;
  },
  // ...
};
```

### 2. Error Handling

**✅ DO:**
```typescript
try {
  const res = await featureApi.list();
  if (res.success && res.data) {
    setData(res.data);
  } else {
    showError(res.message || "Gagal memuat data.");
  }
} catch (error: any) {
  console.error(error);
  showError(
    error.response?.data?.message || 
    error.message || 
    "Terjadi kesalahan. Silakan coba lagi."
  );
}
```

### 3. Loading State Management

**✅ DO:**
- Set loading di awal function
- Set loading = false di setiap branch (success, error, empty)
- Jangan gunakan `finally` untuk set loading (bisa conflict)

---

## 🎯 State Management

### 1. Local State Pattern

**✅ DO:**
```typescript
// Simple state
const [data, setData] = useState<DataType[]>([]);
const [loading, setLoading] = useState<boolean>(true);

// Complex state (use object untuk related states)
const [form, setForm] = useState<FormState>({
  name: "",
  email: "",
  // ...
});

// Modal state
const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
```

### 2. useMemo untuk Derived Data

**✅ DO:**
```typescript
// Expensive calculations
const filteredData = useMemo(() => {
  return data.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [data, searchQuery]);
```

### 3. useCallback untuk Functions

**✅ DO:**
```typescript
// Functions yang digunakan di dependencies
const loadData = useCallback(async () => {
  // ...
}, [dependencies]);

// Event handlers yang complex
const handleSave = useCallback(async () => {
  // ...
}, [form, dependencies]);
```

---

## 🔄 Loading States

### 1. Skeleton Loading

**✅ DO:**
- Buat skeleton component terpisah
- Skeleton harus mirip struktur konten
- Minimal 3-5 items
- Gunakan `animate-pulse`

**Template:**
```typescript
export function {Feature}Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="p-4 bg-white dark:bg-gray-800 rounded-lg">
          {/* Skeleton structure */}
        </div>
      ))}
    </div>
  );
}
```

### 2. Button Loading States

**✅ DO:**
```typescript
<Button
  variant="primary"
  onClick={handleSave}
  disabled={saving}
>
  {saving ? (
    <>
      <SpinnerIcon size="sm" />
      <span>Menyimpan...</span>
    </>
  ) : (
    "Simpan"
  )}
</Button>
```

---

## ❌ Error Handling

### 1. API Errors

**✅ DO:**
```typescript
try {
  const res = await api.action();
  if (!res.success) {
    showError(res.message || "Gagal melakukan aksi.");
    return;
  }
  showSuccess("Berhasil!");
} catch (error: any) {
  console.error(error);
  showError(
    error.response?.data?.message || 
    "Terjadi kesalahan. Silakan coba lagi."
  );
}
```

### 2. Form Validation

**✅ DO:**
```typescript
const [formErrors, setFormErrors] = useState<Record<string, string>>({});

const validateForm = (): boolean => {
  const errors: Record<string, string> = {};
  
  if (!form.name.trim()) {
    errors.name = "Nama wajib diisi";
  }
  
  setFormErrors(errors);
  return Object.keys(errors).length === 0;
};
```

---

## 📁 Code Organization

### 1. File Size

- **Page components:** Max 800-1000 lines
- **Feature components:** Max 300-500 lines
- **Jika terlalu besar:** Extract ke sub-components

### 2. Component Extraction

**Extract jika:**
- Component > 300 lines
- Logic bisa reusable
- Complex rendering logic

**Contoh:**
```
pages/Users.tsx (800 lines)
  → Extract: components/users/UserCard.tsx
  → Extract: components/users/UserSkeleton.tsx
  → Extract: components/users/UserFormModal.tsx
```

### 3. Import Order

```typescript
// 1. React & React hooks
import { useEffect, useState, useCallback } from "react";

// 2. Custom hooks
import { useDebounce } from "../hooks/useDebounce";

// 3. Components - Common
import PageMeta from "../components/common/PageMeta";
import { PageHeader } from "../components/common";

// 4. Components - UI
import Button from "../components/ui/button/Button";
import { ContainerCard } from "../components/ui/card";

// 5. Components - Feature
import { UserSkeleton } from "../components/users";

// 6. Services
import { userApi } from "../services/api";

// 7. Context
import { useToast } from "../context/ToastContext";

// 8. Icons
import { PencilIcon } from "../icons";
```

---

## ✅ Checklist untuk Page/Feature Baru

### Performance
- [ ] Initial loading state = `true`
- [ ] Skeleton component dibuat dan digunakan
- [ ] State updates dioptimasi (set together)
- [ ] useCallback untuk functions dengan dependencies
- [ ] useMemo untuk expensive calculations

### Code Quality
- [ ] Components di-extract jika > 300 lines
- [ ] Import order sesuai standar
- [ ] Error handling lengkap
- [ ] Loading states untuk semua async operations
- [ ] TypeScript types lengkap

### UX
- [ ] Skeleton loading untuk initial load
- [ ] Empty state dengan action button
- [ ] Success/Error toast notifications
- [ ] Disabled states untuk buttons saat loading
- [ ] Responsive design (mobile & desktop)

### API Integration
- [ ] API service di `services/api.ts`
- [ ] Error handling dengan user-friendly messages
- [ ] Loading states untuk semua API calls
- [ ] Debounce untuk search/filter

---

## 📝 Template: New Page

Copy template ini untuk page baru:

```typescript
import { useEffect, useMemo, useState, useCallback } from "react";
import { useDebounce } from "../hooks/useDebounce";
import PageMeta from "../components/common/PageMeta";
import { PageHeader } from "../components/common";
import Button from "../components/ui/button/Button";
import { ContainerCard } from "../components/ui/card";
import { EmptyState } from "../components/ui/empty";
import Input from "../components/form/input/InputField";
import { FormField } from "../components/form";
import { {Feature}Skeleton } from "../components/{feature}";
import { featureApi, FeatureItem } from "../services/api";
import { useToast } from "../context/ToastContext";

export default function {Feature}() {
  const { showSuccess, showError } = useToast();
  const [data, setData] = useState<FeatureItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  const loadData = useCallback(async () => {
    setLoading((prev) => prev ? prev : true);
    try {
      const res = await featureApi.list({
        search: debouncedSearchQuery || undefined,
      });
      if (res.success && res.data) {
        setData(res.data);
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (error: any) {
      console.error(error);
      showError(error.response?.data?.message || "Gagal memuat data.");
      setLoading(false);
    }
  }, [debouncedSearchQuery, showError]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  return (
    <>
      <PageMeta title="{Feature}" description="..." />
      
      <div className="space-y-3 sm:space-y-4 px-2 sm:px-0">
        <PageHeader
          title="{Feature}"
          description="..."
          action={
            <Button variant="primary" onClick={() => {}}>
              + Tambah
            </Button>
          }
        />
        
        <ContainerCard padding="sm">
          <FormField label="Cari" htmlFor="search">
            <Input
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari..."
            />
          </FormField>
        </ContainerCard>
        
        {loading ? (
          <ContainerCard padding="sm">
            <{Feature}Skeleton />
          </ContainerCard>
        ) : data.length === 0 ? (
          <ContainerCard padding="sm">
            <EmptyState
              title="Belum ada data"
              description="..."
              action={
                <Button variant="primary" size="sm" onClick={() => {}}>
                  + Tambah
                </Button>
              }
            />
          </ContainerCard>
        ) : (
          <ContainerCard padding="sm">
            {/* Render data */}
          </ContainerCard>
        )}
      </div>
    </>
  );
}
```

---

## 🎯 Quick Reference

### Performance Best Practices
1. ✅ `loading = true` di initial state
2. ✅ Skeleton component untuk loading
3. ✅ State updates bersamaan (single render)
4. ✅ useCallback untuk functions
5. ✅ useMemo untuk expensive calculations

### Code Organization
1. ✅ Extract components jika > 300 lines
2. ✅ Skeleton di `components/{feature}/`
3. ✅ Import order sesuai standar
4. ✅ Types lengkap (TypeScript)

### UX Standards
1. ✅ Skeleton loading
2. ✅ Empty state dengan action
3. ✅ Toast notifications
4. ✅ Disabled states saat loading
5. ✅ Responsive design

---

**Last Updated:** December 2024
**Version:** 1.0.0

