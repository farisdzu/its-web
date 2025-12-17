<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\User;

class OrgUnit extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'code',
        'parent_id',
        'order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'order' => 'integer',
        ];
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('order');
    }

    // Many-to-many relationship for multiple parents
    public function parents(): BelongsToMany
    {
        return $this->belongsToMany(
            self::class,
            'org_unit_parents',
            'org_unit_id', // Foreign key for child
            'parent_id'    // Foreign key for parent
        )->withTimestamps();
    }

    // Inverse relationship: get all children that have this unit as parent
    public function childrenThroughParents(): BelongsToMany
    {
        return $this->belongsToMany(
            self::class,
            'org_unit_parents',
            'parent_id',   // Foreign key for parent
            'org_unit_id'  // Foreign key for child
        )->withTimestamps();
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}

