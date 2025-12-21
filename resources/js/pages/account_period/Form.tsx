import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/components/modal';

type Period = {
    id?: number;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
};

type Props = {
    show: boolean;
    period?: Period | null;
    onClose: () => void;
};

export default function PeriodFormModal({ show, period, onClose }: Props) {
    const isEdit = Boolean(period?.id);

    const {
        data,
        setData,
        post,
        put,
        processing,
        errors,
        clearErrors,
        reset,
    } = useForm<Period>({
        name: '',
        start_date: '',
        end_date: '',
        status: 'open',
    });

    /* Fill form on edit & reset errors */
    useEffect(() => {
        clearErrors();

        if (period) {
            setData({
                name: period.name || '',
                start_date: period.start_date || '',
                end_date: period.end_date || '',
                status: period.status || 'open',
            });
        } else {
            reset();
        }
    }, [period, show]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        const action = isEdit
            ? put(route('periods.update', period!.id))
            : post(route('periods.store'));

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
            title={isEdit ? 'Edit Period' : 'Create Period'}
            onClose={onClose}
        >
            <form onSubmit={submit} className="space-y-4">
                {/* GLOBAL ERROR */}
                {errors?.error && (
                    <div className="rounded bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                        {errors.error}
                    </div>
                )}

                {/* Name */}
                <div>
                    <label className="block text-sm font-medium">Name</label>
                    <input
                        className={`w-full border rounded px-3 py-2 ${
                            errors.name ? 'border-red-500' : ''
                        }`}
                        value={data.name}
                        onChange={e => setData('name', e.target.value)}
                    />
                    <ErrorText message={errors.name} />
                </div>

                {/* Start Date */}
                <div>
                    <label className="block text-sm font-medium">Start Date</label>
                    <input
                        type="date"
                        className={`w-full border rounded px-3 py-2 ${
                            errors.start_date ? 'border-red-500' : ''
                        }`}
                        value={data.start_date}
                        onChange={e => setData('start_date', e.target.value)}
                    />
                    <ErrorText message={errors.start_date} />
                </div>

                {/* End Date */}
                <div>
                    <label className="block text-sm font-medium">End Date</label>
                    <input
                        type="date"
                        className={`w-full border rounded px-3 py-2 ${
                            errors.end_date ? 'border-red-500' : ''
                        }`}
                        value={data.end_date}
                        onChange={e => setData('end_date', e.target.value)}
                    />
                    <ErrorText message={errors.end_date} />
                </div>

                {/* Status */}
                <div>
                    <label className="block text-sm font-medium">Status</label>
                    <select
                        className={`w-full border rounded px-3 py-2 ${
                            errors.status ? 'border-red-500' : ''
                        }`}
                        value={data.status}
                        onChange={e => setData('status', e.target.value)}
                    >
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                    </select>
                    <ErrorText message={errors.status} />
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
                        className={`px-4 py-2 rounded text-white
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
