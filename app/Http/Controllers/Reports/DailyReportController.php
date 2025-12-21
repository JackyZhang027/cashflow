<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Branch;
use App\Models\Currency;
use App\Models\Transaction;
use Barryvdh\DomPDF\Facade\Pdf;

class DailyReportController extends Controller
{
    public function index(Request $request)
    {
        $branches = Branch::select('id', 'code', 'name')->orderBy('code')->get();
        $currencies = Currency::select('id', 'code')->orderBy('code')->get();

        // DEFAULT RESPONSE (no report yet)
        if (!$request->has(['date'])) {
            return inertia('reports/DailyReport', [
                'generated' => false,
                'branches' => $branches,
                'currencies' => $currencies,
                'filters' => [
                    'date' => now()->toDateString(),
                    'branch_id' => null,
                    'currency_id' => null,
                ],
            ]);
        }

        // VALIDATE ONLY AFTER SUBMIT
        $request->validate([
            'date' => ['required', 'date'],
            'currency_id' => ['required', 'exists:currencies,id'],
            'branch_id' => ['nullable', 'exists:branches,id'],
        ]);

        $date       = $request->date;
        $branchId   = $request->branch_id;
        $currencyId = $request->currency_id;

        /* =========================
        BEGIN BALANCE (same logic)
        ========================= */

        $openingBalance = DB::table('branch_opening_balances')
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('currency_id', $currencyId)
            ->sum('opening_balance');

        $mutationBefore = DB::table('transactions')
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('currency_id', $currencyId)
            ->where('status', 'approved')
            ->whereNull('deleted_at')
            ->whereDate('transaction_date', '<', $date)
            ->selectRaw("
                COALESCE(SUM(
                    CASE
                        WHEN type = 'in' THEN amount
                        WHEN type = 'out' THEN -amount
                    END
                ),0)
            ")
            ->value(DB::raw('0')) ?? 0;

        $beginBalance = $openingBalance + $mutationBefore;

        /* =========================
        DAILY TRANSACTIONS
        ========================= */

        $transactions = Transaction::with(['branch:id,code,name', 'currency:id,code'])
            ->whereDate('transaction_date', $date)
            ->where('currency_id', $currencyId)
            ->where('status', 'approved')
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderBy('approved_at')
            ->get()
            ->map(fn ($t) => [
                'approved_at'   => $t->approved_at,
                'branch'        => $t->branch->name,
                'author'        => $t->actor_name ?? '',
                'description'   => $t->description,
                'full_reference'=> $t->full_reference,
                'type'          => $t->type,
                'amount'        => $t->amount,
            ]);


        return inertia('reports/DailyReport', [
            'generated' => true,
            'transactions' => $transactions,
            'beginBalance' => $beginBalance,
            'branches' => $branches,
            'currencies' => $currencies,
            'filters' => [
                'date' => $date,
                'branch_id' => $branchId,
                'currency_id' => $currencyId,
            ],
        ]);
    }

    public function pdf(Request $request)
    {
        $request->validate([
            'date' => ['required', 'date'],
            'currency_id' => ['required', 'exists:currencies,id'],
            'branch_id' => ['nullable', 'exists:branches,id'],
        ]);

        $date       = $request->date;
        $branchId   = $request->branch_id;
        $currencyId = $request->currency_id;

        /* ================= BEGIN BALANCE ================= */

        $openingBalance = DB::table('branch_opening_balances')
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('currency_id', $currencyId)
            ->sum('opening_balance');

        $mutationBefore = DB::table('transactions')
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('currency_id', $currencyId)
            ->where('status', 'approved')
            ->whereNull('deleted_at')
            ->whereDate('transaction_date', '<', $date)
            ->selectRaw("
                COALESCE(SUM(
                    CASE
                        WHEN type = 'in' THEN amount
                        WHEN type = 'out' THEN -amount
                    END
                ),0)
            ")
            ->value(DB::raw('0')) ?? 0;

        $beginBalance = $openingBalance + $mutationBefore;

        /* ================= TRANSACTIONS ================= */

        $transactions = Transaction::with([
                'branch:id,code',
                'currency:id,code',
            ])
            ->whereDate('transaction_date', $date)
            ->where('currency_id', $currencyId)
            ->where('status', 'approved')
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderBy('approved_at')
            ->get();

        $pdf = Pdf::loadView('print.reports.daily', [
                'date' => $date,
                'currency' => Currency::find($currencyId)->code,
                'branch' => $branchId ? Branch::find($branchId)->name : 'All',
                'transactions' => $transactions,
                'beginBalance' => $beginBalance,
                'printedAt' => now()->format('Y-m-d H:i'),
                'printedBy' => auth()->user()->name ?? 'System',
            ])
            ->setPaper('A4', 'portrait')
            ->setOption('isPhpEnabled', true);

        return $pdf->download("Laporan Harian {$date}.pdf");
    }


}

