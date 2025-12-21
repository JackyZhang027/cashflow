<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class BalanceSummaryController extends Controller
{
    public function index(Request $request)
    {
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to   = $request->to ?? now()->endOfMonth()->toDateString();

        $data = $this->query($from, $to);

        return inertia('reports/BalanceSummary', [
            'data' => $data,
            'filters' => compact('from', 'to'),
        ]);
    }

    public function exportPdf(Request $request)
    {
        $from = $request->from;
        $to   = $request->to;

        $data = $this->query($from, $to);

        $pdf = Pdf::loadView('print.reports.balance-summary', [
                'data' => $data,
                'from' => $from,
                'to' => $to,
                'printedAt' => now()->format('Y-m-d H:i'),
                'printedBy' => auth()->user()->name ?? 'System',
            ])->setPaper('A4', 'portrait')
            ->setOption('isPhpEnabled', true);


        return $pdf->download("Balance Summary {$from} to {$to}.pdf");
    }

    protected function query($from, $to)
    {
        return DB::table('branches as b')
            ->crossJoin('currencies as c')
            ->leftJoin('branch_opening_balances as ob', function ($join) {
                $join->on('ob.branch_id', '=', 'b.id')
                     ->on('ob.currency_id', '=', 'c.id');
            })
            ->leftJoin('transactions as t', function ($join) {
                $join->on('t.branch_id', '=', 'b.id')
                     ->on('t.currency_id', '=', 'c.id')
                     ->where('t.status', 'approved')
                     ->whereNull('t.deleted_at');
            })
            ->selectRaw("
                b.name AS branch,
                c.code AS currency,

                COALESCE(ob.opening_balance, 0)
                + COALESCE(SUM(
                    CASE
                        WHEN t.transaction_date < ? AND t.type = 'in' THEN t.amount
                        WHEN t.transaction_date < ? AND t.type = 'out' THEN -t.amount
                        ELSE 0
                    END
                ), 0) AS begin_balance,

                COALESCE(SUM(
                    CASE
                        WHEN t.transaction_date BETWEEN ? AND ? AND t.type = 'in' THEN t.amount
                        WHEN t.transaction_date BETWEEN ? AND ? AND t.type = 'out' THEN -t.amount
                        ELSE 0
                    END
                ), 0) AS transaction_balance,

                COALESCE(ob.opening_balance, 0)
                + COALESCE(SUM(
                    CASE
                        WHEN t.transaction_date <= ? AND t.type = 'in' THEN t.amount
                        WHEN t.transaction_date <= ? AND t.type = 'out' THEN -t.amount
                        ELSE 0
                    END
                ), 0) AS ending_balance
            ", [
                $from, $from,
                $from, $to, $from, $to,
                $to, $to
            ])
            ->groupBy('b.id', 'c.id', 'ob.opening_balance')
            ->orderBy('b.code')
            ->orderBy('c.code')
            ->get();
    }
}
