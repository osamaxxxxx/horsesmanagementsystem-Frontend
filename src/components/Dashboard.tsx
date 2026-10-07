import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { api, API_URL, download } from '../api';
import { isAdmin, statusMeta, STATUSES } from '../meta';
import { usePrefs } from '../prefs';
import type { Auth, CurrentUser, Paged, Plot, PlotStatus } from '../types';
import ChangePasswordModal from './ChangePasswordModal';
import DetailsModal from './DetailsModal';
import LetterModal from './LetterModal';
import Pagination from './Pagination';
import PlotModal from './PlotModal';
import PlotsTable, { type Sort, type SortKey } from './PlotsTable';
import PrefsToggles from './PrefsToggles';
import PrintSheet from './PrintSheet';
import SecurityModal from './SecurityModal';
import SwapModal from './SwapModal';

type SyncState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
type Modal =
    | { kind: 'plot'; plot?: Plot }
    | { kind: 'details'; id: string }
    | { kind: 'security' }
    | { kind: 'swap' }
    | { kind: 'letter' }
    | { kind: 'password' }
    | null;

const syncStyle: Record<SyncState, { cls: string; dot: string }> = {
    connecting: { cls: 'border-amber-500/40 text-amber-300', dot: 'bg-amber-400 animate-pulse' },
    connected: { cls: 'border-emerald-500/40 text-emerald-300', dot: 'bg-emerald-400 animate-pulse' },
    reconnecting: { cls: 'border-amber-500/40 text-amber-300', dot: 'bg-amber-400 animate-pulse' },
    disconnected: { cls: 'border-rose-500/40 text-rose-300', dot: 'bg-rose-500' }
};

interface Props {
    auth: Auth;
    onSessionEnd: (code?: string) => void;
    onLogout: () => void;
    onUserUpdated: (user: CurrentUser) => void;
}

