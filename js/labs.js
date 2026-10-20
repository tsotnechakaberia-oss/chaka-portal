'use strict';

(() => {
  const { $, buildElement, store, toast, setError, todayKey, t, pick } = Chaka;
  const SAVED_KEY = 'labs';

  const state = { labId: 'glu', sex: store.get('labSex', 'f'), result: null };
  let savedResults = [];

  const findLab = (id) => Chaka.LABS.find((lab) => lab.id === id);
  const formatNumber = (value) => String(Number(value.toPrecision(3)));
  const statusOf = (lab, band) => {
    const base = Chaka.LAB_STATUS[band.key];
    return { tone: band.tone || base.tone, label: band.label || base.label };
  };
  const bandsFor = (lab, sex) => lab.bands(sex);
  const bandIndexFor = (bands, canon) => bands.findIndex((band) => canon < band.to);

  const parseNumber = (raw) => Number(String(raw).trim().replace(',', '.'));

  const rangeText = (lab, unit, sex) => {
    const bands = bandsFor(lab, sex);
    const normalIndex = bands.findIndex((band) => band.key === 'normal');
    const lower = normalIndex > 0 ? bands[normalIndex - 1].to : null;
    const upper = bands[normalIndex].to === Infinity ? null : bands[normalIndex].to;
    const shown = (canon) => formatNumber(unit.toUnit(canon));
    if (lower !== null && upper !== null) return `${shown(lower)} – ${shown(upper)} ${unit.unit}`;
    if (upper !== null) return `< ${shown(upper)} ${unit.unit}`;
    return `≥ ${shown(lower)} ${unit.unit}`;
  };

  const buildScale = (lab, bands, canon) => {
    const [min, max] = lab.scale;
    const span = max - min;
    const percent = (value) => Chaka.clamp(((value - min) / span) * 100, 0, 100);
    const segments = bands.map((band, index) => {
      const start = Math.max(index === 0 ? min : bands[index - 1].to, min);
      const end = Math.min(band.to, max);
      if (end <= start) return null;
      const tone = band.tone || Chaka.LAB_STATUS[band.key].tone;
      return buildElement('i', { class: `lab-seg tone-${tone}`, style: `width:${percent(end) - percent(start)}%` });
    });
    const marker = buildElement('b', { class: 'lab-marker', style: `left:${percent(canon)}%`, 'aria-hidden': 'true' });
    return buildElement('div', { class: 'lab-scale', role: 'img', 'aria-label': t('შედეგის მდებარეობა შკალაზე', 'Result position on the scale') }, ...segments, marker);
  };

  const explanationFor = (lab, bands, index) => {
    const band = bands[index];
    if (band.key === 'normal') return t('ეს მნიშვნელობა ტიპური ზრდასრულის ნორმის ფარგლებშია. თუ თავს ცუდად გრძნობთ, ეს არ გამორიცხავს პრობლემას. შედეგი ექიმთან განიხილეთ.', 'This value is within the typical adult range. If you feel unwell, that does not rule out a problem; discuss the result with a doctor.');
    const normalIndex = bands.findIndex((b) => b.key === 'normal');
    const text = index < normalIndex ? lab.lowText : lab.highText;
    if (text && pick(text)) return pick(text);
    return index < normalIndex
      ? t('მაჩვენებელი ნორმაზე დაბალია. მიზეზის გასარკვევად ექიმთან განიხილეთ.', 'This value is below the typical range. Discuss the cause with a doctor.')
      : t('მაჩვენებელი ნორმაზე მაღალია. მიზეზის გასარკვევად ექიმთან განიხილეთ.', 'This value is above the typical range. Discuss the cause with a doctor.');
  };

  const isCritical = (lab, canon) => Boolean(lab.critical) && (canon < lab.critical[0] || canon > lab.critical[1]);

  const evaluate = (lab, sex, unit, value) => {
    const canon = unit.fromUnit(value);
    const bands = bandsFor(lab, sex);
    const index = bandIndexFor(bands, canon);
    return { labId: lab.id, sex, canon, bandKey: bands[index].key, unitLabel: unit.unit, value };
  };

  const renderResult = () => {
    const box = $('#lab-result');
    const result = state.result;
    if (!result) { box.hidden = true; return; }
    const lab = findLab(result.labId);
    const unit = lab.units.find((candidate) => candidate.unit === result.unitLabel);
    const bands = bandsFor(lab, result.sex);
    const index = bandIndexFor(bands, result.canon);
    const status = statusOf(lab, bands[index]);
    const critical = isCritical(lab, result.canon);

    box.hidden = false;
    box.replaceChildren(...[
      buildElement('div', { class: 'lab-result-head' },
        buildElement('div', {}, buildElement('small', { class: 'mono', text: lab.abbr }), buildElement('h3', { text: pick(lab.name) })),
        buildElement('div', { class: 'lab-value' }, buildElement('b', { text: formatNumber(result.value) }), ` ${unit.unit}`)),
      buildElement('span', { class: `chip-res tone-${status.tone}`, text: pick(status.label) }),
      buildScale(lab, bands, result.canon),
      buildElement('p', { class: 'lab-range mono', text: `${t('ტიპური დიაპაზონი', 'Typical range')}: ${rangeText(lab, unit, result.sex)}` }),
      critical ? buildElement('div', { class: 'urgency u-red', role: 'alert' },
        buildElement('span', { class: 'u-ico', text: '🚨' }),
        buildElement('div', {}, t('მაჩვენებელი ძალიან მკვეთრადაა გადახრილი', 'This value is far outside the usual range'),
          buildElement('small', { text: t('დღესვე დაუკავშირდით ექიმს ან ლაბორატორიას. მძიმე სიმპტომების (ქოშინი, გონების დაბინდვა, სისხლდენა, ძლიერი ტკივილი) დროს დარეკეთ 112.', 'Contact a doctor or the lab today. If you have severe symptoms (breathlessness, confusion, bleeding, strong pain), call 112.') }))) : null,
      buildElement('h4', { text: t('რას ნიშნავს', 'What it means') }),
      buildElement('p', { text: pick(lab.about) }),
      buildElement('p', { text: explanationFor(lab, bands, index) }),
      lab.tip ? buildElement('p', { class: 'note', text: pick(lab.tip) }) : null,
      buildElement('div', { class: 'lab-actions' },
        buildElement('button', { type: 'button', class: 'btn btn-primary btn-sm', onClick: saveCurrent }, t('💾 ჩემს ანალიზებში შენახვა', '💾 Save to my results')),
        lab.id === 'crea' ? buildElement('a', { class: 'btn btn-ghost btn-sm', href: 'calculators.html' }, t('eGFR კალკულატორი →', 'eGFR calculator →')) : null,
        buildElement('a', { class: 'btn btn-ghost btn-sm', href: 'prep.html' }, t('ვიზიტისთვის მომზადება →', 'Prepare for a visit →'))),
      buildElement('p', { class: 'note', text: t('დიაპაზონები ტიპური ზრდასრულისთვისაა. თქვენი ლაბორატორიის ბლანკზე მითითებული ნორმა შეიძლება განსხვავდებოდეს და ის უპირატესია. ეს ახსნა დიაგნოზი არ არის.', 'Ranges are for a typical adult. The range printed on your lab report may differ and takes precedence. This explanation is not a diagnosis.') }),
    ].filter(Boolean));
  };

  const renderUnits = () => {
    const lab = findLab(state.labId);
    const select = $('#lab-unit');
    select.replaceChildren(...lab.units.map((unit) => buildElement('option', { value: unit.unit, text: unit.unit })));
  };

  const renderSexRow = () => {
    const lab = findLab(state.labId);
    $('#lab-sex-row').hidden = !lab.sexSpecific;
  };

  const renderChips = () => {
    const box = $('#lab-picker');
    box.replaceChildren(...Chaka.LAB_GROUPS.map(([groupId, groupName]) => buildElement('div', { class: 'lab-group' },
      buildElement('h3', { class: 'lab-group-title mono', text: pick(groupName) }),
      buildElement('div', { class: 'chip-wrap' }, Chaka.LABS.filter((lab) => lab.group === groupId).map((lab) => buildElement('button', {
        type: 'button', class: `chip${lab.id === state.labId ? ' is-active' : ''}`, 'aria-pressed': String(lab.id === state.labId),
        onClick: () => selectLab(lab.id),
      }, pick(lab.name)))))));
  };

  const selectLab = (id) => {
    state.labId = id;
    state.result = null;
    $('#lab-value').value = '';
    setError($('#lab-value'), '');
    renderChips(); renderUnits(); renderSexRow(); renderResult();
    $('#lab-title').textContent = pick(findLab(id).name);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const lab = findLab(state.labId);
    const input = $('#lab-value');
    const unit = lab.units.find((candidate) => candidate.unit === $('#lab-unit').value) || lab.units[0];
    const raw = input.value.trim();
    if (!raw) { setError(input, t('შეიყვანეთ მნიშვნელობა', 'Enter a value')); return; }
    const value = parseNumber(raw);
    if (!Number.isFinite(value) || value < 0) { setError(input, t('შეიყვანეთ რიცხვი, მაგ.: 5.4', 'Enter a number, e.g. 5.4')); return; }
    const canon = unit.fromUnit(value);
    const [min, max] = lab.plausible;
    if (canon < min || canon > max) { setError(input, t('მნიშვნელობა არარეალურია — შეამოწმეთ ერთეული', 'This value looks unrealistic — check the unit')); return; }
    setError(input, '');
    state.result = evaluate(lab, state.sex, unit, value);
    renderResult();
    $('#lab-result').scrollIntoView({ behavior: Chaka.prefersReduced() ? 'auto' : 'smooth', block: 'nearest' });
  };

  const saveCurrent = () => {
    const result = state.result;
    if (!result) return;
    savedResults = savedResults.filter((entry) => entry.labId !== result.labId);
    savedResults.push({ ...result, date: todayKey() });
    store.set(SAVED_KEY, savedResults);
    renderSaved();
    toast(t('ანალიზი შენახულია (მხოლოდ თქვენს ბრაუზერში)', 'Result saved (in your browser only)'));
  };

  const removeSaved = (labId) => {
    savedResults = savedResults.filter((entry) => entry.labId !== labId);
    store.set(SAVED_KEY, savedResults);
    renderSaved();
  };

  const renderSaved = () => {
    const list = $('#lab-saved');
    $('#lab-saved-count').textContent = savedResults.length;
    if (!savedResults.length) {
      list.replaceChildren(buildElement('li', { class: 'empty-note', text: t('ჯერ არაფერი გაქვთ შენახული.', 'Nothing saved yet.') }));
      return;
    }
    list.replaceChildren(...savedResults.map((entry) => {
      const lab = findLab(entry.labId);
      const bands = bandsFor(lab, entry.sex);
      const status = statusOf(lab, bands[bandIndexFor(bands, entry.canon)]);
      return buildElement('li', { class: 'booking-item' },
        buildElement('div', {}, buildElement('b', { text: pick(lab.name) }), buildElement('small', { text: `${formatNumber(entry.value)} ${entry.unitLabel} · ${entry.date}` })),
        buildElement('div', { style: 'display:flex;gap:.6rem;align-items:center' },
          buildElement('span', { class: `chip-res tone-${status.tone}`, text: pick(status.label) }),
          buildElement('button', { type: 'button', class: 'btn btn-ghost btn-sm btn-danger', 'aria-label': t('წაშლა', 'Delete'), onClick: () => removeSaved(entry.labId) }, '✕')));
    }));
  };

  const init = () => {
    if (!$('#lab-form')) return;
    savedResults = store.get(SAVED_KEY, []);
    $('#lab-form').addEventListener('submit', onSubmit);
    document.querySelectorAll('input[name="lab-sex"]').forEach((radio) => {
      radio.checked = radio.value === state.sex;
      radio.addEventListener('change', () => {
        state.sex = radio.value;
        store.set('labSex', state.sex);
        if (state.result) { state.result = evaluate(findLab(state.labId), state.sex, findLab(state.labId).units.find((u) => u.unit === state.result.unitLabel), state.result.value); renderResult(); }
      });
    });
    $('#lab-value').addEventListener('input', () => setError($('#lab-value'), ''));
    selectLab(state.labId);
    renderSaved();
  };

  Chaka.labs = { init };
})();
