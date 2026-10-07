import { usePrefs } from '../prefs';

export const PAGE_SIZES = [25, 50, 100];

interface Props {
    page: number;
    pageCount: number;
    pageSize: number;
    total: number;
    onPage: (page: number) => void;
    onPageSize: (size: number) => void;
}

export default function Pagination({ page, pageCount, pageSize, total, onPage, onPageSize }: Props) {
    const { t } = usePrefs();
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);

    // Up to five page numbers centred on the current page.
    const start = Math.max(1, Math.min(page - 2, pageCount - 4));
    const pages = Array.from({ length: Math.min(5, pageCount) }, (_, i) => start + i);

    const btn = 'min-w-8 h-8 px-2 inline-flex items-center justify-center rounded-lg text-xs font-bold border transition disabled:opacity-40 disabled:cursor-not-allowed';
    const idle = 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800';
    const nav = (label: string, icon: string, target: number, disabled: boolean) => (
        <button onClick={() => onPage(target)} disabled={disabled} title={label} aria-label={label} className={`${btn} ${idle}`}>
            <i className={`fa-solid ${icon} rtl:rotate-180`}></i>
        </button>
    );

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-semibold">
                <select value={pageSize} onChange={e => onPageSize(Number(e.target.value))} className="input !w-auto !py-1.5 !text-xs font-bold">
                    {PAGE_SIZES.map(n => <option key={n} value={n}>{t('page.size', { n })}</option>)}
                </select>
                <span>{t('page.range', { from, to, total })}</span>
            </div>

            <nav className="flex items-center gap-1">
                {nav(t('page.first'), 'fa-angles-left', 1, page === 1)}
                {nav(t('page.prev'), 'fa-angle-left', page - 1, page === 1)}
                {pages.map(n => (
                    <button key={n} onClick={() => onPage(n)} aria-current={n === page ? 'page' : undefined} className={`${btn} ${n === page ? 'bg-amber-600 border-amber-600 text-white' : idle}`}>
                        {n}
                    </button>
                ))}
                {nav(t('page.next'), 'fa-angle-right', page + 1, page === pageCount)}
                {nav(t('page.last'), 'fa-angles-right', pageCount, page === pageCount)}
            </nav>
        </div>
    );
}
