# Analisa Fitur: Tugas dan Agenda

## 📋 Ringkasan
Menambahkan fitur pemilihan jenis item: **"Tugas"** atau **"Agenda"** pada ITS (Integrated Task System).

---

## 🗄️ DATABASE / BACKEND

### 1. Migration - Tambah Field Baru ke Tabel `tasks`

**File:** `backend/database/migrations/YYYY_MM_DD_HHMMSS_add_type_and_agenda_fields_to_tasks_table.php`

**Field yang perlu ditambahkan:**
```php
$table->enum('type', ['tugas', 'agenda'])->default('tugas')->after('id');
$table->time('start_time')->nullable()->after('due_date');
$table->time('end_time')->nullable()->after('start_time');
$table->string('meeting_link')->nullable()->after('end_time');
```

**Index yang perlu ditambahkan:**
```php
$table->index('type');
$table->index(['type', 'status']); // Untuk filter tugas berdasarkan status
```

**Catatan:**
- Field `status`, `progress`, `priority` tetap ada tapi hanya digunakan untuk `type = 'tugas'`
- Field `due_date` digunakan untuk tugas, bisa juga digunakan untuk agenda sebagai tanggal agenda
- Field `start_time` dan `end_time` hanya untuk agenda
- Field `meeting_link` hanya untuk agenda

### 2. Model Task - Update

**File:** `backend/app/Models/Task.php`

**Tambahkan konstanta:**
```php
public const TYPE_TUGAS = 'tugas';
public const TYPE_AGENDA = 'agenda';

public const TYPES = [
    self::TYPE_TUGAS,
    self::TYPE_AGENDA,
];
```

**Update `$fillable`:**
```php
protected $fillable = [
    'type',           // NEW
    'title',
    'description',
    'due_date',
    'start_time',     // NEW (untuk agenda)
    'end_time',       // NEW (untuk agenda)
    'meeting_link',   // NEW (untuk agenda)
    'progress',
    'priority',
    'status',
    'created_by',
    'assigned_to',
];
```

**Update `casts()`:**
```php
protected function casts(): array
{
    return [
        'due_date' => 'date',
        'start_time' => 'datetime:H:i',  // NEW
        'end_time' => 'datetime:H:i',    // NEW
        'progress' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
```

**Tambahkan scope:**
```php
// Scope untuk filter berdasarkan type
public function scopeByType($query, string $type)
{
    return $query->where('type', $type);
}

// Scope untuk hanya tugas (dengan workflow)
public function scopeTasks($query)
{
    return $query->where('type', self::TYPE_TUGAS);
}

// Scope untuk hanya agenda
public function scopeAgendas($query)
{
    return $query->where('type', self::TYPE_AGENDA);
}
```

### 3. Controller - Update Validasi

**File:** `backend/app/Http/Controllers/Api/TaskController.php`

**Update method `store()`:**
```php
$data = $request->validate([
    'type' => ['required', Rule::in(Task::TYPES)],  // NEW
    'title' => ['required', 'string', 'max:255'],
    'description' => ['nullable', 'string'],
    
    // Field untuk Tugas
    'due_date' => ['nullable', 'date'],
    'progress' => ['nullable', 'integer', 'min:0', 'max:100'],
    'priority' => ['nullable', Rule::in(Task::PRIORITIES)],
    'status' => ['nullable', Rule::in(Task::STATUSES)],
    
    // Field untuk Agenda
    'start_time' => ['nullable', 'date_format:H:i'],
    'end_time' => ['nullable', 'date_format:H:i', 'after:start_time'],
    'meeting_link' => ['nullable', 'url', 'max:500'],
    
    'assigned_to' => ['nullable', 'exists:users,id'],
    'assignee_ids' => ['nullable', 'array'],
    'assignee_ids.*' => ['exists:users,id'],
]);

// Validasi kondisional berdasarkan type
if ($data['type'] === Task::TYPE_TUGAS) {
    // Validasi khusus tugas
    // status, priority wajib atau default
    // progress default 0
} else if ($data['type'] === Task::TYPE_AGENDA) {
    // Validasi khusus agenda
    // start_time dan end_time bisa wajib
    // status, progress, priority tidak digunakan
}
```

