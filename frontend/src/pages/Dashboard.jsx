import React, { useState, useEffect } from 'react';
import API, { fmt } from '../api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Same mapping Invoices.jsx uses for status badges
const STATUS_COLORS = { PAID: '#22c55e', PARTIAL: '#f59e0b', UNPAID: '#ef4444' };

const AXIS_COLOR = '#cbd5e1';
const GRID_COLOR = 'rgba(255,255,255,0.08)';

const shortDate = (iso) => {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const MONTH_NAMES = [
    { value: 1, label: 'January', short: 'Jan' },
    { value: 2, label: 'February', short: 'Feb' },
    { value: 3, label: 'March', short: 'Mar' },
    { value: 4, label: 'April', short: 'Apr' },
    { value: 5, label: 'May', short: 'May' },
    { value: 6, label: 'June', short: 'Jun' },
    { value: 7, label: 'July', short: 'Jul' },
    { value: 8, label: 'August', short: 'Aug' },
    { value: 9, label: 'September', short: 'Sep' },
    { value: 10, label: 'October', short: 'Oct' },
    { value: 11, label: 'November', short: 'Nov' },
    { value: 12, label: 'December', short: 'Dec' },
];

const now = new Date();
const CURRENT_YEAR = now.getFullYear();
const CURRENT_MONTH = now.getMonth() + 1;
const AVAILABLE_YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Top Products & Analysis states
    const [periodType, setPeriodType] = useState('year'); // 'year' | 'month' | '30days'
    const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
    const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
    const [viewMode, setViewMode] = useState('ranking'); // 'ranking' | 'monthlyAnalysis'

    const [topProductsPage, setTopProductsPage] = useState({ content: [], totalPages: 1, totalElements: 0 });
    const [topProductsLoading, setTopProductsLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(5);

    const [monthlyAnalysis, setMonthlyAnalysis] = useState([]);
    const [monthlyLoading, setMonthlyLoading] = useState(false);

    // Initial Dashboard Stats
    useEffect(() => {
        API.get('/reports/dashboard')
            .then(r => setData(r.data))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    // Reset pagination on filter changes
    useEffect(() => {
        setPage(0);
    }, [periodType, selectedYear, selectedMonth, pageSize]);

    // Fetch paginated top products
    useEffect(() => {
        if (viewMode !== 'ranking') return;

        setTopProductsLoading(true);
        const params = {
            page,
            size: pageSize,
        };
        if (periodType === 'month') {
            params.year = selectedYear;
            params.month = selectedMonth;
        } else if (periodType === 'year') {
            params.year = selectedYear;
        }

        API.get('/reports/top-products', { params })
            .then(r => setTopProductsPage(r.data))
            .catch(() => setTopProductsPage({ content: [], totalPages: 1, totalElements: 0 }))
            .finally(() => setTopProductsLoading(false));
    }, [viewMode, periodType, selectedYear, selectedMonth, page, pageSize]);

    // Fetch monthly breakdown analysis
    useEffect(() => {
        if (viewMode !== 'monthlyAnalysis') return;

        setMonthlyLoading(true);
        API.get('/reports/monthly-analysis', { params: { year: selectedYear } })
            .then(r => setMonthlyAnalysis(r.data || []))
            .catch(() => setMonthlyAnalysis([]))
            .finally(() => setMonthlyLoading(false));
    }, [viewMode, selectedYear]);

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
    const lowStockItems = data?.lowStockItems || [];
    const recentSales = data?.recentSales || [];

    const topProductList = topProductsPage.content || [];
    const maxRevenue = Math.max(1, ...topProductList.map(p => Number(p.revenue) || 0));

    const handlePrevMonth = () => {
        if (selectedMonth === 1) {
            setSelectedMonth(12);
            setSelectedYear(y => y - 1);
        } else {
            setSelectedMonth(m => m - 1);
        }
    };

    const handleNextMonth = () => {
        if (selectedMonth === 12) {
            setSelectedMonth(1);
            setSelectedYear(y => y + 1);
        } else {
            setSelectedMonth(m => m + 1);
        }
    };

    const handleDrilldownMonth = (m) => {
        setSelectedMonth(m);
        setPeriodType('month');
        setViewMode('ranking');
    };

    const periodHeading = periodType === '30days'
        ? 'Last 30 Days'
        : periodType === 'month'
            ? `${MONTH_NAMES.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
            : `Entire Year ${selectedYear}`;

    return (
        <div className="page-container">
            <h2 className="page-title">📊 Dashboard</h2>
            {loading ? (
                <div className="dt-loading"><div className="spinner"></div><span>Loading dashboard…</span></div>
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

                        {/* Top Products & Monthly Analysis (Full Span) */}
                        <div className="chart-wrap panel-span-2">
                            <div className="chart-title">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span>🏆 Top Products & Sales Analysis</span>
                                    <span style={{ fontSize: 13, color: '#38bdf8', fontWeight: 500 }}>
                                        ({viewMode === 'ranking' ? periodHeading : `Monthly Breakdown ${selectedYear}`})
                                    </span>
                                </div>

                                <div className="card-header-controls">
                                    {/* View Toggle */}
                                    <div className="period-pill-group">
                                        <button
                                            className={`period-pill ${viewMode === 'ranking' ? 'active' : ''}`}
                                            onClick={() => setViewMode('ranking')}
                                        >
                                            Product Rankings
                                        </button>
                                        <button
                                            className={`period-pill ${viewMode === 'monthlyAnalysis' ? 'active' : ''}`}
                                            onClick={() => setViewMode('monthlyAnalysis')}
                                        >
                                            Monthly Breakdown
                                        </button>
                                    </div>

                                    {/* Period Filters for Product Ranking */}
                                    {viewMode === 'ranking' && (
                                        <div className="period-pill-group">
                                            <button
                                                className={`period-pill ${periodType === '30days' ? 'active' : ''}`}
                                                onClick={() => setPeriodType('30days')}
                                            >
                                                Last 30 Days
                                            </button>
                                            <button
                                                className={`period-pill ${periodType === 'month' ? 'active' : ''}`}
                                                onClick={() => setPeriodType('month')}
                                            >
                                                Month by Month
                                            </button>
                                            <button
                                                className={`period-pill ${periodType === 'year' ? 'active' : ''}`}
                                                onClick={() => setPeriodType('year')}
                                            >
                                                Entire Year
                                            </button>
                                        </div>
                                    )}

                                    {/* Subcontrols for Month by Month */}
                                    {viewMode === 'ranking' && periodType === 'month' && (
                                        <div className="period-subcontrols">
                                            <button className="mini-btn" onClick={handlePrevMonth} title="Previous Month">◀</button>
                                            <select
                                                className="filter-select"
                                                value={selectedMonth}
                                                onChange={e => setSelectedMonth(Number(e.target.value))}
                                            >
                                                {MONTH_NAMES.map(m => (
                                                    <option key={m.value} value={m.value}>{m.label}</option>
                                                ))}
                                            </select>
                                            <select
                                                className="filter-select"
                                                value={selectedYear}
                                                onChange={e => setSelectedYear(Number(e.target.value))}
                                            >
                                                {AVAILABLE_YEARS.map(y => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                            <button className="mini-btn" onClick={handleNextMonth} title="Next Month">▶</button>
                                        </div>
                                    )}

                                    {/* Subcontrols for Entire Year & Monthly Breakdown */}
                                    {(viewMode === 'monthlyAnalysis' || (viewMode === 'ranking' && periodType === 'year')) && (
                                        <div className="period-subcontrols">
                                            <label style={{ fontSize: 12, color: '#cbd5e1' }}>Year:</label>
                                            <select
                                                className="filter-select"
                                                value={selectedYear}
                                                onChange={e => setSelectedYear(Number(e.target.value))}
                                            >
                                                {AVAILABLE_YEARS.map(y => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* View 1: Top Products Rankings with Pagination */}
                            {viewMode === 'ranking' && (
                                <>
                                    {topProductsLoading ? (
                                        <div className="dt-loading" style={{ padding: '32px 0' }}>
                                            <div className="spinner"></div><span>Loading products…</span>
                                        </div>
                                    ) : topProductList.length === 0 ? (
                                        <div className="dt-empty" style={{ padding: '24px 0', textAlign: 'center' }}>
                                            <div style={{ color: '#94a3b8', marginBottom: 10, fontSize: 13 }}>No products sold in this period.</div>
                                            {periodType !== 'year' && (
                                                <button
                                                    type="button"
                                                    className="period-pill active"
                                                    style={{ cursor: 'pointer', padding: '6px 14px', fontSize: 12, display: 'inline-block' }}
                                                    onClick={() => setPeriodType('year')}
                                                >
                                                    📅 View Entire Year ({selectedYear})
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <ul className="rank-list">
                                                {topProductList.map((p, i) => {
                                                    const rankNum = page * pageSize + i + 1;
                                                    const badgeClass = rankNum === 1 ? 'rank-1' : rankNum === 2 ? 'rank-2' : rankNum === 3 ? 'rank-3' : '';
                                                    return (
                                                        <li className="rank-row" key={p.productId || `${p.description}-${i}`}>
                                                            <span className={`rank-badge ${badgeClass}`}>#{rankNum}</span>
                                                            <div className="rank-info">
                                                                <div className="rank-name">{p.description || 'Unnamed product'}</div>
                                                                <div className="rank-bar-track">
                                                                    <div
                                                                        className="rank-bar-fill"
                                                                        style={{ width: `${(Number(p.revenue) / maxRevenue) * 100}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="rank-stats">
                                                                <div className="rank-revenue">${fmt(p.revenue)}</div>
                                                                <div className="rank-qty">{p.quantitySold} units sold</div>
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>

                                            {/* Pagination Controls */}
                                            <div className="card-pagination">
                                                <div className="pagination-info">
                                                    {topProductsPage.totalElements > 0 ? (
                                                        <>
                                                            Showing <strong>{page * pageSize + 1}</strong>–<strong>{Math.min((page + 1) * pageSize, topProductsPage.totalElements)}</strong> of <strong>{topProductsPage.totalElements}</strong> products
                                                        </>
                                                    ) : (
                                                        '0 products'
                                                    )}
                                                </div>
                                                <div className="pagination-controls">
                                                    <label style={{ fontSize: 12, color: '#cbd5e1', marginRight: 4 }}>Per page:</label>
                                                    <select
                                                        className="page-size-select"
                                                        value={pageSize}
                                                        onChange={e => setPageSize(Number(e.target.value))}
                                                    >
                                                        <option value={5}>5</option>
                                                        <option value={10}>10</option>
                                                        <option value={20}>20</option>
                                                    </select>
                                                    <button
                                                        className="page-pill-btn"
                                                        disabled={page === 0 || topProductsLoading}
                                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                                    >
                                                        ◀ Prev
                                                    </button>
                                                    <span style={{ fontSize: 12, color: '#f1f5f9', fontWeight: 600, padding: '0 4px' }}>
                                                        Page {page + 1} of {Math.max(1, topProductsPage.totalPages || 1)}
                                                    </span>
                                                    <button
                                                        className="page-pill-btn"
                                                        disabled={page >= (topProductsPage.totalPages || 1) - 1 || topProductsLoading}
                                                        onClick={() => setPage(p => p + 1)}
                                                    >
                                                        Next ▶
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}

                            {/* View 2: Month by Month Analysis Table */}
                            {viewMode === 'monthlyAnalysis' && (
                                <>
                                    {monthlyLoading ? (
                                        <div className="dt-loading" style={{ padding: '32px 0' }}>
                                            <div className="spinner"></div><span>Analyzing monthly performance…</span>
                                        </div>
                                    ) : (
                                        <div className="monthly-table-wrap">
                                            <table className="monthly-table">
                                                <thead>
                                                    <tr>
                                                        <th>Month</th>
                                                        <th style={{ textAlign: 'right' }}>Revenue</th>
                                                        <th style={{ textAlign: 'right' }}>Units Sold</th>
                                                        <th style={{ textAlign: 'right' }}>Invoices</th>
                                                        <th>Top Product of the Month</th>
                                                        <th style={{ textAlign: 'center' }}>Details</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {monthlyAnalysis.map(m => (
                                                        <tr key={m.month} onClick={() => handleDrilldownMonth(m.month)}>
                                                            <td>
                                                                <span className="monthly-badge">{m.monthName}</span>
                                                            </td>
                                                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#38bdf8' }}>
                                                                ${fmt(m.revenue)}
                                                            </td>
                                                            <td style={{ textAlign: 'right', color: '#cbd5e1' }}>
                                                                {m.quantitySold || 0}
                                                            </td>
                                                            <td style={{ textAlign: 'right', color: '#94a3b8' }}>
                                                                {m.invoiceCount || 0}
                                                            </td>
                                                            <td>
                                                                {m.topProductName ? (
                                                                    <div>
                                                                        <span className="monthly-top-prod">{m.topProductName}</span>
                                                                        <span style={{ fontSize: 11.5, color: '#94a3b8', marginLeft: 8 }}>
                                                                            ({m.topProductQuantity} sold · ${fmt(m.topProductRevenue)})
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span style={{ color: '#64748b', fontStyle: 'italic' }}>No sales</span>
                                                                )}
                                                            </td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                <button
                                                                    className="mini-btn"
                                                                    onClick={(e) => { e.stopPropagation(); handleDrilldownMonth(m.month); }}
                                                                    title={`View product rankings for ${m.monthName}`}
                                                                >
                                                                    🔍 Products
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
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
                        <div className="chart-wrap">
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
                                                    <td style={{ fontWeight: 600, color: '#f8fafc' }}>{s.invoiceNumber}</td>
                                                    <td style={{ color: s.customerName ? '#f1f5f9' : '#94a3b8' }}>{s.customerName || 'Walk-in Customer'}</td>
                                                    <td style={{ color: '#cbd5e1' }}>{s.invoiceDate}</td>
                                                    <td><span className="badge" style={{ background: STATUS_COLORS[s.status], color: '#ffffff', fontWeight: 700 }}>{s.status}</span></td>
                                                    <td style={{ textAlign: 'right', color: '#38bdf8', fontWeight: 700 }}>${fmt(s.grandTotal)}</td>
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
