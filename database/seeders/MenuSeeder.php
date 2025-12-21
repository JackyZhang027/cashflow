<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Menu;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        /* ======================
           MASTER DATA
        ====================== */

        $master = Menu::updateOrCreate(
            ['title' => 'Master Data', 'parent_id' => null, 'route' => '#'],
            [
                'icon' => 'Database',
                'order' => 1,
                'permission_name' => 'master-view',
            ]
        );

        Menu::updateOrCreate(
            ['title' => 'Branches', 'parent_id' => $master->id, 'route' => '/branches'],
            [
                'icon' => 'MapPin',
                'order' => 1,
                'permission_name' => 'branches-view',
            ]
        );

        Menu::updateOrCreate(
            ['title' => 'Currencies', 'parent_id' => $master->id, 'route' => '/currencies'],
            [
                'icon' => 'DollarSign',
                'order' => 2,
                'permission_name' => 'currencies-view',
            ]
        );

        /* ======================
           TRANSACTIONS
        ====================== */

        $transaction = Menu::updateOrCreate(
            ['title' => 'Transactions', 'parent_id' => null, 'route' => '#'],
            [
                'icon' => 'Repeat',
                'order' => 2,
                'permission_name' => 'transaction-view',
            ]
        );

        Menu::updateOrCreate(
            ['title' => 'Scan Transaction', 'parent_id' => $transaction->id, 'route' => '/transactions/scan'],
            [
                'icon' => 'Camera',
                'order' => 1,
                'permission_name' => 'scan-transaction-view',
            ]
        );

        Menu::updateOrCreate(
            ['title' => 'Cash In', 'parent_id' => $transaction->id, 'route' => '/transactions/in'],
            [
                'icon' => 'ArrowUpCircle',
                'order' => 2,
                'permission_name' => 'transaction-in-view',
            ]
        );

        Menu::updateOrCreate(
            ['title' => 'Cash Out', 'parent_id' => $transaction->id, 'route' => '/transactions/out'],
            [
                'icon' => 'ArrowDownCircle',
                'order' => 3,
                'permission_name' => 'transaction-out-view',
            ]
        );

        /* ======================
           ACCESS
        ====================== */

        $access = Menu::updateOrCreate(
            ['title' => 'Access', 'parent_id' => null, 'route' => '#'],
            [
                'icon' => 'Contact',
                'order' => 3,
                'permission_name' => 'access-view',
            ]
        );

        Menu::updateOrCreate(
            ['title' => 'Users', 'parent_id' => $access->id, 'route' => '/users'],
            [
                'icon' => 'Users',
                'order' => 1,
                'permission_name' => 'users-view',
            ]
        );

        Menu::updateOrCreate(
            ['title' => 'Role', 'parent_id' => $access->id, 'route' => '/roles'],
            [
                'icon' => 'AlertTriangle',
                'order' => 2,
                'permission_name' => 'roles-view',
            ]
        );
        
        /* ======================
           SETTINGS
        ====================== */

        $settings = Menu::updateOrCreate(
            ['title' => 'Settings', 'parent_id' => null, 'route' => '#'],
            [
                'icon' => 'Settings',
                'order' => 4,
                'permission_name' => 'settings-view',
            ]
        );

        Menu::updateOrCreate(
            ['title' => 'Menu Manager', 'parent_id' => $settings->id, 'route' => '/menus'],
            [
                'icon' => 'Menu',
                'order' => 1,
                'permission_name' => 'menu-view',
            ]
        );

        /* ======================
           PERMISSIONS
        ====================== */

        Menu::whereNotNull('permission_name')
            ->pluck('permission_name')
            ->unique()
            ->each(fn ($name) =>
                Permission::updateOrCreate(
                    ['name' => $name],
                    ['group' => explode('-', $name)[0]]
                )
            );

        Permission::updateOrCreate(
            ['name' => 'dashboard-view'],
            ['group' => 'dashboard']
        );

        /* ======================
           ROLE
        ====================== */

        $role = Role::updateOrCreate(['name' => 'user']);
        $role->syncPermissions(Permission::pluck('name'));
    }
}
