'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const V = Vita;
  document.documentElement.classList.remove('no-js');

  V.effects.initLoader();
  V.effects.initTheme();
  V.logos.mount();

  V.symptoms.init();
  V.doctors.init();
  V.tools.init();
  V.firstaid.init();
  V.library.init();
  V.contact.init();
  V.initMiniMap();

  V.effects.initNav();
  V.effects.initRanges();
  V.effects.initReveal();
  V.effects.initCounters();
  V.effects.initHolo();
  V.effects.initPointerFx();
  V.effects.initHeroText();
  V.effects.initCanvas();

  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
});
