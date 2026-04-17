import React, { useState, useEffect, useCallback } from 'react';
import API, { fmt } from '../api';
import DataTable from '../components/DataTable';

const CashFlow = () => {
    const [rows, setRows] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(0);
    const [type, setType] = useState('');
    const [category, setCategory] = useState('');
    const [from, setFrom] = useState(new Date().toISOString().slice(0, 7) + '-01');
    const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [summary, setSummary] = useState({ totalCredits: 0, totalDebits: 0, netBalance: 0 });

    const load = useCallback(() => {
        setLoading(true);
        API.get('/cashflow', { params: { type, category, from, to, page, size: 20 } })
            .then(r => { setRows(r.data.content); setTotalPages(r.data.totalPages); })
            .catch(() => setError('Failed to load cash flow'))
            .finally(() => setLoading(false));
        API.get('/cashflow/summary', { params: { from, to } })
            .then(r => setSummary(r.data)).catch(() => {});
    }, [type, category, from, to, page]);

    useEffect(() => { load(); }, [load]);

    const exportCSV = () => {
        API.get('/cashflow/export', { params: { from, to } }).then(r => {
            const rows = r.data;
            const csv = [['Date','Type','Category','Amount','Method','Note'],
                ...rows.map(d => [d.transactionDate, d.type, d.category, d.amount, d.paymentMethod, d.note || ''])]
                .map(r => r.join(',')).join('\n');
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
            a.download = `cashflow_${from}_${to}.csv`; a.click();
        });
    };

    const columns = [
        { key: 'transactionDate', label: 'Date' },
        { key: 'type', label: 'Type', render: r => <span className="badge" style={{ background: r.type === 'CREDIT' ? '#22c55e' : '#ef4444' }}>{r.type}</span> },
        { key: 'category', label: 'Category' },
        { key: 'amount', label: 'Amount', render: r => <span style={{ color: r.type === 'CREDIT' ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{r.type === 'CREDIT' ? '+' : '-'}${fmt(r.amount)}</span> },
        { key: 'paymentMethod', label: 'Method' },
        { key: 'note', label: 'Note' },
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <h2 className="page-title">💹 Cash Flow</h2>
                <button className="btn-secondary" onClick={exportCSV}>📥 Export CSV</button>
            </div>
            {error && <div className="alert-error" onClick={() => setError('')}>{error} ✕</div>}
            <div className="cf-summary">
                <div className="cf-card credit"><div className="cf-card-label">Total Credits</div><div className="cf-card-value">+${fmt(summary.totalCredits)}</div></div>
                <div className="cf-card debit"><div className="cf-card-label">Total Debits</div><div className="cf-card-value">-${fmt(summary.totalDebits)}</div></div>
                <div className="cf-card" style={{ borderLeft: `4px solid ${summary.netBalance >= 0 ? '#22c55e' : '#ef4444'}` }}>
                    <div className="cf-card-label">Net Balance</div>
                    <div className="cf-card-value" style={{ color: summary.netBalance >= 0 ? '#22c55e' : '#ef4444' }}>${fmt(summary.netBalance)}</div>
                </div>
            </div>
            <DataTable columns={columns} data={rows} total={totalPages} page={page}
                onPageChange={setPage} loading={loading}
                filters={<div className="dt-filter-row">
                    <select value={type} onChange={e => { setType(e.target.value); setPage(0); }} className="filter-select">
                        <option value="">All Types</option>
                        <option value="CREDIT">Credit</option>
                        <option value="DEBIT">Debit</option>
                    </select>
                    <select value={category} onChange={e => { setCategory(e.target.value); setPage(0); }} className="filter-select">
                        <option value="">All Categories</option>
                        <option value="INVOICE">Invoice</option>
                        <option value="EXPENSE">Expense</option>
                        <option value="REFUND">Refund</option>
                        <option value="PURCHASE">Purchase</option>
                        <option value="DEBT_PAYMENT">Debt Payment</option>
                    </select>
                    <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(0); }} className="filter-date" />
                    <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(0); }} className="filter-date" />
                </div>}
            />
        </div>
    );
};

export default CashFlow;