**Update method `update()`:**
- Sama seperti store, tapi dengan validasi `sometimes`
- Pastikan tidak bisa mengubah type setelah dibuat (atau bisa dengan validasi khusus)

**Update method `index()` / `list()`:**
- Tambahkan filter berdasarkan `type`
- Default hanya tampilkan `type = 'tugas'` untuk backward compatibility

### 4. API Response - Update Format

**Response untuk Tugas:**
```json
{
  "id": 1,
  "type": "tugas",
  "title": "...",
  "status": "baru",
  "progress": 0,
  "priority": "tinggi",
  "due_date": "2025-01-15",
  ...
}
```

**Response untuk Agenda:**
```json
{
  "id": 2,
  "type": "agenda",
  "title": "...",
  "due_date": "2025-01-15",  // Tanggal agenda
  "start_time": "09:00",
  "end_time": "10:30",
  "meeting_link": "https://zoom.us/...",
  ...
}
```

---

## 🎨 FRONTEND

### 1. Type Definitions

**File:** `frontend/src/components/dashboard/TaskCard.tsx`

**Update interface:**
```typescript
export type TaskType = "tugas" | "agenda";
export type TaskPriority = "tinggi" | "sedang" | "rendah";
export type TaskStatus = "baru" | "proses" | "review" | "selesai";

export interface TaskCardData {
  id: string | number;
  type: TaskType;  // NEW
  title: string;
  description?: string;
  dueDate?: string;  // Untuk tugas: deadline, untuk agenda: tanggal
  startTime?: string;  // NEW (format: "HH:mm")
  endTime?: string;    // NEW (format: "HH:mm")
  meetingLink?: string;  // NEW
  progress?: number;  // Hanya untuk tugas
  priority: TaskPriority;  // Hanya untuk tugas
  status: TaskStatus;  // Hanya untuk tugas
  // ... fields lainnya
}
```

### 2. API Interfaces

**File:** `frontend/src/services/api.ts`

**Update CreateTaskPayload:**
```typescript
export interface CreateTaskPayload {
  type: 'tugas' | 'agenda';  // NEW - required
  title: string;
  description?: string;
  
  // Untuk Tugas
  due_date?: string;
  progress?: number;
  priority?: 'tinggi' | 'sedang' | 'rendah';
  status?: 'baru' | 'proses' | 'review' | 'selesai';
  
  // Untuk Agenda
  start_time?: string;  // Format: "HH:mm"
  end_time?: string;   // Format: "HH:mm"
  meeting_link?: string;
  
  assigned_to?: number | null;
  assignee_ids?: number[];
}
```

### 3. Modal Pilih Jenis

**File:** `frontend/src/components/dashboard/ItemTypeSelectionModal.tsx` (NEW)

**Fitur:**
- Modal muncul saat user klik "Tambah Tugas" (atau rename jadi "Tambah Item")
- Pilihan: "Tugas" atau "Agenda"
- Setelah pilih, buka form sesuai jenis

**UI:**
```
┌─────────────────────────────┐
│  Pilih Jenis Item           │
├─────────────────────────────┤
│                             │
│  ┌──────────┐  ┌──────────┐│
│  │  📋      │  │  📅      ││
│  │  Tugas   │  │  Agenda  ││
│  └──────────┘  └──────────┘│
│                             │
└─────────────────────────────┘
```

### 4. Form Modal - Update

**File:** `frontend/src/components/dashboard/TaskFormModal.tsx`

**Perubahan:**
- Terima prop `itemType: 'tugas' | 'agenda'`
- Render form berbeda berdasarkan type:

**Form Tugas (existing):**
- Judul
- Deskripsi
- Deadline (date)
- Prioritas
- Status
- Progress
- Attachments

**Form Agenda (new):**
- Judul Agenda
- Deskripsi (opsional)
- Tanggal (date)
- Jam Mulai (time input)
- Jam Selesai (time input)
- Link Meeting (url input, opsional)
- Attachments (opsional)
- **TIDAK ada:** Status, Progress, Prioritas

### 5. Task Card - Update Tampilan

