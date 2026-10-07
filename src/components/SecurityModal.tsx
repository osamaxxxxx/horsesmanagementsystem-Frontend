import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '../api';
import { ROLES } from '../meta';
import { usePrefs } from '../prefs';
import type { UserRole, UserRow } from '../types';
import Modal from './Modal';

interface Props {
    currentUserId: string;
    onClose: () => void;
    onToast: (message: string) => void;
}

// One form serves both "add" (id is null) and "edit". When editing, an empty password keeps the current one.
interface UserForm {
    id: string | null;
    username: string;
    fullName: string;
    role: UserRole;
    password: string;
}

const blankForm: UserForm = { id: null, username: '', fullName: '', role: 'PRESIDENT', password: '' };

// Reporter-only security center: who has access, with which role, from which device, and the instant revoke switch.
export default function SecurityModal({ currentUserId, onClose, onToast }: Props) {
    const { t, tError } = usePrefs();
    const [users, setUsers] = useState<UserRow[] | null>(null);
    const [error, setError] = useState('');
    const [form, setForm] = useState<UserForm | null>(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        api<UserRow[]>('GET', '/api/users').then(setUsers).catch(err => setError(tError(err)));
    }, [tError]);
    useEffect(load, [load]);

    const replace = (updated: UserRow) => setUsers(current => current!.map(u => (u.id === updated.id ? updated : u)));

    async function toggleAccess(user: UserRow) {
        try {
            replace(await api<UserRow>('POST', `/api/users/${user.id}/${user.isActive ? 'revoke' : 'restore'}`));
            onToast(t(user.isActive ? 'toast.revoked' : 'toast.restored', { name: user.fullName }));
        } catch (err) {
            onToast(tError(err));
        }
    }

    async function save(e: FormEvent) {
        e.preventDefault();
        if (!form) return;
        setBusy(true);
        setError('');
        try {
            if (form.id === null) {
                const created = await api<UserRow>('POST', '/api/users', form);
                setUsers(current => [...(current ?? []), created]);
                onToast(t('toast.userAdded', { name: created.fullName }));
            } else {
                const updated = await api<UserRow>('PUT', `/api/users/${form.id}`, { fullName: form.fullName, role: form.role });
                if (form.password) await api('POST', `/api/users/${form.id}/password`, { newPassword: form.password });
                replace(updated);
                onToast(t('toast.userUpdated', { name: updated.fullName }));
            }
            setForm(null);
        } catch (err) {
            setError(tError(err));
        } finally {
            setBusy(false);
        }
    }

    const editing = form?.id ? users?.find(u => u.id === form.id) : undefined;
    const ownAccount = form?.id === currentUserId;
    const pill = 'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap';

    return (
        <Modal title={t('security.title')} subtitle={t('security.subtitle')} icon="fa-user-shield" tone="danger" size="max-w-4xl" onClose={onClose}>
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                    <i className="fa-solid fa-circle-info text-amber-600 text-base mt-0.5"></i>
                    <div>
                        <span className="font-bold">{t('security.howTitle')}</span>
                        <p className="mt-0.5 leading-relaxed">{t('security.howBody')}</p>
                    </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-x-auto">
                    <table className="w-full text-start text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold">
                            <tr className="[&>th]:p-3 [&>th]:text-start [&>th]:whitespace-nowrap">
                                <th>{t('security.colUser')}</th>
                                <th>{t('security.colRole')}</th>
                                <th>{t('security.colDevice')}</th>
                                <th>{t('security.colAccess')}</th>
                                <th className="!text-center">{t('security.colControl')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {!users && !error && (
                                <tr><td colSpan={5} className="p-4 text-center text-slate-400">{t('common.loading')}</td></tr>
                            )}
                            {users?.map(user => (
                                <tr key={user.id} className={user.isActive ? '' : 'bg-red-50/60 dark:bg-red-500/10'}>
                                    <td className="p-3 min-w-[170px]">
                                        <div className="font-bold">{user.fullName} {user.id === currentUserId && <span className="text-amber-600">{t('security.you')}</span>}</div>
                                        <div className="text-[11px] text-slate-500 dark:text-slate-400" dir="ltr">{user.username}</div>
                                    </td>
                                    <td className="p-3 font-semibold whitespace-nowrap">{t(`role.${user.role}`)}</td>
                                    <td className="p-3 text-[11px] text-slate-600 dark:text-slate-300">
                                        <div className="max-w-[180px] truncate" title={user.deviceInfo ?? ''}>
                                            <i className="fa-solid fa-laptop-code me-1"></i> {user.deviceInfo ?? t('security.neverLoggedIn')}
                                        </div>
                                        {user.ipAddress && <span className="font-mono text-[10px] text-slate-400" dir="ltr">IP: {user.ipAddress}</span>}
                                    </td>
                                    <td className="p-3">
                                        {!user.isActive ? (
                                            <span className={`${pill} bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> {t('security.revokedBadge')}
                                            </span>
                                        ) : user.isOnline ? (
                                            <span className={`${pill} bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> {t('security.online')}
                                            </span>
                                        ) : (
                                            <span className={`${pill} bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {t('security.offline')}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button
                                                onClick={() => {
                                                    setError('');
                                                    setForm({ id: user.id, username: user.username, fullName: user.fullName, role: user.role, password: '' });
                                                }}
                                                className="btn btn-ghost !px-2.5 !py-1.5 !text-xs"
                                            >
                                                <i className="fa-solid fa-user-pen"></i> {t('common.edit')}
                                            </button>
                                            {user.role !== 'SUPER_ADMIN_REPORTER' && (
                                                <button onClick={() => toggleAccess(user)} className={`btn !px-2.5 !py-1.5 !text-xs text-white ${user.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-700 hover:bg-emerald-600'}`}>
                                                    <i className={`fa-solid ${user.isActive ? 'fa-ban' : 'fa-check'}`}></i>
                                                    {t(user.isActive ? 'security.revoke' : 'security.restore')}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {form ? (
                    <form onSubmit={save} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
                        <h4 className="font-bold text-sm">
                            <i className={`fa-solid ${form.id ? 'fa-user-pen text-amber-600' : 'fa-user-plus text-emerald-600'} me-1`}></i>
                            {form.id ? t('security.editUser', { name: editing?.fullName ?? '' }) : t('security.addUser')}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="label">{t('security.fullName')}</label>
                                <input required maxLength={255} value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="input" />
                            </div>
                            <div>
                                <label className="label">{t('security.role')}</label>
                                <select value={form.role} disabled={ownAccount} onChange={e => setForm({ ...form, role: e.target.value as UserRole })} className="input font-semibold">
                                    {ROLES.map(r => <option key={r} value={r}>{t(`role.${r}`)}</option>)}
                                </select>
                                {ownAccount && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{t('security.ownRole')}</p>}
                            </div>
                            <div>
                                <label className="label">{t('security.username')}</label>
                                <input required minLength={3} maxLength={100} dir="ltr" autoComplete="off" disabled={form.id !== null} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="input" />
                            </div>
                            <div>
                                <label className="label">{form.id ? t('security.newPassword') : t('security.password')}</label>
                                <input type="password" required={form.id === null} minLength={10} maxLength={128} dir="ltr" autoComplete="new-password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setForm(null)} className="btn btn-ghost">{t('common.cancel')}</button>
                            <button type="submit" disabled={busy} className="btn bg-emerald-700 hover:bg-emerald-600 text-white">{busy ? t('common.saving') : t('security.saveUser')}</button>
                        </div>
                    </form>
                ) : (
                    <button
                        onClick={() => {
                            setError('');
                            setForm(blankForm);
                        }}
                        className="btn !text-xs border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                    >
                        <i className="fa-solid fa-user-plus"></i> {t('security.addUser')}
                    </button>
                )}

                {error && <p className="alert-error">{error}</p>}
            </div>

            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex justify-between">
                <button onClick={load} className="btn btn-ghost !text-xs">
                    <i className="fa-solid fa-rotate"></i> {t('common.refresh')}
                </button>
                <button onClick={onClose} className="btn btn-dark !text-xs">{t('common.close')}</button>
            </div>
        </Modal>
    );
}
