import { useEffect, useRef, useState } from 'react';
import { statusMeta, STATUSES } from '../meta';
import { usePrefs, type TKey } from '../prefs';
import type { Plot, PlotStatus } from '../types';

export type SortKey = 'serialNo' | 'beneficiaryName' | 'status' | 'plotNo' | 'studName' | 'contractNo' | 'lotteryDate' | 'contractExpiryDate';
export interface Sort {
    key: SortKey;
    dir: 1 | -1;
}

// The letters column is an append-only log, so the cell shows its newest entry.
const latestEntry = (log: string | null) => log?.split(/\n/).filter(Boolean).pop();

interface Props {
    plots: Plot[];
    sort: Sort;
    onSort: (key: SortKey) => void;
    canDelete: boolean;
    onView: (plot: Plot) => void;
    onEdit: (plot: Plot) => void;
    onSetStatus: (plot: Plot, status: PlotStatus) => void;
    onDelete: (plot: Plot) => void;
}

export default function PlotsTable({ plots, sort, onSort, canDelete, onView, onEdit, onSetStatus, onDelete }: Props) {
    const { t } = usePrefs();
    const scroller = useRef<HTMLDivElement>(null);
    // Status picker, anchored to the palette button that opened it. Fixed-positioned so the scroll area doesn't clip it.
    const [picker, setPicker] = useState<{ plot: Plot; top: number; left: number } | null>(null);

    useEffect(() => {
        if (!picker) return;
        const close = () => setPicker(null);
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
        window.addEventListener('click', close);
        window.addEventListener('resize', close);
        window.addEventListener('scroll', close, true);
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('click', close);
            window.removeEventListener('resize', close);
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('keydown', onKey);
        };
    }, [picker]);

    function openPicker(plot: Plot, button: HTMLElement) {
        const rect = button.getBoundingClientRect();
        const width = 224, height = 200;
        setPicker({
            plot,
            top: rect.bottom + height > window.innerHeight ? rect.top - height - 4 : rect.bottom + 4,
            left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))
        });
    }

    // A new page, filter or sort starts back at the top.
    const first = plots[0]?.id;
    useEffect(() => {
        scroller.current?.scrollTo({ top: 0 });
    }, [first]);

    const today = new Date().toISOString().slice(0, 10);
    const th = 'sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 py-2.5 px-3 border-b border-slate-200 dark:border-slate-700 text-start font-extrabold';
    const longCell = 'py-2 px-3 text-slate-600 dark:text-slate-300 min-w-[220px] max-w-[300px] whitespace-normal';
    const iconBtn = 'w-8 h-8 inline-flex items-center justify-center rounded-lg transition';

    const sortable = (key: SortKey, label: TKey, extra = '') => (
        <th className={`${th} ${extra}`} aria-sort={sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}>
            <button onClick={() => onSort(key)} title={t('table.sort', { column: t(label) })} className="inline-flex items-center gap-1.5 font-extrabold hover:text-amber-700 dark:hover:text-amber-400">
                {t(label)}
                <i className={`fa-solid text-[10px] ${sort.key !== key ? 'fa-sort opacity-30' : sort.dir === 1 ? 'fa-sort-up text-amber-600' : 'fa-sort-down text-amber-600'}`}></i>
            </button>
        </th>
    );

    return (
        <div ref={scroller} className="overflow-auto custom-scrollbar max-h-[calc(100vh-15rem)] min-h-[16rem]">
            <table className="w-full text-[13px] whitespace-nowrap border-separate border-spacing-0 text-slate-700 dark:text-slate-200">
                <thead>
                    <tr>
                        {sortable('serialNo', 'col.serial', 'w-14')}
                        {sortable('beneficiaryName', 'col.beneficiary', 'md:start-0 md:!z-20')}
                        {sortable('status', 'col.status')}
                        {sortable('plotNo', 'col.plotNo')}
                        {sortable('studName', 'col.stud')}
                        {sortable('contractNo', 'col.contractNo')}
                        {sortable('lotteryDate', 'col.lottery')}
                        {sortable('contractExpiryDate', 'col.expiry')}
                        <th className={th}>{t('col.contact')}</th>
                        <th className={th}>{t('col.permits')}</th>
                        <th className={th}>{t('col.requests')}</th>
                        <th className={th}>{t('col.letters')}</th>
                        <th className={th}>{t('col.notes')}</th>
                        <th className={`${th} !text-center end-0 !z-20 border-s`}>{t('col.actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {plots.map(row => {
                        const meta = statusMeta[row.status];
                        const expired = !!row.contractExpiryDate && row.contractExpiryDate < today && row.status !== 'WITHDRAWN';
                        return (
                            <tr
                                key={row.id}
                                onDoubleClick={() => onView(row)}
                                className="[&>td]:border-b [&>td]:border-slate-100 dark:[&>td]:border-slate-800 [&>td]:bg-white even:[&>td]:bg-slate-50 hover:[&>td]:bg-amber-50 dark:[&>td]:bg-slate-900 dark:even:[&>td]:bg-[#141d30] dark:hover:[&>td]:bg-slate-800"
                            >
                                <td className={`py-2 px-3 text-center font-bold text-slate-500 dark:text-slate-400 border-s-4 ${meta.bar}`}>{row.serialNo}</td>
                                <td dir="auto" className="py-2 px-3 font-bold text-start text-slate-900 dark:text-white md:sticky md:start-0 md:z-[5]">{row.beneficiaryName}</td>
                                <td className="py-2 px-3">
                                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-md border ${meta.badge}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}></span>
                                        {t(`status.${row.status}`)}
                                    </span>
                                </td>
                                <td className="py-2 px-3">
                                    <span dir="ltr" className="font-mono font-extrabold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/30">{row.plotNo}</span>
                                </td>
                                <td className="py-2 px-3 font-semibold">
                                    <i className="fa-solid fa-horse text-amber-600/70 me-1"></i> {row.studName}
                                </td>
                                <td className="py-2 px-3 font-mono font-bold" dir="ltr">{row.contractNo}</td>
                                <td className="py-2 px-3 text-slate-600 dark:text-slate-300" dir="ltr">{row.lotteryDate ?? '-'}</td>
                                <td className={`py-2 px-3 ${expired ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-600 dark:text-slate-300'}`} title={expired ? t('table.expired') : undefined}>
                                    <span dir="ltr">{row.contractExpiryDate ?? '-'}</span>
                                    {expired && <i className="fa-solid fa-circle-exclamation ms-1.5"></i>}
                                </td>
                                <td className="py-2 px-3 text-slate-600 dark:text-slate-300" dir="ltr">{row.contactInfo ?? '-'}</td>
                                <td className={longCell} title={row.buildingPermits ?? ''}><div dir="auto" className="line-clamp-2 leading-snug text-start">{row.buildingPermits ?? '-'}</div></td>
                                <td className={longCell} title={row.requestsAndDecisions ?? ''}><div dir="auto" className="line-clamp-2 leading-snug text-start">{row.requestsAndDecisions ?? '-'}</div></td>
                                <td className={longCell} title={row.officialLetters ?? ''}><div dir="auto" className="line-clamp-2 leading-snug text-start">{latestEntry(row.officialLetters) ?? '-'}</div></td>
                                <td className={longCell} title={row.notes ?? ''}><div dir="auto" className="line-clamp-2 leading-snug text-start">{row.notes ?? '-'}</div></td>
                                <td className="py-1.5 px-2 text-center sticky end-0 z-[5] border-s border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-center gap-1">
                                        <button onClick={() => onView(row)} title={t('row.view')} aria-label={t('row.view')} className={`${iconBtn} bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100`}>
                                            <i className="fa-solid fa-eye"></i>
                                        </button>
                                        <button onClick={() => onEdit(row)} title={t('row.edit')} aria-label={t('row.edit')} className={`${iconBtn} bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:text-amber-300`}>
                                            <i className="fa-solid fa-pen-to-square"></i>
                                        </button>
                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                openPicker(row, e.currentTarget);
                                            }}
                                            title={t('row.status')}
                                            aria-label={t('row.status')}
                                            aria-haspopup="menu"
                                            className={`${iconBtn} bg-sky-100 hover:bg-sky-200 text-sky-700 dark:bg-sky-500/20 dark:hover:bg-sky-500/30 dark:text-sky-300`}
                                        >
                                            <i className="fa-solid fa-palette"></i>
                                        </button>
                                        {canDelete && (
                                            <button onClick={() => onDelete(row)} title={t('row.delete')} aria-label={t('row.delete')} className={`${iconBtn} bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-500/20 dark:hover:bg-rose-500/30 dark:text-rose-300`}>
                                                <i className="fa-solid fa-trash-can"></i>
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {picker && (
                <div role="menu" style={{ top: picker.top, left: picker.left }} className="fixed z-30 w-56 card !rounded-xl !shadow-2xl p-1.5 space-y-1 text-xs">
                    {STATUSES.map(status => {
                        const current = status === picker.plot.status;
                        return (
                            <button
                                key={status}
                                role="menuitem"
                                disabled={current}
                                onClick={() => onSetStatus(picker.plot, status)}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border font-bold text-start transition ${statusMeta[status].badge} ${current ? 'ring-2 ring-slate-400 cursor-default' : 'opacity-80 hover:opacity-100'}`}
                            >
                                <span className={`w-2 h-2 rounded-full ${statusMeta[status].dot}`}></span>
                                <span className="flex-1">{t(`status.${status}`)}</span>
                                {current && <i className="fa-solid fa-check"></i>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
