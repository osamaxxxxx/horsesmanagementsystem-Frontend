import { usePrefs } from '../prefs';

// Language and theme switches; `className` styles the two buttons to fit wherever they are placed.
export default function PrefsToggles({ className }: { className: string }) {
    const { theme, toggleLang, toggleTheme, t } = usePrefs();
    const themeLabel = t(theme === 'dark' ? 'header.light' : 'header.dark');
    return (
        <>
            <button onClick={toggleLang} className={className}>
                <i className="fa-solid fa-language"></i>
                <span>{t('header.otherLang')}</span>
            </button>
            <button onClick={toggleTheme} title={themeLabel} aria-label={themeLabel} className={className}>
                <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
        </>
    );
}
