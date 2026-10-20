'use strict';

(() => {
  const { toast, t } = Chaka;
  const isSecureContext = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const listeners = new Set();
  let installEvent = null;
  let offlineBar = null;

  const notify = () => listeners.forEach((listener) => listener());

  const register = () => {
    if (!('serviceWorker' in navigator) || !isSecureContext) return;
    const start = () => navigator.serviceWorker.register('sw.js').then(notify).catch(() => { /* offline mode unavailable */ });
    window.addEventListener('load', () => {
      if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 5000 });
      else setTimeout(start, 3000);
    });
  };

  const cachedFileCount = async () => {
    if (!('caches' in window)) return 0;
    const names = (await caches.keys()).filter((name) => name.startsWith('chaka-'));
    if (!names.length) return 0;
    const cache = await caches.open(names[names.length - 1]);
    return (await cache.keys()).length;
  };

  const status = async () => {
    if (!('serviceWorker' in navigator) || !isSecureContext) return { supported: false, ready: false, files: 0 };
    try {
      await navigator.serviceWorker.ready;
      const files = await cachedFileCount();
      return { supported: true, ready: files > 0, files };
    } catch {
      return { supported: true, ready: false, files: 0 };
    }
  };

  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

  const promptInstall = async () => {
    if (!installEvent) return 'unavailable';
    installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    installEvent = null;
    notify();
    return outcome;
  };

  const showOfflineBar = () => {
    if (offlineBar || document.body.dataset.page === 'emergency') return;
    offlineBar = document.createElement('div');
    offlineBar.className = 'offline-bar';
    offlineBar.setAttribute('role', 'status');
    offlineBar.innerHTML = `<span></span> <a href="emergency.html"></a>`;
    offlineBar.firstChild.textContent = t('ინტერნეტი არ გაქვთ.', 'You are offline.');
    offlineBar.lastChild.textContent = t('გადაუდებელი რეჟიმი →', 'Emergency mode →');
    document.body.append(offlineBar);
  };

  const hideOfflineBar = () => { offlineBar?.remove(); offlineBar = null; };

  const onConnectionChange = () => {
    document.documentElement.dataset.online = String(navigator.onLine);
    if (navigator.onLine) { hideOfflineBar(); } else { showOfflineBar(); }
    notify();
  };

  window.addEventListener('online', () => { onConnectionChange(); toast(t('ინტერნეტი აღდგა', 'Back online')); });
  window.addEventListener('offline', onConnectionChange);
  window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); installEvent = event; notify(); });
  window.addEventListener('appinstalled', () => { installEvent = null; notify(); toast(t('აპლიკაცია დაინსტალირდა', 'App installed')); });

  document.addEventListener('DOMContentLoaded', onConnectionChange);
  register();

  Chaka.pwa = {
    status,
    promptInstall,
    canInstall: () => Boolean(installEvent),
    isStandalone,
    isIos,
    onChange: (listener) => listeners.add(listener),
  };
})();
