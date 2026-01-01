import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/components/modal';

type Props = {
    show: boolean;
    transfer?: any | null;
    branches: any[];
    currencies: any[];
    onClose: () => void;
};

export default function BranchTransferFormModal({
    show,
    transfer,
    branches,
    currencies,
    onClose,
}: Props) {
    const isEdit = Boolean(transfer?.id);
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
        from_branch_id: '',
        to_branch_id: '',
        currency_id: '',
        transfer_date: today,
        amount: '',
        description: '',
        in_actor_name: '',
        out_actor_name: '',
    });

    /**
     * Populate form when modal opens
     */
    useEffect(() => {
        if (!show) return;

        clearErrors();

        if (transfer) {
            setData({
                from_branch_id: transfer.from_branch_id,
                to_branch_id: transfer.to_branch_id,
                currency_id: transfer.currency_id,
                transfer_date: transfer.transfer_date,
                amount: transfer.amount,
                description: transfer.description || '',
                in_actor_name: transfer.in_actor_name,
                out_actor_name: transfer.out_actor_name,
            });
        } else {
            reset();
        }
    }, [show, transfer]);

    /**
     * Reset form when modal closes
     */
    useEffect(() => {
        if (!show) {
            reset();
            clearErrors();
        }
    }, [show]);

    /**
     * Submit handler (FIXED)
     */
    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose(); // ✅ CLOSE MODAL
            },
        };

        if (isEdit) {
            put(route('transfers.update', transfer.id), options);
        } else {
            post(route('transfers.store'), options);
        }
    };

    const ErrorText = ({ message }: { message?: string }) =>
        message ? <p className="mt-1 text-sm text-red-600">{message}</p> : null;

    return (
        <Modal
            show={show}
            title="Branch Transfer"
            onClose={() => !processing && onClose()}
        >
            <form onSubmit={submit} className="space-y-4">

                {/* GLOBAL ERROR */}
                {errors?.error && (
                    <div className="rounded bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                        {errors.error}
                    </div>
                )}

                {/* FROM BRANCH */}
                <div>
                    <label className="block text-sm font-medium">From Branch</label>
                    <select
                        className={`w-full border rounded px-3 py-2 ${
                            errors.from_branch_id ? 'border-red-500' : ''
                        }`}
                        value={data.from_branch_id}
                        onChange={(e) => setData('from_branch_id', e.target.value)}
                    >
                        <option value="">Select Branch</option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                    <ErrorText message={errors.from_branch_id} />
                </div>

                {/* TO BRANCH */}
                <div>
                    <label className="block text-sm font-medium">To Branch</label>
                    <select
                        className={`w-full border rounded px-3 py-2 ${
                            errors.to_branch_id ? 'border-red-500' : ''
                        }`}
                        value={data.to_branch_id}
                        onChange={(e) => setData('to_branch_id', e.target.value)}
                    >
                        <option value="">Select Branch</option>
                        {branches
                            .map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                    </select>
                    <ErrorText message={errors.to_branch_id} />
                </div>

                {/* CURRENCY */}
                <div>
                    <label className="block text-sm font-medium">Currency</label>
                    <select
                        className={`w-full border rounded px-3 py-2 ${
                            errors.currency_id ? 'border-red-500' : ''
                        }`}
                        value={data.currency_id}
                        onChange={(e) => setData('currency_id', e.target.value)}
                    >
                        <option value="">Select Currency</option>
                        {currencies.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.code}
                            </option>
                        ))}
                    </select>
                    <ErrorText message={errors.currency_id} />
                </div>

                {/* DATE */}
                <div>
                    <label className="block text-sm font-medium">Transfer Date</label>
                    <input
                        type="date"
                        className="w-full border rounded px-3 py-2"
                        value={data.transfer_date}
                    />
                </div>

                {/* AMOUNT */}
                <div>
                    <label className="block text-sm font-medium">Amount</label>
                    <input
                        type="number"
                        step="0.01"
                        className={`w-full border rounded px-3 py-2 ${
                            errors.amount ? 'border-red-500' : ''
                        }`}
                        value={data.amount}
                        onChange={(e) => setData('amount', e.target.value)}
                    />
                    <ErrorText message={errors.amount} />
                </div>

                {/* PENYETOR */}
                <div>
                    <label className="block text-sm font-medium">Penyetor</label>
                    <input
                        type="text"
                        className={`w-full border rounded px-3 py-2 ${
                            errors.in_actor_name ? 'border-red-500' : ''
                        }`}
                        value={data.in_actor_name}
                        onChange={(e) => setData('in_actor_name', e.target.value)}
                    />
                    <ErrorText message={errors.in_actor_name} />
                </div>

                {/* PEMOHON */}
                <div>
                    <label className="block text-sm font-medium">Pemohon</label>
                    <input
                        type="text"
                        className={`w-full border rounded px-3 py-2 ${
                            errors.out_actor_name ? 'border-red-500' : ''
                        }`}
                        value={data.out_actor_name}
                        onChange={(e) => setData('out_actor_name', e.target.value)}
                    />
                    <ErrorText message={errors.out_actor_name} />
                </div>

                {/* DESCRIPTION */}
                <div>
                    <label className="block text-sm font-medium">Description</label>
                    <textarea
                        className="w-full border rounded px-3 py-2"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                    />
                </div>

                {/* ACTIONS */}
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
