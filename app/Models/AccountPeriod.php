<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountPeriod extends Model
{
    protected $fillable = [
        'name',
        'start_date',
        'end_date',
        'status',
    ];
}
