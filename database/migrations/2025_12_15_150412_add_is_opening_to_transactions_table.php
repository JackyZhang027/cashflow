<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table
                ->boolean('is_opening')
                ->default(false)
                ->after('status');

            $table->index(['branch_id', 'currency_id', 'is_opening']);
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['branch_id', 'currency_id', 'is_opening']);
            $table->dropColumn('is_opening');
        });
    }
};
