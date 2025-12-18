<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Transaction;

class TransactionPolicy
{
    public function approve(User $user, Transaction $transaction): bool
    {
        return
            $user->can('approve-transaction') && 
            $transaction->status === 'pending'; 
    }
}
