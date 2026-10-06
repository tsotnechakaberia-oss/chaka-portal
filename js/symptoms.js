'use strict';
/* ==========================================================
   symptoms.js — სხეულის ინტერაქტიული რუკა და სიმპტომების ანალიზი
   (საინფორმაციო მიზნით; არ არის დიაგნოზი)
   ========================================================== */
(() => {
  const { $, $$, el, toast } = Vita;
  const selected = new Set();
  let region = null;

  const allSymptoms = () => Object.values(Vita.REGIONS).flatMap((r) => r.symptoms);
  const findSymptom = (id) => allSymptoms().find((s) => s.id === id);

  const setRegion = (key) => {
    region = key;
    $$('.region').forEach((n) => n.classList.toggle('is-active', n.dataset.region === key));
    $('.region-general').classList.toggle('is-active', key === 'general');
    const data = Vita.REGIONS[key];
    $('#sp-title').textContent = data.title;
    $('#body-hint').textContent = `ზონა: ${data.title}`;
    renderChips();
  };

  const renderChips = () => {
    const box = $('#symptom-chips');
    box.replaceChildren();
    if (!region) { box.append(el('p', { class: 'empty-note', text: 'სხეულის რუკაზე დააჭირე ზონას — აქ გამოჩნდება შესაბამისი სიმპტომები.' })); return; }
    Vita.REGIONS[region].symptoms.forEach((s) => {
      const on = selected.has(s.id);
      box.append(el('button', {
        type: 'button', class: `chip sym${s.red ? ' red' : ''}${on ? ' is-active' : ''}`, 'aria-pressed': String(on), title: s.red ? 'საგანგებო ნიშანი' : '',
        onClick: (e) => {
          selected.has(s.id) ? selected.delete(s.id) : selected.add(s.id);
          e.currentTarget.classList.toggle('is-active', selected.has(s.id));
          e.currentTarget.setAttribute('aria-pressed', String(selected.has(s.id)));
          updateCounter();
        },
      }, s.name));
    });
  };

  const updateCounter = () => {
    const n = selected.size;
    $('#analyze-btn').textContent = n ? `გაანალიზება (${n})` : 'გაანალიზება';
  };

  const analyze = () => {
    if (!selected.size) { toast('ჯერ აირჩიე მინიმუმ ერთი სიმპტომი', 'error'); return; }
    const picks = [...selected].map(findSymptom).filter(Boolean);
    const duration = $('#duration').value;
    const child = $('#child-toggle').checked;

    const scores = {};
    picks.forEach((s) => Object.entries(s.w).forEach(([k, v]) => { if (v > 0) scores[k] = (scores[k] || 0) + v; }));
    if (child) scores.peds = (scores.peds || 0) + 4;
    const top = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const max = top[0]?.[1] || 1;

    const hasRed = picks.some((s) => s.red);
    let level = 'green', icon = '🟢', title = 'დაგეგმეთ ვიზიტი, თუ სიმპტომები გაგრძელდა', text = 'ახლა საგანგებო ნიშნები არ ჩანს, თუმცა თუ მდგომარეობა გაუარესდა — მიმართეთ ექიმს.';
    if (hasRed) { level = 'red'; icon = '🚨'; title = 'ეს შეიძლება სასწრაფო მდგომარეობა იყოს'; text = 'დაუყოვნებლივ დარეკეთ 112-ზე. ნუ დაელოდებით დაჯავშნას.'; }
    else if (duration === 'long' || picks.length >= 3 || (duration === 'mid' && picks.length >= 2)) { level = 'amber'; icon = '🟡'; title = 'რეკომენდებულია ვიზიტი უახლოეს დღეებში'; text = 'სიმპტომების ხანგრძლივობა ან რაოდენობა ექიმის შეფასებას ითხოვს.'; }

    const box = $('#symptom-result');
    box.hidden = false;
    box.replaceChildren(
      el('div', { class: `urgency u-${level}`, role: hasRed ? 'alert' : null }, el('span', { class: 'u-ico', text: icon }), el('div', {}, title, el('small', { text: text }))),
      hasRed ? el('a', { class: 'btn btn-primary btn-sm', href: 'tel:112', style: 'margin-bottom:1rem', text: '📞 დარეკვა 112' }) : null,
      el('h4', { text: 'რომელ სპეციალისტს მიმართო' }),
      ...top.map(([key, score]) => {
        const sp = Vita.SPECS[key];
        const bar = el('i');
        requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = `${Math.round((score / max) * 100)}%`; }));
        return el('div', { class: 'spec-row' },
          el('span', { class: 'ic', html: Vita.logos.icon(sp.icon) }),
          el('span', { class: 'nm', text: sp.name }),
          el('div', { class: 'bar' }, bar),
          el('button', { type: 'button', class: 'btn btn-ghost btn-sm go', onClick: () => Vita.doctors.filterBy(key) }, 'ექიმები →'));
      }),
      el('ul', { class: 'hint-list' }, picks.slice(0, 5).map((s) => el('li', {}, el('b', { text: s.name + ': ' }), s.hint))),
      el('p', { class: 'note', text: 'შედეგი ინფორმაციული ხასიათისაა და არ ცვლის ექიმის კონსულტაციას.' }),
    );
    box.scrollIntoView({ behavior: Vita.prefersReduced() ? 'auto' : 'smooth', block: 'nearest' });
  };

  const reset = () => {
    selected.clear(); region = null;
    $$('.region').forEach((n) => n.classList.remove('is-active'));
    $('.region-general').classList.remove('is-active');
    $('#sp-title').textContent = 'აირჩიე ზონა';
    $('#body-hint').textContent = 'აირჩიე სხეულის ზონა';
    $('#symptom-result').hidden = true;
    $('#child-toggle').checked = false;
    $('#duration').value = 'short';
    renderChips(); updateCounter();
  };

  const init = () => {
    $$('.region').forEach((n) => {
      n.addEventListener('click', () => setRegion(n.dataset.region));
      n.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setRegion(n.dataset.region); } });
    });
    $('.region-general').addEventListener('click', () => setRegion('general'));
    $('#analyze-btn').addEventListener('click', analyze);
    $('#reset-symptoms').addEventListener('click', reset);
  };

  Vita.symptoms = { init };
})();
