<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Buat role master, admin dan finance jika belum ada
        $master_admin = Role::firstOrCreate(['name' => 'master-admin']);
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $finance = Role::firstOrCreate(['name' => 'finance']);

        // Daftar permission berdasarkan menu structure
        $permissions = [
            'Dashboard' => [
                'dashboard-view',
            ],
            'Access' => [
                'access-view',
                'permission-view',
                'users-view',
                'roles-view',
            ],
            'Master' => [
                'master-view',
                'branches-view',
                'currencies-view',
            ],
            'Transactions' => [
                'transaction-view',
                'transaction-in-view',
                'transaction-out-view',
                'approve-transaction',
                'reject-transaction',
                'create-transaction',
                'edit-transaction',
                'delete-transaction',
                'scan-transaction-view',
            ],
            'Reports' => [
                'reports-view',
                'balance-summary-view',
                'daily-report-view'
            ],
            'Settings' => [
                'settings-view',
                'menu-view',
                'app-settings-view',
                'backup-view',
            ],
            'Utilities' => [
                'utilities-view',
                'log-view',
                'filemanager-view',
            ],
        ];

        foreach ($permissions as $group => $perms) {
            foreach ($perms as $name) {
                $permission = Permission::updateOrCreate(
                    ['name' => $name],        // match condition
                    ['group' => $group]       // fields to update
                );


                // Assign ke master-admin
                if (!$master_admin->hasPermissionTo($permission)) {
                    $master_admin->givePermissionTo($permission);
                }
            }
        }
    }
}
