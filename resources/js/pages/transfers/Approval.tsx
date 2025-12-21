import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import StatusBadge from '@/components/status-badge';

export default function Approve({ transfer }: any) {
    const { errors, flash } = usePage().props as any;
    const [processing, setProcessing] = useState(false);

    const approve = () => {
        if (processing) return;
        if (!confirm('Approve this transfer?')) return;

        setProcessing(true);

        router.post(
            route('transactions.approval.transfer.approve', transfer.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            }
        );
    };

    const reject = () => {
        if (processing) return;
        if (!confirm('Reject this transfer?')) return;

        setProcessing(true);

        router.post(
            route('transactions.approval.transfer.reject', transfer.id),
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
                    <h1 className="text-xl font-semibold">Branch Transfer Approval</h1>
                    <div className="text-sm font-medium text-gray-700">
                        From: {transfer.from_branch.code} → To: {transfer.to_branch.code}
                    </div>
                    <div className="text-sm text-gray-500">
                        Ref: {transfer.reference}
                    </div>
                </div>

                <StatusBadge status={transfer.status} />
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
            {transfer.status === 'pending' && (
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

            {/* Transfer Details */}
            <div className="bg-white border rounded-xl p-6 grid grid-cols-2 gap-6">
                <Detail label="Transfer Date" value={transfer.transfer_date} />
                <Detail label="Currency" value={transfer.currency.code} />

                <Detail
                    label="From Branch"
                    value={`${transfer.from_branch.code} - ${transfer.from_branch.name}`}
                />
                <Detail
                    label="To Branch"
                    value={`${transfer.to_branch.code} - ${transfer.to_branch.name}`}
                />

                <Detail
                    label="Total Amount"
                    value={
                        transfer.currency.symbol +
                        ' ' +
                        new Intl.NumberFormat('id-ID').format(transfer.total_amount)
                    }
                />

                {transfer.status === 'approved' && (
                    <>
                        <Detail label="Approved By" value={transfer.approver?.name} />
                        <Detail label="Approved At" value={transfer.approved_at} />
                    </>
                )}
            </div>

            {/* Transactions */}
            <div className="bg-white border rounded-xl p-6">
                <h2 className="font-semibold mb-4">Transactions</h2>

                <table className="w-full text-sm border">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="border px-3 py-2 text-left">Reference</th>
                            <th className="border px-3 py-2 text-right">Amount</th>
                            <th className="border px-3 py-2 text-left">Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transfer.transactions.map((tx: any) => (
                            <tr key={tx.id}>
                                <td className="border px-3 py-2 font-mono">
                                    {tx.reference}
                                </td>
                                <td className="border px-3 py-2 text-right">
                                    {transfer.currency.symbol}{' '}
                                    {new Intl.NumberFormat('id-ID').format(tx.amount)}
                                </td>
                                <td className="border px-3 py-2">
                                    {tx.description ?? '-'}
                                </td>
                            </tr>
                        ))}

                        {transfer.transactions.length === 0 && (
                            <tr>
                                <td
                                    colSpan={3}
                                    className="border px-3 py-6 text-center text-gray-500"
                                >
                                    No transactions found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
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
    <AppLayout title="Branch Transfer Approval">
        {page}
    </AppLayout>
);
