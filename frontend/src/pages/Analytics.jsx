import React, { useState, useEffect } from 'react';
import API, { fmt } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Analytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [from, setFrom] = useState(new Date().toISOString().slice(0, 7) + '-01');
    const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

    const load = () => {
        setLoading(true);
        API.get('/reports/analytics', { params: { from, to } })
            .then(r => setData(r.data))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const chartData = data ? [
        { name: 'Revenue', value: parseFloat(data.salesRevenue || 0) },
        { name: 'Refunds', value: parseFloat(data.totalRefunds || 0) },
        { name: 'Expenses', value: parseFloat(data.totalExpenses || 0) },
        { name: 'Gross Profit', value: parseFloat(data.grossProfit || 0) },
        { name: 'Net Profit', value: parseFloat(data.netProfit || 0) },
    ] : [];

    const kpis = data ? [
        { label: 'Sales Revenue', value: `$${fmt(data.salesRevenue)}`, color: '#22c55e' },
        { label: 'Total Refunds', value: `$${fmt(data.totalRefunds)}`, color: '#f97316' },
        { label: 'Gross Profit', value: `$${fmt(data.grossProfit)}`, color: '#3b82f6' },
        { label: 'Total Expenses', value: `$${fmt(data.totalExpenses)}`, color: '#ef4444' },
        { label: 'Net Profit', value: `$${fmt(data.netProfit)}`, color: data?.netProfit >= 0 ? '#22c55e' : '#ef4444' },
        { label: 'Invoices', value: data.invoiceCount, color: '#8b5cf6' },
        { label: 'Refund Count', value: data.refundCount, color: '#f59e0b' },
    ] : [];

    return (
        <div className="page-container">
            <div className="page-header">
                <h2 className="page-title">📈 Sales & Profit Analytics</h2>
            </div>
            <div className="dt-filter-row" style={{ marginBottom: 20 }}>
                <label>From: </label>
                <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="filter-date" />
                <label>To: </label>
                <input type="date" value={to} onChange={e => setTo(e.target.value)} className="filter-date" />
                <button className="btn-primary" onClick={load}>Apply</button>
            </div>

            {loading && <div className="dt-loading"><div className="spinner"></div><span>Loading…</span></div>}

            {data && !loading && (
                <>
                    <div className="dashboard-grid">
                        {kpis.map(k => (
                            <div className="dash-card" key={k.label} style={{ '--card-color': k.color }}>
                                <div className="dash-card-body">
                                    <div className="dash-card-value">{k.value}</div>
                                    <div className="dash-card-label">{k.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="chart-wrap">
                        <h3 className="chart-title">Financial Overview</h3>
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 13 }} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }} />
                                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}
        </div>
    );
};

export default Analytics;
