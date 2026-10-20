'use strict';

(() => {
  const { $, buildElement, clamp } = Chaka;
  let group = 'all';

  const renderResult = (box, res) => {
    box.classList.toggle('err', Boolean(res.error) && !res.hint);
    if (res.error) { box.replaceChildren(buildElement('p', { class: res.hint ? 'res-note' : 'err-txt', role: res.hint ? null : 'alert', text: res.error })); return; }
    const kids = [
      buildElement('div', { class: 'big' }, buildElement('b', { text: res.value }), res.unit ? buildElement('span', { text: res.unit }) : null),
      buildElement('span', { class: `chip-res tone-${res.tone}`, text: res.label }),
    ];
    if (res.scale) {
      const { min, max, bands, pos } = res.scale; let prev = min;
      const bar = buildElement('div', { class: 'scale', 'aria-hidden': 'true' }, bands.map(([to, c]) => { const w = ((to - prev) / (max - min)) * 100; prev = to; return buildElement('i', { style: `width:${w}%;background:${c}` }); }));
      const mark = buildElement('em', { style: 'left:0%' });
      bar.append(mark);
      requestAnimationFrame(() => requestAnimationFrame(() => { mark.style.left = `${clamp(((pos - min) / (max - min)) * 100, 1, 99)}%`; }));
      kids.push(bar);
    }
    if (res.lines?.length) kids.push(buildElement('dl', { class: 'res-lines' }, res.lines.map(([k, v]) => buildElement('div', {}, buildElement('dt', { text: k }), buildElement('dd', { text: v })))));
    if (res.note) kids.push(buildElement('p', { class: 'res-note', text: res.note }));
    box.replaceChildren(...kids);
  };

  const buildCard = (c, i) => {
    const out = buildElement('div', { class: 'calc-out', 'aria-live': 'polite' });
    const inputs = {};
    const read = () => Object.fromEntries(c.fields.map((f) => {
      const raw = inputs[f.id].value;
      return [f.id, f.type === 'number' ? (raw === '' ? NaN : parseFloat(raw)) : raw];
    }));
    const update = () => {

      if (c.id === 'bodyfat') inputs.hip.closest('.f').hidden = inputs.sex.value !== 'f';
      renderResult(out, c.compute(read()));
    };

    const form = buildElement('form', { class: 'calc-form', novalidate: true, onSubmit: (e) => e.preventDefault() },
      c.fields.map((f) => {
        const id = `${c.id}-${f.id}`;
        let input;
        if (f.type === 'select') input = buildElement('select', { class: 'input', id }, f.options.map(([v, t]) => buildElement('option', { value: v, selected: v === f.value ? true : null }, t)));
        else input = buildElement('input', { class: 'input', id, type: f.type, value: f.value ?? '', min: f.min, max: f.max, step: f.step || (f.type === 'number' ? 1 : null), inputmode: f.type === 'number' ? 'decimal' : null });
        inputs[f.id] = input;
        input.addEventListener('input', update); input.addEventListener('change', update);
        const wide = f.type === 'select' && f.options.some(([, t]) => t.length > 22);
        return buildElement('div', { class: `f${wide ? ' wide' : ''}` }, buildElement('label', { for: id, text: f.label }), f.unit ? buildElement('div', { class: 'inp' }, input, buildElement('span', { class: 'u', text: f.unit })) : input);
      }));

    const card = buildElement('article', { class: 'calc card holo', style: `animation-delay:${i * 50}ms`, dataset: { group: c.group }, id: `calc-${c.id}` },
      buildElement('div', { class: 'calc-head' }, buildElement('div', { class: 'ico-wrap', html: Chaka.logos.icon(c.icon) }), buildElement('div', {}, buildElement('h3', { text: c.title }), buildElement('p', { text: c.desc }))),
      form, out,
      buildElement('details', { class: 'calc-src' }, buildElement('summary', { text: 'ფორმულა და წყარო' }), buildElement('p', {}, buildElement('code', { text: c.formula })), buildElement('p', { text: `წყარო: ${c.source}` })));
    update();
    return card;
  };

  const init = () => {
    const grid = $('#calc-grid');
    const cards = Chaka.CALCS.map(buildCard);
    grid.replaceChildren(...cards);

    const chips = $('#calc-groups');
    const paint = () => {
      chips.replaceChildren(...Chaka.CALC_GROUPS.map(([k, t]) => buildElement('button', { type: 'button', class: `chip${k === group ? ' is-active' : ''}`, 'aria-pressed': String(k === group), onClick: () => { group = k; paint(); } }, t)));
      cards.forEach((card) => { card.hidden = group !== 'all' && card.dataset.group !== group; });
      $('#calc-count').textContent = `კალკულატორი: ${cards.filter((c) => !c.hidden).length} / ${cards.length}`;
    };
    paint();
    if (location.hash.startsWith('#calc-')) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  };

  Chaka.calculators = { init };
})();
