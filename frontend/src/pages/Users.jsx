import React, { useState, useEffect, useCallback } from 'react';
import API from '../api';
import FormDialog from '../components/FormDialog';

const EMPTY = { username: '', password: '', email: '', role: 'STAFF' };

const Users = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialog, setDialog] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [error, setError] = useState('');

    const load = useCallback(() => {
        setLoading(true);
        API.get('/users')
            .then(r => setRows(r.data))
            .catch(() => setError('Failed to load users'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => { setForm(EMPTY); setError(''); setDialog(true); };

    const submit = (e) => {
        e.preventDefault();
        API.post('/users', form)
            .then(() => { setDialog(false); load(); })
            .catch(err => setError(err.response?.data?.message || 'Failed to create user'));
    };

    const toggleActive = (u) => {
        API.patch(`/users/${u.id}`, { active: !u.active })
            .then(load)
            .catch(err => setError(err.response?.data?.message || 'Update failed'));
    };

    const changeRole = (u, role) => {
        API.patch(`/users/${u.id}`, { role })
            .then(load)
            .catch(err => setError(err.response?.data?.message || 'Update failed'));
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h2 className="page-title">🧑‍💼 Users</h2>
                <button className="btn-primary" onClick={openCreate}>+ New User</button>
            </div>
            {error && <div className="alert-error" onClick={() => setError('')}>{error} ✕</div>}

            <div className="dt-table-wrap">
                {loading ? (
                    <div className="dt-loading"><div className="spinner"></div><span>Loading…</span></div>
                ) : (
                    <table className="dt-table">
                        <thead>
                            <tr><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr><td colSpan={5} className="dt-empty">No users found</td></tr>
                            ) : rows.map(u => (
                                <tr key={u.id}>
                                    <td>{u.username}</td>
                                    <td>{u.email}</td>
                                    <td>
                                        <select value={u.role} onChange={e => changeRole(u, e.target.value)} className="filter-select">
                                            <option value="ADMIN">Admin</option>
                                            <option value="STAFF">Staff</option>
                                        </select>
                                    </td>
                                    <td>
                                        <span className="badge" style={{ background: u.active ? '#22c55e' : '#ef4444' }}>
                                            {u.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="dt-actions">
                                        <button className="btn-sm-primary" onClick={() => toggleActive(u)}>
                                            {u.active ? 'Deactivate' : 'Reactivate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <FormDialog open={dialog} onClose={() => setDialog(false)} title="New User"
                footer={<><button className="btn-secondary" onClick={() => setDialog(false)}>Cancel</button><button className="btn-primary" form="user-form" type="submit">Create</button></>}>
                <form id="user-form" onSubmit={submit} className="form-grid">
                    <div className="form-group">
                        <label>Username *</label>
                        <input required value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label>Email *</label>
                        <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label>Password *</label>
                        <input type="password" required minLength={6} value={form.password}
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Minimum 6 characters" />
                    </div>
                    <div className="form-group">
                        <label>Role</label>
                        <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                            <option value="STAFF">Staff</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                </form>
            </FormDialog>
        </div>
    );
};

export default Users;
