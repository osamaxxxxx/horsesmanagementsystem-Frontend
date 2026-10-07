import { usePrefs } from '../prefs';

export default function RevokedScreen({ onBack }: { onBack: () => void }) {
    const { t, lang } = usePrefs();
    return (
        <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-24 h-24 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center text-4xl mb-4 border border-red-500/30 animate-pulse">
                <i className="fa-solid fa-user-lock"></i>
            </div>
            <h2 className={`text-3xl font-extrabold mb-2 text-amber-300 ${lang === 'ar' ? 'font-amiri' : ''}`}>{t('revoked.title')}</h2>
            <p className="text-slate-300 max-w-md mb-6 text-sm leading-relaxed">{t('revoked.body')}</p>
            <button onClick={onBack} className="btn btn-dark">
                <i className="fa-solid fa-arrow-right-to-bracket"></i> {t('revoked.back')}
            </button>
        </div>
    );
}
