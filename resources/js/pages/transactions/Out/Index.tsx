import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import PaginatedTable from '@/components/tables/table-with-pagination';
import TransactionFormModal from '../Form';
import StatusBadge from '@/components/status-badge';

function Index({ data, search, branches, currencies }: any) {
    const { props } = usePage<any>();
    const [showModal, setShowModal] = useState(false);
    const [selected, setSelected] = useState<any | null>(null);

    const permissions: string[] = props.auth?.permissions ?? [];
    const can = (permission: string) => permissions.includes(permission);

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
                    { key: 'transaction_date', label: 'Date', sortable: true },
                    { key: 'full_reference', label: 'Ref', sortable: true },
                    { key: 'branch.name', label: 'Branch', sortable: true },
                    { key: 'currency.code', label: 'Currency', sortable: true },
                    { key: 'amount', label: 'Amount', data_type: 'currency', sortable: true },
                    { key: 'actor_name', label: 'Pemohon', sortable: true },
                    {
                        key: 'status', 
                        label: 'Status',
                        sortable: true,
                        render: (value) => <StatusBadge status={value} />,

                    },
                ]}
                filters={[
                    {
                        key: 'status',
                        label: 'All',
                        type: 'select',
                        defaultValue: 'pending',
                        options: [
                            { label: 'Pending', value: 'pending' },
                            { label: 'Approved', value: 'approved' },
                            { label: 'Rejected', value: 'rejected' },
                        ],
                    },
                    {
                        key: 'branch_id',
                        label: 'Branch',
                        type: 'select',
                        options: branches.map((branch: any) => ({ label: branch.name, value: branch.id }) ),
                    },
                    {
                        key: 'currency_id',
                        label: 'Currency',
                        type: 'select',
                        options: currencies.map((currency: any) => ({ label: currency.code, value: currency.id }) ),
                    }
                ]}
                rowActions={[
                    {
                        key: 'approve',
                        label: 'Approve / Reject',
                        className: 'border-green-500 text-green-600',
                        onClick: (row) => {
                            router.visit(route('transactions.approval.show', row.id));
                        },
                        can: (row: any) =>
                            row.status === 'pending' &&
                            can('approve-transaction'),
                    },
                    {
                        key: 'edit',
                        label: 'Edit',
                        onClick: (row) => {
                            setSelected(row);
                            setShowModal(true);
                        },
                        can: (row: any) => row.status === 'pending',
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
                        can: (row: any) => row.status === 'pending',
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
