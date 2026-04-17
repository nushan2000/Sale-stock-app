import React, { useState, useEffect, useCallback } from 'react';
import API, { fmt, today } from '../api';
import DataTable from '../components/DataTable';
import FormDialog from '../components/FormDialog';

const EMPTY_ITEM = { productId: '', quantity: 1, unitPrice: '' };

const Refunds = () => {
    const [rows, setRows] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(0);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [loading, setLoading] = useState(false);
    const [dialog, setDialog] = useState(false);
    const [error, setError] = useState('');
    const [invoices, setInvoices] = useState([]);
    const [products, setProducts] = useState([]);

    const [form, setForm] = useState({
        invoiceId: '', refundDate: today(), reason: '', refundMethod: 'CASH',
        returnedItems: [{ ...EMPTY_ITEM }]
    });

    const load = useCallback(() => {
        setLoading(true);
        API.get('/refunds', { params: { from, to, page, size: 10 } })
            .then(r => { setRows(r.data.content); setTotalPages(r.data.totalPages); })
            .catch(() => setError('Failed to load refunds'))
            .finally(() => setLoading(false));
    }, [from, to, page]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        API.get('/invoices', { params: { size: 100 } }).then(r => setInvoices(r.data.content)).catch(() => {});
        API.get('/products').then(r => setProducts(r.data)).catch(() => {});
    }, []);

    const updateItem = (idx, field, value) => {
        const items = [...form.returnedItems];
        items[idx] = { ...items[idx], [field]: value };
        if (field === 'productId') {
            const prod = products.find(p => p.id == value);
            if (prod) items[idx].unitPrice = prod.retail || 0;
        }
        setForm(f => ({ ...f, returnedItems: items }));
    };

    const addItem = () => setForm(f => ({ ...f, returnedItems: [...f.returnedItems, { ...EMPTY_ITEM }] }));
    const removeItem = (idx) => setForm(f => ({ ...f, returnedItems: f.returnedItems.filter((_, i) => i !== idx) }));

    const submit = (e) => {
        e.preventDefault();
        const payload = {
            ...form,
            returnedItems: form.returnedItems.map(i => ({
                productId: parseInt(i.productId),
                quantity: parseInt(i.quantity),
                unitPrice: parseFloat(i.unitPrice),
            }))
        };
        API.post('/refunds', payload)
            .then(() => { setDialog(false); load(); })
            .catch(err => setError(err.response?.data?.message || 'Refund failed'));
    };

    const columns = [
        { key: 'id', label: '#' },
        { key: 'invoice', label: 'Invoice', render: r => r.invoice?.invoiceNumber || '—' },
        { key: 'refundDate', label: 'Date' },
        { key: 'refundAmount', label: 'Amount', render: r => `$${fmt(r.refundAmount)}` },
        { key: 'reason', label: 'Reason' },
        { key: 'refundMethod', label: 'Method' },
    ];

    const filters = (
        <div className="dt-filter-row">
            <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(0); }} className="filter-date" />
            <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(0); }} className="filter-date" />
        </div>
    );

    return (
        <div className="page-container">
            <div className="page-header">
                <h2 className="page-title">↩️ Refunds</h2>
                <button className="btn-primary" onClick={() => setDialog(true)}>+ New Refund</button>
            </div>
            {error && <div className="alert-error" onClick={() => setError('')}>{error} ✕</div>}
            <DataTable columns={columns} data={rows} total={totalPages} page={page}
                onPageChange={setPage} loading={loading} filters={filters} />

            <FormDialog open={dialog} onClose={() => setDialog(false)} title="New Refund" size="xl"
                footer={<><button className="btn-secondary" onClick={() => setDialog(false)}>Cancel</button><button className="btn-primary" form="ref-form" type="submit">Submit Refund</button></>}>
                <form id="ref-form" onSubmit={submit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Invoice *</label>
                            <select required value={form.invoiceId} onChange={e => setForm(f => ({ ...f, invoiceId: e.target.value }))}>
                                <option value="">Select Invoice</option>
                                {invoices.map(i => <option key={i.id} value={i.id}>{i.invoiceNumber} — {i.customer?.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Refund Date *</label>
                            <input type="date" required value={form.refundDate} onChange={e => setForm(f => ({ ...f, refundDate: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label>Refund Method</label>
                            <select value={form.refundMethod} onChange={e => setForm(f => ({ ...f, refundMethod: e.target.value }))}>
                                <option value="CASH">Cash</option>
                                <option value="CARD">Card</option>
                                <option value="CREDIT">Credit</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Reason</label>
                            <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
                        </div>
                    </div>

                    <div className="section-label">Returned Items</div>
                    <table className="line-items-table">
                        <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th></th></tr></thead>
                        <tbody>
                            {form.returnedItems.map((item, idx) => (
                                <tr key={idx}>
                                    <td>
                                        <select required value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)}>
                                            <option value="">Select Product</option>
                                            {products.map(p => <option key={p.id} value={p.id}>{p.description}</option>)}
                                        </select>
                                    </td>
                                    <td><input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} style={{ width: 60 }} /></td>
                                    <td><input type="number" step="0.01" min="0" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} style={{ width: 80 }} /></td>
                                    <td><button type="button" className="btn-icon danger" onClick={() => removeItem(idx)}>✕</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button type="button" className="btn-secondary btn-sm mt-2" onClick={addItem}>+ Add Item</button>
                </form>
            </FormDialog>
        </div>
    );
};

export default Refunds;
