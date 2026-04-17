import React, { useState, useEffect, useCallback } from 'react';
import API, { fmt } from '../api';
import DataTable from '../components/DataTable';
import FormDialog from '../components/FormDialog';

const STATUS_COLORS = { PAID: '#22c55e', PARTIAL: '#f59e0b', UNPAID: '#ef4444' };

const Debts = () => {
    const [rows, setRows] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(0);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [payDialog, setPayDialog] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [payAmount, setPayAmount] = useState('');
    const [error, setError] = useState('');
    const [customers, setCustomers] = useState([]);
    const [customerId, setCustomerId] = useState('');

    const load = useCallback(() => {
        setLoading(true);
        API.get('/debts', { params: { customerId: customerId || undefined, status, page, size: 10 } })
            .then(r => { setRows(r.data.content); setTotalPages(r.data.totalPages); })
            .catch(() => setError('Failed to load debts'))
            .finally(() => setLoading(false));
    }, [customerId, status, page]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        API.get('/customers/all').then(r => setCustomers(r.data)).catch(() => {});
    }, []);

    const openPay = (debt) => {
        setSelectedDebt(debt);
        setPayAmount(debt.remainingAmount);
        setPayDialog(true);
    };

    const submitPayment = (e) => {
        e.preventDefault();
        API.post('/debts/pay', { debtId: selectedDebt.id, amount: parseFloat(payAmount) })
            .then(() => { setPayDialog(false); load(); })
            .catch(err => setError(err.response?.data?.message || 'Payment failed'));
    };

    const columns = [
        { key: 'customer', label: 'Customer', render: r => r.customer?.name || '—' },
        { key: 'invoice', label: 'Invoice', render: r => r.invoice?.invoiceNumber || '—' },
        { key: 'totalDebt', label: 'Total Debt', render: r => `$${fmt(r.totalDebt)}` },
        { key: 'paidAmount', label: 'Paid', render: r => `$${fmt(r.paidAmount)}` },
        { key: 'remainingAmount', label: 'Remaining', render: r => <strong style={{ color: '#ef4444' }}>${fmt(r.remainingAmount)}</strong> },
        { key: 'lastPaymentDate', label: 'Last Payment', render: r => r.lastPaymentDate || '—' },
        { key: 'status', label: 'Status', render: r => <span className="badge" style={{ background: STATUS_COLORS[r.status] }}>{r.status}</span> },
    ];

    const filters = (
        <div className="dt-filter-row">
            <select value={customerId} onChange={e => { setCustomerId(e.target.value); setPage(0); }} className="filter-select">
                <option value="">All Customers</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(0); }} className="filter-select">
                <option value="">All Status</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
            </select>
        </div>
    );

    return (
        <div className="page-container">
            <div className="page-header">
                <h2 className="page-title">💳 Debts / Credit Ledger</h2>
            </div>
            {error && <div className="alert-error" onClick={() => setError('')}>{error} ✕</div>}
            <DataTable columns={columns} data={rows} total={totalPages} page={page}
                onPageChange={setPage} loading={loading} filters={filters}
                actions={(row) => (
                    row.status !== 'PAID' && (
                        <button className="btn-sm-primary" onClick={() => openPay(row)}>Pay Debt</button>
                    )
                )}
            />

            <FormDialog open={payDialog} onClose={() => setPayDialog(false)} title="Pay Debt"
                footer={<><button className="btn-secondary" onClick={() => setPayDialog(false)}>Cancel</button><button className="btn-primary" form="pay-form" type="submit">Confirm Payment</button></>}>
                {selectedDebt && (
                    <form id="pay-form" onSubmit={submitPayment} className="form-grid">
                        <div className="form-group span-2">
                            <div className="info-box">
                                <strong>Customer:</strong> {selectedDebt.customer?.name}<br />
                                <strong>Total Debt:</strong> ${fmt(selectedDebt.totalDebt)}<br />
                                <strong>Remaining:</strong> <span style={{ color: '#ef4444' }}>${fmt(selectedDebt.remainingAmount)}</span>
                            </div>
                        </div>
                        <div className="form-group span-2">
                            <label>Payment Amount *</label>
                            <input type="number" step="0.01" min="0.01" max={selectedDebt.remainingAmount}
                                required value={payAmount} onChange={e => setPayAmount(e.target.value)} />
                        </div>
                    </form>
                )}
            </FormDialog>
        </div>
    );
};

export default Debts;
