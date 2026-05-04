import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const ChangePasswordModal = ({ onClose }) => {
    const { token, logout } = useAuth();
    const [oldPw, setOldPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (newPw !== confirmPw) { setError('New passwords do not match.'); return; }
        if (newPw.length < 6) { setError('New password must be at least 6 characters.'); return; }
        if (oldPw === newPw) { setError('New password must be different from old password.'); return; }
        setLoading(true);
        try {
            await API.post('/auth/change-password',
                { oldPassword: oldPw, newPassword: newPw },
                { headers: { 'X-Auth-Token': token } }
            );
            setSuccess(true);
            setTimeout(() => logout(), 2000); // re-login required
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to change password.');
        } finally { setLoading(false); }
    };

    return (
        <div className="dialog-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="dialog-box dialog-sm">
                <div className="dialog-header">
                    <span className="dialog-title">🔐 Change Password</span>
                    <button className="dialog-close" onClick={onClose}>✕</button>
                </div>
                <div className="dialog-body">
                    {success ? (
                        <div className="cp-success">
                            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>✅</div>
                            <p style={{ textAlign: 'center', color: 'var(--success)' }}>
                                Password changed! Logging you out…
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {error && <div className="auth-error" style={{ marginBottom: 14 }}>{error}</div>}
                            <div className="form-group" style={{ marginBottom: 14 }}>
                                <label>Current Password</label>
                                <div className="pw-wrap">
                                    <input type={showOld ? 'text' : 'password'} value={oldPw}
                                        onChange={e => setOldPw(e.target.value)}
                                        placeholder="Your current password" required />
                                    <button type="button" className="pw-toggle"
                                        onClick={() => setShowOld(p => !p)}>
                                        {showOld ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 14 }}>
                                <label>New Password</label>
                                <div className="pw-wrap">
                                    <input type={showNew ? 'text' : 'password'} value={newPw}
                                        onChange={e => setNewPw(e.target.value)}
                                        placeholder="Minimum 6 characters" required />
                                    <button type="button" className="pw-toggle"
                                        onClick={() => setShowNew(p => !p)}>
                                        {showNew ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 4 }}>
                                <label>Confirm New Password</label>
                                <input type="password" value={confirmPw}
                                    onChange={e => setConfirmPw(e.target.value)}
                                    placeholder="Repeat new password" required />
                            </div>
                            <div className="dialog-footer" style={{ padding: '14px 0 0', borderTop: 'none' }}>
                                <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Saving…' : 'Change Password'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
