import { router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function BalanceSummary() {
    const { data, filters } = usePage().props as any;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('reports.balance-summary'), filters, {
            preserveState: true,
        });
    };

    const exportPdf = () => {
        window.open(
            route('reports.balance-summary.pdf', filters),
            '_blank'
        );
    };

    return (
        <AppLayout title="Balance Summary">
            <div className="space-y-6 p-3">
                <div className="items-center justify-between">
                    <h1 className="text-xl font-semibold">Balance Summary Report</h1>
                </div>

                <div className="space-y-4 bg-white p-4 rounded-lg shadow">
                    {/* Filters */}
                    <form onSubmit={submit} className="flex gap-4">
                        <input
                            type="date"
                            value={filters.from}
                            onChange={e => filters.from = e.target.value}
                            className="border rounded px-3 py-2"
                        />
                        <input
                            type="date"
                            value={filters.to}
                            onChange={e => filters.to = e.target.value}
                            className="border rounded px-3 py-2"
                        />
                        <button className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white 
                                        py-2 px-4 border border-blue-500 hover:border-transparent rounded
                                        cursor-pointer">Filter</button>
                        <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center cursor-pointer"
                                onClick={exportPdf}
                                type='button'>
                            <svg className="fill-current w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/></svg>
                            <span>Download</span>
                        </button>
                    </form>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-100 border-b">
                                    <th className="p-2 text-left">Branch</th>
                                    <th className="p-2 text-left">Currency</th>
                                    <th className="p-2 text-right">Begin</th>
                                    <th className="p-2 text-right">Transaction</th>
                                    <th className="p-2 text-right">Ending</th>
                                </tr>
                            </thead>

                            <tbody>
                                {data.map((row: any, index: number) => {
                                    const isNewBranch =
                                        index > 0 && data[index - 1].branch !== row.branch;

                                    return (
                                        <tr
                                            key={index}
                                            className={`
                                                ${isNewBranch ? 'border-t-2 border-dashed border-gray-400' : ''}
                                            `}
                                        >
                                            <td className="p-2">{row.branch}</td>
                                            <td className="p-2">{row.currency}</td>
                                            <td className="p-2 text-right">
                                                {Number(row.begin_balance).toLocaleString()}
                                            </td>
                                            <td className="p-2 text-right">
                                                {Number(row.transaction_balance).toLocaleString()}
                                            </td>
                                            <td className="p-2 text-right font-semibold">
                                                {Number(row.ending_balance).toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                    </div>

                </div>
            </div>
        </AppLayout>
    );
}
