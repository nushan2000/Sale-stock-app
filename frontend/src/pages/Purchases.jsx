import React, { useState, useEffect, useCallback } from 'react';
import API, { fmt, today } from '../api';
import DataTable from '../components/DataTable';
import FormDialog from '../components/FormDialog';

const EMPTY_ITEM = { productId: '', quantity: 1, unitCost: '' };

const Purchases = () => {
    const [rows, setRows] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(0);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [dialog, setDialog] = useState(false);
    const [error, setError] = useState('');
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);

    const [form, setForm] = useState({
        supplierId: '', purchaseDate: today(), paymentStatus: 'UNPAID',
        paymentMethod: 'CASH', notes: '', items: [{ ...EMPTY_ITEM }]
    });

    const load = useCallback(() => {
        setLoading(true);
        API.get('/purchases', { params: { search, from, to, page, size: 10 } })
            .then(r => { setRows(r.data.content); setTotalPages(r.data.totalPages); })
            .catch(() => setError('Failed to load purchases'))
            .finally(() => setLoading(false));
    }, [search, from, to, page]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        API.get('/suppliers/all').then(r => setSuppliers(r.data)).catch(() => {});
        API.get('/products').then(r => setProducts(r.data)).catch(() => {});
    }, []);

    const updateItem = (idx, field, value) => {
        const items = [...form.items];
        items[idx] = { ...items[idx], [field]: value };
        if (field === 'productId') {
            const prod = products.find(p => p.id == value);
            if (prod) items[idx].unitCost = prod.cost || 0;
        }
        setForm(f => ({ ...f, items }));
    };

    const grandTotal = form.items.reduce((s, i) =>
        s + (parseFloat(i.unitCost || 0) * parseInt(i.quantity || 1)), 0);

    const submit = (e) => {
        e.preventDefault();
        API.post('/purchases', {
            ...form,
            items: form.items.map(i => ({
                productId: parseInt(i.productId), quantity: parseInt(i.quantity), unitCost: parseFloat(i.unitCost)
            }))
        }).then(() => { setDialog(false); load(); })
          .catch(err => setError(err.response?.data?.message || 'Purchase failed'));
    };

    const columns = [
        { key: 'grnNumber', label: 'GRN #' },
        { key: 'supplier', label: 'Supplier', render: r => r.supplier?.name || 'Direct' },
        { key: 'purchaseDate', label: 'Date' },
        { key: 'totalAmount', label: 'Total', render: r => `$${fmt(r.totalAmount)}` },
        { key: 'paymentStatus', label: 'Status' },
        { key: 'paymentMethod', label: 'Method' },
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <h2 className="page-title">📦 Purchases (GRN)</h2>
                <button className="btn-primary" onClick={() => setDialog(true)}>+ New GRN</button>
            </div>
            {error && <div className="alert-error" onClick={() => setError('')}>{error} ✕</div>}
            <DataTable columns={columns} data={rows} total={totalPages} page={page}
                onPageChange={setPage} onSearch={s => { setSearch(s); setPage(0); }}
                searchPlaceholder="Search GRN or supplier…" loading={loading}
                filters={<div className="dt-filter-row">
                    <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(0); }} className="filter-date" />
                    <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(0); }} className="filter-date" />
                </div>}
            />

            <FormDialog open={dialog} onClose={() => setDialog(false)} title="New Purchase (GRN)" size="xl"
                footer={<><button className="btn-secondary" onClick={() => setDialog(false)}>Cancel</button><button className="btn-primary" form="grn-form" type="submit">Save GRN</button></>}>
                <form id="grn-form" onSubmit={submit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Supplier</label>
                            <select value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}>
                                <option value="">No Supplier (Direct)</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Purchase Date *</label>
                            <input type="date" required value={form.purchaseDate} onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label>Payment Status</label>
                            <select value={form.paymentStatus} onChange={e => setForm(f => ({ ...f, paymentStatus: e.target.value }))}>
                                <option value="UNPAID">Unpaid</option>
                                <option value="PAID">Paid</option>
                                <option value="PARTIAL">Partial</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Payment Method</label>
                            <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                                <option value="CASH">Cash</option>
                                <option value="CARD">Card</option>
                                <option value="CREDIT">Credit</option>
                            </select>
                        </div>
                    </div>

                    <div className="section-label">Items</div>
                    <table className="line-items-table">
                        <thead><tr><th>Product</th><th>Qty</th><th>Unit Cost</th><th>Line Total</th><th></th></tr></thead>
                        <tbody>
                            {form.items.map((item, idx) => (
                                <tr key={idx}>
                                    <td>
                                        <select required value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)}>
                                            <option value="">Select Product</option>
                                            {products.map(p => <option key={p.id} value={p.id}>{p.description}</option>)}
                                        </select>
                                    </td>
                                    <td><input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} style={{ width: 60 }} /></td>
                                    <td><input type="number" step="0.01" min="0" value={item.unitCost} onChange={e => updateItem(idx, 'unitCost', e.target.value)} style={{ width: 80 }} /></td>
                                    <td>${fmt(parseFloat(item.unitCost || 0) * parseInt(item.quantity || 1))}</td>
                                    <td><button type="button" className="btn-icon danger" onClick={() =>
                                        setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))}>✕</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button type="button" className="btn-secondary btn-sm mt-2"
                        onClick={() => setForm(f => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }))}>+ Add Item</button>
                    <div className="invoice-totals">
                        <div className="totals-row"><span>Grand Total:</span><strong>${fmt(grandTotal)}</strong></div>
                    </div>
                </form>
            </FormDialog>
        </div>
    );
};

export default Purchases;
