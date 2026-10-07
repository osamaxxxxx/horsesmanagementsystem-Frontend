import { usePrefs, type TKey } from '../prefs';
import type { Plot } from '../types';

// Column widths in percent; the table is fixed-layout so it always fits the page width.
const columns: { key: TKey; width: number; value: (p: Plot) => string | number | null }[] = [
    { key: 'col.serial', width: 3, value: p => p.serialNo },
    { key: 'col.beneficiary', width: 9, value: p => p.beneficiaryName },
    { key: 'col.plotNo', width: 5, value: p => p.plotNo },
    { key: 'col.stud', width: 8, value: p => p.studName },
    { key: 'col.contractNo', width: 7, value: p => p.contractNo },
    { key: 'col.lottery', width: 6, value: p => p.lotteryDate },
    { key: 'col.expiry', width: 6, value: p => p.contractExpiryDate },
    { key: 'col.contact', width: 9, value: p => p.contactInfo },
    { key: 'col.permits', width: 10, value: p => p.buildingPermits },
    { key: 'col.requests', width: 10, value: p => p.requestsAndDecisions },
    { key: 'col.letters', width: 10, value: p => p.officialLetters },
    { key: 'col.notes', width: 9, value: p => p.notes }
];

// Paper version of the register: all filtered records (not just the current page) with untruncated text.
// Record text is Arabic whatever the display language, so each cell takes its direction from its content.
export default function PrintSheet({ plots, filterLabel, search }: { plots: Plot[]; filterLabel: string; search: string }) {
    const { t, locale } = usePrefs();
    return (
        <div className="print-sheet">
            <h1>{t('app.title')}</h1>
            <div className="print-meta">
                <span>{t('table.title')}</span>
                <span>{t('print.count', { count: plots.length })}</span>
                <span>{t('print.filter', { filter: filterLabel })}</span>
                {search && <span>{t('print.search', { term: search })}</span>}
                <span>{t('print.date', { date: new Date().toLocaleDateString(locale) })}</span>
            </div>
            <table>
                <colgroup>
                    {columns.map(c => <col key={c.key} style={{ width: `${c.width}%` }} />)}
                    <col style={{ width: '8%' }} />
                </colgroup>
                <thead>
                    <tr>
                        {columns.map(c => <th key={c.key}>{t(c.key)}</th>)}
                        <th>{t('col.status')}</th>
                    </tr>
                </thead>
                <tbody>
                    {plots.map(p => (
                        <tr key={p.id}>
                            {columns.map(c => <td key={c.key} dir="auto">{c.value(p) ?? '-'}</td>)}
                            <td>{t(`status.${p.status}`)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
