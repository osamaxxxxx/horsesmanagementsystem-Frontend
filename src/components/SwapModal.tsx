import { useMemo, useState } from 'react';
import { api } from '../api';
import { usePrefs } from '../prefs';
import type { Plot } from '../types';
import Modal from './Modal';

interface Props {
    plots: Plot[];
    onClose: () => void;
    onSwapped: (a: Plot, b: Plot) => void;
}

export default function SwapModal({ plots, onClose, onSwapped }: Props) {
    const { t, tError } = usePrefs();
    const sorted = useMemo(() => [...plots].sort((a, b) => a.serialNo - b.serialNo), [plots]);
    const [plotAId, setPlotAId] = useState(sorted[0]?.id ?? '');
    const [plotBId, setPlotBId] = useState(sorted[1]?.id ?? '');
    const [decisionRef, setDecisionRef] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    async function submit() {
        if (!plotAId || !plotBId || plotAId === plotBId) {
            setError(t('swap.same'));
            return;
        }
        setBusy(true);
        setError('');
        try {
            const result = await api<{ plotA: Plot; plotB: Plot }>('POST', '/api/plots/swap', { plotAId, plotBId, decisionRef });
            onSwapped(result.plotA, result.plotB);
        } catch (err) {
            setError(tError(err));
            setBusy(false);
        }
    }

    const options = sorted.map(p => (
        <option key={p.id} value={p.id}>{t('swap.option', { plotNo: p.plotNo, name: p.beneficiaryName, stud: p.studName })}</option>
    ));

    return (
        <Modal title={t('swap.title')} icon="fa-arrow-right-arrow-left" onClose={onClose}>
            <div className="p-5 space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-300">{t('swap.intro')}</p>
                <div>
                    <label className="label">{t('swap.partyA')}</label>
                    <select value={plotAId} onChange={e => setPlotAId(e.target.value)} className="input font-semibold">{options}</select>
                </div>
                <div className="text-center text-sky-600">
                    <i className="fa-solid fa-repeat text-xl"></i>
                </div>
                <div>
                    <label className="label">{t('swap.partyB')}</label>
                    <select value={plotBId} onChange={e => setPlotBId(e.target.value)} className="input font-semibold">{options}</select>
                </div>
                <div>
                    <label className="label">{t('swap.decision')}</label>
                    <input type="text" value={decisionRef} onChange={e => setDecisionRef(e.target.value)} maxLength={200} placeholder={t('swap.decisionPh')} className="input" />
                </div>
                {error && <p className="alert-error">{error}</p>}
            </div>
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                <button onClick={onClose} className="btn btn-ghost">{t('common.cancel')}</button>
                <button onClick={submit} disabled={busy} className="btn bg-sky-700 hover:bg-sky-600 text-white shadow">{t('swap.submit')}</button>
            </div>
        </Modal>
    );
}
