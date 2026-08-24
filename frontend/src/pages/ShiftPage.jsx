import React, { useState, useEffect, useCallback } from 'react';
import API, { fmt, today } from '../api';
import DataTable from '../components/DataTable';
import FormDialog from '../components/FormDialog';

const ShiftPage = () => {
    const [active, setActive] = useState(null); // null = loading, undefined = none open
    const [summary, setSummary] = useState(null);
    const [till, setTill] = useState([]);
    const [error, setError] = useState('');

    const [openingAmount, setOpeningAmount] = useState('');

    const [tillType, setTillType] = useState('CASH_IN');
    const [tillAmount, setTillAmount] = useState('');
    const [tillNote, setTillNote] = useState('');

    const [closeDialog, setCloseDialog] = useState(false);
    const [closingAmount, setClosingAmount] = useState('');
    const [closeNotes, setCloseNotes] = useState('');

    // Shift history
    const [rows, setRows] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(0);
    const [historyLoading, setHistoryLoading] = useState(false);

    const loadActive = useCallback(() => {
        API.get('/shifts/active')
            .then(r => setActive(r.status === 204 ? undefined : r.data))
            .catch(() => setActive(undefined));
    }, []);

    const loadHistory = useCallback(() => {
        setHistoryLoading(true);
        API.get('/shifts', { params: { page, size: 10 } })
            .then(r => { setRows(r.data.content); setTotalPages(r.data.totalPages); })
            .catch(() => {})
            .finally(() => setHistoryLoading(false));
    }, [page]);

    useEffect(() => { loadActive(); }, [loadActive]);
    useEffect(() => { loadHistory(); }, [loadHistory]);

    const loadLive = useCallback((shiftId) => {
        API.get(`/shifts/${shiftId}/summary`).then(r => setSummary(r.data)).catch(() => {});
        API.get(`/shifts/${shiftId}/till`).then(r => setTill(r.data)).catch(() => {});
    }, []);

    useEffect(() => {
        if (active && active.id) {
            loadLive(active.id);
            const interval = setInterval(() => loadLive(active.id), 15000);
            return () => clearInterval(interval);
        }
    }, [active, loadLive]);

    const startShift = (e) => {
        e.preventDefault();
        API.post('/shifts/start', { openingAmount: parseFloat(openingAmount || 0) })
            .then(() => { setOpeningAmount(''); loadActive(); loadHistory(); })
            .catch(err => setError(err.response?.data?.message || 'Failed to start shift'));
    };

    const addTill = (e) => {
        e.preventDefault();
        API.post(`/shifts/${active.id}/till`, { type: tillType, amount: parseFloat(tillAmount || 0), note: tillNote })
            .then(() => { setTillAmount(''); setTillNote(''); loadLive(active.id); })
            .catch(err => setError(err.response?.data?.message || 'Failed to record till transaction'));
    };

    const openClose = () => {
        setClosingAmount(summary ? summary.expectedCash : '');
        setCloseNotes('');
        setCloseDialog(true);
    };

    const confirmClose = (e) => {
        e.preventDefault();
        API.post(`/shifts/${active.id}/close`, {
            closingAmountCounted: parseFloat(closingAmount || 0),
            notes: closeNotes,
        })
            .then(() => { setCloseDialog(false); setActive(undefined); setSummary(null); setTill([]); loadHistory(); })
            .catch(err => setError(err.response?.data?.message || 'Failed to close shift'));
    };

    const historyColumns = [
        { key: 'startTime', label: 'Started', render: r => new Date(r.startTime).toLocaleString() },
        { key: 'endTime', label: 'Ended', render: r => r.endTime ? new Date(r.endTime).toLocaleString() : '—' },
        { key: 'openingAmount', label: 'Opening', render: r => `$${fmt(r.openingAmount)}` },
        { key: 'closingAmountCounted', label: 'Closing (Counted)', render: r => r.closingAmountCounted != null ? `$${fmt(r.closingAmountCounted)}` : '—' },
        {
            key: 'shortageExcess', label: 'Short/Excess', render: r => r.shortageExcess == null ? '—' : (
                <strong style={{ color: r.shortageExcess < 0 ? '#ef4444' : '#22c55e' }}>${fmt(r.shortageExcess)}</strong>
            )
        },
        { key: 'status', label: 'Status', render: r => <span className="badge" style={{ background: r.status === 'OPEN' ? '#22c55e' : '#6b7280' }}>{r.status}</span> },
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <h2 className="page-title">🕒 Shift &amp; Till</h2>
            </div>
            {error && <div className="alert-error" onClick={() => setError('')}>{error} ✕</div>}

            {active === null && <div className="dt-loading"><div className="spinner"></div><span>Loading…</span></div>}

            {active === undefined && (
                <div className="info-box" style={{ maxWidth: 420 }}>
                    <h3 style={{ marginTop: 0 }}>No shift is currently open</h3>
                    <form onSubmit={startShift} className="form-grid">
                        <div className="form-group span-2">
                            <label>Opening Cash Amount *</label>
                            <input type="number" step="0.01" min="0" required
                                value={openingAmount} onChange={e => setOpeningAmount(e.target.value)} />
                        </div>
                        <div className="form-group span-2">
                            <button className="btn-primary" type="submit">▶ Start Shift</button>
                        </div>
                    </form>
                </div>
            )}

            {active && active.id && summary && (
                <>
                    <div className="page-header">
                        <h3 style={{ margin: 0 }}>Shift started {new Date(active.startTime).toLocaleString()}</h3>
                        <button className="btn-primary" onClick={openClose}>⏹ End Shift</button>
                    </div>

                    <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, margin: '12px 0' }}>
                        <div className="info-box"><strong>Opening Cash</strong><div>${fmt(summary.openingAmount)}</div></div>
                        <div className="info-box"><strong>Total Sales</strong><div>${fmt(summary.totalSales)}</div></div>
                        <div className="info-box"><strong>Till Net</strong><div>${fmt(summary.tillNet)}</div></div>
                        <div className="info-box"><strong>Expected Cash</strong><div style={{ color: '#22c55e' }}>${fmt(summary.expectedCash)}</div></div>
                    </div>

                    <div className="section-label">Sales by Payment Type</div>
                    <table className="dt-table mb-3">
                        <thead><tr>{Object.keys(summary.salesByPaymentType).map(k => <th key={k}>{k}</th>)}</tr></thead>
                        <tbody><tr>{Object.values(summary.salesByPaymentType).map((v, i) => <td key={i}>${fmt(v)}</td>)}</tr></tbody>
                    </table>

                    <div className="section-label">Till — Cash In / Out</div>
                    <form onSubmit={addTill} className="form-grid" style={{ marginBottom: 12 }}>
                        <div className="form-group">
                            <label>Type</label>
                            <select value={tillType} onChange={e => setTillType(e.target.value)}>
                                <option value="CASH_IN">Cash In</option>
                                <option value="CASH_OUT">Cash Out</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Amount *</label>
                            <input type="number" step="0.01" min="0.01" required value={tillAmount} onChange={e => setTillAmount(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Note</label>
                            <input value={tillNote} onChange={e => setTillNote(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <button className="btn-secondary" type="submit" style={{ marginTop: 22 }}>+ Add</button>
                        </div>
                    </form>

                    <table className="dt-table mb-3">
                        <thead><tr><th>Time</th><th>Type</th><th>Amount</th><th>Note</th></tr></thead>
                        <tbody>
                            {till.length === 0 ? (
                                <tr><td colSpan={4} className="dt-empty">No till transactions yet</td></tr>
                            ) : till.map(t => (
                                <tr key={t.id}>
                                    <td>{new Date(t.createdAt).toLocaleTimeString()}</td>
                                    <td>{t.type === 'CASH_IN' ? '⬆ Cash In' : '⬇ Cash Out'}</td>
                                    <td>${fmt(t.amount)}</td>
                                    <td>{t.note || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            <div className="section-label" style={{ marginTop: 20 }}>Shift History</div>
            <DataTable columns={historyColumns} data={rows} total={totalPages} page={page}
                onPageChange={setPage} loading={historyLoading} />

            <FormDialog open={closeDialog} onClose={() => setCloseDialog(false)} title="End Shift"
                footer={<><button className="btn-secondary" onClick={() => setCloseDialog(false)}>Cancel</button><button className="btn-primary" form="close-form" type="submit">Confirm &amp; Close</button></>}>
                <form id="close-form" onSubmit={confirmClose} className="form-grid">
                    <div className="form-group span-2">
                        <div className="info-box">
                            <strong>Expected Cash in Drawer:</strong> ${fmt(summary?.expectedCash)}
                        </div>
                    </div>
                    <div className="form-group span-2">
                        <label>Counted Cash *</label>
                        <input type="number" step="0.01" min="0" required
                            value={closingAmount} onChange={e => setClosingAmount(e.target.value)} />
                    </div>
                    <div className="form-group span-2">
                        <label>Notes</label>
                        <textarea rows={2} value={closeNotes} onChange={e => setCloseNotes(e.target.value)} />
                    </div>
                </form>
            </FormDialog>
        </div>
    );
};

export default ShiftPage;
