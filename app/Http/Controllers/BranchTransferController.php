<?php

namespace App\Http\Controllers;

use App\Models\BranchTransfer;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BranchTransferController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $data = BranchTransfer::query()
            ->with([
                'fromBranch:id,name',
                'toBranch:id,name',
                'currency:id,code',
            ])
            ->when($request->search, function ($q, $search) {
                $q->where('reference', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return inertia('transfers/Index', [
            'data' => $data,
            'search' => $request->search,
            'branches' => \App\Models\Branch::select('id', 'name')->get(),
            'currencies' => \App\Models\Currency::select('id', 'code')->get(),
        ]);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'from_branch_id' => ['required', 'different:to_branch_id', 'exists:branches,id'],
            'to_branch_id'   => ['required', 'exists:branches,id'],
            'currency_id'    => ['required', 'exists:currencies,id'],
            'transfer_date'  => ['required', 'date'],
            'amount'         => ['required', 'numeric', 'min:0.01'],
            'description'    => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($data) {

            // 🔒 Balance validation
            // $balance = Transaction::where('branch_id', $data['from_branch_id'])
            //     ->where('currency_id', $data['currency_id'])
            //     ->where('status', 'approved')
            //     ->selectRaw("
            //         SUM(CASE WHEN type = 'in' THEN amount ELSE -amount END) as balance
            //     ")
            //     ->value('balance') ?? 0;

            // if ($balance < $data['amount']) {
            //     throw ValidationException::withMessages([
            //         'error' => 'Insufficient balance in source branch.',
            //     ]);
            // }

            // Create transfer
            $transfer = BranchTransfer::create([
                ...$data,
                'status' => 'pending',
                'created_by' => auth()->id(),
            ]);

            // OUT transaction
            Transaction::create([
                'branch_id'          => $data['from_branch_id'],
                'currency_id'        => $data['currency_id'],
                'transaction_date'   => $data['transfer_date'],
                'type'               => 'out',
                'amount'             => $data['amount'],
                'description'        => 'Transfer to branch',
                'branch_transfer_id' => $transfer->id,
                'status'             => 'pending',
                'created_by'         => auth()->id(),
            ]);

            // IN transaction
            Transaction::create([
                'branch_id'          => $data['to_branch_id'],
                'currency_id'        => $data['currency_id'],
                'transaction_date'   => $data['transfer_date'],
                'type'               => 'in',
                'amount'             => $data['amount'],
                'description'        => 'Transfer from branch',
                'branch_transfer_id' => $transfer->id,
                'status'             => 'pending',
                'created_by'         => auth()->id(),
            ]);
        });
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, BranchTransfer $transfer)
    {
        if ($transfer->status !== 'pending') {
            return redirect()->back()->withErrors([
                'error' => 'Only pending transfers can be updated.',
            ]);
        }

        $data = $request->validate([
            'from_branch_id' => ['required', 'different:to_branch_id', 'exists:branches,id'],
            'to_branch_id'   => ['required', 'exists:branches,id'],
            'currency_id'    => ['required', 'exists:currencies,id'],
            'transfer_date'  => ['required', 'date'],
            'amount'         => ['required', 'numeric', 'min:0.01'],
            'description'    => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($transfer, $data) {

            $transfer->update([
                ...$data,
                'updated_by' => auth()->id(),
            ]);

            Transaction::where('branch_transfer_id', $transfer->id)
                ->where('type', 'out')
                ->update([
                    'branch_id' => $data['from_branch_id'],
                    'currency_id' => $data['currency_id'],
                    'transaction_date' => $data['transfer_date'],
                    'amount' => $data['amount'],
                ]);

            Transaction::where('branch_transfer_id', $transfer->id)
                ->where('type', 'in')
                ->update([
                    'branch_id' => $data['to_branch_id'],
                    'currency_id' => $data['currency_id'],
                    'transaction_date' => $data['transfer_date'],
                    'amount' => $data['amount'],
                ]);
        });
    }
    /**
     * Display the specified resource.
     */
    public function show(BranchTransfer $transfer)
    {
        $datas = $transfer->load(['transactions', 'fromBranch', 'toBranch', 'currency']);
        return inertia('transfers/Approval', [
            'transfer' => $datas,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(BranchTransfer $transfer)
    {
        if ($transfer->status !== 'pending') {
            return redirect()->back()->withErrors([
                'error' => 'Only pending transfers can be deleted.',
            ]);
        }

        DB::transaction(function () use ($transfer) {
            Transaction::where('branch_transfer_id', $transfer->id)->delete();
            $transfer->delete();
        });

        return back();
    }

    public function approve(BranchTransfer $transfer)
    {
        if ($transfer->status !== 'pending') {
            return redirect()->back()->withErrors([
                'error' => 'Only pending transfers can be approved.',
            ]);
        }

        DB::transaction(function () use ($transfer) {

            $transfer->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => auth()->id(),
            ]);

            Transaction::where('branch_transfer_id', $transfer->id)
                ->update([
                    'status' => 'approved',
                    'approved_at' => now(),
                    'approved_by' => auth()->id(),
                ]);
        });

        return back();
    }

    public function reject(Request $request, BranchTransfer $transfer)
    {
        if ($transfer->status !== 'pending') {
            return redirect()->back()->withErrors([
                'error' => 'Only pending transfers can be rejefcted.',
            ]);
        }

        DB::transaction(function () use ($transfer) {

            $transfer->update([
                'status' => 'rejected',
                'approved_at' => now(),
                'approved_by' => auth()->id(),
            ]);

            Transaction::where('branch_transfer_id', $transfer->id)
                ->update([
                    'status' => 'rejected',
                    'approved_at' => now(),
                    'approved_by' => auth()->id(),
                ]);
        });

        return back();
    }

}
