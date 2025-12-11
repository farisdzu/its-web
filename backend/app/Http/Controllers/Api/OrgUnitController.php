<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrgUnit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OrgUnitController extends Controller
{
    public function index(): JsonResponse
    {
        $units = OrgUnit::orderBy('parent_id')->orderBy('order')->get();

        $tree = $this->buildTree($units);

        return response()->json([
            'success' => true,
            'data' => $tree,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
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

        return response()->json([
            'success' => true,
            'data' => $orgUnit,
        ], 201);
    }

    public function update(Request $request, OrgUnit $orgUnit): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
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

        return response()->json([
            'success' => true,
            'data' => $orgUnit,
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
                    'children' => $build($unit->id),
                ];
            }, $children);
        };

        return $build(0);
    }

    private function isCircular(int $currentId, int $candidateParentId): bool
    {
        $parent = OrgUnit::find($candidateParentId);

        while ($parent) {
            if ($parent->id === $currentId) {
                return true;
            }
            $parent = $parent->parent;
        }

        return false;
    }
}

