'use strict';
(() => {
  const cfg = window.SITE_CONFIG || {};
  const root = document.documentElement;
  const body = document.body;
  const page = body.dataset.page;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce');
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } }
  };
  if (reduce) root.classList.add('reduce');
  const motionBtn = $('[data-motion-toggle]');
  if (motionBtn) {
    motionBtn.setAttribute('aria-pressed', String(reduce));
    motionBtn.textContent = reduce ? 'Activar animaciones' : 'Reducir animaciones';
    motionBtn.addEventListener('click', () => {
      try { if (reduce) localStorage.removeItem('fa-motion'); else localStorage.setItem('fa-motion', 'reduce'); } catch (e) { /* sin almacenamiento */ }
      location.reload();
    });
  }

  /* Contacto centralizado en config.js */
  if (cfg.phone) $$('[data-phone]').forEach(a => { a.href = `tel:${cfg.phone}`; });
  if (cfg.email) $$('[data-email]').forEach(a => { a.href = `mailto:${cfg.email}`; });
  if (cfg.whatsapp && cfg.whatsapp.number) $$('a[data-wa]').forEach(a => { a.href = a.href.replace(/wa\.me\/\d+/, `wa.me/${cfg.whatsapp.number}`); });
  const waFloat = $('.wa-float');
  if (waFloat && !store.get('fa-wa-hint')) {
    setTimeout(() => { waFloat.classList.add('is-hint'); store.set('fa-wa-hint', '1'); setTimeout(() => waFloat.classList.remove('is-hint'), 5000); }, 6000);
  }
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ---------------- Precarga (una vez por sesión) y entrada ---------------- */
  const pre = $('.preloader');
  const hero = $('[data-hero]');
  const startHero = () => hero && hero.classList.add('is-ready');
  if (pre && !reduce && root.classList.contains('intro')) {
    store.set('fa-intro', '1');
    body.style.overflow = 'hidden';
    const yearEl = $('[data-pl-year]', pre);
    const start = performance.now();
    const target = new Date().getFullYear();
    const tick = now => {
      const p = clamp((now - start) / 1500, 0, 1);
      const e = 1 - Math.pow(1 - p, 3);
      yearEl.textContent = Math.round(1920 + (target - 1920) * e);
      if (p < 1) requestAnimationFrame(tick);
      else setTimeout(() => {
        pre.classList.add('is-done');
        body.style.overflow = '';
        setTimeout(startHero, 250);
        setTimeout(() => { pre.remove(); root.classList.remove('intro'); }, 1100);
      }, 250);
    };
    requestAnimationFrame(tick);
  } else {
    pre && pre.remove();
    requestAnimationFrame(() => setTimeout(startHero, 60));
  }

  /* Transición de obturador entre páginas */
  store.set('fa-shutter', '0');
  if (root.classList.contains('is-entering')) {
    requestAnimationFrame(() => requestAnimationFrame(() => { root.classList.add('is-entered'); root.classList.remove('is-entering'); }));
  }
  const shutter = $('.shutter');
  document.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (!a || reduce || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const href = a.getAttribute('href');
    if (!href || a.target === '_blank' || href.startsWith('#') || /^(tel|mailto|https?):/.test(href)) return;
    const url = new URL(href, location.href);
    if (url.pathname === location.pathname && url.hash) return;
    e.preventDefault();
    store.set('fa-shutter', '1');
    shutter.classList.add('is-closing');
    setTimeout(() => { location.href = url.href; }, 480);
  });
  addEventListener('pageshow', e => { if (e.persisted) { shutter.classList.remove('is-closing'); root.classList.remove('is-entering'); } });

  /* ---------------- Cabecera ---------------- */
  const header = $('[data-header]');
  const progress = $('.progress span');
  const toTop = $('[data-top]');
  const ring = toTop && $('.to-top-ring', toTop);
  const mobileBar = $('.mobile-bar');
  let lastY = scrollY;
  let velocity = 0;
  const onScroll = () => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? y / max : 0;
    velocity = clamp(velocity + (y - lastY) * 0.02, -3, 3);
    header.classList.toggle('is-solid', y > 40);
    if (!body.classList.contains('menu-open') && !$('.mega.is-open')) header.classList.toggle('is-hidden', y > lastY && y > 400);
    if (y < lastY) header.classList.remove('is-hidden');
    progress.style.transform = `scaleX(${p})`;
    toTop && toTop.classList.toggle('is-on', y > innerHeight);
    ring && (ring.style.strokeDashoffset = String(138.2 * (1 - p)));
    mobileBar && mobileBar.classList.toggle('is-on', y > innerHeight * 0.5);
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop && toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  /* ---------------- Mega menú ---------------- */
  const megaBtn = $('[data-mega-toggle]');
  const mega = $('[data-mega]');
  if (megaBtn && mega) {
    let closeTimer;
    const previews = $$('.mega-img', mega);
    const caption = $('.mega-caption', mega);
    const show = (id, label) => {
      previews.forEach(p => p.classList.toggle('is-on', p.dataset.for === id));
      if (label) caption.textContent = label;
    };
    const links = $$('.mega-list a', mega);
    show(links[0].dataset.preview, $('.mega-name', links[0]).textContent);
    links.forEach(a => {
      const on = () => { links.forEach(l => l.classList.toggle('is-hover', l === a)); show(a.dataset.preview, $('.mega-name', a).textContent); };
      a.addEventListener('mouseenter', on); a.addEventListener('focus', on);
    });
    const open = () => { clearTimeout(closeTimer); mega.classList.add('is-open'); megaBtn.setAttribute('aria-expanded', 'true'); header.classList.add('is-solid'); };
    const close = (focus) => { mega.classList.remove('is-open'); megaBtn.setAttribute('aria-expanded', 'false'); onScroll(); if (focus) megaBtn.focus(); };
    megaBtn.addEventListener('click', () => (mega.classList.contains('is-open') ? close() : open()));
    const li = megaBtn.parentElement;
    if (fine) {
      li.addEventListener('mouseenter', open);
      li.addEventListener('mouseleave', () => { closeTimer = setTimeout(close, 180); });
    }
    li.addEventListener('focusout', e => { if (!li.contains(e.relatedTarget)) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && mega.classList.contains('is-open')) close(true); });
  }

  /* ---------------- Menú a pantalla completa ---------------- */
  const burger = $('[data-menu-toggle]');
  const overlay = $('[data-overlay]');
  if (burger && overlay) {
    const imgs = $$('.ov-img', overlay);
    const links = $$('.ov-nav a', overlay);
    const label = $('.burger-label', burger);
    const show = id => imgs.forEach(i => i.classList.toggle('is-on', i.dataset.for === id));
    const current = links.find(a => a.hasAttribute('aria-current')) || links[0];
    links.forEach(a => { a.addEventListener('mouseenter', () => show(a.dataset.preview)); a.addEventListener('focus', () => show(a.dataset.preview)); });
    let closing;
    const open = () => {
      clearTimeout(closing);
      overlay.hidden = false;
      show(current.dataset.preview);
      requestAnimationFrame(() => overlay.classList.add('is-open'));
      body.classList.add('menu-open'); burger.setAttribute('aria-expanded', 'true'); label.textContent = 'Cerrar';
      header.classList.remove('is-hidden');
      setTimeout(() => current.focus({ preventScroll: true }), 350);
    };
    const close = (focus = true) => {
      overlay.classList.remove('is-open');
      body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); label.textContent = 'Menú';
      closing = setTimeout(() => { overlay.hidden = true; }, 900);
      if (focus) burger.focus();
    };
    burger.addEventListener('click', () => (overlay.classList.contains('is-open') ? close() : open()));
    document.addEventListener('keydown', e => {
      if (!overlay.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        const items = [burger, ...$$('a', overlay)];
        const i = items.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
        else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
      }
    });
    overlay.addEventListener('click', e => { if (e.target.closest('a[href^="#"]')) close(false); });
  }

  /* ---------------- Cursor personalizado ---------------- */
  const cursor = $('.cursor');
  if (cursor && fine && !reduce) {
    root.classList.add('has-cursor');
    const dot = $('.cursor-dot', cursor), ringEl = $('.cursor-ring', cursor), txt = $('b', ringEl);
    let mx = -100, my = -100, rx = -100, ry = -100;
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px)`; cursor.classList.remove('is-hidden'); }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
    const loop = () => { rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18; ringEl.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(loop); };
    loop();
    document.addEventListener('pointerover', e => {
      const t = e.target;
      const view = t.closest('.shot, .panel, .frame, .ig, .rel, .fan, .film-cell, video');
      const link = !view && t.closest('a, button, summary, select, input, textarea, label');
      cursor.classList.toggle('is-view', !!view);
      cursor.classList.toggle('is-link', !!link);
      if (view) txt.textContent = view.matches('.shot') ? 'Ampliar' : view.matches('video') ? 'Vídeo' : view.matches('.ig') ? 'Instagram' : 'Ver';
    });
  }

  /* ---------------- Botones magnéticos ---------------- */
  if (fine && !reduce) {
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.35;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transition = 'transform .6s cubic-bezier(.22,1,.36,1), color .5s'; el.style.transform = ''; setTimeout(() => { el.style.transition = ''; }, 600); });
    });
  }

  /* ---------------- Texto partido en palabras ---------------- */
  const splitWords = el => {
    let n = 0;
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const inner = document.createElement('span'); inner.textContent = part; inner.style.setProperty('--d', n++);
            w.appendChild(inner); frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) walk(child);
      });
    };
    walk(el);
  };
  $$('[data-split]').forEach(splitWords);

  /* ---------------- Revelado al hacer scroll ---------------- */
  $$('.sec-lead, .s-lead, .lead-p, .ch-head, .spot-copy > p, .print-copy > p, .her-copy > p, .chips, .ticks, .mini-timeline, .stat, .faq-item, .rel, .combo-copy > p, .vf-copy > p, .tl-body, .studio-grid p, .c-method, .form-card, .ig, .sec-head .link, .hero-actions:not(.hero .hero-actions)').forEach(el => el.classList.add('rv'));
  $$('.masonry .shot-frame, .frame-img, .ws-item .shot-frame, .combo-pics .shot-frame, .studio-pics .shot-frame, .tl-img, .viewfinder, .pf-item .shot-frame, .phone-screen').forEach(el => el.classList.add('dev'));
  const s = $('.s-hero-media'); s && requestAnimationFrame(() => setTimeout(() => s.classList.add('in'), 80));
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('.rv, .dev, [data-split], [data-fan], [data-steps], .tl-item').forEach((el, i) => {
      if (el.classList.contains('rv')) el.style.transitionDelay = `${(i % 4) * 70}ms`;
      io.observe(el);
    });
  } else {
    $$('.rv, .dev, [data-split], [data-fan], [data-steps], .tl-item').forEach(el => el.classList.add('in'));
  }

  /* Texto que se «enciende» palabra a palabra */
  const fills = $$('[data-fill]').map(el => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="fw">${w}</span>`).join(' ');
    return { el, words: $$('.fw', el) };
  });

  /* Contadores */
  const counters = $$('[data-count]');
  if (counters.length) {
    const fmt = (v, d) => v.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: false });
    const run = el => {
      const to = parseFloat(el.dataset.count), from = parseFloat(el.dataset.from || 0), d = parseInt(el.dataset.decimals || 0, 10);
      if (reduce) { el.textContent = fmt(to, d); return; }
      const t0 = performance.now();
      const step = now => { const p = clamp((now - t0) / 1800, 0, 1); const e = 1 - Math.pow(1 - p, 4); el.textContent = fmt(from + (to - from) * e, d); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    const co = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { run(en.target); co.unobserve(en.target); } }), { threshold: 0.6 });
    counters.forEach(c => co.observe(c));
  }

  /* ---------------- Palabra rotatoria del hero ---------------- */
  const rot = $('[data-rotator]');
  if (rot) {
    const words = $$('.rot-word', rot);
    let i = 0;
    words[0].classList.add('is-on');
    if (!reduce) setInterval(() => {
      const prev = words[i]; i = (i + 1) % words.length;
      prev.classList.remove('is-on'); prev.classList.add('is-out');
      setTimeout(() => prev.classList.remove('is-out'), 900);
      words[i].classList.add('is-on');
    }, 2600);
  }

  /* ---------------- Marquesinas guiadas por el scroll ---------------- */
  const marquees = reduce ? [] : $$('[data-marquee]').map(el => ({ el, track: $('.marquee-track', el), speed: parseFloat(el.dataset.speed || 1), x: 0, w: 0, visible: true }));
  const vcols = reduce ? [] : $$('[data-vmarquee]').map(el => ({ el, track: $('.hc-track', el), speed: parseFloat(el.dataset.speed || 1), y: 0, h: 0, visible: true }));
  const measure = () => {
    marquees.forEach(m => { m.w = m.track.scrollWidth / 2; });
    vcols.forEach(c => { c.h = c.track.scrollHeight / 2; });
  };
  if (marquees.length || vcols.length) {
    const vis = new IntersectionObserver(es => es.forEach(en => { const m = marquees.find(x => x.el === en.target) || vcols.find(x => x.el === en.target); if (m) m.visible = en.isIntersecting; }));
    marquees.forEach(m => vis.observe(m.el)); vcols.forEach(c => vis.observe(c.el));
    addEventListener('load', measure); addEventListener('resize', measure); measure();
    let hover = null;
    $$('.filmstrip').forEach(f => { f.addEventListener('mouseenter', () => { hover = f; }); f.addEventListener('mouseleave', () => { hover = null; }); });
    let last = performance.now();
    const frame = now => {
      const dt = Math.min(64, now - last) / 16.67; last = now;
      velocity *= 0.92;
      const boost = 1 + Math.abs(velocity) * 0.35;
      const dir = 1;
      marquees.forEach(m => {
        if (!m.visible || !m.w) return;
        const slow = hover === m.el ? 0.25 : 1;
        m.x -= m.speed * 0.5 * dt * boost * dir * slow;
        if (m.x <= -m.w) m.x += m.w; if (m.x > 0) m.x -= m.w;
        m.track.style.transform = `translate3d(${m.x}px,0,0)`;
      });
      vcols.forEach(c => {
        if (!c.visible || !c.h) return;
        c.y -= c.speed * 0.4 * dt;
        if (c.y <= -c.h) c.y += c.h; if (c.y > 0) c.y -= c.h;
        c.track.style.transform = `translate3d(0,${c.y}px,0)`;
      });
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  /* ---------------- Efectos ligados al scroll (parallax, carrete, boda…) ---------------- */
  const parallax = (reduce || !fine || innerWidth < 900) ? [] : $$('[data-parallax]').map(el => ({ el, k: parseFloat(el.dataset.parallax) }));
  const hs = $('[data-hscroll]');
  const htrack = hs && $('[data-htrack]', hs);
  const hbar = hs && $('.life-progress span', hs);
  const pinMQ = matchMedia('(min-width: 961px)');
  const setupH = () => {
    if (!hs) return;
    const pin = pinMQ.matches && !reduce;
    hs.classList.toggle('is-pinned', pin);
    if (pin) {
      const extra = htrack.scrollWidth - innerWidth + parseFloat(getComputedStyle(htrack).marginLeft) * 2;
      hs.style.height = `${innerHeight + Math.max(0, extra)}px`;
      hs.dataset.extra = Math.max(0, extra);
    } else { hs.style.height = ''; htrack.style.transform = ''; }
  };
  setupH(); addEventListener('resize', setupH); addEventListener('load', setupH);
  const expand = $('[data-expand]');
  const expandTarget = expand && $('[data-expand-target]', expand);
  const steps = $('[data-steps]');
  const tl = $('[data-timeline]');
  const chapterLinks = $$('.chapters-nav a[href^="#"]');
  const chapterTargets = chapterLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);

  const scrollFx = () => {
    const vh = innerHeight;
    parallax.forEach(({ el, k }) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      el.style.transform = `translate3d(0, ${((r.top + r.height / 2) - vh / 2) * k}px, 0)`;
    });
    fills.forEach(({ el, words }) => {
      const r = el.getBoundingClientRect();
      const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0, 1);
      const n = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < n || reduce));
    });
    if (hs && hs.classList.contains('is-pinned')) {
      const r = hs.getBoundingClientRect();
      const extra = parseFloat(hs.dataset.extra || 0);
      const p = clamp(-r.top / Math.max(1, extra), 0, 1);
      htrack.style.transform = `translate3d(${-extra * p}px,0,0)`;
      hbar.style.transform = `scaleX(${p})`;
    }
    if (expandTarget && !reduce) {
      const r = expand.getBoundingClientRect();
      const p = clamp((vh - r.top) / (vh * 1.1), 0, 1);
      const e = 1 - Math.pow(1 - p, 2);
      expandTarget.style.setProperty('--ci', `${18 * (1 - e)}%`);
      expandTarget.style.setProperty('--cx', `${22 * (1 - e)}%`);
      expandTarget.style.setProperty('--cr', `${6 * (1 - e)}px`);
      expandTarget.style.setProperty('--cs', String(1.25 - 0.25 * e));
      expandTarget.style.setProperty('--co', String(0.2 + 0.35 * e));
    }
    if (tl) {
      const r = tl.getBoundingClientRect();
      tl.style.setProperty('--tl', clamp((vh * 0.6 - r.top) / r.height, 0, 1));
      const line = $('.tl-line i', tl); line && (line.style.transform = `scaleY(${clamp((vh * 0.6 - r.top) / r.height, 0, 1)})`);
    }
    if (chapterTargets.length) {
      let cur = -1;
      chapterTargets.forEach((t, i) => { if (t.getBoundingClientRect().top < vh * 0.4) cur = i; });
      chapterLinks.forEach((a, i) => a.classList.toggle('is-current', i === cur));
    }
  };
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { scrollFx(); ticking = false; }); } }, { passive: true });
  addEventListener('resize', scrollFx);
  scrollFx();

  /* ---------------- Paneles de servicios en táctil ---------------- */
  const panels = $('[data-panels]');
  if (panels && !fine) {
    const items = $$('.panel', panels);
    items.forEach(p => p.addEventListener('click', e => {
      if (!p.classList.contains('is-active') && (panels.classList.contains('touched') ? true : p !== items[0])) {
        e.preventDefault();
        panels.classList.add('touched');
        items.forEach(x => x.classList.toggle('is-active', x === p));
        setTimeout(() => p.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }), 250);
      }
    }));
  }

  /* ---------------- Diapositivas ---------------- */
  const show = $('[data-slideshow]');
  if (show) {
    const slides = $$('.slide', show), dots = $$('.sl-dot', show), pauseBtn = $('[data-sl-pause]', show);
    const DUR = 6000;
    show.style.setProperty('--dur', `${DUR}ms`);
    let i = 0, timer = null, paused = reduce, left = DUR, started = 0;
    const go = n => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
      dots.forEach((d, k) => { d.classList.toggle('is-active', k === i); d.classList.toggle('is-done', k < i); });
      dots.forEach(d => { const b = $('i', d); b.style.animation = 'none'; b.offsetWidth; b.style.animation = ''; });
      left = DUR; schedule();
    };
    const schedule = () => { clearTimeout(timer); if (paused) return; started = performance.now(); timer = setTimeout(() => go(i + 1), left); };
    dots.forEach(d => d.addEventListener('click', () => go(+d.dataset.go)));
    pauseBtn.addEventListener('click', () => {
      paused = !paused; pauseBtn.setAttribute('aria-pressed', String(paused)); pauseBtn.textContent = paused ? 'Reanudar' : 'Pausar';
      show.classList.toggle('is-paused', paused);
      if (paused) { clearTimeout(timer); left -= performance.now() - started; } else schedule();
    });
    if (reduce) { show.classList.add('is-paused'); pauseBtn.textContent = 'Reanudar'; pauseBtn.setAttribute('aria-pressed', 'true'); }
    new IntersectionObserver(([en]) => { if (!en.isIntersecting) clearTimeout(timer); else if (!paused) schedule(); }).observe(show);
    let sx = 0;
    show.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    show.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1)); });
    go(0);
  }

  /* Mini carrusel en la cabecera de servicio */
  $$('[data-mini-slides]').forEach(box => {
    const s = $$('.sh-slide', box), count = $('.sh-count b', box);
    if (s.length < 2 || reduce) return;
    let i = 0;
    setInterval(() => { s[i].classList.remove('is-active'); i = (i + 1) % s.length; s[i].classList.add('is-active'); count.textContent = String(i + 1).padStart(2, '0'); }, 5000);
  });

  /* Fondo cambiante de la llamada final */
  $$('[data-cycle]').forEach(box => {
    const imgs = $$('.cta-bg-img', box);
    if (!imgs.length) return;
    let i = 0; imgs[0].classList.add('is-on');
    if (!reduce) setInterval(() => { imgs[i].classList.remove('is-on'); i = (i + 1) % imgs.length; imgs[i].classList.add('is-on'); }, 4200);
  });

  /* Altímetro del dron */
  const alt = $('[data-alt]');
  if (alt && !reduce) setInterval(() => { alt.textContent = String(118 + Math.round(Math.sin(performance.now() / 1400) * 4)); }, 300);

  /* Código de tiempo del visor */
  const tc = $('[data-timecode]');
  if (tc && !reduce) {
    const t0 = performance.now();
    setInterval(() => { const s = Math.floor((performance.now() - t0) / 1000); const f = Math.floor(((performance.now() - t0) % 1000) / 40); tc.textContent = `00:${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}:${String(f).padStart(2, '0')}`; }, 40);
  }

  /* ---------------- Vídeos en bucle ---------------- */
  $$('video[data-autoplay]').forEach(v => {
    const btn = v.parentElement.querySelector('[data-video-toggle]');
    let userPaused = reduce;
    const sync = () => { const p = v.paused; btn.classList.toggle('is-paused', p); btn.setAttribute('aria-label', p ? 'Reproducir vídeo' : 'Pausar vídeo'); };
    btn.addEventListener('click', () => { if (v.paused) { userPaused = false; v.play().catch(() => {}); } else { userPaused = true; v.pause(); } });
    v.addEventListener('play', sync); v.addEventListener('pause', sync); sync();
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !userPaused) { v.preload = 'auto'; v.play().catch(sync); } else v.pause();
    }, { threshold: 0.25 }).observe(v);
  });

  /* ---------------- Lightbox ---------------- */
  const dialog = $('.lightbox');
  if (dialog && typeof dialog.showModal === 'function') {
    const im = $('.lb-figure img', dialog), cap = $('figcaption', dialog), count = $('.lb-count', dialog);
    let list = [], idx = 0, opener = null;
    const render = () => {
      const b = list[idx];
      im.src = b.dataset.full; im.alt = $('img', b).alt;
      im.style.animation = 'none'; im.offsetWidth; im.style.animation = '';
      cap.textContent = b.dataset.caption;
      count.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
    };
    document.addEventListener('click', e => {
      const b = e.target.closest('.shot');
      if (!b) return;
      const scope = b.closest('.pf-grid, .masonry, .combo-pics, .studio-pics, .wedding-strip') || document;
      list = $$('.shot', scope).filter(x => x.getClientRects().length && !x.closest('[hidden]'));
      idx = Math.max(0, list.indexOf(b)); opener = b;
      render(); dialog.showModal(); body.style.overflow = 'hidden';
    });
    const step = d => { idx = (idx + d + list.length) % list.length; render(); };
    $('.lb-prev', dialog).addEventListener('click', () => step(-1));
    $('.lb-next', dialog).addEventListener('click', () => step(1));
    $('.lb-close', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('keydown', e => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
    dialog.addEventListener('click', e => { if (e.target === dialog || e.target.classList.contains('lb-figure')) dialog.close(); });
    dialog.addEventListener('close', () => { body.style.overflow = ''; opener && opener.focus(); });
    let tx = 0;
    dialog.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
    dialog.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); });
  }

  /* ---------------- Filtros del portafolio ---------------- */
  const pf = $('[data-pf]');
  if (pf) {
    const items = $$('.pf-item', pf), btns = $$('[data-filter]'), status = $('.pf-status');
    btns.forEach(b => b.addEventListener('click', () => {
      const f = b.dataset.filter;
      btns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      items.forEach(it => it.classList.add('is-hiding'));
      setTimeout(() => {
        let n = 0;
        items.forEach(it => { const on = f === 'all' || it.dataset.cat === f; it.hidden = !on; if (on) n++; });
        status.textContent = `Mostrando ${n} fotografías${f === 'all' ? '' : ` de ${b.firstChild.textContent.trim().toLowerCase()}`}`;
        requestAnimationFrame(() => items.forEach((it, k) => { if (!it.hidden) setTimeout(() => it.classList.remove('is-hiding'), Math.min(k, 20) * 25); }));
        $$('.dev', pf).forEach(d => d.classList.add('in'));
      }, reduce ? 0 : 300);
    }));
  }

  /* ---------------- Formulario (prepara un correo) ---------------- */
  const form = $('#contact-form');
  if (form) {
    const service = form.elements.servicio, date = form.elements.fecha, place = $('#location-field'), dateLabel = $('#date-label');
    const update = () => {
      const strict = service.value === 'bodas' || service.value === 'comuniones';
      place.hidden = service.value !== 'bodas';
      date.required = strict;
      dateLabel.textContent = service.value === 'bodas' ? 'Fecha de la boda' : service.value === 'comuniones' ? 'Fecha de la comunión' : 'Fecha orientativa (opcional)';
    };
    const sel = new URLSearchParams(location.search).get('servicio');
    if (sel && [...service.options].some(o => o.value === sel)) service.value = sel;
    update(); service.addEventListener('change', update);
    const msgs = { nombre: 'Escribe tu nombre.', email: 'Escribe un correo válido, por ejemplo nombre@correo.es, o envía por WhatsApp.', servicio: 'Elige el tipo de sesión.', fecha: 'Indica la fecha, aunque sea aproximada.', mensaje: 'Cuéntanos tu idea en al menos 10 caracteres.' };
    const check = el => {
      const field = el.closest('.field'); if (!field) return true;
      field.querySelector('.field-error')?.remove();
      const ok = el.checkValidity();
      field.classList.toggle('is-invalid', !ok);
      if (!ok) { const p = document.createElement('span'); p.className = 'field-error'; p.textContent = msgs[el.name] || 'Revisa este campo.'; field.appendChild(p); el.setAttribute('aria-invalid', 'true'); }
      else el.removeAttribute('aria-invalid');
      return ok;
    };
    [...form.elements].forEach(el => el.name && el.addEventListener('blur', () => { if (el.value) check(el); }));
    form.addEventListener('submit', e => {
      e.preventDefault();
      const via = e.submitter && e.submitter.value === 'whatsapp' ? 'whatsapp' : 'email';
      form.elements.email.required = via === 'email';
      const bad = [...form.elements].filter(el => el.name && !check(el));
      const status = $('#form-status');
      if (bad.length) { status.textContent = 'Revisa los campos marcados para preparar el correo.'; bad[0].focus(); return; }
      const d = new FormData(form);
      const name = String(d.get('nombre')).trim();
      const svc = service.selectedOptions[0].text;
      const text = `Hola, soy ${name}.\n\nMe interesa: ${svc}\nCorreo: ${d.get('email')}\nTeléfono: ${d.get('telefono') || 'No indicado'}\nFecha: ${d.get('fecha') || 'Por concretar'}\n${service.value === 'bodas' ? `Lugar: ${d.get('localidad') || 'Por concretar'}\n` : ''}\n${String(d.get('mensaje')).trim()}`;
      const href = `mailto:${cfg.email || 'info@javialedofotografo.com'}?subject=${encodeURIComponent('Consulta web · ' + svc)}&body=${encodeURIComponent(text)}`;
      if (via === 'whatsapp') {
        const fecha = d.get('fecha') ? String(d.get('fecha')).split('-').reverse().join('/') : 'Por concretar';
        const waText = [`Hola Javi, soy ${name}.`, '', `Me interesa: ${svc}`, `Fecha: ${fecha}`, service.value === 'bodas' ? `Lugar: ${d.get('localidad') || 'Por concretar'}` : '', d.get('telefono') ? `Teléfono: ${d.get('telefono')}` : '', d.get('email') ? `Correo: ${d.get('email')}` : '', '', String(d.get('mensaje')).trim()].filter((l, k, arr) => l !== '' || (arr[k - 1] !== '' && k > 0)).join('\n');
        const url = `https://wa.me/${(cfg.whatsapp && cfg.whatsapp.number) || '34606653934'}?text=${encodeURIComponent(waText)}`;
        status.textContent = 'Mensaje preparado. Se abre WhatsApp con el texto escrito para que lo envíes a Javi.';
        status.focus();
        window.open(url, '_blank', 'noopener');
        return;
      }
      const fb = $('#mail-fallback'); fb.href = href; fb.hidden = false;
      status.textContent = 'Correo preparado. Se abrirá tu aplicación de email para que lo revises y lo envíes. Si no se abre, llama al estudio o escribe a la dirección de arriba.';
      status.focus();
      location.href = href;
    });
  }

  /* Enlaces de contacto con la sesión preseleccionada */
  if (!['index', 'contacto', 'historia', 'informacion-legal', 'portfolio'].includes(page)) {
    $$('main a[href="contacto.html"]').forEach(a => { a.href = `contacto.html?servicio=${encodeURIComponent(page)}`; });
  }
})();
