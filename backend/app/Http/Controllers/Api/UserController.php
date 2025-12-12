<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class UserController extends Controller
{
    /**
     * Get all users with optional search and role filter
     * Includes pagination for scalability
     * Excludes admin users by default (admin tidak perlu di-assign ke org unit)
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        // Exclude admin users by default (unless explicitly requested)
        if (!$request->has('include_admin')) {
            $query->where('role', '!=', User::ROLE_ADMIN);
        }

        // Search filter
        if ($request->has('search') && $request->search) {
            $query->search($request->search);
        }

        // Role filter
        if ($request->has('role') && $request->role) {
            $query->byRole($request->role);
        }

        // Only get active users by default (unless explicitly requested)
        if (!$request->has('include_inactive')) {
            $query->active();
        }

        // Pagination for scalability (default 50 per page, max 100)
        $perPage = min((int) ($request->get('per_page', 50)), 100);
        $page = (int) $request->get('page', 1);

        // Select only needed fields to reduce response size
        $users = $query->select('id', 'name', 'email', 'username', 'employee_id', 'role', 'org_unit_id', 'title', 'is_active')
            ->with('orgUnit:id,name') // Eager load to prevent N+1
            ->orderBy('name')
            ->paginate($perPage, ['*'], 'page', $page);

        $data = $users->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'employee_id' => $user->employee_id,
                'role' => $user->role,
                'org_unit_id' => $user->org_unit_id,
                'org_unit_name' => $user->orgUnit?->name,
                'title' => $user->title,
                'is_active' => $user->is_active,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    /**
     * Assign user to org unit
     */
    public function assign(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'org_unit_id' => ['required', 'exists:org_units,id'],
            'title' => ['nullable', 'string', 'max:255'],
        ]);

        $user->update([
            'org_unit_id' => $data['org_unit_id'],
            'title' => $data['title'] ?? null,
        ]);

        // Clear cache karena user_count berubah
        Cache::forget('org_units_tree');

        $user->load('orgUnit:id,name');

        return response()->json([
            'success' => true,
            'message' => 'User berhasil di-assign ke bagian.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'org_unit_id' => $user->org_unit_id,
                'org_unit_name' => $user->orgUnit?->name,
                'title' => $user->title,
            ],
        ]);
    }

    /**
     * Unassign user from org unit
     */
    public function unassign(User $user): JsonResponse
    {
        $user->update([
            'org_unit_id' => null,
            'title' => null,
        ]);

        // Clear cache karena user_count berubah
        Cache::forget('org_units_tree');

        return response()->json([
            'success' => true,
            'message' => 'User berhasil di-unassign dari bagian.',
        ]);
    }
}
