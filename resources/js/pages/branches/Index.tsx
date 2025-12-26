import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import PaginatedTable from '@/components/tables/table-with-pagination';
import BranchFormModal from './Form';
import StatusBadge from '@/components/status-badge';
import OpeningBalanceModal from './OpeningBalanceModal';

function OpeningBalanceBadge({ balance, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="px-2 py-1 text-xs rounded bg-green-100 text-green-800 hover:bg-green-200"
        >
            {balance.currency_code}: {Number(balance.amount).toLocaleString()}
        </button>
    );
}

function Index({ data, search, currencies }: any) {
    const [showModal, setShowModal] = useState(false);
    const [showOpeningBalance, setShowOpeningBalance] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<any | null>(null);
    const [selectedOpeningBalance, setSelectedOpeningBalance] = useState(null);


    return (
        <div className="space-y-6 p-3">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Branches</h1>

                <button
                    onClick={() => {
                        setSelectedBranch(null);
                        setShowModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                    + New Branch
                </button>
            </div>

          <PaginatedTable
                data={data}
                fetchUrl={route('branches.index')}
                initialSearch={search}

                /* =====================
                COLUMNS (ALL SORTABLE)
                ===================== */
                columns={[
                    {
                        key: 'code',
                        label: 'Code',
                        sortable: true,
                    },
                    {
                        key: 'name',
                        label: 'Name',
                        sortable: true,
                    },
                    {
                        key: 'opening_balances',
                        label: 'Opening Balance',
                        sortable: true, // backend decides how to sort
                        render: (balances, row) => (
                            <div className="flex flex-wrap gap-1">
                                {balances.length === 0 && (
                                    <span className="text-gray-400 text-xs">Not set</span>
                                )}

                                {balances.map((balance: any) => (
                                    <OpeningBalanceBadge
                                        key={balance.id}
                                        balance={balance}
                                        onClick={() => {
                                            setSelectedBranch(row);
                                            setSelectedOpeningBalance(balance);
                                            setShowOpeningBalance(true);
                                        }}
                                    />
                                ))}
                            </div>
                        ),
                    },
                    {
                        key: 'status',
                        label: 'Status',
                        sortable: true,
                        render: value => <StatusBadge status={value} />,
                    },
                ]}

                /* =====================
                FILTERS
                ===================== */
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

                /* =====================
                ROW ACTIONS
                ===================== */
                rowActions={[
                    {
                        key: 'balance',
                        label: 'Opening Balance',
                        onClick: branch => {
                            setSelectedBranch(branch);
                            setShowOpeningBalance(true);
                        },
                    },
                    {
                        key: 'edit',
                        label: 'Edit',
                        onClick: branch => {
                            setSelectedBranch(branch);
                            setShowModal(true);
                        },
                    },
                    {
                        key: 'delete',
                        label: 'Delete',
                        danger: true,
                        onClick: branch => {
                            if (confirm(`Delete branch ${branch.name}?`)) {
                                router.delete(route('branches.destroy', branch.id), {
                                    preserveScroll: true,
                                });
                            }
                        },
                    },
                ]}

                /* =====================
                BULK ACTIONS
                ===================== */
                bulkActions={[
                    {
                        key: 'bulk-delete',
                        label: 'Delete Selected',
                        danger: true,
                        onClick: rows => {
                            if (confirm(`Delete ${rows.length} branches?`)) {
                                router.post(route('branches.bulk-delete'), {
                                    ids: rows.map(r => r.id),
                                });
                            }
                        },
                    },
                    {
                        key: 'bulk-activate',
                        label: 'Activate Selected',
                        onClick: rows => {
                            router.post(route('branches.bulk-activate'), {
                                ids: rows.map(r => r.id),
                            });
                        },
                    },
                    {
                        key: 'bulk-deactivate',
                        label: 'Deactivate Selected',
                        onClick: rows => {
                            router.post(route('branches.bulk-deactivate'), {
                                ids: rows.map(r => r.id),
                            });
                        },
                    },
                ]}
            />


            {/* Branch create / edit */}
            <BranchFormModal
                show={showModal}
                branch={selectedBranch}
                onClose={() => {
                    setShowModal(false);
                    setSelectedBranch(null);
                }}
            />

            {/* Opening balance */}
            {selectedBranch && (
                <OpeningBalanceModal
                    show={showOpeningBalance}
                    branch={selectedBranch}
                    currencies={currencies}
                    openingBalance={selectedOpeningBalance}
                    onClose={() => {
                        setShowOpeningBalance(false);
                        setSelectedOpeningBalance(null);
                    }}
                />

            )}
        </div>
    );
}

Index.layout = (page: React.ReactNode) => (
    <AppLayout title="Branches">{page}</AppLayout>
);

export default Index;
