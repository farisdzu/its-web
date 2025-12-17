# Backend Best Practices - Laravel API

Panduan standar industri untuk struktur database, controller, dan model di Laravel API.

## 📋 Table of Contents

1. [Database Structure](#database-structure)
2. [Migration Best Practices](#migration-best-practices)
3. [Model Best Practices](#model-best-practices)
4. [Controller Best Practices](#controller-best-practices)
5. [API Response Pattern](#api-response-pattern)
6. [Validation & Error Handling](#validation--error-handling)
7. [Performance Optimization](#performance-optimization)
8. [Security Best Practices](#security-best-practices)

---

## 🗄️ Database Structure

### 1. Table Naming Convention

**✅ DO:**
- Plural, snake_case: `users`, `org_units`, `password_reset_otps`
- Descriptive: `active_sessions` bukan `sessions` (jika ada konflik)
- Pivot tables: `{table1}_{table2}` (e.g., `org_unit_parents`)

**❌ DON'T:**
- Singular: `user`, `org_unit`
- CamelCase: `orgUnits`
- Abbreviations: `usr`, `org_unt`

### 2. Column Naming

**✅ DO:**
- snake_case: `user_id`, `is_active`, `email_verified_at`
- Boolean: prefix dengan `is_`, `has_`, `can_`: `is_active`, `has_permission`
- Timestamps: `created_at`, `updated_at`, `deleted_at`
- Foreign keys: `{table}_id`: `user_id`, `org_unit_id`

**❌ DON'T:**
- CamelCase: `userId`, `isActive`
- Without prefix: `active` (ambiguous)

### 3. Primary Keys

**✅ DO:**
```php
$table->id(); // Auto-incrementing big integer (unsigned)
// atau
$table->uuid('id')->primary(); // Untuk distributed systems
```

**❌ DON'T:**
```php
$table->integer('id')->primary(); // Terlalu kecil untuk scale
```

### 4. Foreign Keys

**✅ DO:**
```php
// Standard foreign key
$table->foreignId('user_id')->constrained()->onDelete('cascade');
// atau
$table->unsignedBigInteger('user_id');
$table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
```

**Cascade Options:**
- `cascade`: Delete child records when parent is deleted
- `set null`: Set FK to null when parent is deleted
- `restrict`: Prevent deletion if child exists
- `no action`: Similar to restrict

### 5. Indexes Strategy

**✅ DO:**
```php
// Single column indexes (frequently queried)
$table->index('email');
$table->index('is_active');
$table->index('role');

// Composite indexes (multiple columns in WHERE)
$table->index(['email', 'is_active']); // WHERE email = ? AND is_active = ?
$table->index(['parent_id', 'order']); // WHERE parent_id = ? ORDER BY order

// Unique indexes
$table->unique('email');
$table->unique(['user_id', 'token_id']); // Composite unique

// Foreign key indexes (auto-created, but explicit is better)
$table->index('user_id');
```

**Index Guidelines:**
- Index columns used in WHERE, JOIN, ORDER BY
- Composite indexes: leftmost prefix rule (a, b, c) covers (a), (a, b), (a, b, c)
- Don't over-index: Each index slows down INSERT/UPDATE
- Index foreign keys: Always index foreign key columns

### 6. Data Types

**✅ DO:**
```php
// Strings
$table->string('name'); // VARCHAR(255) - default
$table->string('code', 50); // VARCHAR(50)
$table->text('description'); // TEXT
$table->longText('content'); // LONGTEXT

// Numbers
$table->integer('order'); // INT
$table->unsignedInteger('count'); // UNSIGNED INT
$table->bigInteger('user_id'); // BIGINT
$table->decimal('price', 10, 2); // DECIMAL(10,2)

// Boolean
$table->boolean('is_active')->default(true);

// Timestamps
$table->timestamp('email_verified_at')->nullable();
$table->timestamps(); // created_at, updated_at
$table->softDeletes(); // deleted_at

// JSON
$table->json('metadata'); // JSON column
```

**❌ DON'T:**
```php
$table->string('id'); // Use id() or uuid() for primary keys
$table->text('name'); // Use string() for short text
```

---

## 📝 Migration Best Practices

### 1. Migration Structure

**✅ DO:**
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('table_name', function (Blueprint $table) {
            // Primary key
            $table->id();
            
            // Columns
            $table->string('name');
            $table->string('email')->unique();
            
            // Foreign keys
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // Indexes
            $table->index('email');
            $table->index(['user_id', 'created_at']);
            
            // Timestamps
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('table_name');
    }
};
```

### 2. Migration Naming

**✅ DO:**
```
2025_12_17_040716_create_org_units_table.php
2025_12_17_050000_add_parent_id_to_org_units_table.php
2025_12_17_060000_create_org_unit_parents_table.php
```

**Pattern:**
- `create_{table}_table` - Create new table
- `add_{column}_to_{table}_table` - Add column
- `modify_{column}_in_{table}_table` - Modify column
- `drop_{column}_from_{table}_table` - Drop column

### 3. Indexes in Migrations

**✅ DO:**
```php
// Indexes after columns, before timestamps
$table->string('email');
$table->boolean('is_active')->default(true);
$table->foreignId('user_id')->constrained();

// Indexes
$table->index('email');
$table->index('is_active');
$table->index('user_id'); // Foreign key index
$table->index(['user_id', 'is_active']); // Composite

$table->timestamps();
```

### 4. Foreign Key Constraints

**✅ DO:**
```php
// Method 1: Using foreignId (Laravel 7+)
$table->foreignId('user_id')->constrained()->onDelete('cascade');

// Method 2: Explicit foreign key
$table->unsignedBigInteger('user_id');
$table->foreign('user_id')
    ->references('id')
    ->on('users')
    ->onDelete('cascade'); // atau 'set null', 'restrict'

// Nullable foreign key
$table->foreignId('parent_id')->nullable()->constrained()->nullOnDelete();
```

### 5. Pivot Tables

**✅ DO:**
```php
Schema::create('org_unit_parents', function (Blueprint $table) {
    $table->id();
    $table->foreignId('org_unit_id')->constrained()->onDelete('cascade');
    $table->foreignId('parent_id')->constrained('org_units')->onDelete('cascade');
    $table->timestamps();
    
    // Composite unique to prevent duplicates
    $table->unique(['org_unit_id', 'parent_id']);
    
    // Indexes for performance
    $table->index('org_unit_id');
    $table->index('parent_id');
});
```

---

## 🎯 Model Best Practices

### 1. Model Structure

**✅ DO:**
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class OrgUnit extends Model
{
    use HasFactory;

    // Fillable fields (mass assignment protection)
    protected $fillable = [
        'name',
        'type',
        'code',
        'parent_id',
        'order',
        'is_active',
    ];

    // Casts for type conversion
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'order' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    // Relationships
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('order');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    // Scopes (query builders)
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('order');
    }
}
```

### 2. Relationships

**✅ DO:**
```php
// One-to-Many
public function children(): HasMany
{
    return $this->hasMany(OrgUnit::class, 'parent_id');
}

// Many-to-One
public function parent(): BelongsTo
{
    return $this->belongsTo(OrgUnit::class, 'parent_id');
}

// Many-to-Many
public function parents(): BelongsToMany
{
    return $this->belongsToMany(
        OrgUnit::class,
        'org_unit_parents',
        'org_unit_id',
        'parent_id'
    )->withTimestamps();
}

// Has Many Through
public function posts(): HasManyThrough
{
    return $this->hasManyThrough(Post::class, User::class);
}
```

### 3. Eager Loading

**✅ DO:**
```php
// Prevent N+1 queries
$units = OrgUnit::with('users')
    ->withCount('users')
    ->with('parents:id,name')
    ->get();

// Conditional eager loading
$units = OrgUnit::with(['users' => function ($query) {
    $query->where('is_active', true);
}])->get();
```

**❌ DON'T:**
```php
// N+1 query problem
$units = OrgUnit::all();
foreach ($units as $unit) {
    $unit->users; // Query executed for each unit!
}
```

### 4. Scopes

**✅ DO:**
```php
// Local scope
public function scopeActive($query)
{
    return $query->where('is_active', true);
}

// Usage
$activeUnits = OrgUnit::active()->get();

// Parameterized scope
public function scopeRole($query, string $role)
{
    return $query->where('role', $role);
}

// Usage
$admins = User::role('admin')->get();
```

### 5. Accessors & Mutators

**✅ DO:**
```php
// Accessor (getter)
protected function casts(): array
{
    return [
        'name' => 'string',
        'created_at' => 'datetime',
    ];
}

// Custom accessor
public function getFullNameAttribute(): string
{
    return "{$this->first_name} {$this->last_name}";
}

// Mutator (setter)
public function setEmailAttribute($value): void
{
    $this->attributes['email'] = strtolower($value);
}
```

---

## 🎮 Controller Best Practices

### 1. Controller Structure

**✅ DO:**
```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrgUnit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class OrgUnitController extends Controller
{
    // Index: List all resources
    public function index(): JsonResponse
    {
        // Cache for performance
        $cacheKey = 'org_units_tree';
        $cacheTTL = 300; // 5 minutes

        $tree = Cache::remember($cacheKey, $cacheTTL, function () {
            // Eager load to prevent N+1
            return OrgUnit::withCount('users')
                ->with('parents:id,name')
                ->orderBy('order')
                ->get();
        });

        return response()->json([
            'success' => true,
            'data' => $tree,
        ]);
    }

    // Store: Create new resource
    public function store(Request $request): JsonResponse
    {
        // Validate input
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:org_units,name'],
            'parent_id' => ['nullable', 'exists:org_units,id'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        // Create resource
        $orgUnit = OrgUnit::create($data);

        // Clear cache
        Cache::forget('org_units_tree');

        return response()->json([
            'success' => true,
            'message' => 'Organizational unit created successfully.',
            'data' => $orgUnit,
        ], 201);
    }

    // Show: Get single resource
    public function show(OrgUnit $orgUnit): JsonResponse
    {
        $orgUnit->load('users', 'parents');

        return response()->json([
            'success' => true,
            'data' => $orgUnit,
        ]);
    }

    // Update: Update resource
    public function update(Request $request, OrgUnit $orgUnit): JsonResponse
    {
        // Validate with ignore current record
        $data = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('org_units')->ignore($orgUnit->id),
            ],
            'parent_id' => ['nullable', 'exists:org_units,id'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        // Update resource
        $orgUnit->update($data);

        // Clear cache
        Cache::forget('org_units_tree');

        return response()->json([
            'success' => true,
            'message' => 'Organizational unit updated successfully.',
            'data' => $orgUnit->fresh(),
        ]);
    }

    // Destroy: Delete resource
    public function destroy(OrgUnit $orgUnit): JsonResponse
    {
        // Check constraints
        if ($orgUnit->users()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete unit with assigned users.',
            ], 422);
        }

        // Delete resource
        $orgUnit->delete();

        // Clear cache
        Cache::forget('org_units_tree');

        return response()->json([
            'success' => true,
            'message' => 'Organizational unit deleted successfully.',
        ]);
    }
}
```

### 2. RESTful Methods

**Standard RESTful Methods:**
- `index()` - GET `/resource` - List all
- `store()` - POST `/resource` - Create new
- `show()` - GET `/resource/{id}` - Get single
- `update()` - PUT/PATCH `/resource/{id}` - Update
- `destroy()` - DELETE `/resource/{id}` - Delete

### 3. Validation

**✅ DO:**
```php
// Inline validation
$data = $request->validate([
    'name' => ['required', 'string', 'max:255'],
    'email' => ['required', 'email', 'unique:users,email'],
    'role' => ['required', 'in:admin,user'],
]);

// Using Form Request (for complex validation)
// app/Http/Requests/CreateUserRequest.php
public function rules(): array
{
    return [
        'name' => ['required', 'string', 'max:255'],
        'email' => ['required', 'email', 'unique:users,email'],
    ];
}
```

### 4. Error Handling

**✅ DO:**
```php
try {
    $orgUnit = OrgUnit::create($data);
    
    return response()->json([
        'success' => true,
        'data' => $orgUnit,
    ], 201);
} catch (\Exception $e) {
    \Log::error('Failed to create org unit', [
        'error' => $e->getMessage(),
        'data' => $data,
    ]);
    
    return response()->json([
        'success' => false,
        'message' => 'Failed to create organizational unit.',
    ], 500);
}
```

### 5. Response Format

**✅ DO:**
```php
// Success response
return response()->json([
    'success' => true,
    'message' => 'Operation successful.',
    'data' => $resource,
], 200);

// Error response
return response()->json([
    'success' => false,
    'message' => 'Error message here.',
    'errors' => $errors, // For validation errors
], 422);
```

---

## 📊 API Response Pattern

### 1. Standard Response Structure

**✅ DO:**
```php
// Success
{
    "success": true,
    "message": "Operation successful",
    "data": { ... }
}

// Error
{
    "success": false,
    "message": "Error message",
    "errors": { ... } // Optional, for validation errors
}

// Paginated
{
    "success": true,
    "data": [ ... ],
    "meta": {
        "current_page": 1,
        "last_page": 10,
        "per_page": 50,
        "total": 500
    }
}
```

### 2. HTTP Status Codes

**✅ DO:**
- `200` - OK (GET, PUT, PATCH success)
- `201` - Created (POST success)
- `204` - No Content (DELETE success)
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not authorized)
- `404` - Not Found
- `422` - Unprocessable Entity (validation errors)
- `500` - Internal Server Error

---

## ⚡ Performance Optimization

### 1. Caching Strategy

**✅ DO:**
```php
// Cache expensive queries
$cacheKey = 'org_units_tree';
$cacheTTL = 300; // 5 minutes

$data = Cache::remember($cacheKey, $cacheTTL, function () {
    return OrgUnit::with('users')->get();
});

// Clear cache on update
Cache::forget('org_units_tree');
```

### 2. Eager Loading

**✅ DO:**
```php
// Prevent N+1 queries
$units = OrgUnit::with('users')
    ->withCount('users')
    ->get();
```

### 3. Query Optimization

**✅ DO:**
```php
// Select only needed columns
$users = User::select('id', 'name', 'email')->get();

// Use indexes
$users = User::where('is_active', true)
    ->where('role', 'admin')
    ->get(); // Uses composite index

// Pagination
$users = User::paginate(50);
```

### 4. Database Indexes

**✅ DO:**
- Index foreign keys
- Index frequently queried columns
- Composite indexes for WHERE + ORDER BY
- Unique indexes for unique constraints

---

## 🔒 Security Best Practices

### 1. Mass Assignment Protection

**✅ DO:**
```php
// Use $fillable (whitelist)
protected $fillable = ['name', 'email'];

// Or $guarded (blacklist)
protected $guarded = ['id', 'is_admin'];
```

### 2. Input Validation

**✅ DO:**
```php
$data = $request->validate([
    'email' => ['required', 'email', 'max:255'],
    'password' => ['required', 'min:8', 'confirmed'],
]);
```

### 3. SQL Injection Prevention

**✅ DO:**
```php
// Use Eloquent (auto-protected)
User::where('email', $email)->first();

// Use parameterized queries
DB::select('SELECT * FROM users WHERE email = ?', [$email]);
```

**❌ DON'T:**
```php
// Never use raw strings
DB::select("SELECT * FROM users WHERE email = '{$email}'");
```

### 4. Authorization

**✅ DO:**
```php
// Use policies or middleware
$this->authorize('update', $orgUnit);

// Or manual check
if (!$user->can('update', $orgUnit)) {
    return response()->json([
        'success' => false,
        'message' => 'Unauthorized.',
    ], 403);
}
```

---

## ✅ Checklist untuk Feature Baru

### Database
- [ ] Table naming: plural, snake_case
- [ ] Column naming: snake_case
- [ ] Primary key: `id()` atau `uuid()`
- [ ] Foreign keys dengan constraints
- [ ] Indexes untuk foreign keys
- [ ] Indexes untuk frequently queried columns
- [ ] Composite indexes untuk WHERE + ORDER BY
- [ ] Timestamps: `timestamps()`
- [ ] Soft deletes jika perlu: `softDeletes()`

### Model
- [ ] `$fillable` atau `$guarded` defined
- [ ] `casts()` untuk type conversion
- [ ] Relationships defined
- [ ] Scopes untuk common queries
- [ ] Eager loading untuk prevent N+1

### Controller
- [ ] RESTful methods (index, store, show, update, destroy)
- [ ] Validation di setiap method
- [ ] Error handling dengan try-catch
- [ ] Cache strategy untuk expensive queries
- [ ] Cache invalidation pada create/update/delete
- [ ] Standard response format
- [ ] Correct HTTP status codes

### Performance
- [ ] Eager loading untuk relationships
- [ ] Indexes untuk query optimization
- [ ] Caching untuk expensive operations
- [ ] Pagination untuk large datasets

### Security
- [ ] Mass assignment protection
- [ ] Input validation
- [ ] Authorization checks
- [ ] SQL injection prevention (use Eloquent)

---

## 📝 Template: New Feature

### Migration Template
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('features', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Indexes
            $table->index('user_id');
            $table->index('is_active');
            $table->index(['user_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('features');
    }
};
```

### Model Template
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Feature extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'user_id',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
```

### Controller Template
```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Feature;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class FeatureController extends Controller
{
    public function index(): JsonResponse
    {
        $features = Feature::with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $features,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'user_id' => ['required', 'exists:users,id'],
        ]);

        $feature = Feature::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Feature created successfully.',
            'data' => $feature,
        ], 201);
    }

    public function show(Feature $feature): JsonResponse
    {
        $feature->load('user');

        return response()->json([
            'success' => true,
            'data' => $feature,
        ]);
    }

    public function update(Request $request, Feature $feature): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $feature->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Feature updated successfully.',
            'data' => $feature->fresh(),
        ]);
    }

    public function destroy(Feature $feature): JsonResponse
    {
        $feature->delete();

        return response()->json([
            'success' => true,
            'message' => 'Feature deleted successfully.',
        ]);
    }
}
```

---

**Last Updated:** December 2024
**Version:** 1.0.0

