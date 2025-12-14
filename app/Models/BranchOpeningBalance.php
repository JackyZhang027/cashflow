<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BranchOpeningBalance extends Model
{
    protected $table = 'branch_opening_balances';

    protected $fillable = [
        'branch_id',
        'currency_id',
        'opening_balance',
        'opening_date',
        'created_by',
    ];

    protected $casts = [
        'opening_balance' => 'decimal:2',
        'opening_date' => 'date',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
    
    public function currency()
    {
        return $this->belongsTo(Currency::class);
    }
}
