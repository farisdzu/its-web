<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    /**
     * List all tasks for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $query = Task::with(['creator:id,name,avatar', 'assignee:id,name,avatar', 'assignees:id,name,avatar'])
            ->orderBy('created_at', 'desc');

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->byStatus($request->status);
        }

        // Filter by priority
        if ($request->has('priority') && $request->priority !== 'all') {
            $query->byPriority($request->priority);
        }

        // Filter by item_type (tugas/agenda)
        if ($request->has('item_type') && in_array($request->item_type, ['tugas', 'agenda'])) {
            $query->byType($request->item_type);
        }
        // If no item_type filter, return all (both tugas and agenda)

        // Filter by type (assigned_to_me, created_by_me, personal)
        if ($request->has('type')) {
            if ($request->type === 'assigned_to_me') {
                $query->assignedTo($user->id);
            } elseif ($request->type === 'created_by_me') {
                $query->createdBy($user->id);
            } elseif ($request->type === 'personal') {
                $query->personal($user->id);
            }
        } else {
            // Default: show tasks created by or assigned to user
            $query->where(function ($q) use ($user) {
                $q->where('created_by', $user->id)
                  ->orWhere('assigned_to', $user->id)
                  ->orWhereHas('assignees', function ($assigneeQuery) use ($user) {
                      $assigneeQuery->where('users.id', $user->id);
                  });
            });
        }

        // Search
        if ($request->has('search') && $request->search) {
            $query->search($request->search);
        }

        $tasks = $query->withCount([
            'attachments as links_count' => function ($query) {
                $query->where('type', 'link');
            },
            'attachments as files_count' => function ($query) {
                $query->where('type', 'file');
            },
        ])->get();

        // Format response to match frontend TaskCardData interface
        $formattedTasks = $tasks->map(function ($task) {
            $formatted = [
                'id' => $task->id,
                'type' => $task->type ?? 'tugas',
                'title' => $task->title,
                'description' => $task->description,
                'dueDate' => $task->due_date ? $task->due_date->format('d M Y') : null,
                'assignedUsers' => $task->assignees->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'avatar' => $user->avatar,
                    ];
                })->toArray(),
                'linksCount' => $task->links_count ?? 0,
                'attachmentsCount' => $task->files_count ?? 0,
                'createdBy' => $task->created_by,
                'assignedTo' => $task->assigned_to,
            ];

            // Add task-specific fields
            if ($task->type === Task::TYPE_TUGAS) {
                $formatted['progress'] = $task->progress;
                $formatted['priority'] = $task->priority;
                $formatted['status'] = $task->status;
            }

            // Add agenda-specific fields
            if ($task->type === Task::TYPE_AGENDA) {
                $formatted['startTime'] = $task->start_time ? $task->start_time->format('H:i') : null;
                $formatted['endTime'] = $task->end_time ? $task->end_time->format('H:i') : null;
                $formatted['meetingLink'] = $task->meeting_link;
            }

            return $formatted;
        });

        return response()->json([
            'success' => true,
            'data' => $formattedTasks,
        ]);
    }

    /**
     * Create a new task
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        try {
            $data = $request->validate([
                'type' => ['required', Rule::in(Task::TYPES)],
                'title' => ['required', 'string', 'max:255'],
                'description' => ['nullable', 'string'],
                
                // Fields for Tugas
                'due_date' => ['nullable', 'date'],
                'progress' => ['nullable', 'integer', 'min:0', 'max:100'],
                'priority' => ['nullable', Rule::in(Task::PRIORITIES)],
                'status' => ['nullable', Rule::in(Task::STATUSES)],
                
                // Fields for Agenda
                'start_time' => ['nullable', 'date_format:H:i'],
                'end_time' => ['nullable', 'date_format:H:i'],
                'meeting_link' => ['nullable', 'string', 'max:500'],
                
                'assigned_to' => ['nullable', 'exists:users,id'],
                'assignee_ids' => ['nullable', 'array'],
                'assignee_ids.*' => ['exists:users,id'],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $e->errors(),
            ], 422);
        }

        try {
            $taskData = [
                'type' => $data['type'],
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'created_by' => $user->id,
                'assigned_to' => $data['assigned_to'] ?? null,
            ];

            // Add fields based on type
            if ($data['type'] === Task::TYPE_TUGAS) {
                $taskData['due_date'] = $data['due_date'] ?? null;
                $taskData['progress'] = $data['progress'] ?? 0;
                $taskData['priority'] = $data['priority'] ?? Task::PRIORITY_SEDANG;
                $taskData['status'] = $data['status'] ?? Task::STATUS_BARU;
            } elseif ($data['type'] === Task::TYPE_AGENDA) {
                $taskData['due_date'] = $data['due_date'] ?? null; // Tanggal agenda
                $taskData['start_time'] = $data['start_time'] ?? null;
                $taskData['end_time'] = $data['end_time'] ?? null;
                $taskData['meeting_link'] = $data['meeting_link'] ?? null;
                // Agenda tidak punya progress, priority, status - set default untuk kompatibilitas database
                $taskData['progress'] = 0; // Set 0 karena kolom tidak nullable
                $taskData['priority'] = Task::PRIORITY_SEDANG; // Default untuk kompatibilitas
                $taskData['status'] = Task::STATUS_BARU; // Default untuk kompatibilitas
            }

            $task = Task::create($taskData);

            // Sync assignees (many-to-many)
            if (isset($data['assignee_ids']) && !empty($data['assignee_ids'])) {
                $task->assignees()->sync($data['assignee_ids']);
            }

            // Load relationships for response
            $task->load(['creator:id,name,avatar', 'assignee:id,name,avatar', 'assignees:id,name,avatar']);
            $task->loadCount([
                'attachments as links_count' => function ($query) {
                    $query->where('type', 'link');
                },
                'attachments as files_count' => function ($query) {
                    $query->where('type', 'file');
                },
            ]);

            $responseData = [
                'id' => $task->id,
                'type' => $task->type,
                'title' => $task->title,
                'description' => $task->description,
                'dueDate' => $task->due_date ? $task->due_date->format('d M Y') : null,
                'assignedUsers' => $task->assignees->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'avatar' => $user->avatar,
                    ];
                })->toArray(),
                'linksCount' => $task->links_count ?? 0,
                'attachmentsCount' => $task->files_count ?? 0,
                'createdBy' => $task->created_by,
                'assignedTo' => $task->assigned_to,
            ];

            // Add task-specific fields
            if ($task->type === Task::TYPE_TUGAS) {
                $responseData['progress'] = $task->progress;
                $responseData['priority'] = $task->priority;
                $responseData['status'] = $task->status;
            }

            // Add agenda-specific fields
            if ($task->type === Task::TYPE_AGENDA) {
                $responseData['startTime'] = $task->start_time ? $task->start_time->format('H:i') : null;
                $responseData['endTime'] = $task->end_time ? $task->end_time->format('H:i') : null;
                $responseData['meetingLink'] = $task->meeting_link;
            }

            return response()->json([
                'success' => true,
                'message' => $task->type === Task::TYPE_TUGAS ? 'Task berhasil dibuat.' : 'Agenda berhasil dibuat.',
                'data' => $responseData,
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Failed to create task', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $user->id,
                'data' => $data,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat task. Silakan coba lagi.',
            ], 500);
        }
    }

    /**
     * Get a single task
     */
    public function show(Task $task): JsonResponse
    {
        $user = Auth::user();

        // Check if user has access to this task
        if ($task->created_by !== $user->id && 
            $task->assigned_to !== $user->id && 
            !$task->assignees->contains('id', $user->id)) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke task ini.',
            ], 403);
        }

        $task->load([
            'creator:id,name,avatar', 
            'assignee:id,name,avatar', 
            'assignees:id,name,avatar',
            'attachments' => function ($query) {
                $query->with('creator:id,name,avatar')->orderBy('created_at', 'desc');
            }
        ]);
        $task->loadCount([
            'attachments as links_count' => function ($query) {
                $query->where('type', 'link');
            },
            'attachments as files_count' => function ($query) {
                $query->where('type', 'file');
            },
        ]);

        $responseData = [
            'id' => $task->id,
            'type' => $task->type ?? 'tugas',
            'title' => $task->title,
            'description' => $task->description,
            'dueDate' => $task->due_date ? $task->due_date->format('d M Y') : null,
            'assignedUsers' => $task->assignees->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'avatar' => $user->avatar,
                ];
            })->toArray(),
            'linksCount' => $task->links_count ?? 0,
            'attachmentsCount' => $task->files_count ?? 0,
            'createdBy' => $task->created_by,
            'assignedTo' => $task->assigned_to,
            'attachments' => $task->attachments->map(function ($attachment) {
                    return [
                        'id' => $attachment->id,
                        'task_id' => $attachment->task_id,
                        'type' => $attachment->type,
                        'name' => $attachment->name,
                        'path' => $attachment->path,
                        'url' => $attachment->url,
                        'mime_type' => $attachment->mime_type,
                        'size' => $attachment->size,
                        'created_by' => $attachment->created_by,
                        'created_at' => $attachment->created_at->toISOString(),
                        'updated_at' => $attachment->updated_at->toISOString(),
                        'creator' => $attachment->creator ? [
                            'id' => $attachment->creator->id,
                            'name' => $attachment->creator->name,
                            'avatar' => $attachment->creator->avatar,
                        ] : null,
                    ];
                })->toArray(),
        ];

        // Add task-specific fields
        if ($task->type === Task::TYPE_TUGAS) {
            $responseData['progress'] = $task->progress;
            $responseData['priority'] = $task->priority;
            $responseData['status'] = $task->status;
        }

        // Add agenda-specific fields
        if ($task->type === Task::TYPE_AGENDA) {
            $responseData['startTime'] = $task->start_time ? $task->start_time->format('H:i') : null;
            $responseData['endTime'] = $task->end_time ? $task->end_time->format('H:i') : null;
            $responseData['meetingLink'] = $task->meeting_link;
        }

        return response()->json([
            'success' => true,
            'data' => $responseData,
        ]);
    }

    /**
     * Update a task
     */
    public function update(Request $request, Task $task): JsonResponse
    {
        $user = Auth::user();

        // Check if user is the creator
        if ($task->created_by !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki izin untuk mengubah task ini.',
            ], 403);
        }

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            
            // Fields for Tugas
            'due_date' => ['nullable', 'date'],
            'progress' => ['nullable', 'integer', 'min:0', 'max:100'],
            'priority' => ['nullable', Rule::in(Task::PRIORITIES)],
            'status' => ['nullable', Rule::in(Task::STATUSES)],
            
            // Fields for Agenda
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i'],
            'meeting_link' => ['nullable', 'string', 'max:500'],
            
            'assigned_to' => ['nullable', 'exists:users,id'],
            'assignee_ids' => ['nullable', 'array'],
            'assignee_ids.*' => ['exists:users,id'],
        ]);

        // Filter data based on task type
        $updateData = [];
        if ($task->type === Task::TYPE_TUGAS) {
            // Only update task-specific fields
            if (isset($data['title'])) $updateData['title'] = $data['title'];
            if (isset($data['description'])) $updateData['description'] = $data['description'];
            if (isset($data['due_date'])) $updateData['due_date'] = $data['due_date'];
            if (isset($data['progress'])) $updateData['progress'] = $data['progress'];
            if (isset($data['priority'])) $updateData['priority'] = $data['priority'];
            if (isset($data['status'])) $updateData['status'] = $data['status'];
            if (isset($data['assigned_to'])) $updateData['assigned_to'] = $data['assigned_to'];
        } elseif ($task->type === Task::TYPE_AGENDA) {
            // Only update agenda-specific fields
            if (isset($data['title'])) $updateData['title'] = $data['title'];
            if (isset($data['description'])) $updateData['description'] = $data['description'];
            if (isset($data['due_date'])) $updateData['due_date'] = $data['due_date'];
            if (isset($data['start_time'])) $updateData['start_time'] = $data['start_time'];
            if (isset($data['end_time'])) $updateData['end_time'] = $data['end_time'];
            if (isset($data['meeting_link'])) $updateData['meeting_link'] = $data['meeting_link'];
            if (isset($data['assigned_to'])) $updateData['assigned_to'] = $data['assigned_to'];
        }

        $task->update($updateData);

        // Sync assignees if provided
        if (isset($data['assignee_ids'])) {
            $task->assignees()->sync($data['assignee_ids'] ?? []);
        }

        // Load relationships for response
        $task->load(['creator:id,name,avatar', 'assignee:id,name,avatar', 'assignees:id,name,avatar']);

        return response()->json([
            'success' => true,
            'message' => 'Task berhasil diperbarui.',
            'data' => [
                'id' => $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'dueDate' => $task->due_date ? $task->due_date->format('d M Y') : null,
                'progress' => $task->progress,
                'priority' => $task->priority,
                'status' => $task->status,
                'assignedUsers' => $task->assignees->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'avatar' => $user->avatar,
                    ];
                })->toArray(),
                'linksCount' => 0,
                'attachmentsCount' => 0,
                'createdBy' => $task->created_by,
                'assignedTo' => $task->assigned_to,
            ],
        ]);
    }

    /**
     * Delete a task
     */
    public function destroy(Task $task): JsonResponse
    {
        $user = Auth::user();

        // Check if user is the creator
        if ($task->created_by !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki izin untuk menghapus task ini.',
            ], 403);
        }

        $task->delete();

        return response()->json([
            'success' => true,
            'message' => 'Task berhasil dihapus.',
        ]);
    }

    /**
     * Update task status (for drag & drop)
     */
    public function updateStatus(Request $request, Task $task): JsonResponse
    {
        $user = Auth::user();

        // Check if user has access to this task
        if ($task->created_by !== $user->id && 
            $task->assigned_to !== $user->id && 
            !$task->assignees->contains('id', $user->id)) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke task ini.',
            ], 403);
        }

        $data = $request->validate([
            'status' => ['required', Rule::in(Task::STATUSES)],
        ]);

        $task->update(['status' => $data['status']]);

        return response()->json([
            'success' => true,
            'message' => 'Status task berhasil diperbarui.',
            'data' => [
                'id' => $task->id,
                'status' => $task->status,
            ],
        ]);
    }
}
