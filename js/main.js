'use strict';

document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.remove('no-js');

  Chaka.effects.initLoader();
  Chaka.effects.initTheme();
  Chaka.logos.mount();

  Chaka.symptoms.init();
  Chaka.doctors.init();
  Chaka.tools.init();
  Chaka.firstaid.init();
  Chaka.library.init();
  Chaka.contact.init();
  Chaka.initMiniMap();

  Chaka.effects.initNav();
  Chaka.effects.initRanges();
  Chaka.effects.initReveal();
  Chaka.effects.initCounters();
  Chaka.effects.initHolo();
  Chaka.effects.initPointerFx();
  Chaka.effects.initHeroText();
  Chaka.effects.initCanvas();

  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
});
