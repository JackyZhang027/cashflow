<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SettingApp extends Model
{
    protected $table = 'setting_app';

    protected $fillable = [
        'app_name',
        'description',
        'logo',
        'favicon',
        'color',
        'seo'
    ];

    protected $casts = [
        'seo' => 'array',
    ];
}
