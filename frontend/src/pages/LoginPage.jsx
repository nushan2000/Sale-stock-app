import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api';

/* ─── Forgot Password (3-step wizard) ──────────────────────── */
const ForgotPassword = ({ onBack }) => {
    const [step, setStep] = useState(1); // 1=email, 2=otp+new pw, 3=done
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');

    const sendOtp = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const res = await API.post('/auth/forgot-password', { email });
            setMsg(res.data.message);
            setStep(2);
        } catch {
            setError('Failed to connect. Try again.');
        } finally { setLoading(false); }
    };

    const resetPw = async (e) => {
        e.preventDefault();
        setError('');
        if (newPw !== confirmPw) { setError('Passwords do not match.'); return; }
        if (newPw.length < 6) { setError('Password must be at least 6 characters.'); return; }
        setLoading(true);
        try {
            await API.post('/auth/reset-password', { email, otp, newPassword: newPw });
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed.');
        } finally { setLoading(false); }
    };

    return (
        <div className="login-forgot">
            {step === 1 && (
                <>
                    <h3 className="fp-title">🔑 Forgot Password</h3>
                    <p className="fp-sub">Enter your account email to receive a reset code.</p>
                    {error && <div className="auth-error">{error}</div>}
                    <form onSubmit={sendOtp}>
                        <div className="auth-field">
                            <label>Email Address</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="your@email.com" required autoFocus />
                        </div>
                        <button className="auth-btn" disabled={loading}>
                            {loading ? 'Sending…' : 'Send OTP Code'}
                        </button>
                    </form>
                    <button className="auth-link" onClick={onBack}>← Back to Login</button>
                </>
            )}

            {step === 2 && (
                <>
                    <h3 className="fp-title">📧 Enter OTP</h3>
                    <p className="fp-sub">{msg || 'Check your email for the 6-digit code.'}</p>
                    {error && <div className="auth-error">{error}</div>}
                    <form onSubmit={resetPw}>
                        <div className="auth-field">
                            <label>OTP Code</label>
                            <input value={otp} onChange={e => setOtp(e.target.value)}
                                placeholder="123456" maxLength={6} required autoFocus />
                        </div>
                        <div className="auth-field">
                            <label>New Password</label>
                            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                                placeholder="Minimum 6 characters" required />
                        </div>
                        <div className="auth-field">
                            <label>Confirm New Password</label>
                            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                                placeholder="Repeat new password" required />
                        </div>
                        <button className="auth-btn" disabled={loading}>
                            {loading ? 'Resetting…' : 'Reset Password'}
                        </button>
                    </form>
                    <button className="auth-link" onClick={() => setStep(1)}>← Try different email</button>
                </>
            )}

            {step === 3 && (
                <div className="fp-success">
                    <div className="fp-check">✅</div>
                    <h3>Password Reset!</h3>
                    <p>Your password has been updated. You can now log in with your new password.</p>
                    <button className="auth-btn" onClick={onBack}>Go to Login</button>
                </div>
            )}
        </div>
    );
};

/* ─── Login Page ────────────────────────────────────────────── */
const LoginPage = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [forgot, setForgot] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            await login(username, password);
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid username or password.');
        } finally { setLoading(false); }
    };

    return (
        <div className="login-page">
            {/* Animated background orbs */}
            <div className="login-bg">
                <div className="orb orb1" />
                <div className="orb orb2" />
                <div className="orb orb3" />
            </div>

            <div className="login-card">
                <div className="login-brand">
                    <span className="login-brand-icon">📦</span>
                    <span className="login-brand-name">ShopPro</span>
                </div>

                {forgot ? (
                    <ForgotPassword onBack={() => setForgot(false)} />
                ) : (
                    <>
                        <h2 className="login-title">Welcome back</h2>
                        <p className="login-sub">Sign in to manage your store</p>

                        {error && <div className="auth-error">{error}</div>}

                        <form onSubmit={handleLogin} className="login-form">
                            <div className="auth-field">
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder="Enter username"
                                    required autoFocus
                                    id="login-username"
                                />
                            </div>
                            <div className="auth-field">
                                <label>Password</label>
                                <div className="pw-wrap">
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Enter password"
                                        required
                                        id="login-password"
                                    />
                                    <button type="button" className="pw-toggle"
                                        onClick={() => setShowPw(p => !p)}>
                                        {showPw ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>

                            <button className="auth-btn" type="submit" disabled={loading} id="login-submit">
                                {loading ? <span className="auth-spinner" /> : 'Sign In'}
                            </button>
                        </form>

                        <button className="auth-link" onClick={() => setForgot(true)} id="forgot-password-link">
                            Forgot password?
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
