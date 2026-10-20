'use strict';

(() => {
  const { store, buildElement, toast } = Chaka;
  const lang = Chaka.lang;
  const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'aria-label', 'title', 'alt'];
  const SKIPPED_TAGS = /^(SCRIPT|STYLE)$/;
  const GEORGIAN_LETTERS = /[Ⴀ-ჿ]/;

  const showLanguageNotice = () => {
    try {
      if (!sessionStorage.getItem('chaka.langnote')) return;
      sessionStorage.removeItem('chaka.langnote');
      setTimeout(() => toast('Interface translated. Medical articles, symptoms and first-aid texts are currently available in Georgian only.', 'ok', 6500), 2200);
    } catch { /* sessionStorage unavailable */ }
  };

  const switchLanguage = () => {
    const nextLang = lang === 'en' ? 'ka' : 'en';
    store.set('lang', nextLang);
    try {
      sessionStorage.setItem('chaka.noLoader', '1');
      if (nextLang === 'en') sessionStorage.setItem('chaka.langnote', '1');
    } catch { /* sessionStorage unavailable */ }
    location.reload();
  };

  const mountLanguageButton = () => {
    const host = document.querySelector('.header-actions');
    if (!host || document.getElementById('lang-toggle')) return;
    const label = lang === 'en' ? 'KA: ქართულად' : 'EN: switch to English';
    const button = buildElement('button', {
      type: 'button', id: 'lang-toggle', class: 'icon-btn lang-btn',
      'aria-label': label, title: lang === 'en' ? 'ქართულად' : 'English', onClick: switchLanguage,
    }, lang === 'en' ? 'KA' : 'EN');
    host.insertBefore(button, document.getElementById('theme-toggle') || host.firstChild);
  };

  document.documentElement.lang = lang === 'en' ? 'en' : 'ka';
  document.addEventListener('DOMContentLoaded', mountLanguageButton);
  if (lang !== 'en') return;

  const revealPage = () => document.documentElement.classList.remove('i18n-pending');

  const createTranslator = () => {
    const dictionary = new Map(Object.entries(Chaka.I18N_EN).map(([key, value]) => [key.trim(), value]));
    Chaka.CLINICS?.forEach((clinic) => { if (clinic.nameEn) dictionary.set(clinic.name, clinic.nameEn); });

    const translate = (text, depth = 0) => {
      const [, leading, core, trailing] = text.match(/^(\s*)([\s\S]*?)(\s*)$/);
      if (!core || !GEORGIAN_LETTERS.test(core)) return text;

      let result = dictionary.get(core);
      if (result === undefined) {
        for (const [pattern, build] of Chaka.I18N_PATTERNS) {
          const match = core.match(pattern);
          if (match) { result = build(match, (part) => translate(part, depth + 1)); break; }
        }
      }
      if (result === undefined && depth < 2) {
        for (const separator of [' · ', ', ', ' / ']) {
          if (!core.includes(separator)) continue;
          const parts = core.split(separator);
          const translatedParts = parts.map((part) => translate(part, depth + 1));
          if (translatedParts.some((part, i) => part !== parts[i])) { result = translatedParts.join(separator); break; }
        }
      }
      return result === undefined ? text : leading + result + trailing;
    };
    return translate;
  };

  const startTranslation = () => {
    const translate = createTranslator();
    Chaka.translate = translate;

    const textStates = new WeakMap();
    const attributeStates = new WeakMap();

    const translateTextNode = (node) => {
      const previous = textStates.get(node);
      if (previous && node.nodeValue === previous.written) return;
      const original = node.nodeValue;
      const written = translate(original);
      textStates.set(node, { original, written });
      if (written !== original) node.nodeValue = written;
    };

    const translateAttribute = (element, attribute) => {
      const value = element.getAttribute(attribute);
      if (value === null) return;
      const states = attributeStates.get(element) || {};
      const previous = states[attribute];
      if (previous && value === previous.written) return;
      const written = translate(value);
      states[attribute] = { original: value, written };
      attributeStates.set(element, states);
      if (written !== value) element.setAttribute(attribute, written);
    };

    const translateTree = (root) => {
      if (root.nodeType === Node.TEXT_NODE) { translateTextNode(root); return; }
      if (root.nodeType !== Node.ELEMENT_NODE || SKIPPED_TAGS.test(root.tagName)) return;

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
        acceptNode: (node) => (node.nodeType === Node.ELEMENT_NODE && SKIPPED_TAGS.test(node.tagName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
      });
      const nodes = [root];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
        else TRANSLATABLE_ATTRIBUTES.forEach((attribute) => translateAttribute(node, attribute));
      });
    };

    document.title = translate(document.title);
    translateTree(document.body);

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'childList') record.addedNodes.forEach(translateTree);
        else if (record.type === 'characterData') translateTextNode(record.target);
        else if (record.type === 'attributes') translateAttribute(record.target, record.attributeName);
      }
      observer.takeRecords();
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: TRANSLATABLE_ATTRIBUTES });

    revealPage();
    showLanguageNotice();
  };

  document.addEventListener('DOMContentLoaded', () => {
    Chaka.loadScript('js/i18n-en.js').then(() => Chaka.loadScript('js/i18n-en-features.js')).then(startTranslation).catch(revealPage);
  });
})();
