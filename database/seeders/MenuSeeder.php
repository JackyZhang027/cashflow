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
        $master = Menu::firstOrCreate([
            'title' => 'Master Data',
            'icon' => 'Database',
            'route' => '#',
            'order' => 1,
            'permission_name' => 'master-view',
        ]);
        
        Menu::firstOrCreate([
            'title' => 'Branches',
            'icon' => 'MapPin',
            'route' => '/branches',
            'order' => 1,
            'permission_name' => 'branches-view',
            'parent_id' => $master->id,
        ]);
        
        
        Menu::firstOrCreate([
            'title' => 'Currencies',
            'icon' => 'DollarSign',
            'route' => '/currencies',
            'order' => 2,
            'permission_name' => 'currencies-view',
            'parent_id' => $master->id,
        ]);
        
        
        $transaction = Menu::firstOrCreate([
            'title' => 'Transactions',
            'icon' => 'Repeat',
            'route' => '#',
            'order' => 2,
            'permission_name' => 'transaction-view',
        ]);
        
        Menu::firstOrCreate([
            'title' => 'Cash In',
            'icon' => 'ArrowUpCircle',
            'route' => '/transactions/in',
            'order' => 1,
            'permission_name' => 'transaction-in-view',
            'parent_id' => $transaction->id,
        ]);

        Menu::firstOrCreate([
            'title' => 'Cash Out',
            'icon' => 'ArrowDownCircle',
            'route' => '/transactions/out',
            'order' => 2,
            'permission_name' => 'transaction-out-view',
            'parent_id' => $transaction->id,
        ]);

        // GROUP: Access
        $access = Menu::firstOrCreate([
            'title' => 'Access',
            'icon' => 'Contact',
            'route' => '#',
            'order' => 2,
            'permission_name' => 'access-view',
        ]);

        // Menu::firstOrCreate([
        //     'title' => 'Permissions',
        //     'icon' => 'AlertOctagon',
        //     'route' => '/permissions',
        //     'order' => 2,
        //     'permission_name' => 'permission-view',
        //     'parent_id' => $access->id,
        // ]);

        Menu::firstOrCreate([
            'title' => 'Users',
            'icon' => 'Users',
            'route' => '/users',
            'order' => 3,
            'permission_name' => 'users-view',
            'parent_id' => $access->id,
        ]);

        // Menu::firstOrCreate([
        //     'title' => 'Roles',
        //     'icon' => 'AlertTriangle',
        //     'route' => '/roles',
        //     'order' => 4,
        //     'permission_name' => 'roles-view',
        //     'parent_id' => $access->id,
        // ]);

        // GROUP: Settings
        $settings = Menu::firstOrCreate([
            'title' => 'Settings',
            'icon' => 'Settings',
            'route' => '#',
            'order' => 3,
            'permission_name' => 'settings-view',
        ]);

        Menu::firstOrCreate([
            'title' => 'Menu Manager',
            'icon' => 'Menu',
            'route' => '/menus',
            'order' => 1,
            'permission_name' => 'menu-view',
            'parent_id' => $settings->id,
        ]);

        Menu::firstOrCreate([
            'title' => 'App Settings',
            'icon' => 'AtSign',
            'route' => '/settingsapp',
            'order' => 2,
            'permission_name' => 'app-settings-view',
            'parent_id' => $settings->id,
        ]);

        // Menu::firstOrCreate([
        //     'title' => 'Backup',
        //     'icon' => 'Inbox',
        //     'route' => '/backup',
        //     'order' => 3,
        //     'permission_name' => 'backup-view',
        //     'parent_id' => $settings->id,
        // ]);

        // GROUP: Utilities
        // $utilities = Menu::firstOrCreate([
        //     'title' => 'Utilities',
        //     'icon' => 'CreditCard',
        //     'route' => '#',
        //     'order' => 4,
        //     'permission_name' => 'utilities-view',
        // ]);

        // Menu::firstOrCreate([
        //     'title' => 'Audit Logs',
        //     'icon' => 'Activity',
        //     'route' => '/audit-logs',
        //     'order' => 2,
        //     'permission_name' => 'log-view',
        //     'parent_id' => $utilities->id,
        // ]);

        // Menu::firstOrCreate([
        //     'title' => 'File Manager',
        //     'icon' => 'Folder',
        //     'route' => '/files',
        //     'order' => 3,
        //     'permission_name' => 'filemanager-view',
        //     'parent_id' => $utilities->id,
        // ]);

        
        $permissions = Menu::pluck('permission_name')->unique()->filter();

        foreach ($permissions as $permName) {
            Permission::firstOrCreate(['name' => $permName]);
        }

        $role = Role::firstOrCreate(['name' => 'user']);
        $role->givePermissionTo('dashboard-view');
    }
}
