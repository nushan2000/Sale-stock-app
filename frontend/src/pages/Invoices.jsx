import React, { useState, useEffect, useCallback } from 'react';
import API, { fmt, today } from '../api';
import DataTable from '../components/DataTable';
import FormDialog from '../components/FormDialog';

const STATUS_COLORS = { PAID: '#22c55e', PARTIAL: '#f59e0b', UNPAID: '#ef4444' };

const EMPTY_ITEM = { productId: '', productName: '', quantity: 1, unitPrice: '', discount: 0, tax: 0, total: 0 };

const Invoices = () => {
    const [rows, setRows] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [loading, setLoading] = useState(false);
    const [dialog, setDialog] = useState(false);
    const [viewDialog, setViewDialog] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [error, setError] = useState('');
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);

    // Form state
    const [form, setForm] = useState({
        customerId: '', invoiceDate: today(), dueDate: '', paymentType: 'CASH',
        paidAmount: 0, notes: '', items: [{ ...EMPTY_ITEM }]
    });

    const load = useCallback(() => {
        setLoading(true);
        API.get('/invoices', { params: { search, status, from, to, page, size: 10 } })
            .then(r => { setRows(r.data.content); setTotalPages(r.data.totalPages); })
            .catch(() => setError('Failed to load invoices'))
            .finally(() => setLoading(false));
    }, [search, status, from, to, page]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        API.get('/customers/all').then(r => setCustomers(r.data)).catch(() => {});
        API.get('/products').then(r => setProducts(r.data)).catch(() => {});
    }, []);

    const openCreate = () => {
        setForm({ customerId: '', invoiceDate: today(), dueDate: '', paymentType: 'CASH', paidAmount: 0, notes: '', items: [{ ...EMPTY_ITEM }] });
        setDialog(true);
    };

    const updateItem = (idx, field, value) => {
        const items = [...form.items];
        items[idx] = { ...items[idx], [field]: value };
        if (field === 'productId') {
            const prod = products.find(p => p.id == value);
            if (prod) {
                items[idx].productName = prod.description;
                items[idx].unitPrice = prod.retail || 0;
            }
        }
        // recalculate total for this item
        const { quantity, unitPrice, discount, tax } = items[idx];
        const disc = parseFloat(discount || 0) / 100;
        const taxRate = parseFloat(tax || 0) / 100;
        items[idx].total = ((parseFloat(unitPrice || 0) * parseInt(quantity || 1)) * (1 - disc) * (1 + taxRate)).toFixed(2);
        setForm(f => ({ ...f, items }));
    };

    const addItem = () => setForm(f => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }));
    const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

    const grandTotal = form.items.reduce((s, i) => s + parseFloat(i.total || 0), 0);
    const balance = (grandTotal - parseFloat(form.paidAmount || 0)).toFixed(2);

    const submit = (e) => {
        e.preventDefault();
        const payload = {
            ...form,
            paidAmount: parseFloat(form.paidAmount || 0),
            items: form.items.map(i => ({
                productId: parseInt(i.productId),
                quantity: parseInt(i.quantity),
                unitPrice: parseFloat(i.unitPrice),
                discount: parseFloat(i.discount || 0),
                tax: parseFloat(i.tax || 0),
            }))
        };
        API.post('/invoices', payload)
            .then(() => { setDialog(false); load(); })
            .catch(err => setError(err.response?.data?.message || 'Failed to create invoice'));
    };

    const del = (id) => {
        if (!confirm('Delete this invoice? Stock will be restored.')) return;
        API.delete(`/invoices/${id}`).then(load).catch(() => setError('Delete failed'));
    };

    const viewInvoice = (id) => {
        API.get(`/invoices/${id}`).then(r => { setSelectedInvoice(r.data); setViewDialog(true); }).catch(() => {});
    };

    const columns = [
        { key: 'invoiceNumber', label: 'Invoice #' },
        { key: 'customer', label: 'Customer', render: r => r.customer?.name || '—' },
        { key: 'invoiceDate', label: 'Date' },
        { key: 'grandTotal', label: 'Total', render: r => `$${fmt(r.grandTotal)}` },
        { key: 'paidAmount', label: 'Paid', render: r => `$${fmt(r.paidAmount)}` },
        { key: 'balance', label: 'Balance', render: r => `$${fmt(r.balance)}` },
        { key: 'status', label: 'Status', render: r => <span className="badge" style={{ background: STATUS_COLORS[r.status] }}>{r.status}</span> },
        { key: 'paymentType', label: 'Payment' },
    ];

    const filters = (
        <div className="dt-filter-row">
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(0); }} className="filter-select">
                <option value="">All Status</option>
                <option value="PAID">Paid</option>
                <option value="PARTIAL">Partial</option>
                <option value="UNPAID">Unpaid</option>
            </select>
            <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(0); }} className="filter-date" placeholder="From" />
            <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(0); }} className="filter-date" placeholder="To" />
        </div>
    );

    return (
        <div className="page-container">
            <div className="page-header">
                <h2 className="page-title">🧾 Invoices</h2>
                <button className="btn-primary" onClick={openCreate}>+ New Invoice</button>
            </div>
            {error && <div className="alert-error" onClick={() => setError('')}>{error} ✕</div>}
            <DataTable columns={columns} data={rows} total={totalPages} page={page}
                onPageChange={setPage} onSearch={s => { setSearch(s); setPage(0); }}
                searchPlaceholder="Search invoice or customer…" loading={loading} filters={filters}
                actions={(row) => (
                    <>
                        <button className="btn-icon" onClick={() => viewInvoice(row.id)}>👁️</button>
                        <button className="btn-icon danger" onClick={() => del(row.id)}>🗑️</button>
                    </>
                )}
            />

            {/* Create Invoice Dialog */}
            <FormDialog open={dialog} onClose={() => setDialog(false)} title="New Invoice" size="xl"
                footer={<><button className="btn-secondary" onClick={() => setDialog(false)}>Cancel</button><button className="btn-primary" form="inv-form" type="submit">Create Invoice</button></>}>
                <form id="inv-form" onSubmit={submit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Customer *</label>
                            <select required value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}>
                                <option value="">Select Customer</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Invoice Date *</label>
                            <input type="date" required value={form.invoiceDate} onChange={e => setForm(f => ({ ...f, invoiceDate: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label>Due Date</label>
                            <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label>Payment Type</label>
                            <select value={form.paymentType} onChange={e => setForm(f => ({ ...f, paymentType: e.target.value }))}>
                                <option value="CASH">Cash</option>
                                <option value="CARD">Card</option>
                                <option value="CREDIT">Credit</option>
                            </select>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="section-label">Items</div>
                    <div className="line-items-wrap">
                        <table className="line-items-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Qty</th>
                                    <th>Unit Price</th>
                                    <th>Disc %</th>
                                    <th>Tax %</th>
                                    <th>Total</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {form.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>
                                            <select value={item.productId} required onChange={e => updateItem(idx, 'productId', e.target.value)}>
                                                <option value="">Select Product</option>
                                                {products.map(p => <option key={p.id} value={p.id}>{p.description} (Stock: {p.amountInStock})</option>)}
                                            </select>
                                        </td>
                                        <td><input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} style={{ width: 60 }} /></td>
                                        <td><input type="number" step="0.01" min="0" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} style={{ width: 80 }} /></td>
                                        <td><input type="number" step="0.01" min="0" max="100" value={item.discount} onChange={e => updateItem(idx, 'discount', e.target.value)} style={{ width: 60 }} /></td>
                                        <td><input type="number" step="0.01" min="0" max="100" value={item.tax} onChange={e => updateItem(idx, 'tax', e.target.value)} style={{ width: 60 }} /></td>
                                        <td className="fw-bold">${fmt(item.total)}</td>
                                        <td><button type="button" className="btn-icon danger" onClick={() => removeItem(idx)}>✕</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button type="button" className="btn-secondary btn-sm mt-2" onClick={addItem}>+ Add Item</button>
                    </div>

                    <div className="invoice-totals">
                        <div className="totals-row">
                            <span>Grand Total:</span>
                            <strong>${fmt(grandTotal)}</strong>
                        </div>
                        <div className="totals-row">
                            <label>Paid Amount:</label>
                            <input type="number" step="0.01" min="0" value={form.paidAmount}
                                onChange={e => setForm(f => ({ ...f, paidAmount: e.target.value }))} style={{ width: 120 }} />
                        </div>
                        <div className="totals-row">
                            <span>Balance:</span>
                            <strong style={{ color: balance > 0 ? '#ef4444' : '#22c55e' }}>${fmt(balance)}</strong>
                        </div>
                        <div className="form-group">
                            <label>Notes</label>
                            <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                        </div>
                    </div>
                </form>
            </FormDialog>

            {/* View Invoice Dialog */}
            {selectedInvoice && (
                <FormDialog open={viewDialog} onClose={() => setViewDialog(false)} title={`Invoice ${selectedInvoice.invoiceNumber}`} size="lg">
                    <div className="invoice-view">
                        <div className="form-grid">
                            <div><strong>Customer:</strong> {selectedInvoice.customer?.name}</div>
                            <div><strong>Date:</strong> {selectedInvoice.invoiceDate}</div>
                            <div><strong>Status:</strong> <span className="badge" style={{ background: STATUS_COLORS[selectedInvoice.status] }}>{selectedInvoice.status}</span></div>
                            <div><strong>Payment:</strong> {selectedInvoice.paymentType}</div>
                        </div>
                        <table className="dt-table mt-2">
                            <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Disc</th><th>Tax</th><th>Total</th></tr></thead>
                            <tbody>
                                {selectedInvoice.items?.map(i => (
                                    <tr key={i.id}>
                                        <td>{i.product?.description}</td>
                                        <td>{i.quantity}</td>
                                        <td>${fmt(i.unitPrice)}</td>
                                        <td>{i.discount}%</td>
                                        <td>{i.tax}%</td>
                                        <td>${fmt(i.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="invoice-totals mt-2">
                            <div className="totals-row"><span>Grand Total:</span><strong>${fmt(selectedInvoice.grandTotal)}</strong></div>
                            <div className="totals-row"><span>Paid:</span><strong>${fmt(selectedInvoice.paidAmount)}</strong></div>
                            <div className="totals-row"><span>Balance:</span><strong style={{ color: selectedInvoice.balance > 0 ? '#ef4444' : '#22c55e' }}>${fmt(selectedInvoice.balance)}</strong></div>
                        </div>
                    </div>
                </FormDialog>
            )}
        </div>
    );
};

export default Invoices;
