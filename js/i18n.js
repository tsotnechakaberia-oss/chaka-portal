'use strict';

(() => {
  const { store, el, toast } = Vita;
  const lang = Vita.lang;
  const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];

  const note = () => {
    try { if (sessionStorage.getItem('vita.langnote')) { sessionStorage.removeItem('vita.langnote'); setTimeout(() => toast('Interface translated. Medical articles, symptoms and first-aid texts are currently available in Georgian only.', 'ok', 6500), 2200); } } catch {  }
  };

  const switchLang = () => {
    const next = lang === 'en' ? 'ka' : 'en';
    store.set('lang', next);
    try { sessionStorage.setItem('vita.noLoader', '1'); if (next === 'en') sessionStorage.setItem('vita.langnote', '1'); } catch {  }
    location.reload();
  };

  const mountButton = () => {
    const host = document.querySelector('.header-actions'); if (!host || document.getElementById('lang-toggle')) return;
    const btn = el('button', { type: 'button', id: 'lang-toggle', class: 'icon-btn lang-btn', 'aria-label': lang === 'en' ? 'ქართულად' : 'Switch to English', title: lang === 'en' ? 'ქართულად' : 'English', onClick: switchLang }, lang === 'en' ? 'KA' : 'EN');
    host.insertBefore(btn, document.getElementById('theme-toggle') || host.firstChild);
  };

  document.documentElement.lang = lang === 'en' ? 'en' : 'ka';
  document.addEventListener('DOMContentLoaded', () => { mountButton(); });
  if (lang !== 'en') return;

  const dict = new Map(Object.entries(Vita.I18N_EN).map(([k, v]) => [k.trim(), v]));
  const hasGeo = (s) => /[Ⴀ-ჿ]/.test(s);

  const tr = (str, depth = 0) => {
    const [, lead, core, trail] = str.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!core || !hasGeo(core)) return str;
    let out = dict.get(core);
    if (out === undefined) {
      for (const [re, fn] of Vita.I18N_PATTERNS) { const m = core.match(re); if (m) { out = fn(m, (x) => tr(x, depth + 1)); break; } }
    }
    if (out === undefined && depth < 2) {
      for (const sep of [' · ', ', ', ' / ']) {
        if (!core.includes(sep)) continue;
        const parts = core.split(sep), done = parts.map((p) => tr(p, depth + 1));
        if (done.some((d, i) => d !== parts[i])) { out = done.join(sep); break; }
      }
    }
    return out === undefined ? str : lead + out + trail;
  };
  Vita.tr = tr;

  Vita.CLINICS?.forEach((c) => { if (c.nameEn) dict.set(c.name, c.nameEn); });

  const textState = new WeakMap();
  const attrState = new WeakMap();

  const doText = (node) => {
    const st = textState.get(node);
    if (st && node.nodeValue === st.written) return;
    const orig = node.nodeValue, out = tr(orig);
    textState.set(node, { orig, written: out });
    if (out !== orig) node.nodeValue = out;
  };
  const doAttr = (elm, attr) => {
    const v = elm.getAttribute(attr); if (v === null) return;
    const all = attrState.get(elm) || {}, st = all[attr];
    if (st && v === st.written) return;
    const out = tr(v); all[attr] = { orig: v, written: out }; attrState.set(elm, all);
    if (out !== v) elm.setAttribute(attr, out);
  };
  const walk = (root) => {
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1) return;
    if (/^(SCRIPT|STYLE)$/.test(root.tagName)) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, { acceptNode: (n) => (n.nodeType === 1 && /^(SCRIPT|STYLE)$/.test(n.tagName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
    const nodes = [root];
    while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach((n) => { if (n.nodeType === 3) doText(n); else ATTRS.forEach((a) => doAttr(n, a)); });
  };

  const start = () => {
    document.title = tr(document.title);
    walk(document.body);
    const obs = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === 'childList') r.addedNodes.forEach(walk);
        else if (r.type === 'characterData') doText(r.target);
        else if (r.type === 'attributes') doAttr(r.target, r.attributeName);
      }
      obs.takeRecords();
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    note();
  };

  document.addEventListener('DOMContentLoaded', start);
})();
