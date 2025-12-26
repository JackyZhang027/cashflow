import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import PaginatedTable from '@/components/tables/table-with-pagination';
import CurrencyFormModal from './Form';

function Index({ data, search }: any) {
    const [showModal, setShowModal] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState<any | null>(null);

    return (
        <div className="space-y-6 p-3">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Currencies</h1>

                <button
                    onClick={() => {
                        setSelectedCurrency(null);
                        setShowModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer"
                >
                    + New Currency
                </button>
            </div>

            <PaginatedTable
                data={data}
                fetchUrl={route('currencies.index')}
                initialSearch={search}
                columns={[
                    { key: 'code', label: 'Code', sortable: true },
                    { key: 'name', label: 'Name', sortable: true },
                    { key: 'symbol', label: 'Symbol', sortable: true },
                    { key: 'precision', label: 'Precision', sortable: true },
                    { key: 'status', label: 'Status', sortable: true },
                ]}
                
                filters={[
                    {
                        key: 'status',
                        label: 'Status',
                        type: 'select',
                        options: [
                            { label: 'Active', value: 'active' },
                            { label: 'Inactive', value: 'inactive' },
                        ],
                    },
                ]}

                rowActions={[
                    {
                        key: 'edit',
                        label: 'Edit',
                        onClick: (currency) => {
                            setSelectedCurrency(currency);
                            setShowModal(true);
                        },
                    },
                    {
                        key: 'delete',
                        label: 'Delete',
                        danger: true,
                        onClick: (currency) => {
                            if (confirm(`Are you sure you want to delete ${currency.name}?`)) {
                                router.delete(route('currencies.destroy', currency.id), {
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
                            if (confirm(`Are you sure you want to delete ${selectedRows.length} currencies?`)) {
                                router.post(route('currencies.bulk-delete'), {
                                    ids: selectedRows.map(row => row.id)
                                });
                            }
                        }
                    },
                    {
                        key: 'bulk-activate',
                        label: 'Activate Selected',
                        onClick: (selectedRows) => {
                            if (confirm(`Are you sure you want to activate ${selectedRows.length} currencies?`)) {
                                router.post(route('currencies.bulk-activate'), {
                                    ids: selectedRows.map(row => row.id)
                                });
                            }
                        }
                    },
                    {
                        key: 'bulk-deactivate',
                        label: 'Deactivate Selected',
                        onClick: (selectedRows) => {
                            if (confirm(`Are you sure you want to deactivate ${selectedRows.length} currencies?`)) {
                                router.post(route('currencies.bulk-deactivate'), {
                                    ids: selectedRows.map(row => row.id)
                                });
                            }
                        },
                    }
                ]}

            />

            {/* ✅ Unified Modal */}
            <CurrencyFormModal
                show={showModal}
                currency={selectedCurrency}
                onClose={() => setShowModal(false)}
            />
        </div>
    );
}

Index.layout = (page: React.ReactNode) => (
    <AppLayout title="Currencies">{page}</AppLayout>
);

export default Index;

