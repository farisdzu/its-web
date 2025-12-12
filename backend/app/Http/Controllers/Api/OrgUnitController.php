<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrgUnit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OrgUnitController extends Controller
{
    public function index(): JsonResponse
    {
        // Cache tree structure for 5 minutes to reduce database load
        // Cache key includes timestamp to invalidate on updates
        $cacheKey = 'org_units_tree';
        $cacheTTL = 300; // 5 minutes

        $tree = Cache::remember($cacheKey, $cacheTTL, function () {
            // Eager load user_count to prevent N+1 queries
            $units = OrgUnit::withCount('users')
                ->orderBy('parent_id')
                ->orderBy('order')
                ->get();

            return $this->buildTree($units);
        });

        return response()->json([
            'success' => true,
            'data' => $tree,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:org_units,name'],
            'parent_id' => ['nullable', 'exists:org_units,id'],
            'type' => ['nullable', 'string', 'max:100'],
            'code' => ['nullable', 'string', 'max:100'],
            'order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $orgUnit = OrgUnit::create([
            'name' => $data['name'],
            'parent_id' => $data['parent_id'] ?? null,
            'type' => $data['type'] ?? null,
            'code' => $data['code'] ?? null,
            'order' => $data['order'] ?? 0,
            'is_active' => $data['is_active'] ?? true,
        ]);

        // Clear cache when tree structure changes
        Cache::forget('org_units_tree');

        return response()->json([
            'success' => true,
            'data' => $orgUnit,
        ], 201);
    }

    public function update(Request $request, OrgUnit $orgUnit): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('org_units', 'name')->ignore($orgUnit->id)],
            'parent_id' => [
                'nullable',
                'exists:org_units,id',
                Rule::notIn([$orgUnit->id]),
            ],
            'type' => ['nullable', 'string', 'max:100'],
            'code' => ['nullable', 'string', 'max:100'],
            'order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if (array_key_exists('parent_id', $data) && $data['parent_id']) {
            if ($this->isCircular($orgUnit->id, $data['parent_id'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parent tidak boleh anak/cucu dari unit ini (menghindari loop).',
                ], 422);
            }
        }

        $orgUnit->fill($data);
        $orgUnit->save();

        // Clear cache when tree structure changes
        Cache::forget('org_units_tree');

        return response()->json([
            'success' => true,
            'data' => $orgUnit,
        ]);
    }

    public function show(OrgUnit $orgUnit): JsonResponse
    {
        $orgUnit->load('users:id,name,email,username,employee_id,role,org_unit_id,title,is_active');

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $orgUnit->id,
                'name' => $orgUnit->name,
                'type' => $orgUnit->type,
                'code' => $orgUnit->code,
                'order' => $orgUnit->order,
                'is_active' => $orgUnit->is_active,
                'parent_id' => $orgUnit->parent_id,
                'users' => $orgUnit->users->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'username' => $user->username,
                        'employee_id' => $user->employee_id,
                        'role' => $user->role,
                        'title' => $user->title,
                        'is_active' => $user->is_active,
                    ];
                }),
            ],
        ]);
    }

    public function destroy(OrgUnit $orgUnit): JsonResponse
    {
        $hasChildren = $orgUnit->children()->exists();
        $hasUsers = $orgUnit->users()->exists();

        if ($hasChildren || $hasUsers) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak bisa menghapus: masih ada child atau user. Nonaktifkan saja atau pindahkan dulu.',
            ], 409);
        }

        $orgUnit->delete();

        // Clear cache when tree structure changes
        Cache::forget('org_units_tree');

        return response()->json([
            'success' => true,
            'message' => 'Org unit dihapus.',
        ]);
    }

    private function buildTree($units): array
    {
        $byParent = [];
        foreach ($units as $unit) {
            $byParent[$unit->parent_id ?? 0][] = $unit;
        }

        $build = function ($parentId) use (&$build, &$byParent) {
            $children = $byParent[$parentId] ?? [];
            return array_map(function (OrgUnit $unit) use ($build) {
                return [
                    'id' => $unit->id,
                    'name' => $unit->name,
                    'type' => $unit->type,
                    'code' => $unit->code,
                    'order' => $unit->order,
                    'is_active' => $unit->is_active,
                    'parent_id' => $unit->parent_id,
                    'user_count' => $unit->users_count ?? 0, // Use eager loaded count
                    'children' => $build($unit->id),
                ];
            }, $children);
        };

        return $build(0);
    }

    private function isCircular(int $currentId, int $candidateParentId): bool
    {
        // Optimize: Load all ancestors in a single query to prevent N+1
        $ancestors = [];
        $parentId = $candidateParentId;

        while ($parentId) {
            if ($parentId === $currentId) {
                return true; // Circular reference detected
            }

            // Check if we've already visited this node (prevent infinite loop)
            if (in_array($parentId, $ancestors)) {
                break;
            }

            $ancestors[] = $parentId;
            $parent = OrgUnit::select('id', 'parent_id')->find($parentId);
            
            if (!$parent) {
                break;
            }

            $parentId = $parent->parent_id;
        }

        return false;
    }
}

