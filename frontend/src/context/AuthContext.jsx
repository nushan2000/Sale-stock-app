import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchMe = useCallback(async (t) => {
        if (!t) { setLoading(false); return; }
        try {
            const res = await API.get('/auth/me', { headers: { 'X-Auth-Token': t } });
            setUser(res.data);
        } catch {
            localStorage.removeItem('auth_token');
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchMe(token); }, [token, fetchMe]);

    const login = async (username, password) => {
        const res = await API.post('/auth/login', { username, password });
        const t = res.data.token;
        localStorage.setItem('auth_token', t);
        setToken(t);
        const me = await API.get('/auth/me', { headers: { 'X-Auth-Token': t } });
        setUser(me.data);
        return me.data;
    };

    const logout = async () => {
        if (token) {
            try { await API.post('/auth/logout', {}, { headers: { 'X-Auth-Token': token } }); } catch {}
        }
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ token, user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
