<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskAttachment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class TaskAttachmentController extends Controller
{
    /**
     * Upload file attachment for a task
     */
    public function storeFile(Request $request, Task $task): JsonResponse
    {
        // Verify user has access to this task
        $user = Auth::user();
        if ($task->created_by !== $user->id && $task->assigned_to !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke task ini.',
            ], 403);
        }

        // Validate file
        $data = $request->validate([
            'file' => [
                'required',
                'file',
                'max:10240', // 10MB max
                'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,jpg,jpeg,png,gif,zip,rar',
            ],
        ]);

        try {
            // Store file
            $file = $request->file('file');
            $path = $file->store('tasks/' . $task->id, 'public');
            
            // Create attachment record
            $attachment = TaskAttachment::create([
                'task_id' => $task->id,
                'type' => TaskAttachment::TYPE_FILE,
                'name' => $file->getClientOriginalName(),
                'path' => $path,
                'url' => Storage::disk('public')->url($path),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'created_by' => $user->id,
            ]);

            $attachment->load('creator:id,name,avatar');
            
            return response()->json([
                'success' => true,
                'message' => 'File berhasil diupload.',
                'data' => [
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
                ],
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Upload file attachment error: ' . $e->getMessage(), [
                'task_id' => $task->id,
                'user_id' => $user->id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengupload file. Silakan coba lagi.',
            ], 500);
        }
    }

    /**
     * Add link attachment for a task
     */
    public function storeLink(Request $request, Task $task): JsonResponse
    {
        // Verify user has access to this task
        $user = Auth::user();
        if ($task->created_by !== $user->id && $task->assigned_to !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke task ini.',
            ], 403);
        }

        // Validate link
        $data = $request->validate([
            'url' => [
                'required',
                'url',
                'max:2048',
            ],
            'name' => [
                'nullable',
                'string',
                'max:255',
            ],
        ]);

        try {
            // Create attachment record
            $attachment = TaskAttachment::create([
                'task_id' => $task->id,
                'type' => TaskAttachment::TYPE_LINK,
                'name' => $data['name'] ?? parse_url($data['url'], PHP_URL_HOST) ?? 'Link',
                'url' => $data['url'],
                'created_by' => $user->id,
            ]);

            $attachment->load('creator:id,name,avatar');
            
            return response()->json([
                'success' => true,
                'message' => 'Link berhasil ditambahkan.',
                'data' => [
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
                ],
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Add link attachment error: ' . $e->getMessage(), [
                'task_id' => $task->id,
                'user_id' => $user->id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menambahkan link. Silakan coba lagi.',
            ], 500);
        }
    }

    /**
     * Delete attachment
     */
    public function destroy(Task $task, TaskAttachment $attachment): JsonResponse
    {
        // Verify attachment belongs to task
        if ($attachment->task_id !== $task->id) {
            return response()->json([
                'success' => false,
                'message' => 'Attachment tidak ditemukan.',
            ], 404);
        }

        // Verify user has access to this task
        $user = Auth::user();
        if ($task->created_by !== $user->id && $task->assigned_to !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke task ini.',
            ], 403);
        }

        try {
            // Delete file from storage if it's a file attachment
            if ($attachment->type === TaskAttachment::TYPE_FILE && $attachment->path) {
                Storage::disk('public')->delete($attachment->path);
            }

            // Delete attachment record
            $attachment->delete();

            return response()->json([
                'success' => true,
                'message' => 'Attachment berhasil dihapus.',
            ]);
        } catch (\Exception $e) {
            \Log::error('Delete attachment error: ' . $e->getMessage(), [
                'attachment_id' => $attachment->id,
                'task_id' => $task->id,
                'user_id' => $user->id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menghapus attachment. Silakan coba lagi.',
            ], 500);
        }
    }
}
