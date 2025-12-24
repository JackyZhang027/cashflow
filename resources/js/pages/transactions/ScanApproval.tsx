import { router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { ScanLine } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

export default function ScanApproval() {
    const { flash } = usePage().props as any;
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        inputRef.current?.focus();
        setReference('');
    }, [flash?.error, flash?.result]);



    const [reference, setReference] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reference.trim()) return;

        setLoading(true);

        router.post(
            route('transactions.approval.scan'),
            { reference },
            {
                preserveScroll: true,
                onFinish: () => setLoading(false),
            }
        );
    };


    return (
        <div className="min-h-[70vh] flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-6 bg-white rounded-2xl shadow-sm border p-6">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <ScanLine className="w-6 h-6 text-blue-600" />
                    </div>
                    <h1 className="text-xl font-semibold">
                        Scan Transaction
                    </h1>
                    <p className="text-sm text-gray-500">
                        Scan barcode or type transaction reference
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={submit} className="space-y-4">
                    <input
                        ref={inputRef}
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="e.g. IDRBR2403010001"
                        className="w-full h-14 px-4 text-lg tracking-wide border rounded-xl
                                focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />


                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 rounded-xl bg-blue-600 text-white
                                   hover:bg-blue-700 transition
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Checking…' : 'Check Transaction'}
                    </button>
                </form>

                {/* Error */}
                {flash?.error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                        {flash.error}
                    </div>
                )}

                {/* Success */}
                {flash?.result && (
                    <div className="rounded-xl border bg-green-50 p-4 text-sm">
                        Transaction <strong>{flash.result.reference}</strong> (Cash {flash.result.type.toUpperCase()}) with amount {flash.result.amount.toLocaleString()} is approved.
                    </div>
                )}

                {/* Hint */}
                <div className="text-center text-xs text-gray-400">
                    Scanner will auto-submit on Enter
                </div>
            </div>
        </div>
    );
}

ScanApproval.layout = (page: React.ReactNode) => (
    <AppLayout title="Scan Approval">{page}</AppLayout>
);
