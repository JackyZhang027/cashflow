<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Branch;
use App\Models\Currency;
use App\Models\BranchTransfer;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
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
        $filters = $request->input('filters', []);
        $sort = $request->input('sort');
        $direction = $request->input('direction', 'asc');


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
            ->when(!empty($filters['branch_id']), function ($q) use ($filters) {
                $q->where('branch_id', $filters['branch_id']);
            })
            ->when(!empty($filters['currency_id']), function ($q) use ($filters) {
                $q->where('currency_id', $filters['currency_id']);
            })
            ->when(!empty($filters['status']), function ($q) use ($filters) {
                $q->where('status', $filters['status']);
            })
            ->when($sort, function ($q) use ($sort, $direction) {
                match ($sort) {
                    'transaction_date', 'amount', 'status' => $q->orderBy($sort, $direction),
                    'branch.name' => $q->join('branches as b', 'b.id', '=', 'transactions.branch_id')
                        ->orderBy('b.name', $direction),
                    'currency.code' => $q->join('currencies as c', 'c.id', '=', 'transactions.currency_id')
                        ->orderBy('c.code', $direction),
                    default => null,
                };
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
     * Approval Page
     * ================================ */
    public function show(Transaction $transaction)
    {
       
        return Inertia::render('transactions/Approval', [
                'transaction' => $transaction->load([
                                    'branch',
                                    'currency',
                                    'approver',
                                ]),
        ]);
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
        if ($request->user()->cannot('update', $transaction)) {
            return back()->withErrors([
                'error' => 'This transaction belongs to a CLOSED accounting period and cannot be edited.',
            ]);
        }


        if ($transaction->is_approved) {
            return back()->withErrors([
                'error' => 'Approved transaction cannot be edited.',
            ]);
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
            return back()->withErrors([
                'error' => 'Approved transaction cannot be deleted.',
            ]);
        }

        DB::transaction(function () use ($transaction) {

            $branchTransferId = $transaction->branch_transfer_id;

            if ($branchTransferId) {
                // Delete ALL transactions in this transfer
                Transaction::where('branch_transfer_id', $branchTransferId)
                    ->forceDelete();

                // Delete the branch transfer itself
                BranchTransfer::where('id', $branchTransferId)
                    ->forceDelete();

            } else {
                // Normal single transaction delete
                $transaction->forceDelete();
            }
        });

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
            'transaction_date' => ['required', 'date', 'after_or_equal:today'],
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

    public function approve(Transaction $transaction, Request $request)
    {
        $this->authorize('approve', $transaction);

        if ($request->user()->cannot('update', $transaction)) {
            return back()->with('error', 'This transactssion belongs to a CLOSED accounting period and cannot be approved.');
        }

        if ($transaction->status !== 'pending') {
            return back()->withErrors([
                'error' => 'Transaction already processed.',
            ]);
        }

        DB::transaction(function () use ($transaction) {

            // Transfer transaction → approve all linked transactions
            if ($transaction->branch_transfer_id) {

                $transactions = Transaction::where(
                        'branch_transfer_id',
                        $transaction->branch_transfer_id
                    )
                    ->lockForUpdate()
                    ->get();

                // Safety check (no partial approval)
                if ($transactions->contains(fn ($tx) => $tx->status !== 'pending')) {
                    throw new \Exception(
                        'One or more transactions in this transfer already processed.'
                    );
                }

                foreach ($transactions as $tx) {
                    $tx->update([
                        'status'      => 'approved',
                        'approved_at' => now(),
                        'approved_by' => Auth::id(),
                    ]);
                }
                $transfer = $transaction->branchTransfer;
                $transfer->update([
                    'status'      => 'approved',
                    'approved_at' => now(),
                    'approved_by' => Auth::id(),
                ]);

            } else {
                // Normal transaction
                $transaction->update([
                    'status'      => 'approved',
                    'approved_at' => now(),
                    'approved_by' => Auth::id(),
                ]);
            }
        });
        
        return back()->with([
            'success' => 'Transaction approved',
            'result' => [
                'reference' => $transaction->full_reference,
                'type'      => $transaction->type === 'in' ? 'In' : 'Out',
                'amount'    => $transaction->amount,
            ],
        ]);


    }


    public function reject(Transaction $transaction)
    {
        $this->authorize('approve', $transaction);

        if ($transaction->status !== 'pending') {
            return back()->with('error', 'Transaction already processed.');
        }

        $transaction->update([
            'status'       => 'rejected',
            'approved_at'  => null,
            'approved_by'  => null,
        ]);

        return back()->with('success', 'Transaction rejected.');
    }

    public function scan(Request $request)
    {
        $request->validate(['reference' => 'required|string']);

        $input = trim(preg_replace('/[\r\n\t]+/', '', $request->reference));

        $transaction = Transaction::query()
            ->join('branches', 'branches.id', 'transactions.branch_id')
            ->join('currencies', 'currencies.id', 'transactions.currency_id')
            ->whereRaw(
                "CONCAT(currencies.code, branches.code, transactions.reference) = ?",
                [$input]
            )
            ->select('transactions.*')
            ->first();

        if (! $transaction) {
            return back()->with('error', 'Transaction not found');
        }
        if ($transaction->status !== 'pending') {
            return back()->with('error', 'Transaction already approved/rejected.');
        }

        return $this->approve($transaction, $request);
    }




}
