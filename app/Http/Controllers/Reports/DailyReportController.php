<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Branch;
use App\Models\Currency;
use App\Models\Transaction;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class DailyReportController extends Controller
{
    public function index(Request $request)
    {
        $branches = Branch::select('id', 'code', 'name')->orderBy('code')->get();
        $currencies = Currency::select('id', 'code', 'name')->orderBy('code')->get();

        if (!$request->has(['date_from', 'date_to'])) {
            return inertia('reports/DailyReport', [
                'generated' => false,
                'branches' => $branches,
                'currencies' => $currencies,
                'filters' => [
                    'date_from' => now()->toDateString(),
                    'date_to' => now()->toDateString(),
                    'branch_id' => null,
                    'currency_id' => null,
                ],
            ]);
        }

        $validated = $request->validate([
            'date_from' => ['required', 'date'],
            'date_to' => ['required', 'date', 'after_or_equal:date_from'],
            'currency_id' => ['required', 'exists:currencies,id'],
            'branch_id' => ['nullable', 'exists:branches,id'],
        ]);

        $report = $this->buildDailyReport(
            $validated['date_from'],
            $validated['date_to'],
            $validated['branch_id'] ?? null,
            $validated['currency_id']
        );

        return inertia('reports/DailyReport', [
            'generated' => true,
            'transactions' => $report['transactions'],
            'beginBalance' => $report['beginBalance'],
            'branches' => $branches,
            'currencies' => $currencies,
            'filters' => $validated,
        ]);
    }


    public function pdf(Request $request)
    {
        $validated = $request->validate([
            'date_from' => ['required', 'date'],
            'date_to' => ['required', 'date', 'after_or_equal:date_from'],
            'currency_id' => ['required', 'exists:currencies,id'],
            'branch_id' => ['nullable', 'exists:branches,id'],
        ]);

        $report = $this->buildDailyReport(
            $validated['date_from'],
            $validated['date_to'],
            $validated['branch_id'] ?? null,
            $validated['currency_id']
        );

       $branchId = $validated['branch_id'] ?? null;

        $pdf = Pdf::loadView('print.reports.daily', [
            'dateFrom' => $validated['date_from'],
            'dateTo' => $validated['date_to'],
            'currency' => Currency::find($validated['currency_id'])->code,
            'branch' => $branchId
                ? Branch::find($branchId)
                : 'All',
            'transactions' => $report['transactions'],
            'beginBalance' => $report['beginBalance'],
            'printedAt' => now()->format('Y-m-d H:i'),
            'printedBy' => auth()->user()->name ?? 'System',
        ])->setPaper('A4');


        return $pdf->download(
            "Laporan {$validated['date_from']} - {$validated['date_to']}.pdf"
        );
    }


    private function buildDailyReport(
        string $dateFrom,
        string $dateTo,
        ?int $branchId,
        int $currencyId
    ): array {
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
            ->whereDate('approved_at', '<', $dateFrom)
            ->selectRaw("
                COALESCE(SUM(
                    CASE
                        WHEN type = 'in' THEN amount
                        WHEN type = 'out' THEN -amount
                    END
                ), 0)
            ")
            ->value(DB::raw('0')) ?? 0;

        $beginBalance = $openingBalance + $mutationBefore;

        /* ================= TRANSACTIONS ================= */

        $transactions = Transaction::with(['branch:id,code,name'])
            ->whereBetween('approved_at', [$dateFrom, $dateTo])
            ->where('currency_id', $currencyId)
            ->where('status', 'approved')
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderBy('approved_at')
            ->get()
            ->map(fn ($t) => [
                'approved_at' => Carbon::parse($t->approved_at)->format('Y-m-d'),
                'branch'         => $t->branch->name,
                'author'         => $t->actor_name ?? '',
                'description'    => $t->description,
                'full_reference' => $t->full_reference,
                'type'           => $t->type,
                'amount'         => $t->amount,
            ]);

        return [
            'beginBalance' => $beginBalance,
            'transactions' => $transactions,
        ];
    }


}

