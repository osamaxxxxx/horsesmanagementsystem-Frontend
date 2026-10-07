import { useEffect, type ReactNode } from 'react';
import { usePrefs } from '../prefs';

interface Props {
    title: string;
    subtitle?: string;
    icon: string;
    tone?: 'brand' | 'danger';
    size?: string;
    onClose: () => void;
    children: ReactNode;
}

// Shared dialog shell: backdrop, branded header, close button, Escape to close.
export default function Modal({ title, subtitle, icon, tone = 'brand', size = 'max-w-lg', onClose, children }: Props) {
    const { t } = usePrefs();

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const danger = tone === 'danger';
    return (
        <div className="modal-backdrop">
            <div role="dialog" aria-modal="true" aria-label={title} className={`modal-panel ${size}`}>
                <div className={`text-white p-4 flex items-center justify-between gap-3 border-b-2 ${danger ? 'bg-slate-950 border-red-500' : 'pattern-bg border-amber-500'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border flex-shrink-0 ${danger ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-400/40'}`}>
                            <i className={`fa-solid ${icon}`}></i>
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-base truncate">{title}</h3>
                            {subtitle && <p className="text-xs text-slate-300 truncate">{subtitle}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} aria-label={t('common.close')} className="text-slate-300 hover:text-white text-lg p-1">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
