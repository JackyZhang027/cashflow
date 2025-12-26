import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import PaginatedTable from '@/components/tables/table-with-pagination';
import BranchTransferFormModal from './Form';
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
                <h1 className="text-xl font-semibold">Branch Transfer</h1>

                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                    onClick={() => {
                        setSelected(null);
                        setShowModal(true);
                    }}
                >
                    + New Transfer
                </button>
            </div>

            <PaginatedTable
                data={data}
                fetchUrl={route('transfers.index')}
                initialSearch={search}
                columns={[
                    { key: 'transfer_date', label: 'Date', sortable: true },
                    { key: 'from_branch.name', label: 'From Branch', sortable: true },
                    { key: 'to_branch.name', label: 'To Branch', sortable: true },
                    { key: 'currency.code', label: 'Currency', sortable: true },
                    { key: 'amount', label: 'Amount', data_type: 'currency', sortable: true },
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
                ]}
                rowActions={[
                    {
                        key: 'approve',
                        label: 'Approve / Reject',
                        className: 'border-green-500 text-green-600',
                        onClick: (row) => {
                            router.visit(route('transactions.approval.transfer.show', row.id));
                        },
                        can: (row: any) =>
                            row.status === 'pending' &&
                            can('approve-branch-transfer'),
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
                            if (confirm('Delete this transfer?')) {
                                router.delete(route('transfers.destroy', row.id));
                            }
                        },
                        can: (row: any) => row.status === 'pending',
                    },
                ]}
            />

            <BranchTransferFormModal
                show={showModal}
                transfer={selected}
                branches={branches}
                currencies={currencies}
                onClose={() => setShowModal(false)}
            />
        </div>
    );
}

Index.layout = (page: React.ReactNode) => (
    <AppLayout title="Branch Transfer">{page}</AppLayout>
);

export default Index;
