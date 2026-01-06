import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

const errorOverlay = document.createElement('div');
errorOverlay.id = 'tv-error-overlay';
errorOverlay.style.cssText = [
  'position:fixed',
  'inset:0',
  'z-index:99999',
  'padding:24px',
  'background:#2b0000',
  'color:#fff',
  'font-family:monospace',
  'font-size:14px',
  'white-space:pre-wrap',
  'display:none'
].join(';');
document.documentElement.appendChild(errorOverlay);

const compatOverlay = document.createElement('div');
compatOverlay.id = 'tv-compat-overlay';
compatOverlay.style.cssText = [
  'position:fixed',
  'inset:0',
  'z-index:99998',
  'padding:28px',
  'background:#0b172a',
  'color:#e2e8f0',
  'font-family:system-ui, Arial, sans-serif',
  'font-size:16px',
  'display:none'
].join(';');
document.documentElement.appendChild(compatOverlay);

const showError = (label: string, error: unknown): void => {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  errorOverlay.textContent = `${label}\n\n${message}`;
  errorOverlay.style.display = 'block';
};

const getUpdateLink = (): { href: string; label: string } => {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('tizen') || ua.includes('samsung')) {
    return { href: 'https://www.samsung.com/support/', label: 'Actualizar TV Samsung' };
  }
  if (ua.includes('webos') || ua.includes('lg')) {
    return { href: 'https://www.lg.com/support', label: 'Actualizar TV LG' };
  }
  if (ua.includes('android tv') || ua.includes('aft') || ua.includes('android')) {
    return { href: 'https://support.google.com/androidtv', label: 'Actualizar Android TV' };
  }
  if (ua.includes('edg/')) {
    return { href: 'https://www.microsoft.com/edge', label: 'Actualizar Microsoft Edge' };
  }
  if (ua.includes('firefox/')) {
    return { href: 'https://www.mozilla.org/firefox/new/', label: 'Actualizar Firefox' };
  }
  if (ua.includes('safari') && !ua.includes('chrome')) {
    return { href: 'https://support.apple.com/en-us/HT204204', label: 'Actualizar Safari' };
  }
  return { href: 'https://www.google.com/chrome/', label: 'Actualizar Google Chrome' };
};

const isCompatible = (): boolean => {
  return (
    typeof Promise !== 'undefined' &&
    typeof fetch !== 'undefined' &&
    typeof WebSocket !== 'undefined' &&
    typeof Map !== 'undefined' &&
    typeof Set !== 'undefined' &&
    typeof Symbol !== 'undefined' &&
    typeof URL !== 'undefined'
  );
};

const showCompatibilityMessage = (): void => {
  const update = getUpdateLink();
  compatOverlay.innerHTML = '';

  const title = document.createElement('h1');
  title.textContent = 'Navegador no compatible';
  title.style.cssText = 'margin:0 0 12px 0;font-size:22px;font-weight:700;color:#fff;';

  const body = document.createElement('p');
  body.textContent =
    'Este navegador no soporta las funciones necesarias. Actualiza el navegador o el sistema de la TV.';
  body.style.cssText = 'margin:0 0 20px 0;line-height:1.5;';

  const link = document.createElement('a');
  link.href = update.href;
  link.textContent = update.label;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.style.cssText = [
    'display:inline-block',
    'padding:12px 18px',
    'border-radius:999px',
    'background:#38bdf8',
    'color:#0b172a',
    'font-weight:700',
    'text-decoration:none'
  ].join(';');

  const hint = document.createElement('p');
  hint.textContent = 'Si no puedes actualizar, abre este enlace en otro dispositivo.';
  hint.style.cssText = 'margin:16px 0 0 0;font-size:14px;color:#cbd5f5;';

  compatOverlay.appendChild(title);
  compatOverlay.appendChild(body);
  compatOverlay.appendChild(link);
  compatOverlay.appendChild(hint);
  compatOverlay.style.display = 'block';
};

if (!isCompatible()) {
  showCompatibilityMessage();
}

window.addEventListener('error', (event) => {
  showError('window.onerror', event.error ?? event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  showError('unhandledrejection', event.reason);
});

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => {
    console.error(err);
    showError('bootstrapApplication', err);
  });
