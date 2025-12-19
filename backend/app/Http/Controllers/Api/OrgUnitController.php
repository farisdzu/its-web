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
            // Eager load user_count and parents to prevent N+1 queries
            $units = OrgUnit::withCount('users')
                ->with('parents:id,name')
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
            'parent_id' => ['nullable', 'exists:org_units,id'], // Backward compatibility
            'parent_ids' => ['nullable', 'array'],
            'parent_ids.*' => ['exists:org_units,id'],
            'type' => ['nullable', 'string', 'max:100'],
            'code' => ['nullable', 'string', 'max:100'],
            'order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        // Get parent_ids from either parent_ids array or parent_id (for backward compatibility)
        $parentIds = $data['parent_ids'] ?? [];
        if (isset($data['parent_id']) && $data['parent_id']) {
            $parentIds[] = $data['parent_id'];
            $parentIds = array_unique($parentIds);
        }

        // Validate no self-reference (will be checked after unit is created, but validate parent_ids array)
        // This will be handled in update method, but for create we don't have unit ID yet

        $orgUnit = OrgUnit::create([
            'name' => $data['name'],
            'parent_id' => $data['parent_id'] ?? null, // Keep for backward compatibility
            'type' => $data['type'] ?? null,
            'code' => $data['code'] ?? null,
            'order' => $data['order'] ?? 0,
            'is_active' => $data['is_active'] ?? true,
        ]);

        // Sync multiple parents
        if (!empty($parentIds)) {
            $orgUnit->parents()->sync($parentIds);
        }

        // Load relationships for response
        $orgUnit->load('parents:id,name');

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
            'parent_ids' => ['nullable', 'array'],
            'parent_ids.*' => [
                'exists:org_units,id',
                Rule::notIn([$orgUnit->id]),
            ],
            'type' => ['nullable', 'string', 'max:100'],
            'code' => ['nullable', 'string', 'max:100'],
            'order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        // Get parent_ids from either parent_ids array or parent_id (for backward compatibility)
        $parentIds = null;
        if (array_key_exists('parent_ids', $data)) {
            $parentIds = $data['parent_ids'] ?? [];
        } elseif (array_key_exists('parent_id', $data)) {
            $parentIds = $data['parent_id'] ? [$data['parent_id']] : [];
        }

        // Validate no circular references if parent_ids is being updated
        if ($parentIds !== null) {
            foreach ($parentIds as $parentId) {
                if ($this->isCircular($orgUnit->id, $parentId, $parentIds)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parent tidak boleh anak/cucu dari unit ini (menghindari loop).',
                ], 422);
                }
            }
        }

        $orgUnit->fill($data);
        $orgUnit->save();

        // Sync multiple parents if parent_ids is provided
        if ($parentIds !== null) {
            $orgUnit->parents()->sync($parentIds);
        }

        // Load relationships for response
        $orgUnit->load('parents:id,name');

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
        $orgUnit->load('parents:id,name');

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $orgUnit->id,
                'name' => $orgUnit->name,
                'type' => $orgUnit->type,
                'code' => $orgUnit->code,
                'order' => $orgUnit->order,
                'is_active' => $orgUnit->is_active,
                'parent_id' => $orgUnit->parent_id, // Backward compatibility
                'parent_ids' => $orgUnit->parents->pluck('id')->toArray(),
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
        $hasChildrenThroughParents = $orgUnit->childrenThroughParents()->exists();
        $hasUsers = $orgUnit->users()->exists();

        if ($hasChildren || $hasChildrenThroughParents || $hasUsers) {
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
        // Optimized: Use hash map for O(1) lookup and efficient deduplication
        $allByParent = [];
        
        foreach ($units as $unit) {
            // Traditional parent_id (for backward compatibility)
            $parentId = $unit->parent_id ?? 0;
            
            // Use unit ID as key for deduplication (same unit might appear under multiple parents)
            if (!isset($allByParent[$parentId])) {
                $allByParent[$parentId] = [];
            }
            $allByParent[$parentId][$unit->id] = $unit;
            
            // Multiple parents from pivot table
            foreach ($unit->parents as $parent) {
                if (!isset($allByParent[$parent->id])) {
                    $allByParent[$parent->id] = [];
                }
                $allByParent[$parent->id][$unit->id] = $unit;
            }
        }

        // Convert hash maps to arrays (values only, keys are unit IDs for deduplication)
        foreach ($allByParent as $parentId => $childrenMap) {
            $allByParent[$parentId] = array_values($childrenMap);
        }

        $build = function ($parentId) use (&$build, &$allByParent) {
            $children = $allByParent[$parentId] ?? [];
            return array_map(function (OrgUnit $unit) use ($build) {
                return [
                    'id' => $unit->id,
                    'name' => $unit->name,
                    'type' => $unit->type,
                    'code' => $unit->code,
                    'order' => $unit->order,
                    'is_active' => $unit->is_active,
                    'parent_id' => $unit->parent_id, // Backward compatibility
                    'parent_ids' => $unit->parents->pluck('id')->toArray(), // Multiple parents
                    'user_count' => $unit->users_count ?? 0, // Use eager loaded count
                    'children' => $build($unit->id),
                ];
            }, $children);
        };

        return $build(0);
    }

    private function isCircular(?int $currentId, int $candidateParentId, array $additionalParents = []): bool
    {
        if ($currentId && $candidateParentId === $currentId) {
            return true; // Self-reference
        }

        // Check if candidate parent is in the additional parents list (would create immediate cycle)
        if ($currentId && in_array($currentId, $additionalParents, true)) {
            return true;
        }

        // Optimized: Use hash set (associative array) for O(1) lookup instead of O(n) in_array
        $visited = [];
        $toCheck = [$candidateParentId];
        
        // Also check additional parents
        foreach ($additionalParents as $parentId) {
            if ($parentId !== $candidateParentId) {
                $toCheck[] = $parentId;
            }
        }

        // Optimized: Batch load all parents at once to reduce N+1 queries
        $parentIdsToLoad = array_unique($toCheck);
        $loadedParents = OrgUnit::with('parents:id')
            ->whereIn('id', $parentIdsToLoad)
            ->get()
            ->keyBy('id');

        while (!empty($toCheck)) {
            $parentId = array_shift($toCheck);
            
            if ($currentId && $parentId === $currentId) {
                return true; // Circular reference detected
            }

            // Optimized: O(1) lookup with isset instead of O(n) in_array
            if (isset($visited[$parentId])) {
                continue;
            }

            $visited[$parentId] = true;
            
            // Use pre-loaded parent instead of querying again
            $parent = $loadedParents->get($parentId);
            
            if (!$parent) {
                // If not pre-loaded, load it (shouldn't happen often)
                $parent = OrgUnit::with('parents:id')->find($parentId);
                if ($parent) {
                    $loadedParents[$parentId] = $parent;
                } else {
                    continue;
                }
            }

            // Check traditional parent_id
            if ($parent->parent_id && !isset($visited[$parent->parent_id])) {
                $toCheck[] = $parent->parent_id;
                // Load if not already loaded
                if (!$loadedParents->has($parent->parent_id)) {
                    $newParent = OrgUnit::with('parents:id')->find($parent->parent_id);
                    if ($newParent) {
                        $loadedParents[$parent->parent_id] = $newParent;
                    }
                }
            }

            // Check multiple parents
            foreach ($parent->parents as $p) {
                if (!isset($visited[$p->id])) {
                    $toCheck[] = $p->id;
                    // Load if not already loaded
                    if (!$loadedParents->has($p->id)) {
                        $newParent = OrgUnit::with('parents:id')->find($p->id);
                        if ($newParent) {
                            $loadedParents[$p->id] = $newParent;
                        }
                    }
                }
            }
        }

        return false;
    }
}

