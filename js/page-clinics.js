'use strict';

(() => {
  const { $, el, debounce } = Vita;
  const state = { q: '', region: 'all', type: 'all', profile: 'all' };
  let map, list = [], me = null;

  const km = (aLat, aLon, bLat, bLon) => {
    const r = (d) => d * Math.PI / 180, dLat = r(bLat - aLat), dLon = r(bLon - aLon);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(aLat)) * Math.cos(r(bLat)) * Math.sin(dLon / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(h));
  };
  const dist = (c) => (me ? km(me.lat, me.lon, c.lat, c.lon) : null);
  const fmtKm = (d) => (d < 10 ? d.toFixed(1) : Math.round(d)) + ' კმ';

  const osm = (c) => `https://www.openstreetmap.org/?mlat=${c.lat}&mlon=${c.lon}#map=16/${c.lat}/${c.lon}`;

  const filtered = () => {
    const q = state.q.trim().toLowerCase();
    return Vita.CLINICS.filter((c) =>
      (state.region === 'all' || c.region === state.region) && (state.type === 'all' || c.type === state.type) &&
      (state.profile === 'all' || c.profiles.includes(state.profile)) &&
      (!q || `${c.name} ${c.nameEn} ${c.city} ${c.region} ${c.profiles.join(' ')}`.toLowerCase().includes(q)));
  };

  const showDetail = (c) => {
    const box = $('#clinic-detail');
    if (!c) { box.replaceChildren(el('p', { class: 'empty-note', text: 'აირჩიეთ მარკერი რუკაზე ან კლინიკა სიიდან — აქ გამოჩნდება დეტალები.' })); return; }
    const t = Vita.CLINIC_TYPES[c.type];
    box.replaceChildren(el('div', { class: 'clinic-detail' },
      el('h3', { text: c.name }), el('p', { class: 'en', text: c.nameEn }),
      el('div', { class: 'tag-row' }, el('span', { class: `tag mono t-${c.type === 'university' ? 'private' : c.type}`, text: t.name }), ...c.profiles.map((p) => el('span', { class: 'tag mono', text: p }))),
      el('dl', {}, el('dt', { text: 'ქალაქი' }), el('dd', { text: c.city }), el('dt', { text: 'რეგიონი' }), el('dd', { text: c.region }),
        c.address ? [el('dt', { text: 'მისამართი' }), el('dd', { text: c.address })] : null,
        el('dt', { text: 'კოორდინატები' }), el('dd', { class: 'mono', text: `${c.lat.toFixed(4)}, ${c.lon.toFixed(4)} (მიახლ.)` })),
      el('div', { style: 'display:flex;gap:.6rem;flex-wrap:wrap' },
        el('a', { class: 'btn btn-primary btn-sm', href: osm(c), target: '_blank', rel: 'noopener noreferrer' }, 'OpenStreetMap ↗'),
        el('a', { class: 'btn btn-ghost btn-sm', href: `index.html#doctors` }, 'ექიმები'))));
    document.querySelectorAll('.clinic-item').forEach((n) => n.classList.toggle('is-active', n.dataset.id === c.id));
  };

  const select = (c, fly = true) => { map.select(c, { fly }); showDetail(c); };

  const renderList = () => {
    list = filtered();
    if (me) list.sort((a, b) => dist(a) - dist(b));
    $('#clinic-count').textContent = `ნაპოვნია: ${list.length} / ${Vita.CLINICS.length}`;
    const box = $('#clinic-list');
    box.replaceChildren(...(list.length ? list.map((c) => el('button', { type: 'button', class: 'clinic-item', dataset: { id: c.id }, onClick: () => select(c) },
      el('b', { text: c.name }), me ? el('span', { class: 'dist', text: `📍 ${fmtKm(dist(c))}` }) : null, el('small', { text: `${c.city} · ${Vita.CLINIC_TYPES[c.type].name} · ${c.profiles.slice(0, 2).join(', ')}` }))) : [el('p', { class: 'empty-note', text: '😕 ამ ფილტრით დაწესებულება ვერ მოიძებნა.' })]));
    map.setData(list);
  };

  const init = () => {
    const regions = [...new Set(Vita.CLINICS.map((c) => c.region))];
    const profiles = [...new Set(Vita.CLINICS.flatMap((c) => c.profiles))].sort((a, b) => a.localeCompare(b, 'ka'));
    $('#f-region').append(...regions.map((r) => el('option', { value: r, text: r })));
    $('#f-profile').append(...profiles.map((p) => el('option', { value: p, text: p })));

    const chips = $('#f-types');
    const paintChips = () => chips.replaceChildren(...[['all', 'ყველა']].concat(Object.entries(Vita.CLINIC_TYPES).map(([k, v]) => [k, v.name])).map(([k, t]) =>
      el('button', { type: 'button', class: `chip${state.type === k ? ' is-active' : ''}`, 'aria-pressed': String(state.type === k), onClick: () => { state.type = k; paintChips(); renderList(); } }, t)));
    paintChips();
    $('#legend').replaceChildren(...Object.values(Vita.CLINIC_TYPES).map((t) => el('span', { style: `--c:${t.color}` }, el('i'), t.name)));

    map = new Vita.GeoMap($('#geo-map'), { clinics: Vita.CLINICS, onSelect: (c) => select(c, true) });
    $('#zoom-in').addEventListener('click', () => map.zoomBy(0.55));
    $('#zoom-out').addEventListener('click', () => map.zoomBy(1.8));
    $('#zoom-reset').addEventListener('click', () => map.reset());
    $('#zoom-tbilisi').addEventListener('click', () => map.focusTbilisi());

    $('#f-search').addEventListener('input', debounce((e) => { state.q = e.target.value; renderList(); }, 150));
    $('#f-region').addEventListener('change', (e) => { state.region = e.target.value; renderList(); if (state.region !== 'all') { const l = filtered(); if (l.length) map.focusPoint(l.reduce((a, c) => a + c.lon, 0) / l.length, l.reduce((a, c) => a + c.lat, 0) / l.length, state.region === 'თბილისი' ? 70 : 180); } else map.reset(); });
    $('#f-profile').addEventListener('change', (e) => { state.profile = e.target.value; renderList(); });
    initNear();
    renderList(); showDetail(null);
  };

  const initNear = () => {
    const btn = $('#near-me'), clear = $('#near-clear');
    if (!btn) return;
    const setMe = (pos) => {
      me = pos; map.setUser(pos ? pos.lon : null, pos ? pos.lat : null);
      clear.hidden = !pos; btn.hidden = Boolean(pos);
      renderList();
      if (pos && list.length) { const n = list[0]; map.focusPoint((pos.lon + n.lon) / 2, (pos.lat + n.lat) / 2, Math.max(60, Math.abs(pos.lon - n.lon) * 110)); showDetail(n); }
      if (!pos) map.reset();
    };
    btn.addEventListener('click', () => {
      if (!navigator.geolocation) { Vita.toast('თქვენი ბრაუზერი მდებარეობას არ უჭერს მხარს', 'error'); return; }
      btn.disabled = true; btn.textContent = '⏳ ვეძებ…';
      navigator.geolocation.getCurrentPosition(
        (p) => { btn.disabled = false; btn.textContent = '📍 ჩემთან ახლოს'; setMe({ lat: p.coords.latitude, lon: p.coords.longitude }); Vita.toast('კლინიკები დალაგდა მანძილის მიხედვით'); },
        (err) => { btn.disabled = false; btn.textContent = '📍 ჩემთან ახლოს'; Vita.toast(err.code === 1 ? 'მდებარეობაზე წვდომა უარყოფილია' : 'მდებარეობის დადგენა ვერ მოხერხდა', 'error'); },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
    });
    clear.addEventListener('click', () => setMe(null));
  };

  Vita.clinicsPage = { init };

  Vita.initMiniMap = () => {
    const svg = document.getElementById('mini-map'); if (!svg || !Vita.GeoMap) return;
    new Vita.GeoMap(svg, { clinics: Vita.CLINICS, interactive: false });
  };
})();
