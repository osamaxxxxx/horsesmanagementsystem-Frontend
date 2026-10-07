import { useCallback, useEffect, useState } from 'react';
import { api, clearAuth, loadAuth, saveAuth, setAuthLostHandler } from './api';
import type { Auth, CurrentUser } from './types';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import RevokedScreen from './components/RevokedScreen';

export default function App() {
    const [auth, setAuth] = useState<Auth | null>(loadAuth);
    const [revoked, setRevoked] = useState(false);

    // Called on logout, on a 401 from the API, and on the realtime AccessRevoked event.
    const endSession = useCallback((code?: string) => {
        clearAuth();
        setAuth(null);
        if (code === 'ACCESS_REVOKED') setRevoked(true);
    }, []);

    useEffect(() => setAuthLostHandler(endSession), [endSession]);

    const logout = useCallback(() => {
        api('POST', '/api/auth/logout').catch(() => {}).finally(() => endSession());
    }, [endSession]);

    // The reporter can change a user's name or role while they are signed in.
    const updateUser = useCallback((user: CurrentUser) => {
        setAuth(current => {
            if (!current) return current;
            const next = { ...current, user };
            saveAuth(next);
            return next;
        });
    }, []);

    if (revoked) return <RevokedScreen onBack={() => setRevoked(false)} />;
    if (!auth)
        return (
            <Login
                onLogin={a => {
                    saveAuth(a);
                    setAuth(a);
                }}
                onRevoked={() => setRevoked(true)}
            />
        );
    return <Dashboard key={auth.token} auth={auth} onSessionEnd={endSession} onLogout={logout} onUserUpdated={updateUser} />;
}
