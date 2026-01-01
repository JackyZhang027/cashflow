import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import useMoneyFormatter from '@/hooks/use-money-formatter';

/* ================= TYPES ================= */

type Branch = {
    id: number;
    code: string;
    name: string;
};

type Currency = {
    id: number;
    code: string;
    name: string;
};

type Transaction = {
    approved_at: string;
    branch: string;
    author: string;
    description: string;
    full_reference: string;
    type: 'in' | 'out';
    amount: number;
};

/* ================= COMPONENT ================= */

export default function DailyReport() {
    const {
        generated,
        branches,
        currencies,
        transactions = [],
        beginBalance = 0,
        filters,
        errors = {},
    } = usePage().props as unknown as {
        generated: boolean;
        branches: Branch[];
        currencies: Currency[];
        transactions?: Transaction[];
        beginBalance?: number;
        filters: {
            date_from: string;
            date_to: string;
            branch_id: number | null;
            currency_id: number | null;
        };
        errors?: {
            date?: string;
            currency_id?: string;
            branch_id?: string;
        };
    };

    /* ================= STATE ================= */

    const [form, setForm] = useState({
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
        branch_id: filters.branch_id ?? null,
        currency_id: filters.currency_id ?? null,
    });


    const [localErrors, setLocalErrors] = useState<{
        date?: string;
        currency_id?: string;
    }>({});

    /* ================= SUBMIT ================= */

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: typeof localErrors = {};

        if (!form.date_from || !form.date_to) {
            newErrors.date = 'Date range is required';
        }

        if (!form.currency_id) {
            newErrors.currency_id = 'Currency is required';
        }

        setLocalErrors(newErrors);

        if (Object.keys(newErrors).length > 0) return;

        router.get(route('reports.daily'), form, {
            preserveScroll: true,
        });
    };

    
    const exportPdf = () => {
        window.open(
            route('reports.daily.pdf', filters),
            '_blank'
        );
    };

    const { format } = useMoneyFormatter();
    const formatMoney = (amount: number) => {
        return format(amount);
    }
    let runningBalance = Number(beginBalance);    
    let totalDebit = 0;
    let totalCredit = 0;


    /* ================= RENDER ================= */

    return (
        <AppLayout title="Laporan Harian">
            <div className="space-y-6 p-3">

                {/* ===== TITLE ===== */}
                <h1 className="text-xl font-semibold">
                    Laporan Harian
                </h1>

                {/* ===== FILTER FORM ===== */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <form
                        onSubmit={submit}
                        className="flex flex-wrap gap-4 items-end"
                    >
                        {/* DATE FROM */}
                    <div>
                        <label className="block text-sm mb-1">From</label>
                        <input
                            type="date"
                            value={form.date_from}
                            onChange={(e) =>
                                setForm({ ...form, date_from: e.target.value })
                            }
                            className="border rounded px-3 py-2"
                        />
                    </div>

                    {/* DATE TO */}
                    <div>
                        <label className="block text-sm mb-1">To</label>
                        <input
                            type="date"
                            value={form.date_to}
                            onChange={(e) =>
                                setForm({ ...form, date_to: e.target.value })
                            }
                            className="border rounded px-3 py-2"
                        />
                    </div>


                        {/* BRANCH */}
                        <div>
                            <label className="block text-sm mb-1">
                                Branch
                            </label>
                            <select
                                value={form.branch_id ?? ''}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        branch_id: e.target.value
                                            ? Number(e.target.value)
                                            : null,
                                    })
                                }
                                className="border rounded px-3 py-2"
                            >
                                <option value="">ALL</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.code} – {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* CURRENCY */}
                        <div>
                            <label className="block text-sm mb-1">
                                Currency
                            </label>
                            <select
                                value={form.currency_id ?? ''}
                                onChange={(e) => {
                                    setForm({
                                        ...form,
                                        currency_id: Number(e.target.value),
                                    });
                                    setLocalErrors({
                                        ...localErrors,
                                        currency_id: undefined,
                                    });
                                }}
                                className={`border rounded px-3 py-2 ${
                                    localErrors.currency_id || errors.currency_id
                                        ? 'border-red-500'
                                        : ''
                                }`}
                            >
                                <option value="">-- Select --</option>
                                {currencies.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* SUBMIT */}
                        <button
                            type="submit"
                            className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white
                                       py-2 px-4 border border-blue-500 hover:border-transparent rounded cursor-pointer"
                        >
                            Generate Report
                        </button>
                        <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center cursor-pointer"
                                onClick={exportPdf}
                                type='button'>
                            <svg className="fill-current w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/></svg>
                            <span>Download</span>
                        </button>
                    </form>
                    
                            {(localErrors.currency_id ||
                                errors.currency_id) && (
                                <p className="text-xs text-red-600 mt-1">
                                    {localErrors.currency_id ||
                                        errors.currency_id}
                                </p>
                            )}
                </div>

                {/* ===== EMPTY STATE ===== */}
                {!generated && (
                    <p className="text-gray-500 italic">
                        Please select parameters and click{' '}
                        <b>Generate Report</b>.
                    </p>
                )}

                {/* ===== REPORT TABLE ===== */}
                {generated && (
                    <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="border-b bg-gray-100">
                                    <th className="p-2 text-left">Approved Date</th>
                                    <th className="p-2 text-left">Branch</th>
                                    <th className="p-2 text-left">Author</th>
                                    <th className="p-2 text-left">Description</th>
                                    <th className="p-2 text-left">Reference</th>
                                    <th className="p-2 text-right">Debit</th>
                                    <th className="p-2 text-right">Credit</th>
                                    <th className="p-2 text-right">Balance</th>
                                </tr>
                            </thead>

                            <tbody>
                                {/* BEGIN BALANCE */}
                                <tr className="font-semibold bg-gray-50">
                                    <td colSpan={7} className="p-2">
                                        BEGIN BALANCE
                                    </td>
                                    <td className="p-2 text-right">
                                        {formatMoney(Number(beginBalance))}
                                    </td>
                                </tr>

                                {/* TRANSACTIONS */}
                                {transactions.map((t, i) => {
                                    const amount = Number(t.amount);

                                    const debit = t.type === 'in' ? amount : 0;
                                    const credit = t.type === 'out' ? amount : 0;

                                    runningBalance += debit - credit;
                                    totalDebit += debit;
                                    totalCredit += credit;

                                    return (
                                        <tr key={i} className="border-b">
                                            <td className="p-2">{t.approved_at}</td>
                                            <td className="p-2">{t.branch}</td>
                                            <td className="p-2">{t.author}</td>
                                            <td className="p-2">{t.description}</td>
                                            <td className="p-2">{t.full_reference}</td>
                                            <td className="p-2 text-right">
                                                {debit ? formatMoney(debit) : ''}
                                            </td>
                                            <td className="p-2 text-right">
                                                {credit ? formatMoney(credit) : ''}
                                            </td>
                                            <td className="p-2 text-right font-semibold">
                                                {formatMoney(runningBalance)}
                                            </td>
                                        </tr>
                                    );
                                })}


                                {transactions.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="p-4 text-center text-gray-500 italic"
                                        >
                                            No transactions found.
                                        </td>
                                    </tr>
                                )}
                                {/* TOTALS */}
                                <tr className="font-semibold bg-gray-100 border-t-2">
                                    <td colSpan={5} className="p-2 text-right">
                                        TOTAL
                                    </td>
                                    <td className="p-2 text-right">
                                        {formatMoney(totalDebit)}
                                    </td>
                                    <td className="p-2 text-right">
                                        {formatMoney(totalCredit)}
                                    </td>
                                    <td className="p-2 text-right">
                                        {formatMoney(runningBalance)}
                                    </td>
                                </tr>

                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
