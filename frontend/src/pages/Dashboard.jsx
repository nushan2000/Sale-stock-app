import React, { useState, useEffect } from 'react';
import API, { fmt } from '../api';

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

    return (
        <div className="page-container">
            <h2 className="page-title">📊 Dashboard</h2>
            {loading ? (
                <div className="dt-loading"><div className="spinner"></div><span>Loading…</span></div>
            ) : !data ? (
                <div className="alert-error">Could not load dashboard. Is the backend running?</div>
            ) : (
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
            )}
        </div>
    );
};

export default Dashboard;
