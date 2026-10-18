'use strict';

(() => {
  const { $, $$, el, clamp } = Vita;
  let group = 'all';

  const renderResult = (box, res) => {
    box.classList.toggle('err', Boolean(res.error) && !res.hint);
    if (res.error) { box.replaceChildren(el('p', { class: res.hint ? 'res-note' : 'err-txt', role: res.hint ? null : 'alert', text: res.error })); return; }
    const kids = [
      el('div', { class: 'big' }, el('b', { text: res.value }), res.unit ? el('span', { text: res.unit }) : null),
      el('span', { class: `chip-res tone-${res.tone}`, text: res.label }),
    ];
    if (res.scale) {
      const { min, max, bands, pos } = res.scale; let prev = min;
      const bar = el('div', { class: 'scale', 'aria-hidden': 'true' }, bands.map(([to, c]) => { const w = ((to - prev) / (max - min)) * 100; prev = to; return el('i', { style: `width:${w}%;background:${c}` }); }));
      const mark = el('em', { style: 'left:0%' });
      bar.append(mark);
      requestAnimationFrame(() => requestAnimationFrame(() => { mark.style.left = `${clamp(((pos - min) / (max - min)) * 100, 1, 99)}%`; }));
      kids.push(bar);
    }
    if (res.lines?.length) kids.push(el('dl', { class: 'res-lines' }, res.lines.map(([k, v]) => el('div', {}, el('dt', { text: k }), el('dd', { text: v })))));
    if (res.note) kids.push(el('p', { class: 'res-note', text: res.note }));
    box.replaceChildren(...kids);
  };

  const buildCard = (c, i) => {
    const out = el('div', { class: 'calc-out', 'aria-live': 'polite' });
    const inputs = {};
    const read = () => Object.fromEntries(c.fields.map((f) => {
      const raw = inputs[f.id].value;
      return [f.id, f.type === 'number' ? (raw === '' ? NaN : parseFloat(raw)) : raw];
    }));
    const update = () => {

      if (c.id === 'bodyfat') inputs.hip.closest('.f').hidden = inputs.sex.value !== 'f';
      renderResult(out, c.compute(read()));
    };

    const form = el('form', { class: 'calc-form', novalidate: true, onSubmit: (e) => e.preventDefault() },
      c.fields.map((f) => {
        const id = `${c.id}-${f.id}`;
        let input;
        if (f.type === 'select') input = el('select', { class: 'input', id }, f.options.map(([v, t]) => el('option', { value: v, selected: v === f.value ? true : null }, t)));
        else input = el('input', { class: 'input', id, type: f.type, value: f.value ?? '', min: f.min, max: f.max, step: f.step || (f.type === 'number' ? 1 : null), inputmode: f.type === 'number' ? 'decimal' : null });
        inputs[f.id] = input;
        input.addEventListener('input', update); input.addEventListener('change', update);
        const wide = f.type === 'select' && f.options.some(([, t]) => t.length > 22);
        return el('div', { class: `f${wide ? ' wide' : ''}` }, el('label', { for: id, text: f.label }), f.unit ? el('div', { class: 'inp' }, input, el('span', { class: 'u', text: f.unit })) : input);
      }));

    const card = el('article', { class: 'calc card holo', style: `animation-delay:${i * 50}ms`, dataset: { group: c.group }, id: `calc-${c.id}` },
      el('div', { class: 'calc-head' }, el('div', { class: 'ico-wrap', html: Vita.logos.icon(c.icon) }), el('div', {}, el('h3', { text: c.title }), el('p', { text: c.desc }))),
      form, out,
      el('details', { class: 'calc-src' }, el('summary', { text: 'ფორმულა და წყარო' }), el('p', {}, el('code', { text: c.formula })), el('p', { text: `წყარო: ${c.source}` })));
    update();
    return card;
  };

  const init = () => {
    const grid = $('#calc-grid');
    const cards = Vita.CALCS.map(buildCard);
    grid.replaceChildren(...cards);

    const chips = $('#calc-groups');
    const paint = () => {
      chips.replaceChildren(...Vita.CALC_GROUPS.map(([k, t]) => el('button', { type: 'button', class: `chip${k === group ? ' is-active' : ''}`, 'aria-pressed': String(k === group), onClick: () => { group = k; paint(); } }, t)));
      cards.forEach((card) => { card.hidden = group !== 'all' && card.dataset.group !== group; });
      $('#calc-count').textContent = `კალკულატორი: ${cards.filter((c) => !c.hidden).length} / ${cards.length}`;
    };
    paint();
    if (location.hash.startsWith('#calc-')) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  };

  Vita.calculators = { init };
})();
