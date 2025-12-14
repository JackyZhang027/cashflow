<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Branch;
use App\Models\Currency;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransactionController extends Controller
{
    /* ================================
     * CASH IN (SETORAN)
     * ================================ */
    public function in(Request $request)
    {
        return $this->indexByType($request, 'in');
    }

    /* ================================
     * CASH OUT (PENGELUARAN)
     * ================================ */
    public function out(Request $request)
    {
        return $this->indexByType($request, 'out');
    }

    /* ================================
     * SHARED INDEX LOGIC
     * ================================ */
    protected function indexByType(Request $request, string $type)
    {
        $search = $request->input('search');

        $transactions = Transaction::query()
            ->with(['branch', 'currency'])
            ->where('type', $type)
            ->when($search, function ($q) use ($search) {
                $q->where(function ($q) use ($search) {
                    $q->where('reference', 'like', "%{$search}%")
                      ->orWhere('actor_name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('transaction_date')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render(
            $type === 'in'
                ? 'transactions/In/Index'
                : 'transactions/Out/Index',
            [
                'data' => $transactions,
                'search' => $search,
                'branches' => Branch::where('is_active', true)->get(['id', 'name']),
                'currencies' => Currency::where('is_active', true)->get(['id', 'code']),
            ]
        );
    }

    /* ================================
     * STORE
     * ================================ */
    public function store(Request $request)
    {
        $data = $this->validatedData($request);

        Transaction::create([
            ...$data,
            'created_by' => auth()->id(),
        ]);

        return back()->with('success', 'Transaction created successfully');
    }

    /* ================================
     * UPDATE
     * ================================ */
    public function update(Request $request, Transaction $transaction)
    {
        if ($transaction->is_approved) {
            abort(403, 'Approved transaction cannot be edited');
        }

        $data = $this->validatedData($request, true);

        $transaction->update([
            ...$data,
            'updated_by' => auth()->id(),
        ]);

        return back()->with('success', 'Transaction updated successfully');
    }

    /* ================================
     * DELETE (SOFT DELETE)
     * ================================ */
    public function destroy(Transaction $transaction)
    {
        if ($transaction->is_approved) {
            abort(403, 'Approved transaction cannot be deleted');
        }

        $transaction->update([
            'deleted_by' => auth()->id(),
        ]);

        $transaction->delete();

        return back()->with('success', 'Transaction deleted');
    }

    /* ================================
     * VALIDATION
     * ================================ */
    protected function validatedData(Request $request, bool $isUpdate = false): array
    {
        return $request->validate([
            'reference' => ['nullable', 'string', 'max:255'],
            'branch_id' => ['required', 'exists:branches,id'],
            'currency_id' => ['required', 'exists:currencies,id'],
            'transaction_date' => ['required', 'date'],
            'type' => ['required', 'in:in,out'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['nullable', 'string'],
            'actor_name' => ['nullable', 'string', 'max:255'],
        ]);
    }
    /* ================================
     * PRINT TRANSACTION SLIP
     * ================================ */
    public function print(Request $request)
    {
        $ids = (array) $request->input('id');

        $transactions = Transaction::with(['branch', 'currency'])
            ->whereIn('id', $ids)
            ->orderBy('transaction_date')
            ->get();

        abort_if($transactions->isEmpty(), 404);

        if ($request->input('type') === 'out') {
            return response()
                ->view('print.transactions.out-slip', [
                    'transactions' => $transactions,
                ])
                ->header('X-Inertia', 'false');
        }

        return response()
            ->view('print.transactions.in-slip', [
                'transactions' => $transactions,
            ])
            ->header('X-Inertia', 'false');
    }


}
