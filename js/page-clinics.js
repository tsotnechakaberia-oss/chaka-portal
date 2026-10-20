'use strict';

(() => {
  const { $, buildElement, debounce } = Chaka;
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
    return Chaka.CLINICS.filter((c) =>
      (state.region === 'all' || c.region === state.region) && (state.type === 'all' || c.type === state.type) &&
      (state.profile === 'all' || c.profiles.includes(state.profile)) &&
      (!q || `${c.name} ${c.nameEn} ${c.city} ${c.region} ${c.profiles.join(' ')}`.toLowerCase().includes(q)));
  };

  const showDetail = (c) => {
    const box = $('#clinic-detail');
    if (!c) { box.replaceChildren(buildElement('p', { class: 'empty-note', text: 'აირჩიეთ მარკერი რუკაზე ან კლინიკა სიიდან — აქ გამოჩნდება დეტალები.' })); return; }
    const t = Chaka.CLINIC_TYPES[c.type];
    box.replaceChildren(buildElement('div', { class: 'clinic-detail' },
      buildElement('h3', { text: c.name }), buildElement('p', { class: 'en', text: c.nameEn }),
      buildElement('div', { class: 'tag-row' }, buildElement('span', { class: `tag mono t-${c.type === 'university' ? 'private' : c.type}`, text: t.name }), ...c.profiles.map((p) => buildElement('span', { class: 'tag mono', text: p }))),
      buildElement('dl', {}, buildElement('dt', { text: 'ქალაქი' }), buildElement('dd', { text: c.city }), buildElement('dt', { text: 'რეგიონი' }), buildElement('dd', { text: c.region }),
        c.address ? [buildElement('dt', { text: 'მისამართი' }), buildElement('dd', { text: c.address })] : null,
        buildElement('dt', { text: 'კოორდინატები' }), buildElement('dd', { class: 'mono', text: `${c.lat.toFixed(4)}, ${c.lon.toFixed(4)} (მიახლ.)` })),
      buildElement('div', { style: 'display:flex;gap:.6rem;flex-wrap:wrap' },
        buildElement('a', { class: 'btn btn-primary btn-sm', href: osm(c), target: '_blank', rel: 'noopener noreferrer' }, 'OpenStreetMap ↗'),
        buildElement('a', { class: 'btn btn-ghost btn-sm', href: `index.html#doctors` }, 'ექიმები'))));
    document.querySelectorAll('.clinic-item').forEach((n) => n.classList.toggle('is-active', n.dataset.id === c.id));
  };

  const select = (c, fly = true) => { map.select(c, { fly }); showDetail(c); };

  const renderList = () => {
    list = filtered();
    if (me) list.sort((a, b) => dist(a) - dist(b));
    $('#clinic-count').textContent = `ნაპოვნია: ${list.length} / ${Chaka.CLINICS.length}`;
    const box = $('#clinic-list');
    box.replaceChildren(...(list.length ? list.map((c) => buildElement('button', { type: 'button', class: 'clinic-item', dataset: { id: c.id }, onClick: () => select(c) },
      buildElement('b', { text: c.name }), me ? buildElement('span', { class: 'dist', text: `📍 ${fmtKm(dist(c))}` }) : null, buildElement('small', { text: `${c.city} · ${Chaka.CLINIC_TYPES[c.type].name} · ${c.profiles.slice(0, 2).join(', ')}` }))) : [buildElement('p', { class: 'empty-note', text: '😕 ამ ფილტრით დაწესებულება ვერ მოიძებნა.' })]));
    map.setData(list);
  };

  const init = () => {
    const regions = [...new Set(Chaka.CLINICS.map((c) => c.region))];
    const profiles = [...new Set(Chaka.CLINICS.flatMap((c) => c.profiles))].sort((a, b) => a.localeCompare(b, 'ka'));
    $('#f-region').append(...regions.map((r) => buildElement('option', { value: r, text: r })));
    $('#f-profile').append(...profiles.map((p) => buildElement('option', { value: p, text: p })));

    const chips = $('#f-types');
    const paintChips = () => chips.replaceChildren(...[['all', 'ყველა']].concat(Object.entries(Chaka.CLINIC_TYPES).map(([k, v]) => [k, v.name])).map(([k, t]) =>
      buildElement('button', { type: 'button', class: `chip${state.type === k ? ' is-active' : ''}`, 'aria-pressed': String(state.type === k), onClick: () => { state.type = k; paintChips(); renderList(); } }, t)));
    paintChips();
    $('#legend').replaceChildren(...Object.values(Chaka.CLINIC_TYPES).map((t) => buildElement('span', { style: `--c:${t.color}` }, buildElement('i'), t.name)));

    map = new Chaka.GeoMap($('#geo-map'), { clinics: Chaka.CLINICS, onSelect: (c) => select(c, true) });
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
      if (!navigator.geolocation) { Chaka.toast('თქვენი ბრაუზერი მდებარეობას არ უჭერს მხარს', 'error'); return; }
      btn.disabled = true; btn.textContent = '⏳ ვეძებ…';
      navigator.geolocation.getCurrentPosition(
        (p) => { btn.disabled = false; btn.textContent = '📍 ჩემთან ახლოს'; setMe({ lat: p.coords.latitude, lon: p.coords.longitude }); Chaka.toast('კლინიკები დალაგდა მანძილის მიხედვით'); },
        (err) => { btn.disabled = false; btn.textContent = '📍 ჩემთან ახლოს'; Chaka.toast(err.code === 1 ? 'მდებარეობაზე წვდომა უარყოფილია' : 'მდებარეობის დადგენა ვერ მოხერხდა', 'error'); },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
    });
    clear.addEventListener('click', () => setMe(null));
  };

  Chaka.clinicsPage = { init };

  const MAP_SCRIPTS = ['js/georgia-geo.js', 'js/map.js'];

  Chaka.initMiniMap = () => {
    const svg = document.getElementById('mini-map');
    if (!svg) return;
    const drawMap = () => Promise.all(MAP_SCRIPTS.map(Chaka.loadScript))
      .then(() => new Chaka.GeoMap(svg, { clinics: Chaka.CLINICS, interactive: false }))
      .catch(() => svg.setAttribute('hidden', ''));

    if (!('IntersectionObserver' in window)) { drawMap(); return; }
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      drawMap();
    }, { rootMargin: '400px 0px' });
    observer.observe(svg);
  };
})();
