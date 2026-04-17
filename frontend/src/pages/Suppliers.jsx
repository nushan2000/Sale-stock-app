import React, { useState, useEffect, useCallback } from 'react';
import API from '../api';
import DataTable from '../components/DataTable';
import FormDialog from '../components/FormDialog';

const EMPTY = { name: '', phone: '', email: '', address: '', notes: '' };

const Suppliers = () => {
    const [rows, setRows] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [dialog, setDialog] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [editId, setEditId] = useState(null);
    const [error, setError] = useState('');

    const load = useCallback(() => {
        setLoading(true);
        API.get('/suppliers', { params: { search, page, size: 10 } })
            .then(r => { setRows(r.data.content); setTotalPages(r.data.totalPages); })
            .catch(() => setError('Failed to load suppliers'))
            .finally(() => setLoading(false));
    }, [search, page]);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => { setForm(EMPTY); setEditId(null); setDialog(true); };
    const openEdit = (row) => { setForm(row); setEditId(row.id); setDialog(true); };

    const submit = (e) => {
        e.preventDefault();
        const req = editId ? API.put(`/suppliers/${editId}`, form) : API.post('/suppliers', form);
        req.then(() => { setDialog(false); load(); })
           .catch(err => setError(err.response?.data?.message || 'Save failed'));
    };

    const del = (id) => {
        if (!confirm('Delete this supplier?')) return;
        API.delete(`/suppliers/${id}`).then(load).catch(() => setError('Delete failed'));
    };

    const columns = [
        { key: 'id', label: '#' },
        { key: 'name', label: 'Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'address', label: 'Address' },
        { key: 'totalPayable', label: 'Total Payable', render: r => `$${Number(r.totalPayable || 0).toFixed(2)}` },
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <h2 className="page-title">🏭 Suppliers</h2>
                <button className="btn-primary" onClick={openCreate}>+ Add Supplier</button>
            </div>
            {error && <div className="alert-error" onClick={() => setError('')}>{error} ✕</div>}
            <DataTable columns={columns} data={rows} total={totalPages} page={page}
                onPageChange={setPage} onSearch={s => { setSearch(s); setPage(0); }}
                searchPlaceholder="Search suppliers…" loading={loading}
                actions={(row) => (
                    <>
                        <button className="btn-icon" onClick={() => openEdit(row)}>✏️</button>
                        <button className="btn-icon danger" onClick={() => del(row.id)}>🗑️</button>
                    </>
                )}
            />

            <FormDialog open={dialog} onClose={() => setDialog(false)} title={editId ? 'Edit Supplier' : 'New Supplier'}
                footer={<><button className="btn-secondary" onClick={() => setDialog(false)}>Cancel</button><button className="btn-primary" form="supp-form" type="submit">Save</button></>}>
                <form id="supp-form" onSubmit={submit} className="form-grid">
                    <div className="form-group">
                        <label>Name *</label>
                        <input required value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Phone</label>
                        <input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Address</label>
                        <input value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />
                    </div>
                    <div className="form-group span-2">
                        <label>Notes</label>
                        <textarea rows={2} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
                    </div>
                </form>
            </FormDialog>
        </div>
    );
};

export default Suppliers;
