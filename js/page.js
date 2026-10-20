'use strict';

document.addEventListener('DOMContentLoaded', () => {
  Chaka.effects.initLoader();
  Chaka.effects.initTheme();
  Chaka.logos.mount();
  Chaka.clinicsPage?.init();
  Chaka.calculators?.init();
  Chaka.diary?.init();
  Chaka.labs?.init();
  Chaka.prep?.init();
  Chaka.firstaid?.init();
  Chaka.emergency?.init();
  Chaka.contact.init();
  Chaka.effects.initNav();
  Chaka.effects.initRanges();
  Chaka.effects.initReveal();
  Chaka.effects.initHolo();
  Chaka.effects.initPointerFx();
  document.getElementById('year').textContent = new Date().getFullYear();
});
