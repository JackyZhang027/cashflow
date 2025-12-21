<?php

namespace App\Providers;

use App\Models\Menu;
use App\Models\User;
use App\Models\SettingApp;
use App\Models\Transaction;
use App\Models\AccountPeriod;
use App\Models\Branch;
use App\Models\Currency;
use App\Models\BranchTransfer;
use Spatie\Permission\Models\Role;
use App\Observers\GlobalActivityLogger;
use Illuminate\Support\ServiceProvider;
use Spatie\Permission\Models\Permission;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        User::observe(GlobalActivityLogger::class);
        Role::observe(GlobalActivityLogger::class);
        Permission::observe(GlobalActivityLogger::class);
        Menu::observe(GlobalActivityLogger::class);
        SettingApp::observe(GlobalActivityLogger::class);
        Transaction::observe(GlobalActivityLogger::class);
        AccountPeriod::observe(GlobalActivityLogger::class);
        BranchTransfer::observe(GlobalActivityLogger::class);
        Branch::observe(GlobalActivityLogger::class);
        Currency::observe(GlobalActivityLogger::class);
    }
}
