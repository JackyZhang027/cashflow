<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Transaction;
use App\Models\AccountPeriod;

class TransactionPolicy
{
    public function approve(User $user, Transaction $transaction): bool
    {
        return
            $user->can('approve-transaction') && 
            $transaction->status === 'pending'; 
    }

    public function update($user, Transaction $transaction): bool
    {
        $period = AccountPeriod::where('start_date', '<=', $transaction->transaction_date)
            ->where('end_date', '>=', $transaction->transaction_date)
            ->first();

        return !$period || $period->status === 'open';
    }

}
