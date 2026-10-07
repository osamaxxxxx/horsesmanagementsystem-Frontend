import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../api';
import { usePrefs } from '../prefs';
import type { Auth } from '../types';
import PrefsToggles from './PrefsToggles';

export default function Login({ onLogin, onRevoked }: { onLogin: (auth: Auth) => void; onRevoked: () => void }) {
    const { t, tError, lang } = usePrefs();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    async function submit(e: FormEvent) {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            onLogin(await api<Auth>('POST', '/api/auth/login', { username, password }));
        } catch (err) {
            if (err instanceof ApiError && err.code === 'ACCESS_REVOKED') onRevoked();
            else setError(tError(err));
            setBusy(false);
        }
    }

    return (
        <div className="min-h-screen pattern-bg flex flex-col items-center justify-center gap-4 p-4">
            <div className="card !border-0 !border-b-4 !border-amber-500 shadow-2xl max-w-md w-full overflow-hidden">
                <div className="pattern-bg text-white p-6 text-center border-b-2 border-amber-500">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 rounded-2xl p-0.5 shadow-2xl">
                        <div className="w-full h-full bg-[#08221a] rounded-[14px] flex items-center justify-center border border-amber-300/30">
                            <i className="fa-solid fa-horse-head text-4xl text-amber-400"></i>
                        </div>
                    </div>
                    <h1 className={`text-xl font-extrabold tracking-wide mt-4 leading-relaxed ${lang === 'ar' ? 'font-amiri' : ''}`}>{t('app.title')}</h1>
                    <p className="text-xs text-slate-300 mt-1">{t('login.subtitle')}</p>
                </div>

                <form onSubmit={submit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="username" className="label">{t('login.username')}</label>
                        <input id="username" value={username} onChange={e => setUsername(e.target.value)} required autoFocus autoComplete="username" dir="ltr" className="input" />
                    </div>
                    <div>
                        <label htmlFor="password" className="label">{t('login.password')}</label>
                        <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" dir="ltr" className="input" />
                    </div>
                    {error && (
                        <p className="alert-error">
                            <i className="fa-solid fa-triangle-exclamation me-1"></i> {error}
                        </p>
                    )}
                    <button type="submit" disabled={busy} className="btn btn-primary w-full">
                        {busy ? t('login.busy') : t('login.submit')}
                    </button>
                </form>
            </div>

            <div className="flex items-center gap-2">
                <PrefsToggles className="hdr-btn" />
            </div>
        </div>
    );
}
