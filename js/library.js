'use strict';

(() => {
  const { $, $$, buildElement, debounce } = Chaka;
  const state = { cat: 'ყველა', q: '' };

  const hl = (text, q) => {
    if (!q) return [text];
    const out = []; const low = text.toLowerCase(); let i = 0;
    for (let at = low.indexOf(q); at !== -1; at = low.indexOf(q, i)) {
      out.push(text.slice(i, at), buildElement('mark', { text: text.slice(at, at + q.length) }));
      i = at + q.length;
    }
    out.push(text.slice(i));
    return out.filter((x) => x !== '');
  };

  const haystack = (a) => [a.title, a.tag, a.lead, a.doctor, ...a.signs, ...a.prevent].join(' ').toLowerCase();

  const section = (title, items, q, cls = '') => buildElement('div', { class: cls },
    buildElement('h3', { text: title }),
    Array.isArray(items) ? buildElement('ul', {}, items.map((t) => buildElement('li', {}, hl(t, q)))) : buildElement('p', {}, hl(items, q)));

  const renderCats = () => {
    const box = $('#lib-cats');
    box.replaceChildren(...Chaka.CATEGORIES.map((c) => buildElement('button', { type: 'button', class: `chip${c === state.cat ? ' is-active' : ''}`, 'aria-pressed': String(c === state.cat),
      onClick: () => { state.cat = c; renderCats(); renderList(); } }, c)));
  };

  const CAT_COLOR = { 'გული': 'var(--coral)', 'ნივთიერებათა ცვლა': 'var(--amber)', 'ნერვული სისტემა': 'var(--violet)', 'სუნთქვა': 'var(--sky)', 'ცხოვრების წესი': 'var(--mint)' };

  const photoBox = (a, alt = '') => (a.img
    ? buildElement('span', { class: 'at-photo' }, buildElement('img', { src: a.img, alt, loading: 'lazy', decoding: 'async' }))
    : buildElement('span', { class: 'at-photo no-img', html: Chaka.logos.icon(a.icon) }));

  const openArticle = (a) => {
    const q = state.q.trim().toLowerCase();
    const dlg = $('#lib-modal');
    const head = a.img
      ? buildElement('figure', { class: 'lib-hero' }, buildElement('img', { src: a.img, alt: a.imgAlt || '' }))
      : buildElement('figure', { class: 'lib-hero no-img', html: Chaka.logos.icon(a.icon) });
    $('#lib-body').replaceChildren(
      head,
      buildElement('div', { class: 'modal-in lib-in', style: `--c:${CAT_COLOR[a.cat] || 'var(--mint)'}` },
        buildElement('p', { class: 'lib-cat' }, buildElement('span', { class: 'lib-dot', 'aria-hidden': 'true' }), a.cat, buildElement('span', { class: 'tag mono', text: a.tag })),
        buildElement('h3', { id: 'lib-title' }, hl(a.title, q)),
        buildElement('p', { class: 'lib-lead' }, hl(a.lead, q)),
        buildElement('div', { class: 'acc-body' },
          section('ნიშნები / ძირითადი ინფორმაცია', a.signs, q),
          section('როდის მივმართოთ ექიმს', a.doctor, q, 'red-flag'),
          section('პრევენცია და რჩევები', a.prevent, q),
          buildElement('p', { class: 'note', text: 'ინფორმაცია ზოგადია და არ ცვლის ექიმის კონსულტაციას.' }))));
    dlg.showModal();
    dlg.scrollTop = 0;
  };

  const renderList = () => {
    const q = state.q.trim().toLowerCase();
    const list = Chaka.ARTICLES.filter((a) => (state.cat === 'ყველა' || a.cat === state.cat) && (!q || haystack(a).includes(q)));
    $('#lib-count').textContent = `სტატია: ${list.length} / ${Chaka.ARTICLES.length}`;
    const box = $('#lib-list');
    if (!list.length) { box.replaceChildren(buildElement('div', { class: 'no-results' }, '🔍 ამ თემაზე სტატია ვერ მოიძებნა.')); return; }

    box.replaceChildren(...list.map((a) => buildElement('button', { type: 'button', class: 'at-tile', 'aria-haspopup': 'dialog', style: `--c:${CAT_COLOR[a.cat] || 'var(--mint)'}`, onClick: () => openArticle(a) },
      photoBox(a),
      buildElement('span', { class: 'at-meta' },
        buildElement('span', { class: 'at-tag mono', text: a.tag }),
        buildElement('strong', {}, hl(a.title, q)),
        buildElement('span', { class: 'at-cat', text: a.cat })))));
  };

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
    const start = () => { deck = shuffle(Chaka.MYTHS); i = 0; score = 0; finished = false; btns.forEach((b) => (b.hidden = false)); show(); };

    const answer = (a) => {
      if (answered) return; answered = true; setBtns(false);
      const m = deck[i], ok = m.a === a;
      if (ok) score += 1;
      exp.className = `myth-explain ${ok ? 'ok' : 'bad'}`;
      exp.replaceChildren(buildElement('b', { text: ok ? '✓ სწორია! ' : '✕ არასწორი. ' }), `ეს ${m.a === 'myth' ? 'მითია' : 'ფაქტია'}.`, buildElement('span', { text: m.why }));
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

  Chaka.library = { init };
})();
