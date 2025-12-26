import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import PaginatedTable from '@/components/tables/table-with-pagination';
import PeriodFormModal from './Form';
import StatusBadge from '@/components/status-badge';

function Index({ data, search }: any) {
    const [showModal, setShowModal] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<any | null>(null);

    return (
        <div className="space-y-6 p-3">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Account Period</h1>

                <button
                    onClick={() => {
                        setSelectedPeriod(null);
                        setShowModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer"
                >
                    + New Period
                </button>
            </div>

            <PaginatedTable
                data={data}
                fetchUrl={route('periods.index')}
                initialSearch={search}
                columns={[
                    { key: 'name', label: 'Name', sortable: true, },
                    { key: 'start_date', label: 'Start Date', sortable: true,  },
                    { key: 'end_date', label: 'End Date', sortable: true,  },
                    {
                        key: 'status',
                        label: 'Status',
                        sortable: true, 
                        render: value => <StatusBadge status={value}
                         />,
                    },
                ]}
                filters={[
                    {
                        key: 'status',
                        label: 'Status',
                        type: 'select',
                        options: [
                            { label: 'Open', value: 'open' },
                            { label: 'Closed', value: 'closed' },
                        ],
                    },
                ]}
                rowActions={[
                    {
                        key: 'edit',
                        label: 'Edit',
                        onClick: (row) => {
                            setSelectedPeriod(row);
                            setShowModal(true);
                        },
                    },
                    {
                        key: 'delete',
                        label: 'Delete',
                        danger: true,
                        onClick: (row) => {
                            if (confirm(`Are you sure you want to delete ${row.name}?`)) {
                                router.delete(route('periods.destroy', row.id), {
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        // Optional: show success message
                                    },
                                });
                            }
                        },
                    },
                ]}
                bulkActions={[
                    {
                        key: 'bulk-delete',
                        label: 'Delete Selected',
                        danger: true,
                        onClick: (selectedRows) => {
                            if (confirm(`Are you sure you want to delete ${selectedRows.length} periods?`)) {
                                router.post(route('periods.bulk-delete'), {
                                    ids: selectedRows.map(row => row.id)
                                });
                            }
                        }
                    },
                    {
                        key: 'bulk-activate',
                        label: 'Activate Selected',
                        onClick: (selectedRows) => {
                            if (confirm(`Are you sure you want to activate ${selectedRows.length} periods?`)) {
                                router.post(route('periods.bulk-activate'), {
                                    ids: selectedRows.map(row => row.id)
                                });
                            }
                        }
                    },
                    {
                        key: 'bulk-deactivate',
                        label: 'Deactivate Selected',
                        onClick: (selectedRows) => {
                            if (confirm(`Are you sure you want to deactivate ${selectedRows.length} periods?`)) {
                                router.post(route('periods.bulk-deactivate'), {
                                    ids: selectedRows.map(row => row.id)
                                });
                            }
                        },
                    }
                ]}

            />

            <PeriodFormModal
                show={showModal}
                period={selectedPeriod}
                onClose={() => setShowModal(false)}
            />
        </div>
    );
}

Index.layout = (page: React.ReactNode) => (
    <AppLayout title="Account Period">{page}</AppLayout>
);

export default Index;

