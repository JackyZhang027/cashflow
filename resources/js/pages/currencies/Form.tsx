import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/components/modal';

type Currency = {
    id?: number;
    code: string;
    name: string;
    symbol?: string;
    precision: number;
    is_active: boolean;
};

type Props = {
    show: boolean;
    currency?: Currency | null;
    onClose: () => void;
};

export default function CurrencyFormModal({ show, currency, onClose }: Props) {
    const isEdit = Boolean(currency?.id);

    const { data, setData, post, put, processing, errors, reset } = useForm<Currency>({
        code: '',
        name: '',
        symbol: '',
        precision: 2,
        is_active: true,
    });

    /* Fill form on edit */
    useEffect(() => {
        if (currency) {
            setData({
                code: currency.code,
                name: currency.name,
                symbol: currency.symbol || '',
                precision: currency.precision,
                is_active: currency.is_active,
            });
        } else {
            reset();
        }
    }, [currency]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEdit) {
            put(route('currencies.update', currency!.id), {
                preserveScroll: true,
                onSuccess: () => onClose(),
            });
        } else {
            post(route('currencies.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        }
    };

    return (
        <Modal
            show={show}
            title={isEdit ? 'Edit Currency' : 'Create Currency'}
            onClose={onClose}
        >
            <form onSubmit={submit} className="space-y-4">
                {/* Code */}
                <div>
                    <label className="block text-sm font-medium">Code</label>
                    <input
                        className='w-full border rounded px-3 py-2'
                        value={data.code}
                        onChange={e => setData('code', e.target.value.toUpperCase())}
                    />
                    {errors.code && <p className="text-red-500 text-sm">{errors.code}</p>}
                </div>

                {/* Name */}
                <div>
                    <label className="block text-sm font-medium">Name</label>
                    <input
                        className="w-full border rounded px-3 py-2"
                        value={data.name}
                        onChange={e => setData('name', e.target.value)}
                    />
                </div>

                {/* Symbol */}
                <div>
                    <label className="block text-sm font-medium">Symbol</label>
                    <input
                        className="w-full border rounded px-3 py-2"
                        value={data.symbol}
                        onChange={e => setData('symbol', e.target.value)}
                    />
                </div>

                {/* Precision (locked on edit) */}
                <div>
                    <label className="block text-sm font-medium">Precision</label>
                    <input
                        type="number"
                        min={0}
                        max={6}
                        disabled={isEdit}
                        className={`w-full border rounded px-3 py-2 ${
                            isEdit ? 'bg-gray-100' : ''
                        }`}
                        value={data.precision}
                        onChange={e => setData('precision', Number(e.target.value))}
                    />
                </div>

                {/* Active */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={data.is_active}
                        onChange={e => setData('is_active', e.target.checked)}
                    />
                    <span>Active</span>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border rounded"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={processing}
                        className={`px-4 py-2 rounded text-white cursor-pointer
                            ${processing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600'}
                        `}
                    >
                        {processing ? 'Saving...' : isEdit ? 'Update' : 'Save'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
