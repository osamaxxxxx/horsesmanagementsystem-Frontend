import { createRoot } from 'react-dom/client';
import App from './App';
import { PrefsProvider } from './prefs';
import './index.css';

createRoot(document.getElementById('root')!).render(
    <PrefsProvider>
        <App />
    </PrefsProvider>
);
