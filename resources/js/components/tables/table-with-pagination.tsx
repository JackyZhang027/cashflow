import React, { useEffect, useRef, useState, useMemo } from 'react';
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
       INITIALIZE FILTER DEFAULTS
    ===================== */
    const initialFilterValues = useMemo(() => {
        const defaults: Record<string, any> = {};
        filters.forEach(f => {
            if (f.defaultValue !== undefined) {
                defaults[f.key] = f.defaultValue;
            }
        });
        return defaults;
    }, []);

    /* =====================
       STATE
    ===================== */

    const [search, setSearch] = useState(initialSearch);
    const [loading, setLoading] = useState(false);

    const [sortBy, setSortBy] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null);

    const [filterValues, setFilterValues] = useState<Record<string, any>>(initialFilterValues);
    
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    /* =====================
       DEDUPLICATE DATA
    ===================== */
    const uniqueData = useMemo(() => {
        const seen = new Set();
        return data.data.filter((row: any) => {
            if (seen.has(row.id)) {
                return false;
            }
            seen.add(row.id);
            return true;
        });
    }, [data.data]);

    const debounceRef = useRef<number | null>(null);
    const isFirstRender = useRef(true);
    const abortControllerRef = useRef<AbortController | null>(null);
    const requestIdRef = useRef(0);

    /* =====================
       INITIAL FETCH WITH DEFAULT FILTERS
    ===================== */
    useEffect(() => {
        // Only fetch on mount if there are default filters
        if (Object.keys(initialFilterValues).length > 0) {
            doFetch(1);
        }
    }, []); // Empty dependency - run once on mount

    /* =====================
       TRIGGER FETCH ON CHANGES
    ===================== */

    useEffect(() => {
        // Skip first render
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        // Clear existing timeout
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Debounce the fetch
        debounceRef.current = window.setTimeout(() => {
            doFetch(1);
        }, 400);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [search, sortBy, sortDir, filterValues]);

    /* =====================
       CLEAR SELECTION ON DATA CHANGE
    ===================== */

    useEffect(() => {
        setSelectedIds([]);
    }, [data.current_page]); // Changed from data.data to current_page to avoid issues

    /* =====================
       FETCH FUNCTION
    ===================== */

    const doFetch = (page: number = 1) => {
        // Prevent duplicate calls
        if (loading) return;
        
        // Cancel any pending request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        
        // Increment request ID to track latest request
        requestIdRef.current += 1;
        const currentRequestId = requestIdRef.current;
        
        setLoading(true);

        // Build query params
        const params: Record<string, any> = { page };
        
        if (search) params.search = search;
        if (sortBy) params.sort = sortBy;
        if (sortDir) params.direction = sortDir;
        
        // Only include non-empty filters
        const activeFilters: Record<string, any> = {};
        Object.entries(filterValues).forEach(([key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
                activeFilters[key] = value;
            }
        });
        if (Object.keys(activeFilters).length > 0) {
            params.filters = activeFilters;
        }

        router.get(
            fetchUrl,
            params,
            {
                preserveScroll: true,
                preserveState: true,
                only: ['data'],
                preserveUrl: true,
                onFinish: () => {
                    // Only set loading to false if this is still the latest request
                    if (currentRequestId === requestIdRef.current) {
                        setLoading(false);
                    }
                },
            }
        );
    };

    /* =====================
       SELECTION
    ===================== */

    const toggleSelectAll = () => {
        setSelectedIds(
            selectedIds.length === uniqueData.length
                ? []
                : uniqueData.map(r => r.id)
        );
    };

    const toggleSelectRow = (id: number) => {
        setSelectedIds(ids =>
            ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
        );
    };

    const selectedRows = uniqueData.filter(r => selectedIds.includes(r.id));

    const isAllSelected =
        selectedIds.length === uniqueData.length && uniqueData.length > 0;
    const isSomeSelected =
        selectedIds.length > 0 && selectedIds.length < uniqueData.length;

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
                                                setFilterValues(prev => ({
                                                    ...prev,
                                                    [filter.key]: e.target.value,
                                                }))
                                            }
                                            placeholder={filter.placeholder || filter.label}
                                            className="h-10 rounded-lg border px-3 text-sm"
                                        />
                                    )}

                                    {filter.type === 'select' && (
                                        <select
                                            value={filterValues[filter.key] ?? ''}
                                            onChange={e =>
                                                setFilterValues(prev => ({
                                                    ...prev,
                                                    [filter.key]: e.target.value,
                                                }))
                                            }
                                            className="h-10 rounded-lg border px-3 text-sm"
                                        >
                                            <option value="">
                                                {filter.label}
                                            </option>
                                            {filter.options?.map(opt => (
                                                <option
                                                    key={opt.value}
                                                    value={opt.value}
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

                    <tbody className="divide-y" key={`page-${data.current_page}`}>
                        {uniqueData.length === 0 && (
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

                        {uniqueData.map((row: any, index: number) => (
                            <tr key={`${data.current_page}-${row.id}-${index}`} className="hover:bg-gray-50">
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