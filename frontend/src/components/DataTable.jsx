import React, { useState } from 'react';

/**
 * Reusable paginated data table with search and optional action buttons.
 *
 * Props:
 *   columns: [{ key, label, render? }]
 *   data:    array of row objects
 *   total:   total pages
 *   page:    current page (0-indexed)
 *   onPageChange(newPage)
 *   onSearch(searchText)
 *   searchPlaceholder
 *   actions(row): React node rendered in last column
 *   filters: extra filter JSX rendered beside search
 *   loading: bool
 */
const DataTable = ({
    columns = [],
    data = [],
    total = 1,
    page = 0,
    onPageChange,
    onSearch,
    searchPlaceholder = 'Search…',
    actions,
    filters,
    loading = false,
}) => {
    const [search, setSearch] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        onSearch && onSearch(search);
    };

    return (
        <div className="dt-wrapper">
            {/* Toolbar */}
            <div className="dt-toolbar">
                {onSearch && (
                    <form onSubmit={handleSearch} className="dt-search-form">
                        <div className="dt-search-wrap">
                            <span className="dt-search-icon">🔍</span>
                            <input
                                className="dt-search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={searchPlaceholder}
                            />
                            <button className="btn-sm-primary" type="submit">Search</button>
                        </div>
                    </form>
                )}
                {filters && <div className="dt-filters">{filters}</div>}
            </div>

            {/* Table */}
            <div className="dt-table-wrap">
                {loading ? (
                    <div className="dt-loading"><div className="spinner"></div><span>Loading…</span></div>
                ) : (
                    <table className="dt-table">
                        <thead>
                            <tr>
                                {columns.map((col) => (
                                    <th key={col.key}>{col.label}</th>
                                ))}
                                {actions && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr><td colSpan={columns.length + (actions ? 1 : 0)} className="dt-empty">No records found</td></tr>
                            ) : (
                                data.map((row, i) => (
                                    <tr key={row.id ?? i}>
                                        {columns.map((col) => (
                                            <td key={col.key}>
                                                {col.render ? col.render(row) : row[col.key] ?? '—'}
                                            </td>
                                        ))}
                                        {actions && <td className="dt-actions">{actions(row)}</td>}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            <div className="dt-pagination">
                <button
                    className="page-btn"
                    disabled={page === 0}
                    onClick={() => onPageChange(page - 1)}
                >‹ Prev</button>
                <span className="page-info">Page {page + 1} of {Math.max(total, 1)}</span>
                <button
                    className="page-btn"
                    disabled={page >= total - 1}
                    onClick={() => onPageChange(page + 1)}
                >Next ›</button>
            </div>
        </div>
    );
};

export default DataTable;
