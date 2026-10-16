'use strict';
/* ==========================================================
   page.js — ქვე-გვერდების (კლინიკები, კალკულატორები) საერთო ინიციალიზაცია
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const V = Vita;
  V.effects.initLoader();
  V.effects.initTheme();
  V.logos.mount();
  V.clinicsPage?.init();
  V.calculators?.init();
  V.diary?.init();
  V.contact.init();
  V.effects.initNav();
  V.effects.initRanges();
  V.effects.initReveal();
  V.effects.initHolo();
  V.effects.initPointerFx();
  document.getElementById('year').textContent = new Date().getFullYear();
});
