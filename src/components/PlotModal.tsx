import { useState, type FormEvent } from 'react';
import { api } from '../api';
import { canEditField, editableFields, isAdmin, statusMeta, STATUSES } from '../meta';
import { usePrefs } from '../prefs';
import type { Plot, PlotInput, PlotPatch, PlotStatus, UserRole } from '../types';
import Modal from './Modal';

interface Props {
    plot?: Plot;
    role: UserRole;
    nextSerial: number;
    onClose: () => void;
    onSaved: (plot: Plot, created: boolean) => void;
}

type Form = { [K in keyof PlotInput]: K extends 'status' ? PlotStatus : string };

// Add/edit form for the 12 official columns. Non-reporter roles only get the fields they are allowed to change.
export default function PlotModal({ plot, role, nextSerial, onClose, onSaved }: Props) {
    const { t, tError } = usePrefs();
    const [form, setForm] = useState<Form>({
        serialNo: String(plot?.serialNo ?? nextSerial),
        beneficiaryName: plot?.beneficiaryName ?? '',
        lotteryDate: plot?.lotteryDate ?? '',
        contractNo: plot?.contractNo ?? '',
        contractExpiryDate: plot?.contractExpiryDate ?? '',
        studName: plot?.studName ?? '',
        plotNo: plot?.plotNo ?? '',
        contactInfo: plot?.contactInfo ?? '',
        buildingPermits: plot?.buildingPermits ?? '',
        requestsAndDecisions: plot?.requestsAndDecisions ?? '',
        officialLetters: plot?.officialLetters ?? '',
        notes: plot?.notes ?? '',
        status: plot?.status ?? 'ACTIVE'
    });
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const bind = (field: keyof Form) => ({
        value: form[field],
        disabled: !canEditField(role, field),
        onChange: (e: { target: { value: string } }) => setForm(f => ({ ...f, [field]: e.target.value }))
    });

    async function submit(e: FormEvent) {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            if (role !== 'SUPER_ADMIN_REPORTER') {
                const patch: PlotPatch = {};
                for (const field of editableFields(role)) (patch as Record<string, string>)[field] = form[field];
                onSaved(await api<Plot>('PATCH', `/api/plots/${plot!.id}`, patch), false);
                return;
            }
            const body = {
                ...form,
                serialNo: Number(form.serialNo),
                lotteryDate: form.lotteryDate || null,
                contractExpiryDate: form.contractExpiryDate || null
            };
            onSaved(plot ? await api<Plot>('PUT', `/api/plots/${plot.id}`, body) : await api<Plot>('POST', '/api/plots', body), !plot);
        } catch (err) {
            setError(tError(err));
            setBusy(false);
        }
    }

    const meta = statusMeta[form.status];

    return (
        <Modal
            title={plot ? t('plot.titleEdit', { plotNo: plot.plotNo }) : t('plot.titleAdd')}
            subtitle={t('app.project')}
            icon="fa-file-pen"
            size="max-w-3xl"
            onClose={onClose}
        >
            <form onSubmit={submit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                {!isAdmin(role) && (
                    <p className="text-xs text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-2.5">
                        <i className="fa-solid fa-circle-info text-amber-600 me-1"></i> {t('plot.limited')}
                    </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label className="label">{t('plot.serial')}</label>
                        <input type="number" min={1} max={1000} required className="input" {...bind('serialNo')} />
                    </div>
                    <div>
                        <label className="label">{t('plot.plotNo')}</label>
                        <input type="text" required maxLength={50} placeholder={t('plot.plotNoPh')} className="input" {...bind('plotNo')} />
                    </div>
                    <div>
                        <label className="label">{t('plot.stud')}</label>
                        <input type="text" required maxLength={255} placeholder={t('plot.studPh')} className="input" {...bind('studName')} />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="label">{t('plot.beneficiary')}</label>
                        <input type="text" required maxLength={255} placeholder={t('plot.beneficiaryPh')} className="input" {...bind('beneficiaryName')} />
                    </div>
                    <div>
                        <label className="label">{t('plot.contact')}</label>
                        <input type="text" placeholder={t('plot.contactPh')} className="input" {...bind('contactInfo')} />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label className="label">{t('plot.contractNo')}</label>
                        <input type="text" required maxLength={100} placeholder={t('plot.contractNoPh')} className="input" {...bind('contractNo')} />
                    </div>
                    <div>
                        <label className="label">{t('plot.lottery')}</label>
                        <input type="date" className="input" {...bind('lotteryDate')} />
                    </div>
                    <div>
                        <label className="label">{t('plot.expiry')}</label>
                        <input type="date" className="input" {...bind('contractExpiryDate')} />
                    </div>
                </div>

                <div className="p-3 bg-amber-50/60 dark:bg-amber-500/5 rounded-xl border border-amber-200 dark:border-amber-500/30">
                    <label className="label">
                        <i className="fa-solid fa-palette text-amber-600 me-1"></i> {t('plot.statusBox')}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <select className="input font-bold" {...bind('status')}>
                            {STATUSES.map(s => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
                        </select>
                        <div className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-bold border ${meta.badge}`}>
                            <span className={`w-2 h-2 rounded-full ${meta.dot}`}></span> {t('plot.preview', { status: t(`status.${form.status}`) })}
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="label">{t('plot.permits')}</label>
                        <textarea rows={2} placeholder={t('plot.permitsPh')} className="input" {...bind('buildingPermits')} />
                    </div>
                    <div>
                        <label className="label">{t('plot.requests')}</label>
                        <textarea rows={2} placeholder={t('plot.requestsPh')} className="input" {...bind('requestsAndDecisions')} />
                    </div>
                    <div>
                        <label className="label">{t('plot.letters')}</label>
                        <textarea rows={3} placeholder={t('plot.lettersPh')} className="input" {...bind('officialLetters')} />
                    </div>
                    <div>
                        <label className="label">{t('plot.notes')}</label>
                        <textarea rows={2} placeholder={t('plot.notesPh')} className="input" {...bind('notes')} />
                    </div>
                </div>

                {error && (
                    <p className="alert-error">
                        <i className="fa-solid fa-triangle-exclamation me-1"></i> {error}
                    </p>
                )}

                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="btn btn-ghost">{t('common.cancel')}</button>
                    <button type="submit" disabled={busy} className="btn btn-primary">{busy ? t('common.saving') : t('plot.save')}</button>
                </div>
            </form>
        </Modal>
    );
}
