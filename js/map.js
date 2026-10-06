'use strict';
/* ==========================================================
   map.js — საქართველოს ინტერაქტიული SVG რუკა (ბიბლიოთეკების გარეშე)
   • საზღვარი: georgia-geo.js (Natural Earth, გამარტივებული)
   • zoom / pan / კლასტერები / მარკერები (DOM + SVG)
   ========================================================== */
(() => {
  const { el, clamp, prefersReduced } = Vita;
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs = {}, ...kids) => {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined) n.setAttribute(k, v);
    kids.forEach((c) => n.append(c));
    return n;
  };

  const CITIES = [
    ['თბილისი', 44.793, 41.715, 1], ['ბათუმი', 41.64, 41.65, 1], ['ქუთაისი', 42.7, 42.27, 1], ['ზუგდიდი', 41.87, 42.51, 0],
    ['თელავი', 45.47, 41.92, 0], ['ახალციხე', 42.98, 41.64, 0], ['გორი', 44.11, 41.98, 0], ['რუსთავი', 44.99, 41.55, 0], ['სოხუმი', 41.02, 43.0, 0],
  ];
  const LABELS = [['შავი ზღვა', 40.45, 42.35, 'sea'], ['რუსეთი', 44.2, 43.4, 'nb'], ['თურქეთი', 41.9, 41.1, 'nb'], ['სომხეთი', 44.5, 41.05, 'nb'], ['აზერბაიჯანი', 46.0, 41.1, 'nb']];

  class GeoMap {
    constructor(svg, { clinics = [], onSelect = () => {}, interactive = true } = {}) {
      this.svg = svg; this.G = Vita.GEO; this.onSelect = onSelect; this.interactive = interactive;
      this.clinics = clinics; this.selected = null;
      this.full = { x: 0, y: 0, w: this.G.width, h: this.G.height };
      this.vb = { ...this.full }; this.raf = 0; this.anim = 0;
      this.pts = new Map();
      this.build();
      if (interactive) this.bind();
      this.apply(); this.render();
      new ResizeObserver(() => this.render()).observe(svg);
    }

    P(lon, lat) { return this.G.project(lon, lat); }

    build() {
      const { svg, G } = this;
      svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'საქართველოს რუკა სამედიცინო დაწესებულებების მარკერებით');
      svg.replaceChildren(
        svgEl('defs', {}, svgEl('pattern', { id: 'seaDots', width: 14, height: 14, patternUnits: 'userSpaceOnUse' }, svgEl('circle', { cx: 2, cy: 2, r: 1, class: 'map-sea-dot' }))),
        this.sea = svgEl('rect', { x: -2000, y: -2000, width: 6000, height: 6000, class: 'map-sea' }),
        svgEl('rect', { x: -2000, y: -2000, width: 6000, height: 6000, fill: 'url(#seaDots)' }),
        this.land = svgEl('path', { d: G.path, class: 'map-land' }),
        this.labels = svgEl('g', { class: 'map-labels', 'aria-hidden': 'true' }),
        this.layer = svgEl('g', { class: 'map-markers' }));
      LABELS.forEach(([t, lon, lat, cls]) => { const [x, y] = this.P(lon, lat); this.labels.append(svgEl('text', { x, y, class: `map-lbl ${cls}` }, document.createTextNode(t))); });
      CITIES.forEach(([t, lon, lat, major]) => {
        const [x, y] = this.P(lon, lat);
        this.labels.append(svgEl('circle', { cx: x, cy: y, r: 2.2, class: 'map-city' }), svgEl('text', { x, y, class: `map-lbl city${major ? ' major' : ''}` }, document.createTextNode(t)));
      });
    }

    /* ---------- ხედვა ---------- */
    scale() { return (this.svg.getBoundingClientRect().width || 800) / this.vb.w; }
    apply() { const { x, y, w, h } = this.vb; this.svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`); }
    fit(box) {
      // box: {x,y,w,h} → aspect-ratio-ს ვუნარჩუნებთ
      const ar = this.full.w / this.full.h; let { x, y, w, h } = box;
      if (w / h > ar) { const nh = w / ar; y -= (nh - h) / 2; h = nh; } else { const nw = h * ar; x -= (nw - w) / 2; w = nw; }
      return { x, y, w, h };
    }
    clampView(v) {
      v.w = clamp(v.w, this.full.w / 50, this.full.w * 1.05); v.h = v.w * (this.full.h / this.full.w);
      v.x = clamp(v.x, this.full.x - v.w * 0.25, this.full.x + this.full.w - v.w * 0.75);
      v.y = clamp(v.y, this.full.y - v.h * 0.25, this.full.y + this.full.h - v.h * 0.75);
      return v;
    }
    flyTo(target) {
      target = this.clampView(this.fit(target));
      cancelAnimationFrame(this.anim);
      if (prefersReduced()) { this.vb = target; this.apply(); this.render(); return; }
      const from = { ...this.vb }, t0 = performance.now(), dur = 650;
      const step = (now) => {
        const p = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 3);
        this.vb = { x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e, w: from.w + (target.w - from.w) * e, h: from.h + (target.h - from.h) * e };
        this.apply(); this.render();
        if (p < 1) this.anim = requestAnimationFrame(step);
      };
      this.anim = requestAnimationFrame(step);
    }
    zoomBy(f, cx = this.vb.x + this.vb.w / 2, cy = this.vb.y + this.vb.h / 2) {
      const w = this.vb.w * f, h = this.vb.h * f;
      this.flyTo({ x: cx - (cx - this.vb.x) * f, y: cy - (cy - this.vb.y) * f, w, h });
    }
    reset() { this.flyTo(this.full); }
    focusPoint(lon, lat, spanW = this.full.w / 9) {
      const [x, y] = this.P(lon, lat), h = spanW * (this.full.h / this.full.w);
      this.flyTo({ x: x - spanW / 2, y: y - h / 2, w: spanW, h });
    }
    focusTbilisi() { this.focusPoint(44.79, 41.72, this.full.w / 34); }

    /* ---------- ინტერაქცია ---------- */
    bind() {
      const { svg } = this; let drag = null;
      svg.style.touchAction = 'none';
      svg.addEventListener('pointerdown', (e) => { if (e.target.closest('.mk')) return; drag = { x: e.clientX, y: e.clientY, vb: { ...this.vb }, moved: false }; svg.setPointerCapture(e.pointerId); svg.classList.add('grab'); });
      svg.addEventListener('pointermove', (e) => {
        if (!drag) return;
        const s = this.scale(), dx = (e.clientX - drag.x) / s, dy = (e.clientY - drag.y) / s;
        if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
        cancelAnimationFrame(this.anim);
        this.vb = this.clampView({ ...drag.vb, x: drag.vb.x - dx, y: drag.vb.y - dy, w: drag.vb.w });
        this.apply(); this.schedule();
      });
      const end = () => { drag = null; svg.classList.remove('grab'); };
      svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
      svg.addEventListener('wheel', (e) => {
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        const r = svg.getBoundingClientRect(), s = this.scale();
        this.zoomBy(e.deltaY > 0 ? 1.25 : 0.8, this.vb.x + (e.clientX - r.left) / s, this.vb.y + (e.clientY - r.top) / s);
      }, { passive: false });
      svg.addEventListener('dblclick', (e) => { if (e.target.closest('.mk')) return; const r = svg.getBoundingClientRect(), s = this.scale(); this.zoomBy(0.5, this.vb.x + (e.clientX - r.left) / s, this.vb.y + (e.clientY - r.top) / s); });
    }
    schedule() { if (!this.raf) this.raf = requestAnimationFrame(() => { this.raf = 0; this.render(); }); }

    /* ---------- მონაცემები და რენდერი ---------- */
    setData(list) { this.clinics = list; if (this.selected && !list.includes(this.selected)) this.selected = null; this.render(); }
    select(c, { fly = true } = {}) {
      this.selected = c; this.render();
      if (c && fly) this.focusPoint(c.lon, c.lat, Math.min(this.vb.w, this.full.w / 6));
    }

    cluster() {
      const s = this.scale(), R = 20 / s, out = [];
      for (const c of this.clinics) {
        const [x, y] = this.P(c.lon, c.lat);
        const near = out.find((k) => Math.hypot(k.x - x, k.y - y) < R);
        if (near) { near.items.push(c); near.x = (near.x * (near.items.length - 1) + x) / near.items.length; near.y = (near.y * (near.items.length - 1) + y) / near.items.length; }
        else out.push({ x, y, items: [c] });
      }
      return out;
    }

    render() {
      const u = 1 / this.scale();
      this.labels.style.setProperty('--u', u);
      this.svg.style.setProperty('--u', u);
      this.land.setAttribute('stroke-width', 1.4 * u);
      this.layer.replaceChildren(...this.cluster().map((k) => {
        const g = svgEl('g', { class: 'mk', transform: `translate(${k.x} ${k.y})` });
        if (k.items.length > 1) {
          g.classList.add('cl'); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button'); g.setAttribute('aria-label', `${k.items.length} დაწესებულება — დააჭირე გასადიდებლად`);
          g.append(svgEl('circle', { r: 13 * u, class: 'cl-bg' }), svgEl('text', { class: 'cl-n', 'font-size': 12 * u, dy: 4 * u }, document.createTextNode(k.items.length)));
          const go = () => {
            const xs = k.items.map((c) => this.P(c.lon, c.lat)); const minX = Math.min(...xs.map((p) => p[0])), maxX = Math.max(...xs.map((p) => p[0])), minY = Math.min(...xs.map((p) => p[1])), maxY = Math.max(...xs.map((p) => p[1]));
            const pad = Math.max(30, (maxX - minX) * 0.5);
            this.flyTo({ x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 });
          };
          g.addEventListener('click', go); g.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
        } else {
          const c = k.items[0], t = Vita.CLINIC_TYPES[c.type];
          g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button'); g.setAttribute('aria-label', c.name);
          if (c === this.selected) g.append(svgEl('circle', { r: 16 * u, class: 'sel-ring', 'stroke-width': 2 * u }));
          g.append(svgEl('circle', { r: 7.5 * u, class: 'dot', fill: t.color, 'stroke-width': 2 * u }), svgEl('path', { d: `M${-3.2 * u} 0H${3.2 * u}M0 ${-3.2 * u}V${3.2 * u}`, class: 'dot-plus', 'stroke-width': 1.8 * u }), svgEl('title', {}, document.createTextNode(c.name)));
          g.addEventListener('click', () => this.onSelect(c)); g.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.onSelect(c); });
        }
        return g;
      }));
    }
  }

  Vita.GeoMap = GeoMap;
})();
