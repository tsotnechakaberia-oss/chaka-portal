'use strict';
/* ==========================================================
   library.js — სამედიცინო ბიბლიოთეკა (ძებნა, კატეგორიები,
   აკორდეონი) და „მითი თუ ფაქტი“ მინი-თამაში
   ========================================================== */
(() => {
  const { $, $$, el, debounce } = Vita;
  const state = { cat: 'ყველა', q: '' };

  /** ძებნილი ტექსტის მონიშვნა <mark>-ით */
  const hl = (text, q) => {
    if (!q) return [text];
    const out = []; const low = text.toLowerCase(); let i = 0;
    for (let at = low.indexOf(q); at !== -1; at = low.indexOf(q, i)) {
      out.push(text.slice(i, at), el('mark', { text: text.slice(at, at + q.length) }));
      i = at + q.length;
    }
    out.push(text.slice(i));
    return out.filter((x) => x !== '');
  };

  const haystack = (a) => [a.title, a.tag, a.lead, a.doctor, ...a.signs, ...a.prevent].join(' ').toLowerCase();

  const section = (title, items, q, cls = '') => el('div', { class: cls },
    el('h4', { text: title }),
    Array.isArray(items) ? el('ul', {}, items.map((t) => el('li', {}, hl(t, q)))) : el('p', {}, hl(items, q)));

  const renderCats = () => {
    const box = $('#lib-cats');
    box.replaceChildren(...Vita.CATEGORIES.map((c) => el('button', { type: 'button', class: `chip${c === state.cat ? ' is-active' : ''}`, 'aria-pressed': String(c === state.cat),
      onClick: () => { state.cat = c; renderCats(); renderList(); } }, c)));
  };

  const renderList = () => {
    const q = state.q.trim().toLowerCase();
    const list = Vita.ARTICLES.filter((a) => (state.cat === 'ყველა' || a.cat === state.cat) && (!q || haystack(a).includes(q)));
    $('#lib-count').textContent = `სტატია: ${list.length} / ${Vita.ARTICLES.length}`;
    const box = $('#lib-list');
    if (!list.length) { box.replaceChildren(el('div', { class: 'no-results' }, '🔍 ამ თემაზე სტატია ვერ მოიძებნა.')); return; }

    box.replaceChildren(...list.map((a, i) => {
      const id = `acc-${a.id}`;
      const item = el('div', { class: 'acc-item', style: `animation-delay:${i * 50}ms` });
      const btn = el('button', { type: 'button', class: 'acc-btn', 'aria-expanded': 'false', 'aria-controls': id },
        el('span', { class: 'chip-ico', html: Vita.logos.icon(a.icon) }), el('span', {}, hl(a.title, q)), el('span', { class: 'tag mono', text: a.tag }), el('span', { class: 'plus', 'aria-hidden': 'true' }));
      const panel = el('div', { class: 'acc-panel', id, role: 'region' },
        el('div', { class: 'acc-inner' }, el('div', { class: 'acc-body' },
          el('p', {}, hl(a.lead, q)),
          section('ნიშნები / ძირითადი ინფორმაცია', a.signs, q),
          section('როდის მივმართოთ ექიმს', a.doctor, q, 'red-flag'),
          section('პრევენცია და რჩევები', a.prevent, q),
          el('p', { class: 'note', text: 'ინფორმაცია ზოგადია და არ ცვლის ექიმის კონსულტაციას.' }))));
      const toggle = (open) => { item.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open)); };
      btn.addEventListener('click', () => toggle(!item.classList.contains('open')));
      item.append(btn, panel);
      if (q && list.length <= 3) toggle(true);
      return item;
    }));
  };

  /* ---------- მითი თუ ფაქტი ---------- */
  const initMyth = () => {
    const qEl = $('#myth-q'), exp = $('#myth-explain'), next = $('#myth-next'), scoreEl = $('#myth-score');
    const btns = $$('[data-answer]');
    let deck = [], i = 0, score = 0, answered = false, finished = false;

    const shuffle = (arr) => { const a = [...arr]; for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a; };
    const setBtns = (on) => btns.forEach((b) => { b.disabled = !on; });

    const show = () => {
      answered = false; exp.textContent = ''; exp.className = 'myth-explain'; next.hidden = true; setBtns(true);
      qEl.textContent = `„${deck[i].q}“`;
      scoreEl.textContent = `${score} / ${i}`;
    };
    const start = () => { deck = shuffle(Vita.MYTHS); i = 0; score = 0; finished = false; btns.forEach((b) => (b.hidden = false)); show(); };

    const answer = (a) => {
      if (answered) return; answered = true; setBtns(false);
      const m = deck[i], ok = m.a === a;
      if (ok) score += 1;
      exp.className = `myth-explain ${ok ? 'ok' : 'bad'}`;
      exp.replaceChildren(el('b', { text: ok ? '✓ სწორია! ' : '✕ არასწორი. ' }), `ეს ${m.a === 'myth' ? 'მითია' : 'ფაქტია'}.`, el('span', { text: m.why }));
      scoreEl.textContent = `${score} / ${i + 1}`;
      next.hidden = false; next.textContent = i === deck.length - 1 ? 'შედეგის ნახვა' : 'შემდეგი →';
    };

    next.addEventListener('click', () => {
      if (finished) { start(); return; }
      if (i < deck.length - 1) { i += 1; show(); return; }
      qEl.textContent = score >= deck.length - 1 ? `🏆 შესანიშნავია! ${score} / ${deck.length}` : score >= deck.length / 2 ? `👍 კარგი შედეგია: ${score} / ${deck.length}` : `📚 ${score} / ${deck.length} — წაიკითხე ბიბლიოთეკა და სცადე თავიდან`;
      exp.textContent = ''; btns.forEach((b) => (b.hidden = true)); next.textContent = '↻ თავიდან'; finished = true;
    });
    btns.forEach((b) => b.addEventListener('click', () => answer(b.dataset.answer)));
    start();
  };

  const init = () => {
    renderCats(); renderList(); initMyth();
    $('#lib-search').addEventListener('input', debounce((e) => { state.q = e.target.value; renderList(); }, 150));
  };

  Vita.library = { init };
})();
