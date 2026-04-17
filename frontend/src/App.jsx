import React, { useState } from 'react';
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
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import './App.css';
import axios from 'axios';
import { Container, Row, Col } from 'react-bootstrap';

// Wrap legacy Sales page
const SalesPage = () => {
    const [products, setProducts] = React.useState([]);
    const [cart, setCart] = React.useState([]);
    
    React.useEffect(() => {
        axios.get('http://localhost:8080/api/products')
            .then(r => setProducts(r.data))
            .catch(() => {});
    }, []);
    
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
        axios.post('http://localhost:8080/api/sales', { items: cart })
            .then(() => { 
                setCart([]); 
                alert("Sale successful!");
                axios.get('http://localhost:8080/api/products').then(r => setProducts(r.data)); 
            })
            .catch(err => alert(err.response?.data?.message || err.response?.data || 'Sale failed'));
    };
    
    return (
        <Container fluid style={{ paddingLeft: '2%', paddingRight: '2%' }}>
            <Row>
                <Col md={8}><h5 className="my-2 fw-semibold text-muted">Inventory & Quick Sale</h5><ProductList products={products} addToCart={addToCart} /></Col>
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
    { to: '/customers', label: '👤 Customers' },
    { to: '/suppliers', label: '🏭 Suppliers' },
];

const App = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);

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
                        {NAV_ITEMS.map(item => (
                            <NavLink key={item.to} to={item.to} end={item.end}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <span className="nav-icon">{item.label.split(' ')[0]}</span>
                                {sidebarOpen && <span className="nav-label">{item.label.substring(item.label.indexOf(' ') + 1)}</span>}
                            </NavLink>
                        ))}
                    </nav>
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
                        <Route path="/customers" element={<Customers />} />
                        <Route path="/suppliers" element={<Suppliers />} />
                    </Routes>
                </main>
            </div>
        </HashRouter>
    );
};

export default App;
