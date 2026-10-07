import { useMemo, useState } from 'react';
import { api } from '../api';
import { usePrefs, type TKey } from '../prefs';
import type { Plot } from '../types';
import Modal from './Modal';

// `value` is what gets stamped into the official record, which is kept in Arabic whatever the display language.
const LETTER_TYPES: { value: string; label: TKey }[] = [
    { value: 'كتاب صادر من اللجنة', label: 'letter.type.outgoing' },
    { value: 'كتاب وارد من المنتفع', label: 'letter.type.incoming' },
    { value: 'إنذار رسمي بالسحب', label: 'letter.type.warning' },
    { value: 'إفادة رخصة بناء', label: 'letter.type.permit' }
];

interface Props {
    plots: Plot[];
    onClose: () => void;
    onSaved: (plot: Plot) => void;
}

export default function LetterModal({ plots, onClose, onSaved }: Props) {
    const { t, tError } = usePrefs();
    const sorted = useMemo(() => [...plots].sort((a, b) => a.serialNo - b.serialNo), [plots]);
    const [plotId, setPlotId] = useState(sorted[0]?.id ?? '');
    const [type, setType] = useState(LETTER_TYPES[0].value);
    const [reference, setReference] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    async function submit() {
        if (!plotId || !reference.trim() || !content.trim()) {
            setError(t('letter.required'));
            return;
        }
        setBusy(true);
        setError('');
        try {
            onSaved(await api<Plot>('POST', `/api/plots/${plotId}/letters`, { type, reference, content }));
        } catch (err) {
            setError(tError(err));
            setBusy(false);
        }
    }

    return (
        <Modal title={t('letter.title')} icon="fa-file-shield" onClose={onClose}>
            <div className="p-5 space-y-3">
                <div>
                    <label className="label">{t('letter.target')}</label>
                    <select value={plotId} onChange={e => setPlotId(e.target.value)} className="input font-semibold">
                        {sorted.map(p => (
                            <option key={p.id} value={p.id}>{t('swap.option', { plotNo: p.plotNo, name: p.beneficiaryName, stud: p.studName })}</option>
                        ))}
                    </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="label">{t('letter.type')}</label>
                        <select value={type} onChange={e => setType(e.target.value)} className="input">
                            {LETTER_TYPES.map(lt => <option key={lt.value} value={lt.value}>{t(lt.label)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">{t('letter.ref')}</label>
                        <input type="text" value={reference} onChange={e => setReference(e.target.value)} maxLength={100} placeholder={t('letter.refPh')} className="input" />
                    </div>
                </div>
                <div>
                    <label className="label">{t('letter.content')}</label>
                    <textarea rows={3} value={content} onChange={e => setContent(e.target.value)} maxLength={2000} placeholder={t('letter.contentPh')} className="input"></textarea>
                </div>
                {error && <p className="alert-error">{error}</p>}
            </div>
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                <button onClick={onClose} className="btn btn-ghost">{t('common.cancel')}</button>
                <button onClick={submit} disabled={busy} className="btn btn-primary">{t('letter.submit')}</button>
            </div>
        </Modal>
    );
}
