<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SettingAppSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('setting_app')->insert([
            'app_name' => 'CashFlow',
            'description' => 'Cashflow Management Application',
            'logo' => '/storage/settings/logo.png',
            'favicon' => '/storage/settings/favicon.ico',
            'color' => '#2563eb', // Tailwind blue-600
            'seo' => json_encode([
                'title' => 'CashFlow - Manage Your Finances Efficiently',
                'keywords' => 'CashFlow, Finance, Management, Budgeting, Expenses, Income',
                'description' => 'cashflow is a powerful application designed to help you manage your finances efficiently. Track your income and expenses, create budgets, and gain insights into your financial health with ease.',
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
