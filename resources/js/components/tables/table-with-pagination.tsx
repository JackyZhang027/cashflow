import React, { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';

type Column = { key: string; label: string, data_type?: string, render?: (value: any, row: any) => React.ReactNode; };

type PagedData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    prev_page_url?: string | null;
    next_page_url?: string | null;
};

type RowAction<T> = {
    key: string;
    label: string;
    onClick: (row: T) => void;
    danger?: boolean;
    can?: (row: T) => boolean;
    className?: string;
};

type BulkAction<T> = {
    key: string;
    label: string;
    onClick: (selectedRows: T[]) => void;
    danger?: boolean;
};

export default function PaginatedTable<T extends { id: number }>(props: {
    data: PagedData<T>;
    columns: Column[];
    fetchUrl: string;
    initialSearch?: string;
    rowActions?: RowAction<T>[];
    bulkActions?: BulkAction<T>[];
}) {
    const {
        data,
        columns,
        fetchUrl,
        initialSearch = '',
        rowActions = [],
        bulkActions = [],
    } = props;

    const [search, setSearch] = useState(initialSearch);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const debounceRef = useRef<number | null>(null);
    const isFirstRender = useRef(true);

    /* =========================
       DEBOUNCED SEARCH
    ========================= */
    useEffect(() => {
        // Skip search on first render
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = window.setTimeout(() => {
            doSearch();
        }, 400);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [search]);

    // Sync search state with prop changes
    useEffect(() => {
        setSearch(initialSearch);
    }, [initialSearch]);

    // Clear selection when data changes
    useEffect(() => {
        setSelectedIds([]);
    }, [data]);

    const doSearch = (page: number = 1) => {
        setLoading(true);

        const params = new URLSearchParams();
        if (search) {
            params.append('search', search);
        }
        params.append('page', page.toString());

        router.visit(`${fetchUrl}?${params.toString()}`, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
            only: ['data'],
            onFinish: () => {
                setLoading(false);
                // Reset URL to clean state
                window.history.replaceState({}, '', fetchUrl);
            },
        });
    };

    const goToPage = (url?: string | null) => {
        if (!url) return;
        
        const urlObj = new URL(url);
        const page = urlObj.searchParams.get('page');
        
        if (page) {
            doSearch(parseInt(page));
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === data.data.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(data.data.map(row => row.id));
        }
    };

    const toggleSelectRow = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const getSelectedRows = () => {
        return data.data.filter(row => selectedIds.includes(row.id));
    };

    const isAllSelected = selectedIds.length === data.data.length && data.data.length > 0;
    const isSomeSelected = selectedIds.length > 0 && selectedIds.length < data.data.length;

    return (
        <div className="bg-white rounded-xl border shadow-sm">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-4">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search ..."
                        className="h-10 w-64 rounded-lg border px-3 text-sm"
                    />

                    {bulkActions.length > 0 && selectedIds.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                                {selectedIds.length} selected
                            </span>
                            {bulkActions.map((action) => (
                                <button
                                    key={action.key}
                                    onClick={() => action.onClick(getSelectedRows())}
                                    className={`px-3 py-2 rounded-lg border text-sm cursor-pointer ${
                                        action.danger
                                            ? 'border-red-500 text-red-600 hover:bg-red-50'
                                            : 'border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {loading && (
                    <span className="text-sm text-gray-500 animate-pulse">
                        Loading…
                    </span>
                )}
            </div>

            {/* Table */}
            <div className="relative overflow-x-auto">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    </div>
                )}

                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            {bulkActions.length > 0 && (
                                <th className="px-4 py-3 w-12">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        ref={(el) => {
                                            if (el) el.indeterminate = isSomeSelected;
                                        }}
                                        onChange={toggleSelectAll}
                                        className="rounded border-gray-300"
                                    />
                                </th>
                            )}
                            {columns.map((c) => (
                                <th key={c.key} className="px-4 py-3 text-left">
                                    {c.label}
                                </th>
                            ))}
                            {rowActions.length > 0 && (
                                <th className="px-4 py-3 text-right">Actions</th>
                            )}
                        </tr>
                    </thead>

                    <tbody className="divide-y">
                        {data.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={
                                        columns.length +
                                        (rowActions.length > 0 ? 1 : 0) +
                                        (bulkActions.length > 0 ? 1 : 0)
                                    }
                                    className="py-10 text-center text-gray-500"
                                >
                                    No data found
                                </td>
                            </tr>
                        )}

                        {data.data.map((row: any) => (
                            <tr key={row.id} className="hover:bg-gray-50">
                                {/* Bulk checkbox */}
                                {bulkActions.length > 0 && (
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(row.id)}
                                            onChange={() => toggleSelectRow(row.id)}
                                            className="rounded border-gray-300"
                                        />
                                    </td>
                                )}

                                {/* Data columns */}
                                {columns.map((c) => {
                                    const value = c.key
                                        .split('.')
                                        .reduce((obj, key) => obj && (obj as any)[key], row);

                                    return (
                                        <td key={c.key} className="px-4 py-3">
                                            {c.render ? (
                                                c.render(value, row)
                                            ) : c.data_type === 'currency' ? (
                                                new Intl.NumberFormat('id-ID').format(value)
                                            ) : (
                                                value ?? '-'
                                            )}
                                        </td>
                                    );
                                })}

                                {/* Row actions */}
                                {rowActions.length > 0 && (
                                    <td className="px-4 py-3 text-right space-x-2">
                                        {rowActions
                                            .filter(a => !a.can || a.can(row))
                                            .map((a) => (
                                                <button
                                                    key={a.key}
                                                    onClick={() => a.onClick(row)}
                                                    className={[
                                                        'px-3 py-1 rounded-lg border text-sm cursor-pointer',
                                                        a.danger
                                                            ? 'border-red-500 text-red-600'
                                                            : 'border-gray-300',
                                                        a.className, // 👈 custom class
                                                    ].filter(Boolean).join(' ')}
                                                >
                                                    {a.label}
                                                </button>
                                        ))}

                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>

                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t">
                <button
                    disabled={!data.prev_page_url || loading}
                    onClick={() => goToPage(data.prev_page_url)}
                    className="border rounded-lg px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>

                <span className="text-sm text-gray-600">
                    Page {data.current_page} of {data.last_page}
                </span>

                <button
                    disabled={!data.next_page_url || loading}
                    onClick={() => goToPage(data.next_page_url)}
                    className="border rounded-lg px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
        </div>
    );
}