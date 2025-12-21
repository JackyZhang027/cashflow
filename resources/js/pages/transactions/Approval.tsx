import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import StatusBadge from '@/components/status-badge';

export default function Approve({ transaction }: any) {
    const { errors, flash } = usePage().props as any;
    const [processing, setProcessing] = useState(false);

    const approve = () => {
        if (processing) return;
        if (!confirm('Approve this transaction?')) return;

        setProcessing(true);

        router.post(
            route('transactions.approval.approve', transaction.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            }
        );
    };

    const reject = () => {
        if (processing) return;
        if (!confirm('Reject this transaction?')) return;

        setProcessing(true);

        router.post(
            route('transactions.approval.reject', transaction.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            }
        );
    };

    return (
        <div className="space-y-6 p-4">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold">Transaction Approval</h1>
                    <div className="text-sm font-medium text-gray-700">
                        Type: Cash {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </div>
                    <div className="text-sm text-gray-500">
                        Ref: {transaction.full_reference}
                    </div>
                </div>

                <StatusBadge status={transaction.status} />
            </div>

            {/* GLOBAL ERROR */}
            {errors?.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                    {errors.error}
                </div>
            )}

            {/* FLASH SUCCESS */}
            {flash?.success && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
                    {flash.success}
                </div>
            )}

            {/* Actions */}
            {transaction.status === 'pending' && (
                <div className="flex justify-start gap-3 border rounded-xl p-4 bg-gray-50">
                    <button
                        onClick={approve}
                        disabled={processing}
                        className={`px-4 py-2 rounded-lg text-white
                            ${processing
                                ? 'bg-green-300 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700'}
                        `}
                    >
                        {processing ? 'Processing...' : 'Approve'}
                    </button>

                    <button
                        onClick={reject}
                        disabled={processing}
                        className={`px-4 py-2 rounded-lg border
                            ${processing
                                ? 'border-red-300 text-red-300 cursor-not-allowed'
                                : 'border-red-500 text-red-600 hover:bg-red-50'}
                        `}
                    >
                        Reject
                    </button>
                </div>
            )}

            {/* Transaction Details */}
            <div className="bg-white border rounded-xl p-6 grid grid-cols-2 gap-6">
                <Detail label="Date" value={transaction.transaction_date} />
                <Detail label="Branch" value={transaction.branch.name} />
                <Detail label="Currency" value={transaction.currency.code} />
                <Detail
                    label="Amount"
                    value={
                        transaction.currency.symbol +
                        ' ' +
                        new Intl.NumberFormat('id-ID').format(transaction.amount)
                    }
                />
                <Detail label="Penyetor" value={transaction.actor_name} />
                <Detail label="Description" value={transaction.description ?? '-'} />

                {transaction.status === 'approved' && (
                    <>
                        <Detail label="Approved By" value={transaction.approver.name} />
                        <Detail label="Approved At" value={transaction.approved_at} />
                    </>
                )}
            </div>
        </div>
    );
}

const Detail = ({ label, value }: { label: string; value: any }) => (
    <div>
        <div className="text-sm text-gray-500">{label}</div>
        <div className="font-medium">{value}</div>
    </div>
);

Approve.layout = (page: React.ReactNode) => (
    <AppLayout title="Transaction Approval">
        {page}
    </AppLayout>
);