**File:** `frontend/src/components/dashboard/TaskCard.tsx`

**Perubahan:**
- Deteksi `task.type` untuk render berbeda
- **Card Tugas:** Tetap seperti sekarang
- **Card Agenda:**
  - Icon kalender/jam (bukan task icon)
  - Warna aksen berbeda (misal: biru untuk agenda)
  - Tampilkan waktu: "09:00 - 10:30"
  - Tombol "Join Meeting" jika ada `meetingLink`
  - **TIDAK tampilkan:** Status badge, Progress circle, Priority badge
  - **TIDAK bisa drag & drop** (agenda tidak di Kanban)

### 6. Kanban Board - Filter

**File:** `frontend/src/components/dashboard/KanbanBoard.tsx`

**Perubahan:**
- Filter hanya tampilkan `type === 'tugas'`
- Agenda tidak muncul di Kanban Board
- Agenda bisa ditampilkan di view terpisah (Calendar View atau List View)

### 7. Dashboard - Update

**File:** `frontend/src/pages/Dashboard/User/Index.tsx`

**Perubahan:**
- Tombol "Tambah Tugas" → "Tambah Item" (atau tetap "Tambah Tugas" tapi buka modal pilih jenis)
- Filter untuk memisahkan Tugas dan Agenda
- Mungkin perlu tab/view terpisah untuk Agenda

### 8. Icons

**File:** `frontend/src/icons/index.ts`

**Icons yang dibutuhkan:**
- Calendar icon (untuk agenda card)
- Clock icon (untuk waktu agenda)
- Video/Meeting icon (untuk join meeting button)

---

## 📝 RINGKASAN PERUBAHAN

### Backend:
1. ✅ Migration: Tambah field `type`, `start_time`, `end_time`, `meeting_link`
2. ✅ Model: Tambah konstanta TYPE, update fillable, casts, scope
3. ✅ Controller: Update validasi kondisional berdasarkan type
4. ✅ API Response: Include type dan field agenda

### Frontend:
1. ✅ Type definitions: Tambah TaskType, update interfaces
2. ✅ Modal pilih jenis: Component baru
3. ✅ Form Modal: Conditional rendering berdasarkan type
4. ✅ Task Card: Tampilan berbeda untuk Tugas vs Agenda
5. ✅ Kanban Board: Filter hanya Tugas
6. ✅ Dashboard: Update flow dan filter

---

## 🎯 PRIORITAS IMPLEMENTASI

1. **Phase 1: Database & Backend**
   - Migration
   - Model update
   - Controller update
   - Test API

2. **Phase 2: Frontend Core**
   - Type definitions
   - Modal pilih jenis
   - Form modal update

3. **Phase 3: UI/UX**
   - Task card update
   - Kanban filter
   - Dashboard update

4. **Phase 4: Polish**
   - Icons
   - Styling
   - Testing

---

## ❓ PERTANYAAN / KEPUTUSAN

1. **Agenda di mana ditampilkan?**
   - Option A: List view terpisah
   - Option B: Calendar view
   - Option C: Tab terpisah di dashboard
   - **Rekomendasi:** Tab terpisah atau Calendar view

2. **Apakah Agenda bisa di-edit status?**
   - **Jawab:** Tidak, agenda tidak punya workflow

3. **Apakah Agenda bisa di-assign?**
   - **Jawab:** Ya, tetap bisa assign user

4. **Filter di dashboard:**
   - Tampilkan semua (Tugas + Agenda)?
   - Atau filter terpisah?
   - **Rekomendasi:** Filter terpisah atau tab

---

## ✅ CHECKLIST IMPLEMENTASI

### Backend:
- [ ] Migration file
- [ ] Model Task update
- [ ] Controller validation update
- [ ] API response format update
- [ ] Test API endpoints

### Frontend:
- [ ] Type definitions
- [ ] ItemTypeSelectionModal component
- [ ] TaskFormModal update
- [ ] TaskCard update (tampilan berbeda)
- [ ] KanbanBoard filter
- [ ] Dashboard update
- [ ] Icons tambahan
- [ ] Styling agenda card

---

**Dokumen ini akan diupdate seiring implementasi.**

