<?php

namespace App\Http\Controllers;

use App\Models\BranchTransfer;
use App\Models\Transaction;
use App\Models\Branch;
use App\Models\Currency;
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
        $search = $request->input('search');
        $filters = $request->input('filters', []);
        $sort = $request->input('sort');
        $direction = $request->input('direction', 'asc');

        $data = BranchTransfer::query()
            ->with([
                'fromBranch:id,name',
                'toBranch:id,name',
                'currency:id,code',
            ])
            ->when($request->search, function ($q, $search) {
                $q->where('reference', 'like', "%{$search}%");
            })
            ->when(!empty($filters['status']), function ($q) use ($filters) {
                $q->where('status', $filters['status']);
            })
            ->when($sort, function ($q) use ($sort, $direction) {
                match ($sort) {
                    'transaction_date', 'amount', 'status' => $q->orderBy($sort, $direction),
                    'from_branch.name' => $q->join('branches as fb', 'fb.id', '=', 'branch_transfers.from_branch_id')
                        ->orderBy('fb.name', $direction),
                    'to_branch.name' => $q->join('branches as tb', 'tb.id', '=', 'branch_transfers.to_branch_id')
                        ->orderBy('tb.name', $direction),
                    'currency.code' => $q->join('currencies as c', 'c.id', '=', 'branch_transfers.currency_id')
                        ->orderBy('c.code', $direction),
                    default => null,
                };
            })
            ->paginate(10)
            ->withQueryString();

        return inertia('transfers/Index', [
            'data' => $data,
            'search' => $request->search,
            'branches' => Branch::select('id', 'name')->where('is_active', true)->get(),
            'currencies' => Currency::select('id', 'code')->where('is_active', true)->get(),
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
            'in_actor_name'  => ['nullable', 'string'],
            'out_actor_name' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($data) {
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
                'actor_name'         => $data['out_actor_name'] ?? null,
                'description'        => $data['description'] ?? 'Transfer from branch',
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
                'actor_name'         => $data['in_actor_name'] ?? null,
                'description'        => $data['description'] ?? 'Transfer from branch',
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
