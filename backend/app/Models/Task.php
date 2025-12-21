<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    use HasFactory;

    public const TYPE_TUGAS = 'tugas';
    public const TYPE_AGENDA = 'agenda';

    public const TYPES = [
        self::TYPE_TUGAS,
        self::TYPE_AGENDA,
    ];

    public const PRIORITY_TINGGI = 'tinggi';
    public const PRIORITY_SEDANG = 'sedang';
    public const PRIORITY_RENDAH = 'rendah';

    public const PRIORITIES = [
        self::PRIORITY_TINGGI,
        self::PRIORITY_SEDANG,
        self::PRIORITY_RENDAH,
    ];

    public const STATUS_BARU = 'baru';
    public const STATUS_PROses = 'proses';
    public const STATUS_REVIEW = 'review';
    public const STATUS_SELESAI = 'selesai';

    public const STATUSES = [
        self::STATUS_BARU,
        self::STATUS_PROses,
        self::STATUS_REVIEW,
        self::STATUS_SELESAI,
    ];

    protected $fillable = [
        'type',
        'title',
        'description',
        'due_date',
        'start_time',
        'end_time',
        'meeting_link',
        'progress',
        'priority',
        'status',
        'created_by',
        'assigned_to',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'progress' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * User who created this task
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * User who is assigned to this task (single assignee)
     */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Users assigned to this task (many-to-many)
     */
    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'task_assignees', 'task_id', 'user_id')
            ->withTimestamps();
    }

    /**
     * Attachments for this task
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(TaskAttachment::class);
    }

    /**
     * Scope untuk mendapatkan task berdasarkan status
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope untuk mendapatkan task berdasarkan priority
     */
    public function scopeByPriority($query, string $priority)
    {
        return $query->where('priority', $priority);
    }

    /**
     * Scope untuk mendapatkan task yang dibuat oleh user tertentu
     */
    public function scopeCreatedBy($query, int $userId)
    {
        return $query->where('created_by', $userId);
    }

    /**
     * Scope untuk mendapatkan task yang di-assign ke user tertentu
     */
    public function scopeAssignedTo($query, int $userId)
    {
        return $query->where('assigned_to', $userId)
            ->orWhereHas('assignees', function ($q) use ($userId) {
                $q->where('users.id', $userId);
            });
    }

    /**
     * Scope untuk mendapatkan task personal (tidak ada assigned_to)
     */
    public function scopePersonal($query, int $userId)
    {
        return $query->where('created_by', $userId)
            ->whereNull('assigned_to');
    }

    /**
     * Scope untuk mencari task berdasarkan keyword
     */
    public function scopeSearch($query, string $keyword)
    {
        return $query->where(function ($q) use ($keyword) {
            $q->where('title', 'like', "%{$keyword}%")
              ->orWhere('description', 'like', "%{$keyword}%");
        });
    }

    /**
     * Scope untuk mendapatkan task berdasarkan type
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope untuk hanya tugas (dengan workflow)
     */
    public function scopeTasks($query)
    {
        return $query->where('type', self::TYPE_TUGAS);
    }

    /**
     * Scope untuk hanya agenda
     */
    public function scopeAgendas($query)
    {
        return $query->where('type', self::TYPE_AGENDA);
    }
}
