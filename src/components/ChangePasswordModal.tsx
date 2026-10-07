import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../api';
import { usePrefs } from '../prefs';
import Modal from './Modal';

export default function ChangePasswordModal({ onClose, onChanged }: { onClose: () => void; onChanged: () => void }) {
    const { t, tError } = usePrefs();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    async function submit(e: FormEvent) {
        e.preventDefault();
        if (newPassword !== confirm) {
            setError(t('password.mismatch'));
            return;
        }
        setBusy(true);
        setError('');
        try {
            await api('POST', '/api/auth/change-password', { currentPassword, newPassword });
            onChanged();
        } catch (err) {
            setError(err instanceof ApiError && err.code === 'INVALID_CREDENTIALS' ? t('password.wrongCurrent') : tError(err));
            setBusy(false);
        }
    }

    return (
        <Modal title={t('password.title')} icon="fa-key" size="max-w-md" onClose={onClose}>
            <form onSubmit={submit}>
                <div className="p-5 space-y-3">
                    <div>
                        <label htmlFor="currentPassword" className="label">{t('password.current')}</label>
                        <input id="currentPassword" type="password" required autoFocus autoComplete="current-password" dir="ltr" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="input" />
                    </div>
                    <div>
                        <label htmlFor="newPassword" className="label">{t('password.new')}</label>
                        <input id="newPassword" type="password" required minLength={10} maxLength={128} autoComplete="new-password" dir="ltr" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input" />
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{t('password.hint')}</p>
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="label">{t('password.confirm')}</label>
                        <input id="confirmPassword" type="password" required minLength={10} maxLength={128} autoComplete="new-password" dir="ltr" value={confirm} onChange={e => setConfirm(e.target.value)} className="input" />
                    </div>
                    {error && (
                        <p className="alert-error">
                            <i className="fa-solid fa-triangle-exclamation me-1"></i> {error}
                        </p>
                    )}
                </div>
                <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="btn btn-ghost">{t('common.cancel')}</button>
                    <button type="submit" disabled={busy} className="btn btn-primary">{busy ? t('common.saving') : t('password.submit')}</button>
                </div>
            </form>
        </Modal>
    );
}
