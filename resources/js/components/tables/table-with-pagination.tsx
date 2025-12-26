import React, { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';

/* =====================
   TYPES
===================== */

type Column = {
    key: string;
    label: string;
    data_type?: string;
    sortable?: boolean;
    render?: (value: any, row: any) => React.ReactNode;
};

type FilterOption = {
    label: string;
    value: string | number;
};

type Filter = {
    key: string;
    label: string;
    type: 'text' | 'select';
    options?: FilterOption[];
    placeholder?: string;
    defaultValue?: any;
};

type PagedData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
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
    onClick: (rows: T[]) => void;
    danger?: boolean;
};

/* =====================
   COMPONENT
===================== */

export default function PaginatedTable<T extends { id: number }>({
    data,
    columns,
    fetchUrl,
    initialSearch = '',
    rowActions = [],
    bulkActions = [],
    filters = [],
}: {
    data: PagedData<T>;
    columns: Column[];
    fetchUrl: string;
    initialSearch?: string;
    rowActions?: RowAction<T>[];
    bulkActions?: BulkAction<T>[];
    filters?: Filter[];
}) {
    /* =====================
       STATE
    ===================== */

    const [search, setSearch] = useState(initialSearch);
    const [loading, setLoading] = useState(false);

    const [sortBy, setSortBy] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null);

    const [filterValues, setFilterValues] = useState<Record<string, any>>({});
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const debounceRef = useRef<number | null>(null);
    const isFirstRender = useRef(true);

    /* =====================
       INIT FILTER DEFAULTS
    ===================== */

    useEffect(() => {
        const defaults: Record<string, any> = {};
        filters.forEach(f => {
            if (f.defaultValue !== undefined) {
                defaults[f.key] = f.defaultValue;
            }
        });
        setFilterValues(defaults);
    }, []);

    /* =====================
       DEBOUNCED SEARCH
    ===================== */

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = window.setTimeout(() => {
            doFetch(1);
        }, 400);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [search]);

    /* =====================
       AUTO FETCH ON SORT/FILTER
    ===================== */

    useEffect(() => {
        doFetch(1);
    }, [sortBy, sortDir, filterValues]);

    /* =====================
       CLEAR SELECTION ON DATA CHANGE
    ===================== */

    useEffect(() => {
        setSelectedIds([]);
    }, [data]);

    /* =====================
       FETCH
    ===================== */

    const doFetch = (page: number = 1) => {
        setLoading(true);

        router.get(
            fetchUrl,
            {
                page,
                search,
                sort: sortBy,
                direction: sortDir,
                filters: filterValues,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                only: ['data'],
                onFinish: () => setLoading(false),
            }
        );
    };

    /* =====================
       SELECTION
    ===================== */

    const toggleSelectAll = () => {
        setSelectedIds(
            selectedIds.length === data.data.length
                ? []
                : data.data.map(r => r.id)
        );
    };

    const toggleSelectRow = (id: number) => {
        setSelectedIds(ids =>
            ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
        );
    };

    const selectedRows = data.data.filter(r => selectedIds.includes(r.id));

    const isAllSelected =
        selectedIds.length === data.data.length && data.data.length > 0;
    const isSomeSelected =
        selectedIds.length > 0 && selectedIds.length < data.data.length;

    /* =====================
       RENDER
    ===================== */

    return (
        <div className="bg-white rounded-xl border shadow-sm">
            {/* Toolbar */}
            <div className="p-4 border-b flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search..."
                        className="h-10 w-64 rounded-lg border px-3 text-sm"
                    />
                    {/* Filters */}
                    {filters.length > 0 && (
                        <div className="flex items-center gap-3 flex-wrap">
                            {filters.map(filter => (
                                <div key={filter.key}>
                                    {filter.type === 'text' && (
                                        <input
                                            value={filterValues[filter.key] ?? ''}
                                            onChange={e =>
                                                setFilterValues({
                                                    ...filterValues,
                                                    [filter.key]: e.target.value,
                                                })
                                            }
                                            placeholder={filter.placeholder || filter.label}
                                            className="h-10 rounded-lg border px-3 text-sm"
                                        />
                                    )}

                                    {filter.type === 'select' && (
                                        <select
                                            value={filterValues[filter.key] ?? ''}
                                            onChange={e =>
                                                setFilterValues({
                                                    ...filterValues,
                                                    [filter.key]: e.target.value,
                                                })
                                            }
                                            className="h-10 rounded-lg border px-3 text-sm"
                                        >
                                            <option value="">
                                                {filter.label}
                                            </option>
                                            {filter.options?.map(opt => (
                                                // if filter has default property, set that option as selected
                                                <option
                                                    key={opt.value}
                                                    value={opt.value}
                                                    selected={filter.defaultValue === opt.value}
                                                >
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    
                </div>

                

                {/* Bulk actions */}
                {bulkActions.length > 0 && selectedIds.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                            {selectedIds.length} selected
                        </span>
                        {bulkActions.map(action => (
                            <button
                                key={action.key}
                                onClick={() => action.onClick(selectedRows)}
                                className={`px-3 py-2 rounded-lg border text-sm ${
                                    action.danger
                                        ? 'border-red-500 text-red-600'
                                        : 'border-gray-300'
                                }`}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="relative overflow-x-auto">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
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
                                        ref={el => {
                                            if (el) el.indeterminate = isSomeSelected;
                                        }}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                            )}

                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    className={`px-4 py-3 text-left ${
                                        col.sortable ? 'cursor-pointer select-none' : ''
                                    }`}
                                    onClick={() => {
                                        if (!col.sortable) return;

                                        if (sortBy !== col.key) {
                                            setSortBy(col.key);
                                            setSortDir('asc');
                                        } else if (sortDir === 'asc') {
                                            setSortDir('desc');
                                        } else {
                                            setSortBy(null);
                                            setSortDir(null);
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-1">
                                        {col.label}
                                        {sortBy === col.key && (
                                            <span className="text-xs">
                                                {sortDir === 'asc' ? '▲' : '▼'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}

                            {rowActions.length > 0 && (
                                <th className="px-4 py-3 text-right">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>

                    <tbody className="divide-y">
                        {data.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={
                                        columns.length +
                                        (rowActions.length ? 1 : 0) +
                                        (bulkActions.length ? 1 : 0)
                                    }
                                    className="py-10 text-center text-gray-500"
                                >
                                    No data found
                                </td>
                            </tr>
                        )}

                        {data.data.map((row: any) => (
                            <tr key={row.id} className="hover:bg-gray-50">
                                {bulkActions.length > 0 && (
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(row.id)}
                                            onChange={() => toggleSelectRow(row.id)}
                                        />
                                    </td>
                                )}

                                {columns.map(col => {
                                    const value = col.key
                                        .split('.')
                                        .reduce((o, k) => o?.[k], row);

                                    return (
                                        <td key={col.key} className="px-4 py-3">
                                            {col.render
                                                ? col.render(value, row)
                                                : col.data_type === 'currency'
                                                ? new Intl.NumberFormat('id-ID').format(value)
                                                : value ?? '-'}
                                        </td>
                                    );
                                })}

                                {rowActions.length > 0 && (
                                    <td className="px-4 py-3 text-right space-x-2">
                                        {rowActions
                                            .filter(a => !a.can || a.can(row))
                                            .map(a => (
                                                <button
                                                    key={a.key}
                                                    onClick={() => a.onClick(row)}
                                                    className={`px-3 py-1 rounded-lg border text-sm ${
                                                        a.danger
                                                            ? 'border-red-500 text-red-600'
                                                            : 'border-gray-300'
                                                    } ${a.className ?? ''}`}
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
                    disabled={data.current_page <= 1 || loading}
                    onClick={() => doFetch(data.current_page - 1)}
                    className="border rounded-lg px-3 py-2 text-sm disabled:opacity-50"
                >
                    Previous
                </button>

                <span className="text-sm text-gray-600">
                    Page {data.current_page} of {data.last_page}
                </span>

                <button
                    disabled={data.current_page >= data.last_page || loading}
                    onClick={() => doFetch(data.current_page + 1)}
                    className="border rounded-lg px-3 py-2 text-sm disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
