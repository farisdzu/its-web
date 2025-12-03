<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActiveSession extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'token_id',
        'device_name',
        'ip_address',
        'user_agent',
        'last_activity',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'last_activity' => 'datetime',
        ];
    }

    /**
     * Get the user that owns this session.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope untuk mendapatkan session yang aktif (belum expired)
     */
    public function scopeActive($query)
    {
        return $query->where('last_activity', '>', now()->subMinutes(config('session.lifetime', 120)));
    }

    /**
     * Scope untuk mendapatkan session berdasarkan user
     */
    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope untuk mendapatkan session berdasarkan token
     */
    public function scopeByToken($query, string $tokenId)
    {
        return $query->where('token_id', $tokenId);
    }
}