export default function Dashboard({ auth, onSessionEnd, onLogout, onUserUpdated }: Props) {
    const { t, tError, lang, locale } = usePrefs();
    const { user } = auth;
    const admin = isAdmin(user.role);

    const [plots, setPlots] = useState<Plot[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<unknown>(null);
    const [sync, setSync] = useState<SyncState>('connecting');
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<PlotStatus | 'ALL'>('ALL');
    const [sort, setSort] = useState<Sort>({ key: 'serialNo', dir: 1 });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [printing, setPrinting] = useState(false);
    const [modal, setModal] = useState<Modal>(null);
    const [toast, setToast] = useState('');
    const toastTimer = useRef<number>();

    const showToast = useCallback((message: string) => {
        setToast(message);
        window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setToast(''), 3500);
    }, []);

    const upsert = useCallback((plot: Plot) => {
        setPlots(current => (current.some(p => p.id === plot.id) ? current.map(p => (p.id === plot.id ? plot : p)) : [...current, plot]));
        setLastSync(new Date());
    }, []);

    const load = useCallback(async () => {
        try {
            const result = await api<Paged<Plot>>('GET', '/api/plots?pageSize=1000');
            setPlots(result.items);
            setLastSync(new Date());
            setLoadError(null);
        } catch (err) {
            setLoadError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load plus the realtime channel that keeps every open screen in step.
    useEffect(() => {
        const refreshProfile = () => api<CurrentUser>('GET', '/api/auth/me').then(onUserUpdated).catch(() => {});
        load();
        refreshProfile();

        const hub = new HubConnectionBuilder()
            .withUrl(`${API_URL}/hubs/sync`, { accessTokenFactory: () => auth.token })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Error)
            .build();
        hub.on('PlotUpserted', upsert);
        hub.on('PlotDeleted', (id: string) => {
            setPlots(current => current.filter(p => p.id !== id));
            setLastSync(new Date());
        });
        hub.on('ProfileChanged', refreshProfile);
        hub.on('AccessRevoked', (notice: { reason: string }) => onSessionEnd(notice.reason));
        hub.onreconnecting(() => setSync('reconnecting'));
        hub.onreconnected(() => {
            setSync('connected');
            load(); // catch up on anything missed while offline
            refreshProfile();
        });
        hub.onclose(() => setSync('disconnected'));
        hub.start().then(() => setSync('connected')).catch(() => setSync('disconnected'));

        return () => {
            hub.stop();
        };
    }, [auth.token, load, upsert, onSessionEnd, onUserUpdated]);

    // The printout shows every filtered record, so the sheet is only built while a print is in progress.
    useEffect(() => {
        const before = () => flushSync(() => setPrinting(true));
        const after = () => setPrinting(false);
        window.addEventListener('beforeprint', before);
        window.addEventListener('afterprint', after);
        return () => {
            window.removeEventListener('beforeprint', before);
            window.removeEventListener('afterprint', after);
        };
    }, []);

    const term = useDeferredValue(search).trim().toLowerCase();
    const filtered = useMemo(() => {
        const rows = plots.filter(p =>
            (statusFilter === 'ALL' || p.status === statusFilter) &&
            (!term ||
                p.plotNo.toLowerCase().includes(term) ||
                p.contractNo.toLowerCase().includes(term) ||
                p.beneficiaryName.toLowerCase().includes(term) ||
                p.studName.toLowerCase().includes(term) ||
                String(p.serialNo).includes(term)));
        return rows.sort((a, b) => {
            const x = a[sort.key], y = b[sort.key];
            if (x === y) return a.serialNo - b.serialNo;
            if (x === null) return 1; // empty values last, in either direction
            if (y === null) return -1;
            const order = typeof x === 'number' ? x - (y as number) : String(x).localeCompare(String(y), 'ar', { numeric: true });
            return order * sort.dir;
        });
    }, [plots, term, statusFilter, sort]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(page, pageCount);
    const pageRows = useMemo(() => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filtered, currentPage, pageSize]);

    // Any change to what is being listed goes back to the first page.
    useEffect(() => setPage(1), [term, statusFilter, sort, pageSize]);

    const counts = useMemo(() => {
        const result = Object.fromEntries(STATUSES.map(s => [s, 0])) as Record<PlotStatus, number>;
        for (const p of plots) result[p.status]++;
        return result;
    }, [plots]);

    const toggleSort = (key: SortKey) => setSort(s => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));

    // Runs a server action and reports the outcome.
    async function run(action: () => Promise<string>) {
        try {
            showToast(await action());
        } catch (err) {
            showToast(tError(err));
        }
    }

    const setStatus = (plot: Plot, status: PlotStatus) =>
        run(async () => {
            upsert(await api<Plot>('PATCH', `/api/plots/${plot.id}`, { status }));
            return t('toast.statusChanged', { plotNo: plot.plotNo, status: t(`status.${status}`) });
        });

    const remove = (plot: Plot) => {
        if (!window.confirm(t('confirm.delete', { plotNo: plot.plotNo, name: plot.beneficiaryName }))) return;
        run(async () => {
            await api('DELETE', `/api/plots/${plot.id}`);
            setPlots(current => current.filter(p => p.id !== plot.id));
            return t('toast.deleted', { plotNo: plot.plotNo });
        });
    };

    const exportCsv = () =>
        run(async () => {
            await download('/api/plots/export', `سجل_قسائم_قرية_الخيول_العقدة_${new Date().toISOString().slice(0, 10)}.csv`);
            return t('toast.exported');
        });

    const print = () => {
        flushSync(() => setPrinting(true));
        window.print();
    };

    const close = useCallback(() => setModal(null), []);
    const detailsPlot = modal?.kind === 'details' ? plots.find(p => p.id === modal.id) : undefined;
    const filterLabel = statusFilter === 'ALL' ? t('table.allStatuses') : t(`status.${statusFilter}`);

    return (
        <>
            <div className="screen-only min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
                <header className="pattern-bg text-white shadow-lg border-b-4 border-amber-500">
                    <div className="max-w-[1920px] mx-auto px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="relative w-11 h-11 bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 rounded-xl p-0.5 shadow-xl flex-shrink-0">
                                <div className="w-full h-full bg-[#08221a] rounded-[10px] flex items-center justify-center border border-amber-300/30">
                                    <i className="fa-solid fa-horse-head text-xl text-amber-400"></i>
                                </div>
                            </div>
                            <div className="min-w-0">
                                <h1 className={`text-base sm:text-lg md:text-xl font-extrabold leading-tight ${lang === 'ar' ? 'font-amiri tracking-wide' : ''}`}>{t('app.title')}</h1>
                                <p className="text-[11px] text-slate-300 truncate hidden sm:block">{t('app.subtitle')}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span
                                title={lastSync ? t('sync.last', { time: lastSync.toLocaleTimeString(locale) }) : undefined}
                                className={`h-8 inline-flex items-center gap-1.5 px-3 rounded-full bg-emerald-950/80 border font-semibold ${syncStyle[sync].cls}`}
                            >
                                <span className={`w-2 h-2 rounded-full ${syncStyle[sync].dot}`}></span>
                                {t(`sync.${sync}`)}
                            </span>
                            <span className="text-amber-200 font-medium px-1">
                                <i className="fa-solid fa-user me-1"></i>
                                {user.fullName} <span className="text-amber-400/80 hidden lg:inline">({t(`role.${user.role}`)})</span>
                            </span>
                            <PrefsToggles className="hdr-btn" />
                            <button onClick={() => setModal({ kind: 'password' })} title={t('header.changePassword')} aria-label={t('header.changePassword')} className="hdr-btn">
                                <i className="fa-solid fa-key"></i>
                            </button>
                            {admin && (
                                <button onClick={() => setModal({ kind: 'security' })} className="hdr-btn !bg-amber-600 hover:!bg-amber-500 !text-white !border-amber-400/50">
                                    <i className="fa-solid fa-shield-halved"></i>
                                    <span className="hidden sm:inline">{t('header.security')}</span>
                                </button>
                            )}
                            <button onClick={onLogout} title={t('header.logout')} className="hdr-btn">
                                <i className="fa-solid fa-right-from-bracket rtl:rotate-180"></i>
                                <span className="hidden sm:inline">{t('header.logout')}</span>
                            </button>
                        </div>
                    </div>
                </header>

                <main className="max-w-[1920px] mx-auto w-full flex-1 px-3 sm:px-5 py-4 space-y-4">
                    {/* Status summary; each tile also filters the table. */}
                    <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5">
                        <StatTile
                            active={statusFilter === 'ALL'}
                            onClick={() => setStatusFilter('ALL')}
                            icon="fa-map-location-dot"
                            tone="text-slate-700 dark:text-slate-200"
                            label={t('stats.all')}
                            value={plots.length}
                            hint={t('stats.capacity')}
                        />
                        {STATUSES.map(s => (
                            <StatTile
                                key={s}
                                active={statusFilter === s}
                                onClick={() => setStatusFilter(statusFilter === s ? 'ALL' : s)}
                                icon={statusMeta[s].icon}
                                tone={statusMeta[s].text}
                                dot={statusMeta[s].dot}
                                label={t(`status.${s}`)}
                                value={counts[s]}
                            />
                        ))}
                    </section>

                    <section className="card overflow-hidden">
                        <div className="p-3 sm:p-4 space-y-3 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <i className="fa-solid fa-table-list text-amber-600 text-lg"></i>
                                    <h2 className="font-bold text-base truncate">{t('table.title')}</h2>
                                    <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full font-bold whitespace-nowrap">
                                        {t('table.count', { shown: filtered.length, total: plots.length })}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {admin && (
                                        <>
                                            <button onClick={() => setModal({ kind: 'plot' })} className="btn btn-primary !py-1.5 !text-xs">
                                                <i className="fa-solid fa-plus"></i> {t('action.add')}
                                            </button>
                                            <button onClick={() => setModal({ kind: 'swap' })} className="btn btn-ghost !py-1.5 !text-xs">
                                                <i className="fa-solid fa-arrow-right-arrow-left text-sky-600"></i> {t('action.swap')}
                                            </button>
                                            <button onClick={() => setModal({ kind: 'letter' })} className="btn btn-ghost !py-1.5 !text-xs">
                                                <i className="fa-solid fa-envelope-open-text text-amber-600"></i> {t('action.letter')}
                                            </button>
                                            <button onClick={exportCsv} className="btn btn-ghost !py-1.5 !text-xs">
                                                <i className="fa-solid fa-file-excel text-emerald-600"></i> {t('action.export')}
                                            </button>
                                        </>
                                    )}
                                    <button onClick={print} className="btn btn-ghost !py-1.5 !text-xs">
                                        <i className="fa-solid fa-print"></i> {t('action.print')}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none">
                                        <i className="fa-solid fa-magnifying-glass text-amber-600"></i>
                                    </span>
                                    <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('table.search')} className="input !ps-10 !pe-16 font-medium" />
                                    {search && (
                                        <button onClick={() => setSearch('')} className="absolute inset-y-0 end-0 pe-3 flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs">
                                            {t('table.clear')} <i className="fa-solid fa-xmark"></i>
                                        </button>
                                    )}
                                </div>
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as PlotStatus | 'ALL')} className="input sm:!w-60 font-semibold">
                                    <option value="ALL">{t('table.allStatuses')}</option>
                                    {STATUSES.map(s => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="p-10 text-center text-slate-400 font-bold">
                                <i className="fa-solid fa-spinner fa-spin text-2xl mb-3 text-amber-500"></i>
                                <p>{t('table.loading')}</p>
                            </div>
                        ) : loadError ? (
                            <div className="p-10 text-center">
                                <p className="font-bold text-rose-600 dark:text-rose-400">{tError(loadError)}</p>
                                <button onClick={load} className="btn btn-dark mt-3">{t('common.retry')}</button>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="p-10 text-center text-slate-400">
                                <i className="fa-solid fa-folder-open text-4xl mb-3 text-slate-300 dark:text-slate-600"></i>
                                <p className="font-bold text-slate-600 dark:text-slate-300">{t('table.emptyTitle')}</p>
                                <p className="text-xs mt-1">{t('table.emptyHint')}</p>
                            </div>
                        ) : (
                            <>
                                <PlotsTable
                                    plots={pageRows}
                                    sort={sort}
                                    onSort={toggleSort}
                                    canDelete={admin}
                                    onView={p => setModal({ kind: 'details', id: p.id })}
                                    onEdit={p => setModal({ kind: 'plot', plot: p })}
                                    onSetStatus={setStatus}
                                    onDelete={remove}
                                />
                                <Pagination page={currentPage} pageCount={pageCount} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={setPageSize} />
                            </>
                        )}
                    </section>
                </main>

                {modal?.kind === 'plot' && (
                    <PlotModal
                        plot={modal.plot}
                        role={user.role}
                        nextSerial={plots.reduce((max, p) => Math.max(max, p.serialNo), 0) + 1}
                        onClose={close}
                        onSaved={(plot, created) => {
                            upsert(plot);
                            close();
                            showToast(t(created ? 'toast.added' : 'toast.updated', { plotNo: plot.plotNo }));
                        }}
                    />
                )}
                {detailsPlot && <DetailsModal plot={detailsPlot} onClose={close} />}
                {modal?.kind === 'swap' && (
                    <SwapModal
                        plots={plots}
                        onClose={close}
                        onSwapped={(a, b) => {
                            upsert(a);
                            upsert(b);
                            close();
                            showToast(t('toast.swapped'));
                        }}
                    />
                )}
                {modal?.kind === 'letter' && (
                    <LetterModal
                        plots={plots}
                        onClose={close}
                        onSaved={plot => {
                            upsert(plot);
                            // Open the plot's file so the new entry is visible straight away.
                            setModal({ kind: 'details', id: plot.id });
                            showToast(t('toast.letterAdded', { plotNo: plot.plotNo }));
                        }}
                    />
                )}
                {modal?.kind === 'security' && <SecurityModal currentUserId={user.id} onClose={close} onToast={showToast} />}
                {modal?.kind === 'password' && (
                    <ChangePasswordModal
                        onClose={close}
                        onChanged={() => {
                            close();
                            showToast(t('toast.passwordChanged'));
                        }}
                    />
                )}

                {toast && (
                    <div role="status" className="fixed bottom-5 start-5 z-50 max-w-[calc(100vw-2.5rem)] bg-slate-900 dark:bg-slate-700 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 dark:border-slate-600 flex items-center gap-3 text-xs">
                        <i className="fa-solid fa-circle-info text-amber-400 text-base"></i>
                        <span className="font-bold">{toast}</span>
                    </div>
                )}
            </div>

            {printing && <PrintSheet plots={filtered} filterLabel={filterLabel} search={search.trim()} />}
        </>
    );
}

interface StatTileProps {
    active: boolean;
    onClick: () => void;
    icon: string;
    tone: string;
    dot?: string;
    label: string;
    value: number;
    hint?: string;
}

function StatTile({ active, onClick, icon, tone, dot, label, value, hint }: StatTileProps) {
    return (
        <button
            onClick={onClick}
            aria-pressed={active}
            className={`card !rounded-xl px-3 py-2.5 flex items-center gap-3 text-start transition hover:shadow-md ${active ? 'ring-2 ring-amber-500 !border-amber-500' : ''}`}
        >
            <i className={`fa-solid ${icon} text-lg w-6 text-center ${tone}`}></i>
            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                    {dot && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`}></span>}
                    <span className="truncate">{label}</span>
                </p>
                <p className={`text-xl font-extrabold leading-tight ${tone}`}>
                    {value.toLocaleString('en')}
                    {hint && <span className="text-[11px] font-semibold text-slate-400 ms-1.5">{hint}</span>}
                </p>
            </div>
        </button>
    );
}
