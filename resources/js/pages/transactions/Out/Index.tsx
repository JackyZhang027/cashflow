import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import PaginatedTable from '@/components/tables/table-with-pagination';
import TransactionFormModal from '../Form';
import StatusBadge from '@/components/status-badge';

function Index({ data, search, branches, currencies }: any) {
    const [showModal, setShowModal] = useState(false);
    const [selected, setSelected] = useState<any | null>(null);

    return (
        <div className="space-y-6 p-3">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Cash Out (Pengeluaran)</h1>

                <button
                    className="px-4 py-2 bg-red-600 text-white rounded cursor-pointer"
                    onClick={() => {
                        setSelected(null);
                        setShowModal(true);
                    }}
                > 
                    + New Cash Out
                </button>
            </div>

            <PaginatedTable
                data={data}
                fetchUrl={route('transactions.out.index')}
                initialSearch={search}
                columns={[
                    { key: 'transaction_date', label: 'Date' },
                    { key: 'full_reference', label: 'Ref' },
                    { key: 'branch.name', label: 'Branch' },
                    { key: 'currency.code', label: 'Currency' },
                    { key: 'amount', label: 'Amount' },
                    { key: 'actor_name', label: 'Pemohon' },
                    {
                        key: 'status', 
                        label: 'Status',
                        render: (value) => <StatusBadge status={value} />,

                    },
                ]}
                rowActions={[
                    {
                        key: 'edit',
                        label: 'Edit',
                        onClick: (row) => {
                            setSelected(row);
                            setShowModal(true);
                        },
                    },
                    {
                        key: 'delete',
                        label: 'Delete',
                        danger: true,
                        onClick: (row) => {
                            if (confirm('Delete this transaction?')) {
                                router.delete(route('transactions.destroy', row.id));
                            }
                        },
                    },
                ]}
                bulkActions={[
                    {
                        key: 'bulk-print',
                        label: 'Print Selected',
                        onClick: (selectedRows) => {
                            if (confirm(`Are you sure you want to print ${selectedRows.length} Transactions?`)) {
                                window.open(route('transactions.print', { id: selectedRows.map(row => row.id), 'type': 'out' }));

                            }
                        }
                    },
                ]}
            />

            <TransactionFormModal
                show={showModal}
                transaction={selected}
                type="out"
                branches={branches}
                currencies={currencies}
                onClose={() => setShowModal(false)}
            />
        </div>
    );
}

Index.layout = (page: React.ReactNode) => (
    <AppLayout title="Cash Out">{page}</AppLayout>
);

export default Index;
