'use strict';

(() => {
  const { $, $$, buildElement, clamp, store, toast, todayKey, pad } = Chaka;

  const tween = (node, to, { dec = 1, suffix = '' } = {}) => {
    const from = parseFloat(node.textContent) || 0, t0 = performance.now(), dur = 700;
    const step = (now) => {
      const p = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 3);
      node.textContent = (from + (to - from) * e).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const initTabs = () => {
    const tabs = $$('#tool-tabs .tab');
    const show = (name) => {
      tabs.forEach((t) => { const on = t.dataset.tab === name; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
      $$('.tab-panel').forEach((p) => { p.hidden = p.dataset.panel !== name; p.classList.toggle('is-active', p.dataset.panel === name); });
      ({ bmi: bmi.update, water: water.update, pulse: pulse.update, sleep: sleep.update, tracker: tracker.render })[name]?.();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => show(t.dataset.tab));
      t.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        next.focus(); show(next.dataset.tab);
      });
    });
  };

  const bmi = (() => {
    const h = $('#bmi-h'), w = $('#bmi-w');
    const angle = (b) => {
      b = clamp(b, 12, 40);
      if (b < 18.5) return -90 + ((b - 12) / 6.5) * 45;
      if (b < 25) return -45 + ((b - 18.5) / 6.5) * 45;
      if (b < 30) return ((b - 25) / 5) * 45;
      return 45 + ((b - 30) / 10) * 45;
    };
    const cats = [
      [18.5, 'სიფიფქე', 'var(--sky)', 'წონა ნორმაზე დაბალია. თუ ეს უმიზეზოდ მოხდა ან თან დაღლილობა გაქვთ — მიმართეთ ექიმს.'],
      [25, 'ნორმა', 'var(--mint)', 'ინდექსი ნორმის ფარგლებშია. შეინარჩუნეთ აქტიურობა და დაბალანსებული კვება.'],
      [30, 'ჭარბი წონა', 'var(--amber)', 'ჭარბი წონა ზრდის გულ-სისხლძარღვთა და ნივთიერებათა ცვლის რისკებს. მცირე ცვლილებებიც ეფექტურია.'],
      [Infinity, 'სიმსუქნე', 'var(--coral)', 'რეკომენდებულია ექიმთან ან დიეტოლოგთან კონსულტაცია ინდივიდუალური გეგმისთვის.'],
    ];
    const update = () => {
      const hm = +h.value / 100, v = +w.value / (hm * hm);
      const [, name, color, note] = cats.find(([lim]) => v < lim);
      $('#bmi-h-out').textContent = h.value; $('#bmi-w-out').textContent = w.value;
      $('#bmi-needle').style.transform = `rotate(${angle(v)}deg)`;
      tween($('#bmi-val'), v);
      const cat = $('#bmi-cat'); cat.textContent = name; cat.style.color = color;
      const lo = (18.5 * hm * hm).toFixed(0), hi = (24.9 * hm * hm).toFixed(0);
      $('#bmi-note').textContent = `${note} ამ სიმაღლისთვის ნორმის დიაპაზონია დაახლოებით ${lo}–${hi} კგ.`;
    };
    [h, w].forEach((i) => i.addEventListener('input', update));
    return { update };
  })();

  const water = (() => {
    const w = $('#wt-w'), a = $('#wt-a'), hot = $('#wt-hot');
    const update = () => {
      const ml = +w.value * 30 + (+a.value / 30) * 350 + (hot.checked ? 500 : 0);
      $('#wt-w-out').textContent = w.value; $('#wt-a-out').textContent = a.value;
      tween($('#wt-val'), ml / 1000, { dec: 1, suffix: ' ლ' });
      $('#bottle-fill').style.height = `${clamp((ml / 4500) * 100, 8, 100)}%`;
      $('#wt-note').textContent = `დაახლოებით ${Math.round(ml / 250)} ჭიქა (250 მლ) დღეში, სითხის ჩათვლით საკვებიდან მიღებული წყლის გარდა — დაყავით დღის განმავლობაში.`;
    };
    [w, a, hot].forEach((i) => i.addEventListener('input', update));
    return { update };
  })();

  const pulse = (() => {
    const age = $('#pl-age');
    const zones = [
      ['მსუბუქი', .5, .6, 'var(--sky)', 'გახურება, აღდგენა'],
      ['ცხიმის წვის', .6, .7, 'var(--mint)', 'ხანგრძლივი მსუბუქი კარდიო'],
      ['აერობული', .7, .8, 'var(--amber)', 'გამძლეობის გაუმჯობესება'],
      ['ანაერობული', .8, .9, 'var(--violet)', 'მაღალი ინტენსივობა'],
      ['მაქსიმუმი', .9, 1, 'var(--coral)', 'მხოლოდ მოკლე ინტერვალები'],
    ];
    const update = () => {
      const max = 220 - +age.value;
      $('#pl-age-out').textContent = age.value; $('#pl-max').textContent = max;
      const list = $('#zones');
      list.replaceChildren(...zones.map(([n, lo, hi, c, d]) => {
        const bar = buildElement('i', { style: `background:${c}` });
        requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = `${hi * 100 - 40}%`; }));
        return buildElement('li', { class: 'zone' }, buildElement('span', {}, buildElement('b', { text: n }), ' ', buildElement('small', { text: d })), buildElement('span', { class: 'rng', text: `${Math.round(max * lo)}–${Math.round(max * hi)}` }), buildElement('div', { class: 'zb' }, bar));
      }));
    };
    age.addEventListener('input', update);

    const start = $('#pulse-start'), beat = $('#beat-btn'), status = $('#pulse-status');
    let taps = 0, timer = null;
    start.addEventListener('click', () => {
      clearInterval(timer); taps = 0;
      let left = 15; beat.disabled = false; beat.focus(); start.disabled = true;
      status.textContent = `დარჩა ${left} წმ · დარტყმები: 0`;
      timer = setInterval(() => {
        left -= 1;
        if (left > 0) { status.textContent = `დარჩა ${left} წმ · დარტყმები: ${taps}`; return; }
        clearInterval(timer); beat.disabled = true; start.disabled = false;
        const bpm = taps * 4;
        const verdict = bpm === 0 ? 'ვერ დავთვალეთ — სცადეთ თავიდან.' : bpm < 60 ? 'ნელი პულსი (სპორტსმენებში შეიძლება ნორმა იყოს).' : bpm <= 100 ? 'მოსვენებულ მდგომარეობაში ნორმის დიაპაზონია (60–100).' : 'მომატებულია; დაისვენეთ და გაზომეთ თავიდან. განმეორებისას მიმართეთ ექიმს.';
        status.textContent = `შედეგი: ≈ ${bpm} დარტყმა/წთ. ${verdict}`;
        toast(`პულსი ≈ ${bpm} დ/წთ`);
      }, 1000);
    });
    beat.addEventListener('click', () => { taps += 1; beat.classList.add('hit'); setTimeout(() => beat.classList.remove('hit'), 90); });
    return { update };
  })();

  const sleep = (() => {
    const input = $('#sleep-time');
    let mode = 'wake';
    const fmt = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const update = () => {
      const list = $('#sleep-results');
      const [hh, mm] = input.value.split(':').map(Number);
      const base = new Date();
      let items;
      if (mode === 'wake') {
        base.setHours(hh || 0, mm || 0, 0, 0);
        items = [6, 5, 4].map((c) => ({ c, t: new Date(base.getTime() - (c * 90 + 15) * 60000) }));
        $('#sleep-label').textContent = 'რომ გამოიღვიძო ციკლის ბოლოს, დაწექი:';
      } else {
        items = [4, 5, 6].map((c) => ({ c, t: new Date(Date.now() + (c * 90 + 15) * 60000) }));
        $('#sleep-label').textContent = 'თუ ახლავე დაწვები, ოპტიმალური გაღვიძების დრო:';
      }
      list.replaceChildren(...items.map(({ c, t }, i) => buildElement('li', { class: (mode === 'wake' ? i === 1 : i === 1) ? 'best' : '', style: `animation-delay:${i * 90}ms` },
        buildElement('b', { text: fmt(t) }), buildElement('small', { text: `${c} ციკლი · ${(c * 1.5).toFixed(1)} სთ` }))));
    };
    input.addEventListener('input', update);
    $$('.seg-btn').forEach((b) => b.addEventListener('click', () => {
      mode = b.dataset.mode;
      $$('.seg-btn').forEach((x) => x.classList.toggle('is-active', x === b));
      input.disabled = mode === 'now';
      $('#sleep-time-label').textContent = mode === 'wake' ? 'როდის უნდა გაიღვიძო?' : 'გაღვიძების დრო გამოითვლება ახლანდელიდან';
      update();
    }));
    return { update };
  })();

  const tracker = (() => {
    const MOODS = ['😞', '😐', '🙂', '😄', '🤩'];
    const score = (r) => Math.round(clamp(r.water / 8, 0, 1) * 35 + clamp(r.steps / 8000, 0, 1) * 35 + clamp(r.sleep / 7, 0, 1) * 30);
    const load = () => store.get('tracker', {});
    const rec = () => ({ water: 0, steps: 0, sleep: 0, mood: null, ...(load()[todayKey()] || {}) });
    const save = (r) => { const all = load(); all[todayKey()] = r; store.set('tracker', all); };
    let built = false;

    const build = () => {
      const g = $('#glasses'); g.replaceChildren(...Array.from({ length: 8 }, (_, i) => buildElement('button', { type: 'button', class: 'glass', 'aria-label': `ჭიქა ${i + 1}`, 'aria-pressed': 'false',
        onClick: () => { const r = rec(); r.water = r.water === i + 1 ? i : i + 1; save(r); render(); } })));
      $('#moods').replaceChildren(...MOODS.map((m, i) => buildElement('button', { type: 'button', class: 'mood', 'aria-label': `განწყობა ${i + 1}`, text: m,
        onClick: () => { const r = rec(); r.mood = i; save(r); render(); } })));
      $('#tr-steps').addEventListener('input', (e) => { const r = rec(); r.steps = +e.target.value; save(r); render(true); });
      $('#tr-sleep').addEventListener('input', (e) => { const r = rec(); r.sleep = +e.target.value; save(r); render(true); });
      built = true;
    };

    const render = (fromRange = false) => {
      if (!built) build();
      const r = rec(), s = score(r);
      $$('#glasses .glass').forEach((gl, i) => { gl.classList.toggle('is-full', i < r.water); gl.setAttribute('aria-pressed', String(i < r.water)); });
      $$('#moods .mood').forEach((m, i) => m.classList.toggle('is-active', r.mood === i));
      if (!fromRange) { $('#tr-steps').value = r.steps; $('#tr-sleep').value = r.sleep; Chaka.paintRange($('#tr-steps')); Chaka.paintRange($('#tr-sleep')); }
      $('#tr-steps-out').textContent = r.steps.toLocaleString(Chaka.locale()); $('#tr-sleep-out').textContent = r.sleep;
      $('#score-val').textContent = s;
      const fg = $('#ring-fg'); fg.style.strokeDashoffset = 327 * (1 - s / 100);
      fg.style.stroke = s >= 80 ? 'var(--mint)' : s >= 50 ? 'var(--amber)' : 'var(--coral)';
      $('#score-note').textContent = s >= 80 ? 'შესანიშნავი დღეა! ასე გააგრძელე 💚' : s >= 50 ? 'კარგი ტემპია — კიდევ ცოტა წყალი ან გასეირნება.' : 'დღე ახლა იწყება: ერთი ჭიქა წყალი და 10-წუთიანი ნაბიჯები კარგი დასაწყისია.';

      const all = load(), bars = $('#week-bars'); const days = ['კვ', 'ორ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ'];
      bars.replaceChildren(...Array.from({ length: 7 }, (_, k) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - k));
        const v = all[todayKey(d)] ? score({ water: 0, steps: 0, sleep: 0, ...all[todayKey(d)] }) : 0;
        const bar = buildElement('i', { style: 'height:0' });
        requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.height = `${Math.max(v * 0.62, 3)}px`; }));
        return buildElement('div', { class: `wb${k === 6 ? ' today' : ''}`, title: `${v}` }, bar, buildElement('span', { text: days[d.getDay()] }));
      }));
    };
    return { render };
  })();

  const init = () => { initTabs(); bmi.update(); };
  Chaka.tools = { init };
})();
