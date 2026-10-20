'use strict';

(() => {
  const { $, buildElement } = Chaka;
  let audioCtx = null, beepTimer = null;

  const stopBeep = () => { clearInterval(beepTimer); beepTimer = null; };
  const beep = () => {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = 880; g.gain.setValueAtTime(.18, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + .09);
      o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + .1);
    } catch { /* storage or audio unavailable */ }
  };

  const openAid = (item) => {
    const dlg = $('#aid-modal'), body = $('#aid-body');
    let idx = 0;
    const total = item.steps.length;

    const bar = buildElement('i');
    const stepBox = buildElement('div', { class: 'step-box', 'aria-live': 'polite' });
    const prev = buildElement('button', { type: 'button', class: 'btn btn-ghost btn-sm', onClick: () => go(-1) }, '← უკან');
    const next = buildElement('button', { type: 'button', class: 'btn btn-primary btn-sm', onClick: () => go(1) }, 'შემდეგი →');

    const paint = () => {
      const [t, d] = item.steps[idx];
      stepBox.replaceChildren(buildElement('span', { class: 'sn', text: `ნაბიჯი ${idx + 1} / ${total}` }), buildElement('h4', { text: t }), buildElement('p', { text: d }));
      bar.style.width = `${((idx + 1) / total) * 100}%`;
      prev.disabled = idx === 0;
      next.textContent = idx === total - 1 ? 'დასრულება ✓' : 'შემდეგი →';
    };
    const go = (dir) => {
      if (idx + dir >= total) { dlg.close(); Chaka.toast('გახსოვდეს: პირველ რიგში — 112'); return; }
      idx = Chaka.clamp(idx + dir, 0, total - 1); paint();
    };

    let metro = null;
    if (item.bpm) {
      const heart = buildElement('span', { class: 'heart beat', 'aria-hidden': 'true', text: '♥' });
      heart.style.animationDuration = `${60 / item.bpm}s`;
      const soundBtn = buildElement('button', { type: 'button', class: 'btn btn-ghost btn-sm', 'aria-pressed': 'false', onClick: (e) => {
        if (beepTimer) { stopBeep(); e.currentTarget.textContent = '🔈 ხმის ჩართვა'; e.currentTarget.setAttribute('aria-pressed', 'false'); }
        else { beep(); beepTimer = setInterval(beep, 60000 / item.bpm); e.currentTarget.textContent = '🔊 ხმის გამორთვა'; e.currentTarget.setAttribute('aria-pressed', 'true'); }
      } }, '🔈 ხმის ჩართვა');
      metro = buildElement('div', { class: 'metro' }, heart, buildElement('p', {}, 'დაწოლის ტემპი: ', buildElement('b', { text: `${item.bpm} / წთ` }), '. დაჭირეთ გულის პულსაციის რიტმში.'), soundBtn);
    }

    body.replaceChildren(buildElement('div', { class: 'modal-in' },
      buildElement('h3', { id: 'aid-title', text: item.title }),
      buildElement('div', { class: 'warn', html: '⚠ ' }, item.warn),
      buildElement('div', { class: 'stepper-bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(total) }, bar),
      stepBox, metro,
      buildElement('div', { class: 'step-nav' }, prev, buildElement('a', { class: 'btn btn-ghost btn-sm btn-danger', href: 'tel:112' }, '📞 112'), next)));
    paint();
    dlg.showModal();
  };

  const init = () => {
    const grid = $('#aid-grid');
    grid.replaceChildren(...Chaka.FIRST_AID.map((it, i) => buildElement('button', { type: 'button', class: 'aid-card card holo reveal', style: `--c:${it.color};--d:${i * 0.07}s`, onClick: () => openAid(it) },
      buildElement('span', { class: 'aid-ico', html: Chaka.logos.icon(it.icon) }),
      buildElement('h3', { text: it.title }),
      buildElement('p', { text: it.short }),
      buildElement('span', { class: 'go', text: `${it.steps.length} ნაბიჯი →` }))));
    grid.querySelectorAll('.reveal').forEach((n) => Chaka.observeReveal?.(n));
    const dlg = $('#aid-modal');
    dlg.addEventListener('close', stopBeep);
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  };

  Chaka.firstaid = { init };
})();
