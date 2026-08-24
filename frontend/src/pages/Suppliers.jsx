import React, { useState, useEffect, useCallback } from 'react';
import API, { fmt, today } from '../api';
import DataTable from '../components/DataTable';
import FormDialog from '../components/FormDialog';
import { useAuth } from '../context/AuthContext';

const EMPTY = { name: '', phone: '', email: '', address: '', notes: '' };
const EMPTY_PAYMENT = { amount: '', paymentMethod: 'CASH', paymentDate: today(), note: '' };

const Suppliers = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const [rows, setRows] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [dialog, setDialog] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [editId, setEditId] = useState(null);
    const [error, setError] = useState('');

    const [payDialog, setPayDialog] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [payForm, setPayForm] = useState(EMPTY_PAYMENT);
    const [historyDialog, setHistoryDialog] = useState(false);
    const [payments, setPayments] = useState([]);

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

    const openPay = (supplier) => {
        setSelectedSupplier(supplier);
        setPayForm({ ...EMPTY_PAYMENT, amount: supplier.totalPayable || '' });
        setPayDialog(true);
    };

    const submitPayment = (e) => {
        e.preventDefault();
        API.post(`/suppliers/${selectedSupplier.id}/payments`, {
            ...payForm,
            amount: parseFloat(payForm.amount),
        })
            .then(() => { setPayDialog(false); load(); })
            .catch(err => setError(err.response?.data?.message || 'Payment failed'));
    };

    const openHistory = (supplier) => {
        setSelectedSupplier(supplier);
        API.get(`/suppliers/${supplier.id}/payments`).then(r => setPayments(r.data)).catch(() => setPayments([]));
        setHistoryDialog(true);
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
                        {row.totalPayable > 0 && (
                            <button className="btn-sm-primary" onClick={() => openPay(row)}>💰 Pay</button>
                        )}
                        <button className="btn-icon" onClick={() => openHistory(row)} title="Payment history">🧾</button>
                        <button className="btn-icon" onClick={() => openEdit(row)}>✏️</button>
                        {isAdmin && <button className="btn-icon danger" onClick={() => del(row.id)}>🗑️</button>}
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

            <FormDialog open={payDialog} onClose={() => setPayDialog(false)} title="Pay Supplier"
                footer={<><button className="btn-secondary" onClick={() => setPayDialog(false)}>Cancel</button><button className="btn-primary" form="supp-pay-form" type="submit">Confirm Payment</button></>}>
                {selectedSupplier && (
                    <form id="supp-pay-form" onSubmit={submitPayment} className="form-grid">
                        <div className="form-group span-2">
                            <div className="info-box">
                                <strong>Supplier:</strong> {selectedSupplier.name}<br />
                                <strong>Outstanding Payable:</strong> <span style={{ color: '#ef4444' }}>${fmt(selectedSupplier.totalPayable)}</span>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Amount *</label>
                            <input type="number" step="0.01" min="0.01" max={selectedSupplier.totalPayable}
                                required value={payForm.amount}
                                onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label>Payment Date *</label>
                            <input type="date" required value={payForm.paymentDate}
                                onChange={e => setPayForm(f => ({ ...f, paymentDate: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label>Method</label>
                            <select value={payForm.paymentMethod}
                                onChange={e => setPayForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                                <option value="CASH">Cash</option>
                                <option value="CARD">Card</option>
                                <option value="BANK">Bank Transfer</option>
                                <option value="CHEQUE">Cheque</option>
                            </select>
                        </div>
                        <div className="form-group span-2">
                            <label>Note</label>
                            <input value={payForm.note} onChange={e => setPayForm(f => ({ ...f, note: e.target.value }))} />
                        </div>
                    </form>
                )}
            </FormDialog>

            <FormDialog open={historyDialog} onClose={() => setHistoryDialog(false)}
                title={`Payment History — ${selectedSupplier?.name || ''}`} size="lg">
                <table className="dt-table">
                    <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Note</th></tr></thead>
                    <tbody>
                        {payments.length === 0 ? (
                            <tr><td colSpan={4} className="dt-empty">No payments recorded</td></tr>
                        ) : payments.map(p => (
                            <tr key={p.id}>
                                <td>{p.paymentDate}</td>
                                <td>${fmt(p.amount)}</td>
                                <td>{p.paymentMethod}</td>
                                <td>{p.note || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </FormDialog>
        </div>
    );
};

export default Suppliers;
