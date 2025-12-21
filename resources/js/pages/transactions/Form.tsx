import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/components/modal';

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

    const {
        data,
        setData,
        post,
        put,
        processing,
        errors,
        clearErrors,
        reset,
    } = useForm({
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

        clearErrors();

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
            reset();
        }
    }, [show, transaction, type]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        const action = isEdit
            ? put(route('transactions.update', transaction.id))
            : post(route('transactions.store'));

        action({
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    const ErrorText = ({ message }: { message?: string }) =>
        message ? <p className="mt-1 text-sm text-red-600">{message}</p> : null;

    return (
        <Modal
            show={show}
            title={type === 'in' ? 'Cash In' : 'Cash Out'}
            onClose={onClose}
        >
            <form onSubmit={submit} className="space-y-4">

                {/* GLOBAL ERROR (business rules) */}
                {errors?.error && (
                    <div className="rounded bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                        {errors.error}
                    </div>
                )}

                {/* Branch */}
                <div>
                    <label className="block text-sm font-medium">Branch</label>
                    <select
                        className={`w-full border rounded px-3 py-2 ${
                            errors.branch_id ? 'border-red-500' : ''
                        }`}
                        value={data.branch_id}
                        onChange={e => setData('branch_id', e.target.value)}
                    >
                        <option value="">Select Branch</option>
                        {branches.map(b => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                    <ErrorText message={errors.branch_id} />
                </div>

                {/* Currency */}
                <div>
                    <label className="block text-sm font-medium">Currency</label>
                    <select
                        className={`w-full border rounded px-3 py-2 ${
                            errors.currency_id ? 'border-red-500' : ''
                        }`}
                        value={data.currency_id}
                        onChange={e => setData('currency_id', e.target.value)}
                    >
                        <option value="">Select Currency</option>
                        {currencies.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.code}
                            </option>
                        ))}
                    </select>
                    <ErrorText message={errors.currency_id} />
                </div>

                {/* Transaction Date */}
                <div>
                    <label className="block text-sm font-medium">Transaction Date</label>
                    <input
                        type="date"
                        className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
                        value={data.transaction_date}
                        disabled
                    />
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-sm font-medium">Amount</label>
                    <input
                        type="number"
                        step="0.01"
                        className={`w-full border rounded px-3 py-2 ${
                            errors.amount ? 'border-red-500' : ''
                        }`}
                        value={data.amount}
                        onChange={e => setData('amount', e.target.value)}
                    />
                    <ErrorText message={errors.amount} />
                </div>

                {/* Actor */}
                <div>
                    <label className="block text-sm font-medium">
                        {type === 'in' ? 'Penyetor' : 'Pemohon'}
                    </label>
                    <input
                        className={`w-full border rounded px-3 py-2 ${
                            errors.actor_name ? 'border-red-500' : ''
                        }`}
                        value={data.actor_name}
                        onChange={e => setData('actor_name', e.target.value)}
                    />
                    <ErrorText message={errors.actor_name} />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium">Description</label>
                    <textarea
                        className={`w-full border rounded px-3 py-2 ${
                            errors.description ? 'border-red-500' : ''
                        }`}
                        value={data.description}
                        onChange={e => setData('description', e.target.value)}
                    />
                    <ErrorText message={errors.description} />
                </div>

                {/* Actions */}
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
