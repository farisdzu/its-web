<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    public const ROLE_ADMIN = 'admin';
    public const ROLE_DEKAN = 'dekan';
    public const ROLE_UNIT = 'unit';
    public const ROLE_SDM = 'sdm';

    public const ROLES = [
        self::ROLE_ADMIN,
        self::ROLE_DEKAN,
        self::ROLE_UNIT,
        self::ROLE_SDM,
    ];

    protected $fillable = [
        'name',
        'username',
        'email',
        'phone',
        'avatar',
        'password',
        'role',
        'employee_id',
        'org_unit_id',
        'title',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function activeSessions(): HasMany
    {
        return $this->hasMany(ActiveSession::class);
    }

    public function orgUnit(): BelongsTo
    {
        return $this->belongsTo(OrgUnit::class);
    }

    /**
     * Scope untuk mendapatkan user yang aktif
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope untuk mendapatkan user berdasarkan role
     */
    public function scopeByRole($query, string $role)
    {
        return $query->where('role', $role);
    }

    /**
     * Scope untuk mencari user berdasarkan nama, email, atau username
     */
    public function scopeSearch($query, string $keyword)
    {
        return $query->where(function ($q) use ($keyword) {
            $q->where('name', 'like', "%{$keyword}%")
              ->orWhere('email', 'like', "%{$keyword}%")
              ->orWhere('username', 'like', "%{$keyword}%")
              ->orWhere('employee_id', 'like', "%{$keyword}%");
        });
    }

    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    public function isDekan(): bool
    {
        return $this->hasRole(self::ROLE_DEKAN);
    }

    public function isUnit(): bool
    {
        return $this->hasRole(self::ROLE_UNIT);
    }

    public function isSdm(): bool
    {
        return $this->hasRole(self::ROLE_SDM);
    }

    public function getDashboardRoute(): string
    {
        return match ($this->role) {
            self::ROLE_DEKAN => '/dekan',
            self::ROLE_UNIT => '/unit',
            self::ROLE_SDM => '/sdm',
            default => '/sdm',
        };
    }

    protected static function boot(): void
    {
        parent::boot();

        static::deleting(function (User $user) {
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }
        });

        static::updating(function (User $user) {
            if ($user->isDirty('avatar')) {
                $oldAvatar = $user->getOriginal('avatar');
                if ($oldAvatar && $oldAvatar !== $user->avatar && Storage::disk('public')->exists($oldAvatar)) {
                    Storage::disk('public')->delete($oldAvatar);
                }
            }
        });
    }
}
