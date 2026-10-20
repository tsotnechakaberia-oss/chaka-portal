'use strict';

(() => {
  const { $, buildElement, store, toast, setError, todayKey, clamp, prefersReduced } = Chaka;

  const METRICS = {
    weight: { label: 'წონა', unit: 'კგ', series: [{ key: 'weight', name: 'წონა', color: '--mint' }], band: null },
    bp: { label: 'წნევა', unit: 'მმ.ვრც.სვ.', series: [{ key: 'sys', name: 'სისტოლური', color: '--coral' }, { key: 'dia', name: 'დიასტოლური', color: '--sky' }], band: null },
    pulse: { label: 'პულსი', unit: 'დ/წთ', series: [{ key: 'pulse', name: 'პულსი', color: '--violet' }], band: [60, 100] },
  };
  let entries = [], metric = 'weight', hover = null, progress = 1;
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
  const fmtDate = (iso) => new Date(iso + 'T00:00').toLocaleDateString(Chaka.locale(), { day: 'numeric', month: 'short' });
  const save = () => store.set('diary', entries);
  const valuesFor = (m) => entries.filter((e) => METRICS[m].series.some((s) => e[s.key] != null)).sort((a, b) => a.date.localeCompare(b.date));

  const RULES = {
    weight: [20, 300, 'წონა: 20–300 კგ'], sys: [70, 250, 'სისტოლური: 70–250'], dia: [40, 150, 'დიასტოლური: 40–150'], pulse: [30, 220, 'პულსი: 30–220'],
  };
  const validate = (f) => {
    let ok = true;
    const v = {};
    for (const [k, [min, max, msg]] of Object.entries(RULES)) {
      const input = f[k]; v[k] = num(input.value);
      const bad = v[k] !== null && (!Number.isFinite(v[k]) || v[k] < min || v[k] > max);
      ok = setError(input, bad ? msg : '') && ok;
    }
    if ((v.sys === null) !== (v.dia === null)) { setError(f.sys, v.sys === null ? 'შეიყვანეთ ორივე მაჩვენებელი' : ''); setError(f.dia, v.dia === null ? 'შეიყვანეთ ორივე მაჩვენებელი' : ''); ok = false; }
    else if (v.sys !== null && v.sys <= v.dia) { setError(f.sys, 'სისტოლური მეტი უნდა იყოს'); ok = false; }
    const hasAny = ['weight', 'sys', 'pulse'].some((k) => v[k] !== null);
    $('#d-form-err').textContent = hasAny ? '' : 'შეავსეთ მინიმუმ ერთი მაჩვენებელი';
    if (!f.date.value || f.date.value > todayKey()) { setError(f.date, 'აირჩიეთ დღევანდელი ან ადრინდელი თარიღი'); ok = false; } else setError(f.date, '');
    return ok && hasAny ? v : null;
  };

  const initForm = () => {
    const f = Object.fromEntries(['date', 'weight', 'sys', 'dia', 'pulse', 'note'].map((k) => [k, $(`#d-${k}`)]));
    f.date.value = todayKey(); f.date.max = todayKey();
    $('#diary-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const v = validate(f);
      if (!v) { toast('გთხოვთ, გაასწოროთ ფორმა', 'error'); $('#diary-form .invalid')?.focus(); return; }
      entries.push({ id: Date.now().toString(36), date: f.date.value, weight: v.weight, sys: v.sys, dia: v.dia, pulse: v.pulse, note: f.note.value.trim().slice(0, 120) });
      save(); ['weight', 'sys', 'dia', 'pulse', 'note'].forEach((k) => { f[k].value = ''; f[k].classList.remove('valid'); });

      metric = v.weight !== null ? 'weight' : v.sys !== null ? 'bp' : 'pulse';
      renderAll(true); toast('ჩანაწერი დაემატა');
    });
    ['weight', 'sys', 'dia', 'pulse'].forEach((k) => f[k].addEventListener('blur', () => validate(f)));
  };

  const renderStats = () => {
    const box = $('#d-stats'), m = METRICS[metric], rows = valuesFor(metric);
    if (!rows.length) { box.replaceChildren(); return; }
    box.replaceChildren(...m.series.flatMap((s) => {
      const vals = rows.map((r) => r[s.key]).filter((x) => x != null);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length, last = vals[vals.length - 1], first = vals[0], diff = last - first;
      return [
        stat(`${m.series.length > 1 ? s.name + ' · ' : ''}ბოლო`, `${last} ${m.series.length > 1 ? '' : m.unit}`),
        stat('საშუალო', avg.toFixed(1)), stat('მინ – მაქს', `${Math.min(...vals)} – ${Math.max(...vals)}`),
        stat('ცვლილება', `${diff > 0 ? '+' : ''}${diff.toFixed(1)}`, diff === 0 ? '' : diff > 0 ? 'up' : 'down')];
    }));
  };
  const stat = (k, v, cls = '') => buildElement('div', { class: `d-stat ${cls}` }, buildElement('small', { text: k }), buildElement('b', { class: 'mono', text: v }));

  const bpNote = (e) => (e.sys == null ? '' : e.sys < 120 && e.dia < 80 ? 'ნორმა' : e.sys >= 180 || e.dia >= 120 ? 'კრიზისული ⚠' : e.sys >= 140 || e.dia >= 90 ? 'მაღალი (II ხ.)' : 'ზღვრული/მომატებული');

  const renderList = () => {
    const list = $('#d-list'), sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    $('#d-count').textContent = entries.length;
    if (!sorted.length) { list.replaceChildren(buildElement('li', { class: 'empty-note', text: 'ჩანაწერები ჯერ არ არის. დაამატეთ პირველი გაზომვა მარცხნივ.' })); return; }
    list.replaceChildren(...sorted.slice(0, 40).map((e) => buildElement('li', { class: 'booking-item' },
      buildElement('div', {}, buildElement('b', { text: new Date(e.date + 'T00:00').toLocaleDateString(Chaka.locale(), { day: 'numeric', month: 'long', year: 'numeric' }) }),
        buildElement('small', { text: [e.weight != null ? `${e.weight} კგ` : null, e.sys != null ? `${e.sys}/${e.dia} (${bpNote(e)})` : null, e.pulse != null ? `${e.pulse} დ/წთ` : null, e.note || null].filter(Boolean).join(' · ') })),
      buildElement('button', { type: 'button', class: 'btn btn-ghost btn-sm btn-danger', 'aria-label': 'ჩანაწერის წაშლა', onClick: () => { entries = entries.filter((x) => x.id !== e.id); save(); renderAll(); toast('ჩანაწერი წაიშალა'); } }, 'წაშლა'))));
  };

  const exportCsv = () => {
    if (!entries.length) { toast('ექსპორტისთვის მონაცემი არ არის', 'error'); return; }
    const esc = (t) => `"${String(t ?? '').replace(/"/g, '""')}"`;
    const rows = [['თარიღი', 'წონა_კგ', 'სისტოლური', 'დიასტოლური', 'პულსი', 'შენიშვნა'], ...[...entries].sort((a, b) => a.date.localeCompare(b.date)).map((e) => [e.date, e.weight, e.sys, e.dia, e.pulse, e.note])];
    const url = URL.createObjectURL(new Blob(['﻿' + rows.map((r) => r.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const a = buildElement('a', { href: url, download: 'chaka-diary.csv' }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const cv = () => $('#d-chart');
  const geometry = (c) => ({ w: c.clientWidth, h: c.clientHeight, l: 46, r: 16, t: 18, b: 34 });

  const draw = () => {
    const c = cv(); if (!c) return;
    const ctx = c.getContext('2d'), dpr = window.devicePixelRatio || 1, g = geometry(c);
    if (c.width !== Math.round(g.w * dpr) || c.height !== Math.round(g.h * dpr)) { c.width = Math.round(g.w * dpr); c.height = Math.round(g.h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, g.w, g.h);
    const m = METRICS[metric], rows = valuesFor(metric), text = css('--muted'), line = css('--line');
    $('#d-empty').hidden = rows.length > 0;
    if (!rows.length) return;

    const all = rows.flatMap((r) => m.series.map((s) => r[s.key]).filter((x) => x != null));
    let lo = Math.min(...all, ...(m.band || [Infinity])), hi = Math.max(...all, ...(m.band || [-Infinity]));
    if (m.band && Math.min(...all) > m.band[1]) lo = Math.min(lo, m.band[0]);
    const pad = Math.max((hi - lo) * 0.15, 2); lo = Math.floor(lo - pad); hi = lo + Math.ceil((Math.ceil(hi + pad) - lo) / 4) * 4;
    const t0 = new Date(rows[0].date).getTime(), t1 = new Date(rows[rows.length - 1].date).getTime();
    const X = (d) => g.l + (t1 === t0 ? (g.w - g.l - g.r) / 2 : ((new Date(d).getTime() - t0) / (t1 - t0)) * (g.w - g.l - g.r));
    const Y = (v) => g.t + (1 - (v - lo) / (hi - lo)) * (g.h - g.t - g.b);
    g.X = X; g.Y = Y; c._g = g;

    ctx.font = `11px ${css('--mono')}`; ctx.textBaseline = 'middle'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const v = lo + ((hi - lo) * i) / 4, y = Y(v);
      ctx.strokeStyle = line; ctx.beginPath(); ctx.moveTo(g.l, y); ctx.lineTo(g.w - g.r, y); ctx.stroke();
      ctx.fillStyle = text; ctx.textAlign = 'right'; ctx.fillText(Math.round(v * 10) / 10, g.l - 8, y);
    }
    if (m.band) { ctx.fillStyle = css('--mint'); ctx.globalAlpha = 0.09; ctx.fillRect(g.l, Y(m.band[1]), g.w - g.l - g.r, Y(m.band[0]) - Y(m.band[1])); ctx.globalAlpha = 1; ctx.fillStyle = text; ctx.textAlign = 'left'; ctx.fillText('ნორმა 60–100', g.l + 6, Y(m.band[1]) + 10); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = text;
    const ticks = Math.min(rows.length, Math.max(2, Math.floor((g.w - g.l) / 90)));
    for (let i = 0; i < ticks; i++) { const r = rows[ticks === 1 ? 0 : Math.round((i * (rows.length - 1)) / (ticks - 1))]; ctx.fillText(fmtDate(r.date), clamp(X(r.date), g.l + 14, g.w - g.r - 14), g.h - g.b + 10); }

    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, g.l + (g.w - g.l) * progress, g.h); ctx.clip();
    m.series.forEach((s) => {
      const pts = rows.filter((r) => r[s.key] != null).map((r) => [X(r.date), Y(r[s.key]), r]);
      const col = css(s.color);
      if (pts.length > 1) {
        const grad = ctx.createLinearGradient(0, g.t, 0, g.h - g.b); grad.addColorStop(0, col + '40'); grad.addColorStop(1, col + '00');
        if (m.series.length === 1) { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.lineTo(pts[pts.length - 1][0], g.h - g.b); ctx.lineTo(pts[0][0], g.h - g.b); ctx.closePath(); ctx.fillStyle = grad; ctx.fill(); }
        ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();
      }
      pts.forEach(([x, y, r]) => { const on = hover && hover.id === r.id; ctx.beginPath(); ctx.arc(x, y, on ? 6 : 4, 0, 7); ctx.fillStyle = css('--surface-solid'); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = col; ctx.stroke(); });
    });
    ctx.restore();

    if (hover) {
      const x = X(hover.date), txt = m.series.filter((s) => hover[s.key] != null).map((s) => `${s.name}: ${hover[s.key]}`);
      const lines = [fmtDate(hover.date), ...txt]; ctx.font = `12px ${css('--font')}`;
      const bw = Math.max(...lines.map((t) => ctx.measureText(t).width)) + 20, bh = lines.length * 18 + 12, bx = clamp(x - bw / 2, 4, g.w - bw - 4);
      ctx.strokeStyle = css('--line-strong'); ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(x, g.t); ctx.lineTo(x, g.h - g.b); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = css('--surface-solid'); ctx.strokeStyle = css('--line-strong'); ctx.beginPath(); ctx.roundRect(bx, g.t, bw, bh, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = css('--text'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; lines.forEach((t, i) => ctx.fillText(t, bx + 10, g.t + 16 + i * 18));
    }
  };

  const animate = () => {
    if (prefersReduced()) { progress = 1; draw(); return; }
    progress = 0; const t0 = performance.now();
    const step = (now) => { progress = clamp((now - t0) / 700, 0, 1); progress = 1 - Math.pow(1 - progress, 3); draw(); if (progress < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };

  const bindChart = () => {
    const c = cv();
    const move = (e) => {
      const g = c._g; if (!g) return;
      const rect = c.getBoundingClientRect(), x = (e.clientX - rect.left), rows = valuesFor(metric);
      const best = rows.reduce((a, r) => (Math.abs(g.X(r.date) - x) < Math.abs(g.X(a.date) - x) ? r : a), rows[0]);
      const next = Math.abs(g.X(best.date) - x) < 40 ? best : null;
      if ((next && next.id) !== (hover && hover.id)) { hover = next; draw(); }
    };
    c.addEventListener('pointermove', move); c.addEventListener('pointerdown', move);
    c.addEventListener('pointerleave', () => { hover = null; draw(); });
    new ResizeObserver(() => draw()).observe(c);
    new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  };

  const renderTabs = () => {
    const box = $('#d-tabs');
    box.replaceChildren(...Object.entries(METRICS).map(([k, m]) => buildElement('button', { type: 'button', role: 'tab', class: `tab${k === metric ? ' is-active' : ''}`, 'aria-selected': String(k === metric),
      onClick: () => { metric = k; hover = null; renderAll(true); } }, m.label)));
    $('#d-legend').replaceChildren(...METRICS[metric].series.map((s) => buildElement('span', { style: `--c:var(${s.color})` }, buildElement('i'), `${s.name} (${METRICS[metric].unit})`)));
  };

  const renderAll = (anim = false) => { renderTabs(); renderStats(); renderList(); anim ? animate() : draw(); };

  const demo = () => {

    const out = [];
    for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i * 2); out.push({ id: `demo${i}`, date: todayKey(d), weight: +(78 - (13 - i) * 0.15 + Math.sin(i) * 0.3).toFixed(1), sys: 118 + Math.round(Math.sin(i * 1.3) * 8), dia: 76 + Math.round(Math.cos(i) * 5), pulse: 68 + Math.round(Math.sin(i * 2) * 7), note: i === 0 ? 'დემო მონაცემი' : '' }); }
    entries = entries.concat(out); save(); renderAll(true); toast('დემო მონაცემები დაემატა');
  };

  const init = () => {
    if (!$('#diary-form')) return;
    entries = store.get('diary', []);
    initForm(); bindChart(); renderAll(true);
    $('#d-export').addEventListener('click', exportCsv);
    $('#d-demo').addEventListener('click', demo);
    $('#d-clear').addEventListener('click', () => { if (entries.length && confirm('წაიშალოს ყველა ჩანაწერი?')) { entries = []; save(); renderAll(true); toast('დღიური გასუფთავდა'); } });
  };

  Chaka.diary = { init };
})();
