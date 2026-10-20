'use strict';

(() => {
  const MIN_LOADER_MS = 900;
  const { $, $$, clamp, prefersReduced, store, paintRange } = Chaka;

  const initLoader = () => {
    const loader = $('#loader');
    if (!loader) return;
    try { if (sessionStorage.getItem('chaka.noLoader')) { sessionStorage.removeItem('chaka.noLoader'); loader.remove(); return; } } catch { /* storage or audio unavailable */ }
    const hide = () => { loader.classList.add('done'); setTimeout(() => loader.remove(), 1000); };
    const started = performance.now();
    const finish = () => setTimeout(hide, Math.max(0, MIN_LOADER_MS - (performance.now() - started)));
    if (document.readyState === 'complete') finish(); else window.addEventListener('load', finish, { once: true });
    setTimeout(hide, 4500);
  };

  const initTheme = () => {
    const root = document.documentElement;
    const saved = store.get('theme', null);
    const initial = saved || 'dark';
    const apply = (t) => { root.dataset.theme = t; $('meta[name="theme-color"]').content = t === 'dark' ? '#050a14' : '#f2f7fb'; Chaka.canvasColors && Chaka.canvasColors(); };
    apply(initial);
    $('#theme-toggle').addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      apply(next); store.set('theme', next);
    });
  };

  const initNav = () => {
    const header = $('.site-header'), nav = $('#main-nav'), burger = $('#burger');
    const bar = $('.scroll-progress span'), toTop = $('#to-top');

    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); } });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') nav.classList.remove('open'); });

    const onScroll = () => {
      const y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
      header.classList.toggle('scrolled', y > 10);
      toTop.classList.toggle('show', y > 700);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReduced() ? 'auto' : 'smooth' }));

    const links = new Map($$('[data-spy]').map((a) => [a.dataset.spy, a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.classList.remove('active'));
        links.get(en.target.id)?.classList.add('active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  };

  const initReveal = () => {
    const items = $$('.reveal');
    if (!('IntersectionObserver' in window) || prefersReduced()) { items.forEach((n) => n.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach((n) => io.observe(n));
    Chaka.observeReveal = (n) => { if (n.classList.contains('reveal')) io.observe(n); };
  };

  const initCounters = () => {
    const targets = {
      doctors: Chaka.DOCTORS.filter((d) => d.spec !== 'team').length,
      specs: Object.keys(Chaka.SPECS).filter((k) => k !== 'team').length,
      articles: Chaka.ARTICLES.length,
      aid: Chaka.FIRST_AID.length,
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const node = en.target, end = targets[node.dataset.count] ?? 0, t0 = performance.now(), dur = 1400;
        const tick = (now) => {
          const p = clamp((now - t0) / dur, 0, 1);
          node.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.unobserve(node);
      });
    });
    $$('[data-count]').forEach((n) => io.observe(n));
  };

  const initHolo = () => {
    if (!window.matchMedia('(hover: hover)').matches || prefersReduced()) return;
    document.addEventListener('pointermove', (e) => {
      const card = e.target.closest?.('.holo');
      if (!card) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', `${x * 100}%`);
      card.style.setProperty('--my', `${y * 100}%`);
      card.style.setProperty('--ry', `${(x - 0.5) * 7}deg`);
      card.style.setProperty('--rx', `${(0.5 - y) * 7}deg`);
    });
    document.addEventListener('pointerout', (e) => {
      const card = e.target.closest?.('.holo');
      if (card && !card.contains(e.relatedTarget)) { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); }
    });
  };

  const initPointerFx = () => {
    if (!window.matchMedia('(hover: hover)').matches) return;
    const glow = $('#cursor-glow');
    let raf = 0, tx = 0, ty = 0;
    document.addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(() => { glow.style.transform = `translate(${tx}px, ${ty}px)`; glow.classList.add('on'); raf = 0; });
      const b = e.target.closest?.('[data-magnetic]');
      if (b && !prefersReduced()) {
        const r = b.getBoundingClientRect();
        b.style.setProperty('--bx', `${(e.clientX - (r.left + r.width / 2)) * 0.22}px`);
        b.style.setProperty('--by', `${(e.clientY - (r.top + r.height / 2)) * 0.3}px`);
      }
    });
    document.addEventListener('pointerout', (e) => {
      const b = e.target.closest?.('[data-magnetic]');
      if (b) { b.style.setProperty('--bx', '0px'); b.style.setProperty('--by', '0px'); }
    });
    document.addEventListener('pointerleave', () => glow.classList.remove('on'));
  };

  const initHeroText = () => {
    const rot = $('#rotator');
    const words = Object.entries(Chaka.SPECS).filter(([k]) => k !== 'team').map(([, s]) => s.name);
    let i = 0;
    if (rot && !prefersReduced()) {
      setInterval(() => {
        rot.classList.add('out');
        setTimeout(() => { i = (i + 1) % words.length; rot.textContent = words[i]; rot.classList.remove('out'); }, 320);
      }, 2200);
    }
    const live = $('#bpm-live'), chip = $('#bpm-chip');
    setInterval(() => {
      const bpm = 68 + Math.round(Math.random() * 8);
      if (live) live.textContent = bpm;
      if (chip) chip.textContent = `BPM ${bpm}`;
    }, 1600);
  };

  const initCanvas = () => {
    const canvas = $('#hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1, running = true, parts = [];
    const mouse = { x: -999, y: -999 };
    let colors = { a: '45,245,196', b: '71,184,255', c: '143,123,255' };

    Chaka.canvasColors = () => {
      colors = document.documentElement.dataset.theme === 'light'
        ? { a: '0,156,120', b: '10,119,196', c: '90,68,230' }
        : { a: '45,245,196', b: '71,184,255', c: '143,123,255' };
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = clamp(Math.round((w * h) / 16000), 22, 70);
      parts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() * 1.8 + .6 }));
    };

    const drawHelix = (t) => {
      const cx = w > 960 ? w * 0.72 : w * 0.5, top = 30, bottom = h - 30, N = 30;
      const R = Math.min(70, w * 0.08) + 18;
      for (let i = 0; i < N; i++) {
        const y = top + ((bottom - top) * i) / (N - 1);
        const ph = t * 0.0012 + i * 0.42;
        const s = Math.sin(ph), z = Math.cos(ph);
        const x1 = cx + s * R, x2 = cx - s * R;
        ctx.strokeStyle = `rgba(${colors.b},${0.1 + Math.abs(z) * 0.1})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
        ctx.fillStyle = `rgba(${colors.a},${0.25 + (z + 1) * 0.3})`;
        ctx.beginPath(); ctx.arc(x1, y, 2.2 + (z + 1) * 1.8, 0, 6.283); ctx.fill();
        ctx.fillStyle = `rgba(${colors.c},${0.25 + (1 - z) * 0.3})`;
        ctx.beginPath(); ctx.arc(x2, y, 2.2 + (1 - z) * 1.8, 0, 6.283); ctx.fill();
      }
    };

    const frame = (t) => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      drawHelix(t);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 14000) { const f = 0.8 / Math.sqrt(d2 + 1); p.x += dx * f; p.y += dy * f; }
        ctx.fillStyle = `rgba(${colors.a},.6)`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const dx = parts[i].x - parts[j].x, dy = parts[i].y - parts[j].y, d = dx * dx + dy * dy;
          if (d < 12000) { ctx.strokeStyle = `rgba(${colors.b},${(1 - d / 12000) * 0.28})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(parts[i].x, parts[i].y); ctx.lineTo(parts[j].x, parts[j].y); ctx.stroke(); }
        }
      }
      requestAnimationFrame(frame);
    };

    Chaka.canvasColors();
    resize();
    window.addEventListener('resize', Chaka.debounce(resize, 150));
    canvas.parentElement.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    canvas.parentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });

    if (prefersReduced()) { frame(0); running = false; return; }

    const io = new IntersectionObserver(([en]) => {
      const next = en.isIntersecting && !document.hidden;
      if (next && !running) { running = true; requestAnimationFrame(frame); } else if (!next) running = false;
    });
    io.observe(canvas);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && !running) { running = true; requestAnimationFrame(frame); } else if (document.hidden) running = false; });
    requestAnimationFrame(frame);
  };

  const initRanges = () => {
    $$('input[type="range"]').forEach((r) => { paintRange(r); r.addEventListener('input', () => paintRange(r)); });
  };

  Chaka.effects = { initLoader, initTheme, initNav, initReveal, initCounters, initHolo, initPointerFx, initHeroText, initCanvas, initRanges };
})();
