import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import PaginatedTable from '@/components/tables/table-with-pagination';
import BranchFormModal from './Form';

function Index({ data, search }: any) {
    const [showModal, setShowModal] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<any | null>(null);

    return (
        <div className="space-y-6 p-3">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Branches</h1>

                <button
                    onClick={() => {
                        setSelectedBranch(null);
                        setShowModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer"
                >
                    + New Branch
                </button>
            </div>

            <PaginatedTable
                data={data}
                fetchUrl={route('branches.index')}
                initialSearch={search}
                columns={[
                    { key: 'code', label: 'Code' },
                    { key: 'name', label: 'Name' },
                    { key: 'address', label: 'Address' },
                    { key: 'city', label: 'City' },
                    { key: 'province', label: 'Province' },
                    { key: 'status', label: 'Status' },
                ]}
                rowActions={[
                    {
                        key: 'edit',
                        label: 'Edit',
                        onClick: (branch) => {
                            setSelectedBranch(branch);
                            setShowModal(true);
                        },
                    },
                    {
                        key: 'delete',
                        label: 'Delete',
                        danger: true,
                        onClick: (branch) => {
                            if (confirm(`Delete branch ${branch.name}?`)) {
                                router.delete(route('branches.destroy', branch.id), {
                                    preserveScroll: true,
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
                        onClick: (rows) => {
                            if (confirm(`Are you sure you want to delete ${rows.length} branches?`)) {
                                router.post(route('branches.bulk-delete'), {
                                    ids: rows.map(r => r.id),
                                });
                            }
                        },
                    },
                    {
                        key: 'bulk-activate',
                        label: 'Activate Selected',
                        onClick: (rows) => {
                            if (confirm(`Are you sure you want to activate ${rows.length} branches?`)) {
                                router.post(route('branches.bulk-activate'), {
                                    ids: rows.map(r => r.id),
                                });
                            }
                        },
                    },
                    {
                        key: 'bulk-deactivate',
                        label: 'Deactivate Selected',
                        onClick: (rows) => {
                            if (confirm(`Are you sure you want to deactivate ${rows.length} branches?`)) {
                                router.post(route('branches.bulk-deactivate'), {
                                    ids: rows.map(r => r.id),
                                });
                            }
                        },
                    },
                ]}
            />

            <BranchFormModal
                show={showModal}
                branch={selectedBranch}
                onClose={() => setShowModal(false)}
            />
        </div>
    );
}

Index.layout = (page: React.ReactNode) => (
    <AppLayout title="Branches">{page}</AppLayout>
);

export default Index;
