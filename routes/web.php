<?php

use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\UserFileController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\SettingAppController;
use App\Http\Controllers\MediaFolderController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\CurrencyController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\BranchOpeningBalanceController;
use App\Http\Controllers\Reports\BalanceSummaryController;
use App\Http\Controllers\Reports\DailyReportController;

Route::middleware(['auth', 'menu.permission'])->group(function () {
    Route::get('/', function () {
        return Inertia::render('home');
    })->name('home');

    Route::resource('roles', RoleController::class);
    Route::resource('menus', MenuController::class);
    Route::post('menus/reorder', [MenuController::class, 'reorder'])->name('menus.reorder');
    Route::resource('permissions', PermissionController::class);
    Route::resource('users', UserController::class);
    Route::put('/users/{user}/reset-password', [UserController::class, 'resetPassword'])->name('users.reset-password');
    Route::get('/settingsapp', [SettingAppController::class, 'edit'])->name('setting.edit');
    Route::post('/settingsapp', [SettingAppController::class, 'update'])->name('setting.update');
    Route::get('/audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');
    Route::get('/backup', [BackupController::class, 'index'])->name('backup.index');
    Route::post('/backup/run', [BackupController::class, 'run'])->name('backup.run');
    Route::get('/backup/download/{file}', [BackupController::class, 'download'])->name('backup.download');
    Route::delete('/backup/delete/{file}', [BackupController::class, 'delete'])->name('backup.delete');
    Route::get('/files', [UserFileController::class, 'index'])->name('files.index');
    Route::post('/files', [UserFileController::class, 'store'])->name('files.store');
    Route::delete('/files/{id}', [UserFileController::class, 'destroy'])->name('files.destroy');
    Route::resource('media', MediaFolderController::class);

    //Branches
    Route::post('/branches/bulk-delete', [BranchController::class, 'bulkDelete'])->name('branches.bulk-delete');
    Route::post('/branches/bulk-activate', [BranchController::class, 'bulkActivate'])->name('branches.bulk-activate');
    Route::post('/branches/bulk-deactivate', [BranchController::class, 'bulkDeactivate'])->name('branches.bulk-deactivate');
    Route::resource('branches', BranchController::class);

    //Currencies
    Route::post('/currencies/bulk-delete', [CurrencyController::class, 'bulkDelete'])->name('currencies.bulk-delete');
    Route::post('/currencies/bulk-activate', [CurrencyController::class, 'bulkActivate'])->name('currencies.bulk-activate');
    Route::post('/currencies/bulk-deactivate', [CurrencyController::class, 'bulkDeactivate'])->name('currencies.bulk-deactivate');
    Route::resource('currencies', CurrencyController::class);

    //Transactions
    Route::prefix('transactions')->group(function () {
        Route::post('/opening-balances', [BranchOpeningBalanceController::class, 'store'])->name('branch-opening-balances.store');
        Route::put('/opening-balances/{openingBalance}', [BranchOpeningBalanceController::class, 'update'])->name('branch-opening-balances.update');


        Route::get('in', [TransactionController::class, 'in'])->name('transactions.in.index');
        Route::get('out', [TransactionController::class, 'out'])->name('transactions.out.index');

        Route::post('/', [TransactionController::class, 'store'])->name('transactions.store');
        Route::put('{transaction}', [TransactionController::class, 'update'])->name('transactions.update');
        Route::delete('{transaction}', [TransactionController::class, 'destroy'])->name('transactions.destroy');
        Route::get('/transactions/{transaction}/approval', [TransactionController::class, 'show'])
            ->name('transactions.approval.show')
            ->middleware('can:approve-transaction');

        Route::get('/print', [TransactionController::class, 'print'])->name('transactions.print');

        Route::prefix('transactions/{transaction}/approval')->group(function () {
            Route::post('approve', [TransactionController::class, 'approve'])
                ->name('transactions.approval.approve')
                ->middleware('can:approve-transaction');;

            Route::post('reject', [TransactionController::class, 'reject'])
                ->name('transactions.approval.reject')
                ->middleware('can:approve-transaction');;
        });

    });

    Route::get('/transactions/scan', function () {
        return Inertia::render('transactions/ScanApproval');
    })->name('transactions.approval.scan.form');

    Route::post('/transactions/approval/scan', [TransactionController::class, 'scan'])
        ->name('transactions.approval.scan');

    // Reports
    Route::get('/reports/balance-summary', [BalanceSummaryController::class, 'index'])
        ->name('reports.balance-summary');

    Route::get('/reports/balance-summary/pdf', [BalanceSummaryController::class, 'exportPdf'])
        ->name('reports.balance-summary.pdf');

    Route::get('/reports/daily-report', [DailyReportController::class, 'index'])
        ->name('reports.daily');
    
    Route::get('/reports/daily/pdf', [DailyReportController::class, 'pdf'])
        ->name('reports.daily.pdf');


});


require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
