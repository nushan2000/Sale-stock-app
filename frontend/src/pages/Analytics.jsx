import React, { useState, useEffect } from 'react';
import API, { fmt } from '../api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AXIS_COLOR = '#94a3b8';
const GRID_COLOR = 'rgba(255,255,255,0.05)';

const shortDate = (iso) => {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const TREND_META = {
    up: { arrow: '▲', color: '#22c55e', label: 'Trending up' },
    down: { arrow: '▼', color: '#ef4444', label: 'Trending down' },
    flat: { arrow: '▬', color: '#94a3b8', label: 'Roughly flat' },
};

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

    const trendData = (data?.dailyTrend || []).map(p => ({ ...p, label: shortDate(p.date) }));
    const topProducts = data?.topProducts || [];
    const maxRevenue = Math.max(1, ...topProducts.map(p => Number(p.revenue) || 0));
    const forecast = data?.forecast;
    const trendMeta = TREND_META[forecast?.trend] || TREND_META.flat;

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
                                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                                <XAxis dataKey="name" tick={{ fill: AXIS_COLOR, fontSize: 13 }} />
                                <YAxis tick={{ fill: AXIS_COLOR, fontSize: 12 }} />
                                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
                                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="dashboard-panels">
                        {/* Revenue trend across the selected range */}
                        <div className="chart-wrap panel-span-2">
                            <h3 className="chart-title">Revenue Trend</h3>
                            {trendData.length === 0 || trendData.every(p => Number(p.value) === 0) ? (
                                <div className="dt-empty">No sales recorded in this period yet.</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={240}>
                                    <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                                        <XAxis dataKey="label" tick={{ fill: AXIS_COLOR, fontSize: 12 }} axisLine={{ stroke: '#334155' }} tickLine={false} />
                                        <YAxis tick={{ fill: AXIS_COLOR, fontSize: 12 }} axisLine={false} tickLine={false} width={50} />
                                        <Tooltip
                                            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }}
                                            labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                                            formatter={(value) => [`$${fmt(value)}`, 'Revenue']}
                                        />
                                        <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Forecast */}
                        <div className="chart-wrap">
                            <h3 className="chart-title">📡 Next 7 Days (Projected)</h3>
                            {forecast ? (
                                <div className="forecast-card">
                                    <div className="forecast-value">${fmt(forecast.projectedNext7Days)}</div>
                                    <div className="forecast-trend" style={{ color: trendMeta.color }}>
                                        <span>{trendMeta.arrow}</span>
                                        <span>{trendMeta.label}</span>
                                        <span className="forecast-change">
                                            {forecast.changePercent > 0 ? '+' : ''}{fmt(forecast.changePercent)}%
                                        </span>
                                    </div>
                                    <p className="forecast-note">
                                        A simple trend projection off the daily revenue in this date range —
                                        not a guarantee, just "if this pace continues".
                                    </p>
                                </div>
                            ) : (
                                <div className="dt-empty">Not enough data for a projection yet.</div>
                            )}
                        </div>

                        {/* Top products */}
                        <div className="chart-wrap panel-span-2">
                            <h3 className="chart-title">Top Products by Revenue</h3>
                            {topProducts.length === 0 ? (
                                <div className="dt-empty">No sales recorded in this period yet.</div>
                            ) : (
                                <ul className="rank-list">
                                    {topProducts.map((p, i) => (
                                        <li className="rank-row" key={p.productId}>
                                            <span className="rank-badge">{i + 1}</span>
                                            <div className="rank-info">
                                                <div className="rank-name">{p.description || 'Unnamed product'}</div>
                                                <div className="rank-bar-track">
                                                    <div className="rank-bar-fill" style={{ width: `${(Number(p.revenue) / maxRevenue) * 100}%` }} />
                                                </div>
                                            </div>
                                            <div className="rank-stats">
                                                <div className="rank-revenue">${fmt(p.revenue)}</div>
                                                <div className="rank-qty">{p.quantitySold} sold</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Analytics;
