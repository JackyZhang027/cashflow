import { useEffect, useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/components/modal';

export default function OpeningBalanceModal({
    show,
    branch,
    currencies,
    openingBalance,
    onClose,
}: any) {
    const isEdit = Boolean(openingBalance?.id);
    const isLocked = Boolean(openingBalance?.is_locked); // optional flag

    const { data, setData, post, put, processing, errors, reset } = useForm({
        branch_id: branch.id,
        currency_id: '',
        opening_balance: 0,
        opening_date: new Date().toISOString().slice(0, 10),
    });

    useEffect(() => {
        if (!show) return;

        if (openingBalance) {
            setData({
                branch_id: branch.id,
                currency_id: openingBalance.currency_id,
                opening_balance: openingBalance.amount,
                opening_date: openingBalance.opening_date.slice(0, 10),
            });
        } else {
            setData({
                branch_id: branch.id,
                currency_id: '',
                opening_balance: 0,
                opening_date: new Date().toISOString().slice(0, 10),
            });
        }
    }, [show, openingBalance, branch.id]);



    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isLocked) return;

        if (isEdit) {
            put(route('branch-opening-balances.update', openingBalance.id), {
                preserveScroll: true,
                onSuccess: onClose,
            });
        } else {
            post(route('branch-opening-balances.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    onClose();
                },
            });
        }
    };

    return (
        <Modal
            show={show}
            title={
                isEdit
                    ? `Edit Opening Balance — ${branch.name}`
                    : `Add Opening Balance — ${branch.name}`
            }
            onClose={onClose}
        >
            <form onSubmit={submit} className="space-y-4">

                {/* 🔒 lock warning */}
                {isLocked && (
                    <div className="p-3 text-sm rounded bg-yellow-100 text-yellow-800">
                        Opening balance is locked because transactions already exist.
                    </div>
                )}

                {/* Currency */}
                <div>
                    <label className="block text-sm font-medium">Currency</label>
                    <select
                        className={`w-full border rounded px-3 py-2 ${
                            isEdit || isLocked ? 'bg-gray-100' : ''
                        }`}
                        value={data.currency_id}
                        disabled={isEdit || isLocked}
                        onChange={e =>
                            setData(
                                'currency_id',
                                e.target.value ? Number(e.target.value) : ''
                            )
                        }
                    >
                        <option value="">-- Select Currency --</option>

                        {currencies.map((currency: any) => (
                            <option key={currency.id} value={currency.id}>
                                {currency.code} — {currency.name}
                            </option>
                        ))}
                    </select>

                </div>

                {/* Opening Balance */}
                <div>
                    <label className="block text-sm font-medium">
                        Opening Balance
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        className={`w-full border rounded px-3 py-2 ${
                            isLocked ? 'bg-gray-100' : ''
                        }`}
                        value={data.opening_balance}
                        disabled={isLocked}
                        onChange={e =>
                            setData('opening_balance', Number(e.target.value))
                        }
                    />
                    {errors.opening_balance && (
                        <p className="text-red-500 text-sm">
                            {errors.opening_balance}
                        </p>
                    )}
                </div>

                {/* Opening Date */}
                <div>
                    <label className="block text-sm font-medium">
                        Opening Date
                    </label>
                    <input
                        type="date"
                        className={`w-full border rounded px-3 py-2 ${
                            isLocked ? 'bg-gray-100' : ''
                        }`}
                        value={data.opening_date}
                        disabled={isLocked}
                        onChange={e => setData('opening_date', e.target.value)}
                    />
                    {errors.opening_date && (
                        <p className="text-red-500 text-sm">
                            {errors.opening_date}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border rounded"
                    >
                        Close
                    </button>

                    {!isLocked && (
                        <button
                            disabled={processing}
                            className={`px-4 py-2 rounded text-white ${
                                processing ? 'bg-gray-400' : 'bg-blue-600'
                            }`}
                        >
                            {processing ? 'Saving...' : isEdit ? 'Update' : 'Save'}
                        </button>
                    )}
                </div>
            </form>
        </Modal>
    );
}
