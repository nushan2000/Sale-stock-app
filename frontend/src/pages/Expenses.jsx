import React, { useState, useEffect, useCallback } from 'react';
import API, { fmt, today } from '../api';
import DataTable from '../components/DataTable';
import FormDialog from '../components/FormDialog';

const CATEGORIES = ['RENT', 'UTILITIES', 'SALARY', 'TRANSPORT', 'MAINTENANCE', 'OTHER'];

const EMPTY = { title: '', category: 'OTHER', amount: '', expenseDate: today(), paymentMethod: 'CASH', notes: '' };

const Expenses = () => {
    const [rows, setRows] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [loading, setLoading] = useState(false);
    const [dialog, setDialog] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [editId, setEditId] = useState(null);
    const [error, setError] = useState('');

    const load = useCallback(() => {
        setLoading(true);
        API.get('/expenses', { params: { search, category, from, to, page, size: 10 } })
            .then(r => { setRows(r.data.content); setTotalPages(r.data.totalPages); })
            .catch(() => setError('Failed to load expenses'))
            .finally(() => setLoading(false));
    }, [search, category, from, to, page]);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => { setForm(EMPTY); setEditId(null); setDialog(true); };
    const openEdit = (row) => { setForm({ ...row, expenseDate: row.expenseDate }); setEditId(row.id); setDialog(true); };

    const submit = (e) => {
        e.preventDefault();
        const req = editId ? API.put(`/expenses/${editId}`, form) : API.post('/expenses', form);
        req.then(() => { setDialog(false); load(); })
           .catch(err => setError(err.response?.data?.message || 'Save failed'));
    };

    const del = (id) => {
        if (!confirm('Delete this expense?')) return;
        API.delete(`/expenses/${id}`).then(load).catch(() => setError('Delete failed'));
    };

    const CATEGORY_COLORS = { RENT: '#6366f1', UTILITIES: '#3b82f6', SALARY: '#22c55e', TRANSPORT: '#f59e0b', MAINTENANCE: '#f97316', OTHER: '#94a3b8' };

    const columns = [
        { key: 'id', label: '#' },
        { key: 'expenseDate', label: 'Date' },
        { key: 'title', label: 'Title' },
        { key: 'category', label: 'Category', render: r => <span className="badge" style={{ background: CATEGORY_COLORS[r.category] || '#94a3b8' }}>{r.category}</span> },
        { key: 'amount', label: 'Amount', render: r => `$${fmt(r.amount)}` },
        { key: 'paymentMethod', label: 'Method' },
    ];

    const filters = (
        <div className="dt-filter-row">
            <select value={category} onChange={e => { setCategory(e.target.value); setPage(0); }} className="filter-select">
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(0); }} className="filter-date" />
            <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(0); }} className="filter-date" />
        </div>
    );

    return (
        <div className="page-container">
            <div className="page-header">
                <h2 className="page-title">💸 Expenses</h2>
                <button className="btn-primary" onClick={openCreate}>+ Add Expense</button>
            </div>
            {error && <div className="alert-error" onClick={() => setError('')}>{error} ✕</div>}
            <DataTable columns={columns} data={rows} total={totalPages} page={page}
                onPageChange={setPage} onSearch={s => { setSearch(s); setPage(0); }}
                searchPlaceholder="Search expenses…" loading={loading} filters={filters}
                actions={(row) => (
                    <>
                        <button className="btn-icon" onClick={() => openEdit(row)}>✏️</button>
                        <button className="btn-icon danger" onClick={() => del(row.id)}>🗑️</button>
                    </>
                )}
            />

            <FormDialog open={dialog} onClose={() => setDialog(false)} title={editId ? 'Edit Expense' : 'New Expense'}
                footer={<><button className="btn-secondary" onClick={() => setDialog(false)}>Cancel</button><button className="btn-primary" form="exp-form" type="submit">Save</button></>}>
                <form id="exp-form" onSubmit={submit} className="form-grid">
                    <div className="form-group span-2">
                        <label>Title *</label>
                        <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label>Category</label>
                        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Amount *</label>
                        <input type="number" step="0.01" min="0" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label>Date *</label>
                        <input type="date" required value={form.expenseDate} onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label>Payment Method</label>
                        <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                            <option value="CASH">Cash</option>
                            <option value="CARD">Card</option>
                            <option value="BANK">Bank</option>
                        </select>
                    </div>
                    <div className="form-group span-2">
                        <label>Notes</label>
                        <textarea rows={2} value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                    </div>
                </form>
            </FormDialog>
        </div>
    );
};

export default Expenses;
