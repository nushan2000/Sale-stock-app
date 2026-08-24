import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Invoices from './pages/Invoices';
import Refunds from './pages/Refunds';
import Debts from './pages/Debts';
import Purchases from './pages/Purchases';
import Expenses from './pages/Expenses';
import CashFlow from './pages/CashFlow';
import Analytics from './pages/Analytics';
import ShiftPage from './pages/ShiftPage';
import Users from './pages/Users';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import LoginPage from './pages/LoginPage';
import ChangePasswordModal from './components/ChangePasswordModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';
import API from './api';
import { Container, Row, Col } from 'react-bootstrap';

// Wrap legacy Sales page
const SalesPage = () => {
    const { token } = useAuth();
    const [products, setProducts] = React.useState([]);
    const [cart, setCart] = React.useState([]);

    const [search, setSearch] = useState("");
const [manufacture, setManufacture] = useState("");
const [page, setPage] = useState(0);
const [totalPages, setTotalPages] = useState(1);

// Changing the search/manufacturer filter jumps back to page 0 — otherwise staying on
// e.g. page 3 while the filtered result set only has 1 page silently returns nothing.
useEffect(() => { setPage(0); }, [search, manufacture]);

useEffect(() => {
    if (!token) return;

    API.get('/products', {
        params: {
            keyword: search,
            manufactur: manufacture,
            page: page,
            size: 20
        }
    })
    .then(r => { setProducts(r.data.content); setTotalPages(r.data.totalPages); })
    .catch(err => console.error(err));

}, [token, search, manufacture, page]);

    const addToCart = (product) => {
        setCart(prev => {
            const ex = prev.find(i => i.product.id === product.id);
            if (ex) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            return [...prev, { product, quantity: 1, unitPrice: product.retail || 0 }];
        });
    };

    const removeFromCart = (pid) => setCart(c => c.filter(i => i.product.id !== pid));
    const updateUnitPrice = (pid, p) => setCart(c => c.map(i => i.product.id === pid ? { ...i, unitPrice: p } : i));

    const checkout = () => {
        API.post('/sales', { items: cart })
            .then(() => {
                setCart([]);
                alert("Sale successful!");
                API.get('/products').then(r => setProducts(r.data.content));
            })
            .catch(err => alert(err.response?.data?.message || err.response?.data || 'Sale failed'));
    };
    
    return (
        <Container fluid style={{ paddingLeft: '2%', paddingRight: '2%' }}>
            <Row>
                <Col md={8}><h5 className="my-2 fw-semibold text-muted">Inventory & Quick Sale</h5><ProductList
    products={products}
    addToCart={addToCart}
    search={search}
    setSearch={setSearch}
    manufacture={manufacture}
    setManufacture={setManufacture}
/>
<div className="dt-pagination">
    <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹ Prev</button>
    <span className="page-info">Page {page + 1} of {Math.max(totalPages, 1)}</span>
    <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next ›</button>
</div>
</Col>
                <Col md={4}><h5 className="my-2 fw-semibold text-muted">Cart</h5><Cart cart={cart} removeFromCart={removeFromCart} checkout={checkout} updateUnitPrice={updateUnitPrice} /></Col>
            </Row>
        </Container>
    );
};

const NAV_ITEMS = [
    { to: '/', label: '📊 Dashboard', end: true },
    { to: '/sales', label: '🛒 Inventory & Sales' },
    { to: '/invoices', label: '🧾 Invoices' },
    { to: '/refunds', label: '↩️ Refunds' },
    { to: '/debts', label: '💳 Debts' },
    { to: '/purchases', label: '📦 Purchases' },
    { to: '/expenses', label: '💸 Expenses' },
    { to: '/cashflow', label: '💹 Cash Flow' },
    { to: '/analytics', label: '📈 Analytics' },
    { to: '/shift', label: '🕒 Shift & Till' },
    { to: '/customers', label: '👤 Customers' },
    { to: '/suppliers', label: '🏭 Suppliers' },
];

const ADMIN_NAV_ITEMS = [
    { to: '/users', label: '🧑‍💼 Users' },
];

/* ─── Main app shell (requires auth) ───────────────────────── */
const AppShell = () => {
    const { user, logout, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showChangePw, setShowChangePw] = useState(false);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
                <div className="dt-loading">
                    <div className="spinner" />
                    <span>Loading…</span>
                </div>
            </div>
        );
    }

     if (!user) return <LoginPage />;

    return (
        <HashRouter>
            <div className="app-layout">
                {/* Sidebar */}
                <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
                    <div className="sidebar-brand">
                        <span className="brand-icon">📦</span>
                        {sidebarOpen && <span className="brand-text">ShopPro</span>}
                    </div>
                    <nav className="sidebar-nav">
                        {[...NAV_ITEMS, ...(user?.role === 'ADMIN' ? ADMIN_NAV_ITEMS : [])].map(item => (
                            <NavLink key={item.to} to={item.to} end={item.end}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <span className="nav-icon">{item.label.split(' ')[0]}</span>
                                {sidebarOpen && <span className="nav-label">{item.label.substring(item.label.indexOf(' ') + 1)}</span>}
                            </NavLink>
                        ))}
                    </nav>

                    {/* User info & actions at bottom of sidebar */}
                    <div className={`sidebar-user ${sidebarOpen ? '' : 'collapsed'}`}>
                        {sidebarOpen ? (
                            <>
                                <div className="sidebar-user-info">
                                    <span className="sidebar-user-avatar">👤</span>
                                    <div>
                                        <div className="sidebar-user-name">{user?.username || "User"}</div>
                                        <div className="sidebar-user-email">{user?.email || "user@example.com"}</div>
                                    </div>
                                </div>
                                <div className="sidebar-user-actions">
                                    <button
                                        className="sidebar-action-btn"
                                        id="change-password-btn"
                                        onClick={() => setShowChangePw(true)}
                                        title="Change password"
                                    >🔐 Change Password</button>
                                    <button
                                        className="sidebar-action-btn danger"
                                        id="logout-btn"
                                        onClick={logout}
                                        title="Sign out"
                                    >🚪 Sign Out</button>
                                </div>
                            </>
                        ) : (
                            <div className="sidebar-user-mini">
                                <button className="btn-icon" title="Change password" onClick={() => setShowChangePw(true)}>🔐</button>
                                <button className="btn-icon danger" title="Sign out" onClick={logout}>🚪</button>
                            </div>
                        )}
                    </div>

                    <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)}>
                        {sidebarOpen ? '◀' : '▶'}
                    </button>
                </aside>

                {/* Main content */}
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/sales" element={<SalesPage />} />
                        <Route path="/invoices" element={<Invoices />} />
                        <Route path="/refunds" element={<Refunds />} />
                        <Route path="/debts" element={<Debts />} />
                        <Route path="/purchases" element={<Purchases />} />
                        <Route path="/expenses" element={<Expenses />} />
                        <Route path="/cashflow" element={<CashFlow />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/shift" element={<ShiftPage />} />
                        <Route path="/customers" element={<Customers />} />
                        <Route path="/suppliers" element={<Suppliers />} />
                        {user?.role === 'ADMIN' && <Route path="/users" element={<Users />} />}
                    </Routes>
                </main>
            </div>

            {/* Change Password Modal */}
            {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
        </HashRouter>
    );
};

const App = () => (
    <AuthProvider>
        <AppShell />
    </AuthProvider>
);

export default App;
