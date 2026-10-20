'use strict';

(() => {
  const { $, $$, buildElement, store, toast, setError, isEmail, isGePhone, todayKey, pad } = Chaka;
  const state = { spec: 'all', q: '', sort: 'rating', today: false };
  let bookings = [];

  const initials = (name) => name.split(' ').map((p) => p[0]).join('').slice(0, 2);
  const stars = (r) => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));
  const fmtDate = (iso) => new Date(iso + 'T00:00').toLocaleDateString(Chaka.locale(), { weekday: 'long', day: 'numeric', month: 'long' });

  const avatar = (d) => {
    const hue = (d.id * 47) % 360;
    return `<svg class="doc-avatar" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="20" fill="hsl(${hue} 60% 38%)"/>
      <circle cx="46" cy="14" r="22" fill="hsl(${(hue + 50) % 360} 80% 60%)" opacity=".35"/>
      <text x="32" y="40" text-anchor="middle" font-size="22" font-weight="800" fill="#fff" font-family="inherit">${initials(d.name)}</text></svg>`;
  };

  const renderChips = () => {
    const box = $('#spec-filter');
    box.replaceChildren(
      buildElement('button', { type: 'button', class: 'chip is-active', dataset: { spec: 'all' }, 'aria-pressed': 'true' }, 'ყველა'),
      ...Object.entries(Chaka.SPECS).map(([key, s]) =>
        buildElement('button', { type: 'button', class: 'chip', dataset: { spec: key }, 'aria-pressed': 'false' }, buildElement('span', { class: 'chip-ico', html: Chaka.logos.icon(s.icon) }), s.name)));
    box.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (chip) setSpec(chip.dataset.spec);
    });
  };

  const setSpec = (spec) => {
    state.spec = spec;
    $$('#spec-filter .chip').forEach((c) => { const on = c.dataset.spec === spec; c.classList.toggle('is-active', on); c.setAttribute('aria-pressed', String(on)); });
    renderGrid();
  };

  const filtered = () => {
    const q = state.q.trim().toLowerCase();
    const list = Chaka.DOCTORS.filter((d) =>
      (state.spec === 'all' || d.spec === state.spec) &&
      (!state.today || d.today) &&
      (!q || `${d.name} ${Chaka.SPECS[d.spec].name} ${d.bio}`.toLowerCase().includes(q)));
    const sorters = {
      rating: (a, b) => (b.rating ?? -1) - (a.rating ?? -1),
      exp: (a, b) => (b.exp ?? -1) - (a.exp ?? -1),
      price: (a, b) => (a.price ?? 1e9) - (b.price ?? 1e9),
      name: (a, b) => a.name.localeCompare(b.name, 'ka'),
    };
    return list.sort(sorters[state.sort]);
  };

  const card = (d, i) => {
    const sp = Chaka.SPECS[d.spec];
    const isTeam = d.spec === 'team';
    const open = () => { if (!isTeam) openBooking(d); };
    return buildElement('article', { class: 'doc-card card holo', style: `animation-delay:${i * 60}ms`, tabindex: '0', 'aria-label': `${d.name}, ${sp.name}`,
      onClick: (e) => { if (!e.target.closest('button')) open(); },
      onKeydown: (e) => { if (e.key === 'Enter') open(); } },
      d.spec === 'team' ? null : buildElement('span', { class: `avail${d.today ? '' : ' off'}`, text: d.today ? 'დღეს თავისუფალია' : 'ხვალიდან' }),
      buildElement('div', { class: 'doc-top' },
        buildElement('div', { html: avatar(d) }),
        buildElement('div', {}, buildElement('h3', { text: d.name }), buildElement('span', { class: 'doc-spec' }, buildElement('span', { class: 'chip-ico', html: Chaka.logos.icon(sp.icon) }), isTeam ? d.role : sp.name))),
      buildElement('div', { class: 'doc-meta' },
        d.rating ? buildElement('span', {}, buildElement('span', { class: 'stars', 'aria-hidden': 'true', text: stars(d.rating) }), ' ', buildElement('b', { class: 'mono', text: d.rating.toFixed(1) })) : null,
        d.exp ? buildElement('span', {}, buildElement('b', { text: d.exp }), ' წლის გამოცდილება') : null,
        d.langs ? buildElement('span', { text: d.langs }) : null,
        d.demo ? buildElement('span', { class: 'tag mono', text: 'დემო პროფილი' }) : null),
      buildElement('p', { class: 'doc-bio', text: isTeam ? 'პროექტის გუნდის წევრი. სპეციალობა და პროფილი დაზუსტდება.' : d.bio }),
      buildElement('div', { class: 'doc-foot' },
        buildElement('span', { class: 'price', text: d.price ? `${d.price} ₾` : isTeam ? '' : 'ფასი: შეთანხმებით' }),
        isTeam ? buildElement('span', { class: 'tag mono', text: 'GROUP' }) : buildElement('button', { type: 'button', class: 'btn btn-primary btn-sm', onClick: open }, 'დაჯავშნა')));
  };

  const renderGrid = () => {
    const grid = $('#doc-grid');
    const list = filtered();
    grid.replaceChildren(...(list.length ? list.map(card) : [buildElement('div', { class: 'no-results' }, buildElement('p', { text: '😕 ასეთი ექიმი ვერ მოიძებნა. სცადე სხვა ფილტრი.' }), buildElement('button', { class: 'btn btn-ghost btn-sm', type: 'button', onClick: resetFilters }, 'ფილტრების გასუფთავება'))]));
    $('#doc-count').textContent = `ნაპოვნია: ${list.length} / ${Chaka.DOCTORS.length}`;
  };

  const resetFilters = () => {
    Object.assign(state, { spec: 'all', q: '', today: false });
    $('#doc-search').value = ''; $('#doc-today').checked = false;
    setSpec('all');
  };

  const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const makeSlots = () => { const a = []; for (let h = 9; h < 18; h++) { a.push(`${pad(h)}:00`); a.push(`${pad(h)}:30`); } return a; };

  const slotState = (doc, date, time) => {
    if (hash(`${doc.id}|${date}|${time}`) % 10 < 3) return 'busy';
    if (bookings.some((b) => b.docId === doc.id && b.date === date && b.time === time)) return 'busy';
    if (date === todayKey()) { const [h, m] = time.split(':').map(Number); const now = new Date(); if (h * 60 + m <= now.getHours() * 60 + now.getMinutes() + 30) return 'past'; }
    return 'free';
  };

  const openBooking = (doc) => {
    const dlg = $('#booking-modal'), body = $('#bk-body');
    const sp = Chaka.SPECS[doc.spec];
    const min = todayKey(), maxD = new Date(); maxD.setDate(maxD.getDate() + 30);
    let chosen = null;

    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const startDate = makeSlots().some((t) => slotState(doc, min, t) === 'free') ? min : todayKey(tomorrow);

    const slotsBox = buildElement('div', { class: 'slots', role: 'group', 'aria-label': 'დროის არჩევა' });
    const slotErr = buildElement('small', { class: 'err', 'data-err': 'bk-slot' });
    const paintSlots = (date) => {
      chosen = null; slotErr.textContent = '';
      slotsBox.replaceChildren(...makeSlots().map((t) => {
        const st = slotState(doc, date, t);
        return buildElement('button', { type: 'button', class: 'slot', disabled: st !== 'free', 'aria-pressed': 'false', text: t,
          onClick: (e) => { $$('.slot', slotsBox).forEach((b) => { b.classList.remove('is-active'); b.setAttribute('aria-pressed', 'false'); }); e.currentTarget.classList.add('is-active'); e.currentTarget.setAttribute('aria-pressed', 'true'); chosen = t; slotErr.textContent = ''; } });
      }));
    };

    const f = {
      name: buildElement('input', { class: 'input', id: 'bk-name', type: 'text', placeholder: 'სახელი გვარი', autocomplete: 'name' }),
      phone: buildElement('input', { class: 'input', id: 'bk-phone', type: 'tel', placeholder: '5XX XX XX XX', autocomplete: 'tel' }),
      mail: buildElement('input', { class: 'input', id: 'bk-mail', type: 'email', placeholder: 'name@example.com (არასავალდებულო)', autocomplete: 'email' }),
      date: buildElement('input', { class: 'input', id: 'bk-date', type: 'date', min, max: todayKey(maxD), value: startDate }),
      note: buildElement('textarea', { class: 'input', id: 'bk-note', rows: '2', maxlength: '200', placeholder: 'ვიზიტის მიზეზი (არასავალდებულო)' }),
    };
    const row = (label, input, err = true) => buildElement('div', { class: 'form-row' }, buildElement('label', { for: input.id, text: label }), input, err ? buildElement('small', { class: 'err', 'data-err': input.id }) : null);

    const validate = () => {
      let ok = true;
      ok = setError(f.name, f.name.value.trim().split(/\s+/).filter(Boolean).length >= 2 && f.name.value.trim().length >= 5 ? '' : 'შეიყვანეთ სახელი და გვარი') && ok;
      ok = setError(f.phone, isGePhone(f.phone.value) ? '' : 'ფორმატი: 5XX XX XX XX') && ok;
      ok = setError(f.mail, !f.mail.value.trim() || isEmail(f.mail.value) ? '' : 'ელ-ფოსტა არასწორია') && ok;
      ok = setError(f.date, f.date.value && f.date.value >= min && f.date.value <= f.date.max ? '' : 'აირჩიეთ თარიღი მომდევნო 30 დღეში') && ok;
      if (!chosen) { slotErr.textContent = 'აირჩიეთ ვიზიტის დრო'; ok = false; }
      return ok;
    };

    const form = buildElement('form', { novalidate: true, onSubmit: (e) => {
      e.preventDefault();
      if (!validate()) { toast('გთხოვთ, გაასწოროთ ფორმის შეცდომები', 'error'); form.querySelector('.invalid')?.focus(); return; }
      const code = 'VT-' + Math.random().toString(36).slice(2, 7).toUpperCase();
      const rec = { code, docId: doc.id, patient: f.name.value.trim(), phone: f.phone.value.trim(), date: f.date.value, time: chosen, created: Date.now() };
      bookings.push(rec); store.set('bookings', bookings); renderBookings();
      showSuccess(rec);
    } },
      row('სახელი და გვარი', f.name), buildElement('div', { class: 'form-2' }, row('ტელეფონი', f.phone), row('ელ-ფოსტა', f.mail)),
      row('თარიღი', f.date), buildElement('div', { class: 'form-row' }, buildElement('label', { text: 'დრო' }), slotsBox, slotErr),
      row('შენიშვნა', f.note, false),
      buildElement('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'ვიზიტის დადასტურება'));

    f.name.addEventListener('blur', validateField(f.name, () => f.name.value.trim().split(/\s+/).length >= 2 ? '' : 'შეიყვანეთ სახელი და გვარი'));
    f.phone.addEventListener('input', () => { f.phone.value = Chaka.formatGePhone(f.phone.value); });
    f.phone.addEventListener('blur', validateField(f.phone, () => (isGePhone(f.phone.value) ? '' : 'ფორმატი: 5XX XX XX XX')));
    f.date.addEventListener('change', () => paintSlots(f.date.value || min));
    paintSlots(startDate);

    const showSuccess = (rec) => {
      body.replaceChildren(buildElement('div', { class: 'modal-in bk-ok' },
        buildElement('div', { html: '<svg viewBox="0 0 96 96" aria-hidden="true"><circle class="ok-ring" cx="48" cy="48" r="42"/><path class="ok-check" d="M28 50 L43 65 L70 34"/></svg>' }),
        buildElement('h3', { id: 'bk-title', text: 'ვიზიტი დაჯავშნილია!' }),
        buildElement('p', { text: `${doc.name} · ${fmtDate(rec.date)}, ${rec.time}` }),
        buildElement('div', { class: 'code', text: rec.code }),
        buildElement('p', { class: 'note', text: 'შეინახეთ ჯავშნის კოდი. ჯავშნების გაუქმება შესაძლებელია ქვემოთ, „ჩემი ჯავშნები“ ბლოკიდან.' }),
        buildElement('div', { style: 'display:flex;gap:.6rem;justify-content:center;flex-wrap:wrap' },
          buildElement('button', { class: 'btn btn-primary', type: 'button', onClick: () => downloadIcs([rec], `vizit-${rec.code}`) }, '📅 კალენდარში დამატება'),
          buildElement('button', { class: 'btn btn-ghost', type: 'button', onClick: () => dlg.close() }, 'დახურვა'))));
      toast('ჯავშანი წარმატებით დაემატა');
    };

    body.replaceChildren(buildElement('div', { class: 'modal-in' },
      buildElement('h3', { id: 'bk-title', text: 'ვიზიტის დაჯავშნა' }),
      buildElement('div', { class: 'bk-doc' }, buildElement('div', { html: avatar(doc) }), buildElement('div', {}, buildElement('b', { text: doc.name }), buildElement('br'), buildElement('span', { class: 'doc-spec' }, sp.name, doc.price ? ` · ${doc.price} ₾` : ''))),
      form));
    dlg.showModal();
  };

  const validateField = (input, fn) => () => setError(input, fn());

  const icsEscape = (t) => String(t).replace(/[\\;,]/g, (m) => '\\' + m).replace(/\n/g, '\\n');
  const icsStamp = (date, time, addMin = 0) => {
    const d = new Date(`${date}T${time}`); d.setMinutes(d.getMinutes() + addMin);
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  };
  const icsEvent = (b) => {
    const d = Chaka.DOCTORS.find((x) => x.id === b.docId);
    const title = d ? `ვიზიტი: ${d.name} (${Chaka.SPECS[d.spec].name})` : 'ვიზიტი ექიმთან';
    return ['BEGIN:VEVENT', `UID:${b.code}@chaka-med-portal`, `DTSTAMP:${icsStamp(todayKey(), '00:00')}`,
      `DTSTART:${icsStamp(b.date, b.time)}`, `DTEND:${icsStamp(b.date, b.time, 30)}`,
      `SUMMARY:${icsEscape(title)}`, `DESCRIPTION:${icsEscape(`ჯავშნის კოდი: ${b.code}\nპაციენტი: ${b.patient}`)}`,
      'BEGIN:VALARM', 'TRIGGER:-PT60M', 'ACTION:DISPLAY', 'DESCRIPTION:ვიზიტი ერთ საათში', 'END:VALARM', 'END:VEVENT'].join('\r\n');
  };
  const downloadIcs = (items, name) => {
    const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ჩაკა//Med Portal//KA', 'CALSCALE:GREGORIAN', ...items.map(icsEvent), 'END:VCALENDAR'].join('\r\n');
    const url = URL.createObjectURL(new Blob([body], { type: 'text/calendar;charset=utf-8' }));
    const a = buildElement('a', { href: url, download: `${name}.ics` });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('კალენდრის ფაილი ჩამოიტვირთა');
  };

  const renderBookings = () => {
    const list = $('#bookings-list');
    $('#bookings-count').textContent = bookings.length;
    if (!bookings.length) { list.replaceChildren(buildElement('li', { class: 'empty-note', text: 'ჯერ არ გაქვთ დაჯავშნილი ვიზიტი.' })); return; }
    const nowKey = todayKey() + ' ' + `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`;
    const sorted = [...bookings].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const upcoming = sorted.filter((b) => `${b.date} ${b.time}` >= nowKey);
    const rows = sorted.map((b) => {
      const d = Chaka.DOCTORS.find((x) => x.id === b.docId);
      const past = `${b.date} ${b.time}` < nowKey;
      return buildElement('li', { class: `booking-item${past ? ' is-past' : ''}` },
        buildElement('div', {}, buildElement('b', { text: d ? `${d.name} · ${Chaka.SPECS[d.spec].name}` : 'ექიმი' }), buildElement('small', { text: `${fmtDate(b.date)}, ${b.time} · ${b.patient}` })),
        buildElement('div', { style: 'display:flex;gap:.8rem;align-items:center' },
          buildElement('span', { class: 'booking-code', text: b.code }),
          past ? buildElement('span', { class: 'tag mono', text: 'დასრულდა' }) : buildElement('button', { type: 'button', class: 'btn btn-ghost btn-sm', title: 'კალენდარში დამატება (.ics)', onClick: () => downloadIcs([b], `vizit-${b.code}`) }, '📅 .ics'),
          past ? null : buildElement('a', { class: 'btn btn-ghost btn-sm', href: `prep.html?booking=${b.code}`, title: 'ვიზიტისთვის მომზადება' }, '📝 მომზადება'),
          buildElement('button', { type: 'button', class: 'btn btn-ghost btn-sm btn-danger', onClick: () => { bookings = bookings.filter((x) => x.code !== b.code); store.set('bookings', bookings); renderBookings(); toast('ჯავშანი გაუქმდა'); } }, 'გაუქმება')));
    });
    list.replaceChildren(...[...rows, upcoming.length > 1 ? buildElement('li', { class: 'booking-all' }, buildElement('button', { type: 'button', class: 'btn btn-primary btn-sm', onClick: () => downloadIcs(upcoming, 'chaka-vizitebi') }, `📅 ყველა მომავალი ვიზიტის ჩამოტვირთვა (${upcoming.length})`)) : null].filter(Boolean));
  };

  const init = () => {
    bookings = store.get('bookings', []);
    renderChips(); renderGrid(); renderBookings();
    $('#doc-search').addEventListener('input', Chaka.debounce((e) => { state.q = e.target.value; renderGrid(); }, 150));
    $('#doc-sort').addEventListener('change', (e) => { state.sort = e.target.value; renderGrid(); });
    $('#doc-today').addEventListener('change', (e) => { state.today = e.target.checked; renderGrid(); });
    const dlg = $('#booking-modal');
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  };

  const filterBy = (spec) => {
    state.q = ''; $('#doc-search').value = '';
    setSpec(spec);
    document.getElementById('doctors').scrollIntoView({ behavior: Chaka.prefersReduced() ? 'auto' : 'smooth' });
  };

  Chaka.doctors = { init, filterBy };
})();
