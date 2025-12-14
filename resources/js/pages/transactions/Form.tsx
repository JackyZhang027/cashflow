import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';

type Props = {
    show: boolean;
    transaction?: any | null;
    type: 'in' | 'out';
    branches: any[];
    currencies: any[];
    onClose: () => void;
};

export default function TransactionFormModal({
    show,
    transaction,
    type,
    branches,
    currencies,
    onClose,
}: Props) {
    const isEdit = Boolean(transaction?.id);

    const today = new Date().toISOString().split('T')[0];

    const { data, setData, post, put, processing, reset } = useForm({
        reference: '',
        branch_id: '',
        currency_id: '',
        transaction_date: today,
        type,
        amount: '',
        description: '',
        actor_name: '',
    });

    useEffect(() => {
        if (!show) return;

        if (transaction) {
            setData({
                reference: transaction.reference || '',
                branch_id: transaction.branch_id,
                currency_id: transaction.currency_id,
                transaction_date: transaction.transaction_date,
                type: transaction.type,
                amount: transaction.amount,
                description: transaction.description || '',
                actor_name: transaction.actor_name || '',
            });
        } else {
            setData({
                reference: '',
                branch_id: '',
                currency_id: '',
                transaction_date: today,
                type,
                amount: '',
                description: '',
                actor_name: '',
            });
        }
    }, [show, transaction, type]);


    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        const options = {
            onSuccess: () => {
                reset();
                onClose();
            },
        };

        if (isEdit) {
            put(route('transactions.update', transaction.id), options);
        } else {
            post(route('transactions.store'), options);
        }
    };

    return (
        <Modal
            show={show}
            title={type === 'in' ? 'Cash In' : 'Cash Out'}
            onClose={onClose}
        >
            <form onSubmit={submit} className="space-y-4">
                {/* Branch */}
                Branch
                <select
                    name='branch_id'
                    className="w-full border rounded px-3 py-2"
                    value={data.branch_id}
                    onChange={e => setData('branch_id', e.target.value)}
                    required
                >
                    <option value="">Select Branch</option>
                    {branches.map(b => (
                        <option key={b.id} value={b.id}>
                            {b.name}
                        </option>
                    ))}
                </select>

                {/* Currency */}
                Currency
                <select
                    className="w-full border rounded px-3 py-2"
                    value={data.currency_id}
                    onChange={e => setData('currency_id', e.target.value)}
                    required
                >
                    <option value="">Select Currency</option>
                    {currencies.map(c => (
                        <option key={c.id} value={c.id}>
                            {c.code}
                        </option>
                    ))}
                </select>

                {/* Date (Today, Read Only) */}
                Transaction Date
                <input
                    type="date"
                    className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
                    value={data.transaction_date}
                    disabled
                />

                {/* Amount */}
                Amount
                <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded px-3 py-2"
                    value={data.amount}
                    onChange={e => setData('amount', e.target.value)}
                    placeholder="Amount"
                    required
                />

                {/* Actor */}
                {type === 'in' ? 'Penyetor' : 'Pemohon'}
                <input
                    className="w-full border rounded px-3 py-2"
                    placeholder={type === 'in' ? 'Penyetor' : 'Pemohon'}
                    value={data.actor_name}
                    onChange={e => setData('actor_name', e.target.value)}
                />

                {/* Description */}
                Description
                <textarea
                    className="w-full border rounded px-3 py-2"
                    placeholder="Description"
                    value={data.description}
                    onChange={e => setData('description', e.target.value)}
                />

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border rounded"
                        disabled={processing}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                    >
                        {processing ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
