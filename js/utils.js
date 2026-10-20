'use strict';

window.Chaka = window.Chaka || {};

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const buildElement = (tag, props = {}, ...children) => {
    const node = document.createElement(tag);
    for (const [key, val] of Object.entries(props || {})) {
      if (val === null || val === undefined || val === false) continue;
      if (key === 'class') node.className = val;
      else if (key === 'text') node.textContent = val;
      else if (key === 'html') node.innerHTML = val;
      else if (key === 'dataset') Object.assign(node.dataset, val);
      else if (key.startsWith('on') && typeof val === 'function') node.addEventListener(key.slice(2).toLowerCase(), val);
      else node.setAttribute(key, val === true ? '' : val);
    }
    for (const child of children.flat()) {
      if (child === null || child === undefined || child === false) continue;
      node.append(child.nodeType ? child : document.createTextNode(String(child)));
    }
    return node;
  };

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const pad = (n) => String(n).padStart(2, '0');
  const todayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const store = {
    get(key, fallback) {
      try { const raw = localStorage.getItem('chaka.' + key); return raw === null ? fallback : JSON.parse(raw); }
      catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('chaka.' + key, JSON.stringify(value)); } catch { /* storage unavailable or full */ }
    },
  };

  const scriptLoads = new Map();
  const loadScript = (src) => {
    if (!scriptLoads.has(src)) {
      scriptLoads.set(src, new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => { scriptLoads.delete(src); reject(new Error(`Failed to load ${src}`)); };
        document.head.append(script);
      }));
    }
    return scriptLoads.get(src);
  };

  const toast = (message, type = 'ok', ms = 3600) => {
    const host = $('#toasts');
    if (!host) return;
    const node = buildElement('div', { class: `toast ${type === 'error' ? 'error' : ''}`, role: 'status' },
      buildElement('span', { text: type === 'error' ? '⚠' : '✓', style: `color:var(--${type === 'error' ? 'coral' : 'mint'});font-weight:800` }),
      buildElement('span', { text: message }));
    host.append(node);
    setTimeout(() => { node.classList.add('out'); setTimeout(() => node.remove(), 400); }, ms);
  };

  const paintRange = (input) => {
    const min = +input.min || 0, max = +input.max || 100;
    input.style.setProperty('--p', `${((input.value - min) / (max - min)) * 100}%`);
  };

  const setError = (input, message) => {
    const slot = document.querySelector(`[data-err="${input.id}"]`);
    if (slot) slot.textContent = message || '';
    if (input.classList) {
      input.classList.toggle('invalid', Boolean(message));
      input.classList.toggle('valid', !message && Boolean(input.value));
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
    }
    return !message;
  };
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

  const isGePhone = (v) => /^(\+?995)?\s?5\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}$/.test(v.trim());

  const formatGePhone = (v) => {
    let d = String(v).replace(/\D/g, '');
    if (d.startsWith('995')) d = d.slice(3);
    d = d.slice(0, 9);
    return [d.slice(0, 3), d.slice(3, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ');
  };

  const lang = store.get('lang', 'ka') === 'en' ? 'en' : 'ka';
  const t = (ka, en) => (lang === 'en' ? en : ka);
  const pick = (text) => (lang === 'en' ? text.en : text.ka);
  const locale = () => (lang === 'en' ? 'en-GB' : 'ka-GE');

  Object.assign(window.Chaka, { lang, t, pick, locale, $, $$, buildElement, clamp, prefersReduced, debounce, pad, todayKey, store, loadScript, toast, paintRange, setError, isEmail, isGePhone, formatGePhone });
})();
