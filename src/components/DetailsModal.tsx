import { statusMeta } from '../meta';
import { usePrefs } from '../prefs';
import type { Plot } from '../types';
import Modal from './Modal';

export default function DetailsModal({ plot: p, onClose }: { plot: Plot; onClose: () => void }) {
    const { t } = usePrefs();
    const meta = statusMeta[p.status];
    const sections = [
        { icon: 'fa-building text-blue-500', title: t('details.permits'), text: p.buildingPermits, empty: t('details.permitsEmpty') },
        { icon: 'fa-clipboard-question text-purple-500', title: t('details.requests'), text: p.requestsAndDecisions, empty: t('details.requestsEmpty') },
        { icon: 'fa-envelope text-amber-500', title: t('details.letters'), text: p.officialLetters, empty: t('details.lettersEmpty') },
        { icon: 'fa-note-sticky text-emerald-500', title: t('details.notes'), text: p.notes, empty: t('details.notesEmpty') }
    ];
    const box = 'bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700';
    const boxLabel = 'text-slate-400 block mb-0.5';

    return (
        <Modal
            title={t('details.title', { plotNo: p.plotNo, stud: p.studName })}
            subtitle={t('details.subtitle', { serial: p.serialNo, contractNo: p.contractNo })}
            icon="fa-scroll"
            size="max-w-2xl"
            onClose={onClose}
        >
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                <div className={`flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border ${meta.badge}`}>
                    <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${meta.dot}`}></span>
                        <span className="font-extrabold text-sm">{t('details.status', { status: t(`status.${p.status}`) })}</span>
                    </div>
                    <span className="text-xs font-semibold">{t('details.lottery', { date: p.lotteryDate ?? t('details.notRecorded') })}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className={box}>
                        <span className={boxLabel}>{t('col.beneficiary')}</span>
                        <strong className="text-sm">{p.beneficiaryName}</strong>
                    </div>
                    <div className={box}>
                        <span className={boxLabel}>{t('col.stud')}</span>
                        <strong className="text-amber-700 dark:text-amber-400 text-sm"><i className="fa-solid fa-horse me-1"></i> {p.studName}</strong>
                    </div>
                    <div className={box}>
                        <span className={boxLabel}>{t('details.contract')}</span>
                        <strong>{p.contractNo} {t('details.expires', { date: p.contractExpiryDate ?? t('details.notRecorded') })}</strong>
                    </div>
                    <div className={box}>
                        <span className={boxLabel}>{t('col.contact')}</span>
                        <strong>{p.contactInfo ?? t('details.noContact')}</strong>
                    </div>
                </div>

                <div className="space-y-2 text-xs">
                    {sections.map(s => (
                        <div key={s.title} className="border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                            <h4 className="font-bold flex items-center gap-1.5 mb-1">
                                <i className={`fa-solid ${s.icon}`}></i> {s.title}
                            </h4>
                            <p dir="auto" className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line text-start">{s.text ?? s.empty}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center gap-3 text-xs">
                <span className="text-slate-500 dark:text-slate-400"><i className="fa-solid fa-lock text-emerald-600 me-1"></i> {t('details.footer')}</span>
                <button onClick={onClose} className="btn btn-dark !py-1.5 !text-xs">{t('common.close')}</button>
            </div>
        </Modal>
    );
}
