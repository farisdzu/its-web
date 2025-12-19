<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class TaskAttachment extends Model
{
    use HasFactory;

    public const TYPE_FILE = 'file';
    public const TYPE_LINK = 'link';

    public const TYPES = [
        self::TYPE_FILE,
        self::TYPE_LINK,
    ];

    protected $fillable = [
        'task_id',
        'type',
        'name',
        'path',
        'url',
        'mime_type',
        'size',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Task that owns this attachment
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * User who created this attachment
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope untuk mendapatkan attachments berdasarkan type
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope untuk mendapatkan file attachments
     */
    public function scopeFiles($query)
    {
        return $query->where('type', self::TYPE_FILE);
    }

    /**
     * Scope untuk mendapatkan link attachments
     */
    public function scopeLinks($query)
    {
        return $query->where('type', self::TYPE_LINK);
    }

    /**
     * Accessor untuk mendapatkan full URL file
     */
    public function getFileUrlAttribute(): ?string
    {
        if ($this->type === self::TYPE_FILE && $this->path) {
            return Storage::url($this->path);
        }

        return $this->url;
    }
}
