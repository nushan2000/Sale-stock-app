import React, { useState, useEffect } from 'react';
import API, { fmt } from '../api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Same mapping Invoices.jsx uses for status badges — kept in sync manually since the
// two pages don't share a components module for this.
const STATUS_COLORS = { PAID: '#22c55e', PARTIAL: '#f59e0b', UNPAID: '#ef4444' };

const AXIS_COLOR = '#94a3b8';
const GRID_COLOR = 'rgba(255,255,255,0.05)';

const shortDate = (iso) => {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get('/reports/dashboard')
            .then(r => setData(r.data))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    const cards = data ? [
        { label: "Today's Sales", value: `$${fmt(data.todaySales)}`, icon: '💰', color: '#22c55e' },
        { label: "Today's Expenses", value: `$${fmt(data.todayExpenses)}`, icon: '💸', color: '#f59e0b' },
        { label: 'Total Receivable', value: `$${fmt(data.totalReceivable)}`, icon: '📥', color: '#3b82f6' },
        { label: 'Total Payable', value: `$${fmt(data.totalPayable)}`, icon: '📤', color: '#ef4444' },
        { label: 'Customers', value: data.totalCustomers, icon: '👤', color: '#8b5cf6' },
        { label: 'Suppliers', value: data.totalSuppliers, icon: '🏭', color: '#6366f1' },
        { label: 'Products', value: data.totalProducts, icon: '📦', color: '#14b8a6' },
        { label: 'Low Stock Items', value: data.lowStockCount, icon: '⚠️', color: '#f97316' },
        { label: 'Pending Invoices', value: data.pendingInvoices, icon: '🧾', color: '#ec4899' },
    ] : [];

    const trendData = (data?.salesTrend || []).map(p => ({ ...p, label: shortDate(p.date) }));
    const topProducts = data?.topProducts || [];
    const maxRevenue = Math.max(1, ...topProducts.map(p => Number(p.revenue) || 0));
    const lowStockItems = data?.lowStockItems || [];
    const recentSales = data?.recentSales || [];

    return (
        <div className="page-container">
            <h2 className="page-title">📊 Dashboard</h2>
            {loading ? (
                <div className="dt-loading"><div className="spinner"></div><span>Loading…</span></div>
            ) : !data ? (
                <div className="alert-error">Could not load dashboard. Is the backend running?</div>
            ) : (
                <>
                    <div className="dashboard-grid">
                        {cards.map((card) => (
                            <div className="dash-card" key={card.label} style={{ '--card-color': card.color }}>
                                <div className="dash-card-icon">{card.icon}</div>
                                <div className="dash-card-body">
                                    <div className="dash-card-value">{card.value}</div>
                                    <div className="dash-card-label">{card.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="dashboard-panels">
                        {/* Sales trend */}
                        <div className="chart-wrap panel-span-2">
                            <h3 className="chart-title">Sales Trend — Last 14 Days</h3>
                            {trendData.length === 0 || trendData.every(p => Number(p.value) === 0) ? (
                                <div className="dt-empty">No sales recorded in this period yet.</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="salesTrendFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                                                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                                        <XAxis dataKey="label" tick={{ fill: AXIS_COLOR, fontSize: 12 }} axisLine={{ stroke: '#334155' }} tickLine={false} />
                                        <YAxis tick={{ fill: AXIS_COLOR, fontSize: 12 }} axisLine={false} tickLine={false} width={50} />
                                        <Tooltip
                                            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }}
                                            labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                                            formatter={(value) => [`$${fmt(value)}`, 'Sales']}
                                        />
                                        <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fill="url(#salesTrendFill)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Top products */}
                        <div className="chart-wrap">
                            <h3 className="chart-title">Top Products — Last 30 Days</h3>
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

                        {/* Low stock */}
                        <div className="chart-wrap">
                            <h3 className="chart-title">⚠️ Low Stock Alert</h3>
                            {lowStockItems.length === 0 ? (
                                <div className="dt-empty">All products are above their minimum stock level.</div>
                            ) : (
                                <ul className="rank-list">
                                    {lowStockItems.map(p => {
                                        const critical = (p.amountInStock ?? 0) <= 0;
                                        return (
                                            <li className="rank-row" key={p.productId}>
                                                <span className={`stock-dot ${critical ? 'stock-critical' : 'stock-warning'}`} />
                                                <div className="rank-info">
                                                    <div className="rank-name">{p.description || 'Unnamed product'}</div>
                                                </div>
                                                <div className="rank-stats">
                                                    <div className={critical ? 'stock-value-critical' : 'stock-value-warning'}>
                                                        {p.amountInStock ?? 0} in stock
                                                    </div>
                                                    <div className="rank-qty">min {p.minAmount}</div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        {/* Recent sales */}
                        <div className="chart-wrap panel-span-2">
                            <h3 className="chart-title">🧾 Recent Sales</h3>
                            {recentSales.length === 0 ? (
                                <div className="dt-empty">No sales yet.</div>
                            ) : (
                                <div className="dt-table-wrap">
                                    <table className="dt-table">
                                        <thead>
                                            <tr>
                                                <th>Invoice</th>
                                                <th>Customer</th>
                                                <th>Date</th>
                                                <th>Status</th>
                                                <th style={{ textAlign: 'right' }}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentSales.map(s => (
                                                <tr key={s.invoiceNumber}>
                                                    <td>{s.invoiceNumber}</td>
                                                    <td>{s.customerName || '—'}</td>
                                                    <td>{s.invoiceDate}</td>
                                                    <td><span className="badge" style={{ background: STATUS_COLORS[s.status] }}>{s.status}</span></td>
                                                    <td style={{ textAlign: 'right' }}>${fmt(s.grandTotal)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;
