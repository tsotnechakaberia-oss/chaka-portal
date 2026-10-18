'use strict';

(() => {
  const { $, $$, el } = Vita;
  let uid = 0;
  const nextId = (p) => `${p}${++uid}`;

  const GRAD = (id) => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="var(--mint)"/><stop offset=".55" stop-color="var(--sky)"/><stop offset="1" stop-color="var(--violet)"/></linearGradient>`;

  const HEX = '32,3 57,17.5 57,46.5 32,61 7,46.5 7,17.5';
  const HEART = 'M32 47 C 22 39 15 33 15 25 C 15 20 19 17 23 17 C 27 17 30 19 32 22 C 34 19 37 17 41 17 C 45 17 49 20 49 25 C 49 33 42 39 32 47 Z';
  const ECG = 'M8 33 H23 L27 24 L33 43 L38 29 L41 33 H56';

  const mark = () => {
    const g = nextId('lgm');
    return `<svg class="lg" viewBox="0 0 64 64" aria-hidden="true"><defs>${GRAD(g)}</defs>
      <polygon class="lg-hex" points="${HEX}" stroke="url(#${g})"/>
      <circle class="lg-orbit" cx="32" cy="32" r="23"/>
      <path class="lg-heart" d="${HEART}"/>
      <path class="lg-ecg" d="${ECG}" pathLength="90"/></svg>`;
  };

  const draw = () => {
    const g = nextId('lgd');
    return `<svg class="lg lg-draw" viewBox="0 0 64 64" aria-hidden="true"><defs>${GRAD(g).replace('id="' + g + '"', 'id="' + g + '"')}</defs>
      <polygon class="d d1" points="${HEX}" style="stroke:url(#${g})"/>
      <path class="d d2" d="${HEART}"/>
      <path class="d d3" d="${ECG}"/></svg>`;
  };

  const emblem = () => {
    const g = nextId('lge');
    let ticks = '';
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2, long = i % 5 === 0;
      const r1 = 138, r2 = long ? 126 : 132;
      ticks += `<line class="tick" x1="${150 + Math.cos(a) * r1}" y1="${150 + Math.sin(a) * r1}" x2="${150 + Math.cos(a) * r2}" y2="${150 + Math.sin(a) * r2}"/>`;
    }
    return `<svg class="em" viewBox="0 0 300 300" aria-hidden="true"><defs>${GRAD(g)}</defs>
      ${ticks}
      <circle class="ring r1" cx="150" cy="150" r="120"/>
      <circle class="ring r2" cx="150" cy="150" r="102"/>
      <circle class="ring r3" cx="150" cy="150" r="84"/>
      <g class="orb"><circle cx="150" cy="30" r="5"/></g>
      <g class="orb o2"><circle cx="150" cy="48" r="4"/></g>
      <polygon class="core-hex" points="150,86 205,118 205,182 150,214 95,182 95,118" stroke="url(#${g})"/>
      <path d="M150 190 C 128 172 114 158 114 140 C 114 129 123 122 132 122 C 140 122 146 126 150 132 C 154 126 160 122 168 122 C 177 122 186 129 186 140 C 186 158 172 172 150 190 Z" fill="color-mix(in srgb, var(--coral) 80%, transparent)" class="lg-heart" style="transform-origin:150px 156px"/>
      <path class="ecg-core" d="M104 152 H132 L141 132 L153 172 L162 146 L168 152 H196" pathLength="160" stroke-dasharray="160"/></svg>`;
  };

  const partnerSVG = (kind) => {
    const shapes = {
      spin:   `<g class="pl-spin"><rect class="pl-fill" x="26" y="10" width="12" height="44" rx="5"/><rect class="pl-fill" x="10" y="26" width="44" height="12" rx="5"/></g><circle class="pl-accent" cx="32" cy="32" r="5"/>`,
      leaf:   `<path class="pl-leaf pl-fill" d="M12 52 C 12 24 30 10 54 10 C 54 36 40 54 12 52 Z"/><path class="pl-accent-s" d="M16 48 C 26 34 36 26 46 18"/>`,
      shield: `<path class="pl-shield pl-stroke" d="M32 8 L54 16 V32 C 54 45 44 54 32 58 C 20 54 10 45 10 32 V16 Z"/><path class="pl-accent-s" d="M22 33 L29 40 L43 24" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
      atom:   `<g class="pl-atom"><ellipse class="pl-stroke" cx="32" cy="32" rx="26" ry="10" stroke-width="2.4"/><ellipse class="pl-stroke" cx="32" cy="32" rx="26" ry="10" transform="rotate(60 32 32)" stroke-width="2.4"/><ellipse class="pl-stroke" cx="32" cy="32" rx="26" ry="10" transform="rotate(120 32 32)" stroke-width="2.4"/></g><circle class="pl-accent" cx="32" cy="32" r="5"/>`,
      dna:    `<path class="pl-stroke pl-flow" d="M16 6 C 48 20, 16 44, 48 58"/><path class="pl-stroke pl-flow" d="M48 6 C 16 20, 48 44, 16 58"/><path class="pl-accent-s" d="M22 16 H42 M20 32 H44 M22 48 H42"/>`,
      wave:   `<path class="pl-stroke pl-flow" d="M4 34 H18 L24 18 L32 50 L40 26 L45 34 H60" stroke-width="3.4"/><circle class="pl-accent" cx="32" cy="50" r="3"/>`,
      drop:   `<path class="pl-drop pl-fill" d="M32 8 C 32 8 14 28 14 40 C 14 50 22 57 32 57 C 42 57 50 50 50 40 C 50 28 32 8 32 8 Z"/><ellipse class="pl-ripple" cx="32" cy="58" rx="16" ry="4"/>`,
      eye:    `<g class="pl-eye"><path class="pl-stroke" d="M4 32 C 14 14 50 14 60 32 C 50 50 14 50 4 32 Z"/><circle class="pl-accent" cx="32" cy="32" r="9"/><circle cx="32" cy="32" r="4" fill="var(--bg)"/></g>`,
    };
    return `<svg viewBox="0 0 64 64" aria-hidden="true">${shapes[kind] || shapes.spin}</svg>`;
  };

  const ICONS = {
    heart:   '<path class="ia" d="M12 21 C 5 16 2 12 2 8.500 C 2 5.500 4.300 3.500 7 3.500 C 9 3.500 11 4.700 12 6.500 C 13 4.700 15 3.500 17 3.500 C 19.700 3.500 22 5.500 22 8.500 C 22 12 19 16 12 21 Z"/><path d="M5 11 H9 L10.500 8 L13 14 L14.500 11 H19" stroke-width="1.300"/>',
    brain:   '<g class="ia"><path d="M9 4 a3 3 0 0 0-3 3 a3 3 0 0 0-2 5 a3 3 0 0 0 2 5 a3 3 0 0 0 6 1 V5 a2 2 0 0 0-3-1 z"/><path d="M15 4 a3 3 0 0 1 3 3 a3 3 0 0 1 2 5 a3 3 0 0 1-2 5 a3 3 0 0 1-6 1 V5 a2 2 0 0 1 3-1 z"/></g>',
    lungs:   '<g class="ia"><path d="M12 3 V11"/><path d="M12 11 L9 14 M12 11 L15 14"/><path d="M10 9 C 7 9 4.500 15 3.500 19 C 3 21 4.500 21.500 6.500 21 C 9 20 10.500 18.500 10.500 16 Z"/><path d="M14 9 C 17 9 19.500 15 20.500 19 C 21 21 19.500 21.500 17.500 21 C 15 20 13.500 18.500 13.500 16 Z"/></g>',
    eye:     '<g class="ia"><path d="M2 12 s4-7 10-7 10 7 10 7 -4 7 -10 7 S2 12 2 12 z"/><circle cx="12" cy="12" r="3"/></g>',
    tooth:   '<path class="ia" d="M8 3 C 5.500 3 4 5 4 7.500 C 4 9.500 5 11 5.500 13 C 6 15.500 6.200 21 7.800 21 C 9.200 21 9.200 16.500 10.500 16.500 H13.500 C 14.800 16.500 14.800 21 16.200 21 C 17.800 21 18 15.500 18.500 13 C 19 11 20 9.500 20 7.500 C 20 5 18.500 3 16 3 C 14.500 3 13.500 4 12 4 S 9.500 3 8 3 Z"/>',
    bone:    '<g class="ia"><path d="M7 17 L17 7"/><circle cx="5.500" cy="15.500" r="2.200"/><circle cx="8.500" cy="18.500" r="2.200"/><circle cx="15.500" cy="5.500" r="2.200"/><circle cx="18.500" cy="8.500" r="2.200"/></g>',
    peds:    '<g class="ia"><circle cx="12" cy="12" r="9"/><circle cx="9" cy="10.500" r=".6" fill="currentColor"/><circle cx="15" cy="10.500" r=".6" fill="currentColor"/><path d="M8.500 14.500 C 10 16.500 14 16.500 15.500 14.500"/><path d="M12 3 C 12 5 14 5 14 3.500"/></g>',
    therapy: '<g class="ia"><path d="M6 3 V9 a4 4 0 0 0 8 0 V3"/><path d="M10 13 V15 a5 5 0 0 0 10 0 V13"/><circle cx="20" cy="11" r="2"/></g>',
    gyn:     '<g class="ia"><circle cx="12" cy="8.500" r="5"/><path d="M12 13.500 V21 M8.500 17.500 H15.500"/></g>',
    psych:   '<g class="ia"><path d="M8 21 V17 C 5 15.500 4 12.500 4 10 C 4 5.500 7.500 3 11.500 3 C 16 3 19.500 6 19.500 10 V13 H17 V17 H13 V21"/><path d="M11 7.500 V11 M9.200 9.300 H12.800"/></g>',
    scalpel: '<g class="ia"><path d="M4 20 L14 10"/><path d="M14 10 L17 4 L20 7 L14 10 Z"/><path d="M7 17 L9 19"/></g>',
    team:    '<g class="ia"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.500"/><path d="M2.500 20 C 2.500 15.500 5 13.500 8 13.500 C 11 13.500 13.500 15.500 13.500 20"/><path d="M15 14 C 18.500 13.500 21.500 15 21.500 19"/></g>',
    drop:    '<path class="ia" d="M12 3 C 12 3 5 11 5 15 C 5 18.900 8.100 21.500 12 21.500 C 15.900 21.500 19 18.900 19 15 C 19 11 12 3 12 3 Z"/>',
    flame:   '<path class="ia" d="M12 22 C 7 22 4.500 18.500 4.500 15 C 4.500 11 8 9 8.500 5 C 11 6.500 12.500 8.500 12.500 10.500 C 14 9.500 14.500 8 14.500 6.500 C 17.500 9 19.500 12 19.500 15 C 19.500 18.500 17 22 12 22 Z"/>',
    sun:     '<g class="ia"><circle cx="12" cy="12" r="4.500"/><path d="M12 2 V4.500 M12 19.500 V22 M2 12 H4.500 M19.500 12 H22 M4.900 4.900 L6.700 6.700 M17.300 17.300 L19.100 19.100 M4.900 19.100 L6.700 17.300 M17.300 6.700 L19.100 4.900"/></g>',
    body:    '<g class="ia"><circle cx="12" cy="5" r="2.500"/><path d="M7 21 V12 a5 5 0 0 1 10 0 V21"/><path d="M12 11 V21"/><path d="M4 11 L7 9 M20 11 L17 9"/></g>',
    stethoscope: '<g class="ia"><path d="M6 3 V9 a4 4 0 0 0 8 0 V3"/><path d="M10 13 V15 a5 5 0 0 0 10 0 V13"/><circle cx="20" cy="11" r="2"/></g>',
    calendar:'<g class="ia"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10 H21 M8 3 V7 M16 3 V7"/><path d="M9 15 L11 17 L15 13"/></g>',
  };
  const icon = (name) => `<svg class="ico ico-${name}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.heart}</svg>`;

  const ecgPath = (beats = 4, w = 400, h = 64) => {
    const seg = w / beats, mid = h / 2;
    let d = `M0 ${mid}`;
    for (let i = 0; i < beats; i++) {
      const x = i * seg;
      d += ` L${x + seg * .12} ${mid} Q${x + seg * .18} ${mid - 7} ${x + seg * .24} ${mid}`
        + ` L${x + seg * .33} ${mid} L${x + seg * .37} ${mid + 7} L${x + seg * .42} ${4} L${x + seg * .47} ${h - 6} L${x + seg * .51} ${mid}`
        + ` L${x + seg * .62} ${mid} Q${x + seg * .7} ${mid - 11} ${x + seg * .78} ${mid} L${x + seg} ${mid}`;
    }
    return d;
  };
  const ecgSVG = () => `<svg viewBox="0 0 800 64" preserveAspectRatio="none" aria-hidden="true"><path d="${ecgPath(8, 800)}"/></svg>`;

  const mount = () => {
    $$('[data-logo]').forEach((n) => {
      const kind = n.dataset.logo;
      n.innerHTML = kind === 'draw' ? draw() : kind === 'emblem' ? emblem() : mark();
    });
    $$('[data-icon]').forEach((n) => { n.innerHTML = icon(n.dataset.icon); });

    const track = $('#partner-track');
    if (track) {
      const items = Vita.PARTNERS.map((p) => el('div', { class: 'pl-item', html: partnerSVG(p.kind) + `<span>${p.name}<small>${p.tag}</small></span>` }));

      track.append(...items, ...items.map((n) => n.cloneNode(true)));
      track.lastElementChild && $$('.pl-item', track).slice(items.length).forEach((n) => n.setAttribute('aria-hidden', 'true'));
    }
    const strip = $('#ecg-strip');
    if (strip) strip.innerHTML = ecgSVG();
  };

  Vita.logos = { mark, draw, emblem, partnerSVG, icon, mount, ecgSVG };
})();
