<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\BranchOpeningBalance;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;


class BranchOpeningBalanceController extends Controller
{
    /**
     * Store opening balance
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'branch_id' => ['required', 'exists:branches,id'],
            'currency_id' => ['required', 'exists:currencies,id'],
            'opening_balance' => ['required', 'numeric', 'min:0'],
            'opening_date' => ['required', 'date'],
        ]);

        try {
            DB::transaction(function () use ($data) {

                $exists = BranchOpeningBalance::where('branch_id', $data['branch_id'])
                    ->where('currency_id', $data['currency_id'])
                    ->exists();

                if ($exists) {
                    throw new \Exception(
                        'Opening balance already exists for this currency.'
                    );
                }

                BranchOpeningBalance::create([
                    'branch_id' => $data['branch_id'],
                    'currency_id' => $data['currency_id'],
                    'opening_balance' => $data['opening_balance'],
                    'opening_date' => $data['opening_date'],
                    'created_by' => auth()->id(),
                ]);

                Transaction::create([
                    'branch_id' => $data['branch_id'],
                    'currency_id' => $data['currency_id'],
                    'type' => 'in',
                    'amount' => $data['opening_balance'],
                    'transaction_date' => $data['opening_date'],
                    'note' => 'Opening Balance',
                    'is_opening' => true,
                ]);
            });
        } catch (\Throwable $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }

        return redirect()
            ->back()
            ->with('success', 'Opening balance saved.');
    }


    /**
     * Update opening balance
     */
    public function update(Request $request, BranchOpeningBalance $openingBalance)
    {
        $data = $request->validate([
            'opening_balance' => ['required', 'numeric', 'min:0'],
            'opening_date' => ['required', 'date'],
        ]);

        try {
            DB::transaction(function () use ($openingBalance, $data) {

                $locked = Transaction::where('branch_id', $openingBalance->branch_id)
                    ->where('currency_id', $openingBalance->currency_id)
                    ->where('is_opening', false)
                    ->exists();

                if ($locked) {
                    throw new \Exception(
                        'Opening balance is locked because transactions already exist.'
                    );
                }

                $openingBalance->update([
                    'opening_balance' => $data['opening_balance'],
                    'opening_date' => $data['opening_date'],
                ]);

                Transaction::where('branch_id', $openingBalance->branch_id)
                    ->where('currency_id', $openingBalance->currency_id)
                    ->where('is_opening', true)
                    ->update([
                        'amount' => $data['opening_balance'],
                        'transaction_date' => $data['opening_date'],
                    ]);
            });
        } catch (\Throwable $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }

        return redirect()
            ->back()
            ->with('success', 'Opening balance updated.');
    }

}
