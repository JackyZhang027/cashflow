<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

class Branch extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'address',
        'city',
        'province',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    /**
     * Model Events
     */
    protected static function booted(): void
    {
        // CREATE
        static::creating(function ($branch) {
            if (Auth::check()) {
                $branch->created_by = Auth::id();
            }
        });

        // UPDATE
        static::updating(function ($branch) {
            if (Auth::check()) {
                $branch->updated_by = Auth::id();
            }
        });

        // SOFT DELETE
        static::deleting(function ($branch) {
            if (! $branch->isForceDeleting() && Auth::check()) {
                $branch->deleted_by = Auth::id();
                $branch->saveQuietly(); // prevent recursion
            }
        });

        // RESTORE
        static::restoring(function ($branch) {
            $branch->deleted_by = null;
        });
    }

    /**
     * Relationships
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function deleter()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function openingBalances()
    {
        return $this->hasMany(BranchOpeningBalance::class);
    }

    public function openingBalanceByCurrency(string $currencyCode)
    {
        return $this->hasOne(BranchOpeningBalance::class)
            ->whereHas('currency', fn ($q) => $q->where('code', $currencyCode));
    }
}
