/* ==========================================================
   STACKLY COMMERCIAL REALTY — interactions & animations
   GSAP + ScrollTrigger + Lenis (all optional: page works without them)
   ========================================================== */
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE_POINTER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const HAS_GSAP = !!window.gsap;
const SKIP = false; // the loader plays on every page
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

// ---------- IMAGE FALLBACK ----------
$$('img').forEach((img) => img.addEventListener('error', () => { img.style.visibility = 'hidden'; }));

// ---------- SPLIT HEADINGS INTO WORDS ----------
$$('.split').forEach((el) => {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.innerHTML = text.split(/\s+/).map((w) => '<span class="w" aria-hidden="true"><span>' + w + '</span></span>').join(' ');
});

// ---------- PRELOADER ----------
(function () {
  const pre = $('#preloader');
  const root = document.documentElement;
  if (!pre || SKIP) { root.classList.remove('is-loading'); if (pre) pre.style.display = 'none'; return; }
  const fill = $('#plFill'), pct = $('#plPercent'), status = $('#plStatus');
  const FIRST = { home: 'Surveying the market', about: 'Meeting the team', 'property-types': 'Mapping asset classes', listings: 'Loading available properties', services: 'Preparing our services', contact: 'Opening the front desk' };
  const MSGS = [[0, FIRST[document.body.dataset.page] || 'Surveying the market'], [35, 'Shortlisting properties'], [70, 'Verifying titles'], [92, 'Welcome']];
  let loaded = document.readyState === 'complete';
  window.addEventListener('load', () => { loaded = true; });
  const t0 = Date.now();
  const INNER = document.body.dataset.page !== 'home';   // inner pages get a much shorter loader
  const MAX_WAIT = INNER ? 1800 : 4000;
  const ready = () => loaded || Date.now() - t0 > MAX_WAIT;
  let idx = -1, finished = false;

  function paint(v) {
    const r = Math.round(v);
    fill.style.width = r + '%';
    pct.textContent = r + '%';
    let i = 0; MSGS.forEach((m, k) => { if (r >= m[0]) i = k; });
    if (i !== idx) { idx = i; status.textContent = MSGS[i][1]; }
  }
  function reveal() {
    if (finished) return; finished = true;
    try { sessionStorage.setItem('stk_seen', '1'); } catch (e) {}
    root.classList.remove('is-loading');
    pre.style.display = 'none';
    if (window.playHeroEntrance) window.playHeroEntrance();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }
  // hard safety net: never trap the visitor behind the loader
  setTimeout(reveal, INNER ? 3500 : 7000);

  if (!HAS_GSAP || REDUCED) {
    paint(100);
    const done = () => { pre.style.transition = 'opacity .4s'; pre.style.opacity = '0'; setTimeout(reveal, 400); };
    if (ready()) done(); else { window.addEventListener('load', done); setTimeout(done, MAX_WAIT); }
    return;
  }

  gsap.from('.pl-brand, .pl-status, .pl-bar, .pl-percent', { y: 16, opacity: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out' });
  gsap.from('.pl-skyline i', { scaleY: 0, duration: 0.9, stagger: 0.09, ease: 'power3.out', delay: 0.2 });
  gsap.to('.pl-skyline i', { scaleY: 0.82, duration: 1.1, stagger: { each: 0.12, yoyo: true, repeat: -1 }, ease: 'sine.inOut', delay: 1.3 });

  const p = { v: 0 };
  function exit() {
    gsap.timeline({ onComplete: reveal })
      .to('.pl-inner', { opacity: 0, y: -24, duration: INNER ? 0.3 : 0.45, ease: 'power2.in' })
      .to(pre, { yPercent: -100, duration: INNER ? 0.7 : 0.95, ease: 'power4.inOut' }, 0.15);
  }
  function finish() {
    gsap.to(p, { v: 100, duration: INNER ? 0.3 : 0.45, ease: 'power1.out', onUpdate: () => paint(p.v), onComplete: () => setTimeout(exit, INNER ? 80 : 250) });
  }
  paint(0);
  gsap.to(p, {
    v: 90, duration: INNER ? 0.9 : 2.2, ease: 'power2.out', delay: INNER ? 0.1 : 0.3, onUpdate: () => paint(p.v),
    onComplete: () => {
      if (ready()) return finish();
      const c = setInterval(() => { if (ready()) { clearInterval(c); finish(); } }, 100);
    }
  });
})();

// ---------- HEADER + PROGRESS BAR + ACTIVE LINK ----------
const header = $('#site-header');
const bar = $('#scrollBar');
function onScroll() {
  const y = window.scrollY;
  header.classList.toggle('solid', y > 40);
  const h = document.documentElement.scrollHeight - window.innerHeight;
  bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')';
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();

// ---------- MOBILE NAV ----------
const navToggle = $('#navToggle'), navClose = $('#navClose'), navLinks = $('#navLinks');
function setMenu(open) {
  navLinks.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  document.body.style.overflow = open ? 'hidden' : '';
}
navToggle.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
navClose.addEventListener('click', () => setMenu(false));
$$('a', navLinks).forEach((l) => l.addEventListener('click', () => setMenu(false)));
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
window.addEventListener('resize', () => { if (window.innerWidth > 900) setMenu(false); });

// ---------- FLIP CARDS: tap on touch, keyboard friendly ----------
$$('.fcard').forEach((card) => {
  card.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    if (window.matchMedia('(hover: none)').matches) {
      const was = card.classList.contains('flipped');
      $$('.fcard.flipped').forEach((c) => c.classList.remove('flipped'));
      if (!was) card.classList.add('flipped');
    }
  });
  card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.classList.toggle('flipped'); } });
});

// ---------- SMOOTH SCROLL (Lenis) ----------
let lenis = null;
if (window.Lenis && HAS_GSAP && !REDUCED) {
  lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  if (window.ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  const lock = () => ((document.documentElement.classList.contains('is-loading') || document.body.style.overflow === 'hidden') ? lenis.stop() : lenis.start());
  new MutationObserver(lock).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(lock).observe(document.body, { attributes: true, attributeFilter: ['style'] });
  lock();
}
function goTo(target) {
  const offset = window.innerWidth > 900 ? -70 : -64;
  if (lenis) lenis.scrollTo(target, { offset });
  else target.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
}
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href');
  if (id.length < 2) { e.preventDefault(); goTo(document.body); return; }
  const t = $(id);
  if (t) { e.preventDefault(); goTo(t); }
}));

// ---------- LISTING FILTER ----------
const chips = $$('.chip');
const cards = $$('.listing');
function applyFilter(type, scroll) {
  chips.forEach((c) => c.classList.toggle('on', c.dataset.filter === type));
  const show = cards.filter((c) => type === 'all' || c.dataset.type === type);
  cards.forEach((c) => { if (!show.includes(c)) c.style.display = 'none'; });
  show.forEach((c) => { c.style.display = ''; });
  if (HAS_GSAP && !REDUCED) gsap.fromTo(show, { y: 36, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.08, ease: 'power3.out', clearProps: 'opacity,scale' });
  if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 700);
  if (scroll) goTo($('#listings'));
}
chips.forEach((c) => c.addEventListener('click', () => applyFilter(c.dataset.filter, false)));
const heroSearch = $('#heroSearch');
if (heroSearch) heroSearch.addEventListener('submit', (e) => { e.preventDefault(); location.href = './html/listings.html?type=' + encodeURIComponent($('#hsType').value); });
if ($('#listingGrid') && chips.length) {
  const wanted = new URLSearchParams(location.search).get('type');
  if (wanted && wanted !== 'all' && chips.some((c) => c.dataset.filter === wanted)) applyFilter(wanted, false);
}

// ---------- NEWSLETTER FORM ----------
const newsForm = $('#newsForm');
if (newsForm) newsForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = $('#newsEmail'), msg = $('#newsMsg');
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
  msg.textContent = ok ? 'Thank you! You are on the list.' : 'Please enter a valid email address.';
  if (ok) email.value = '';
});

// ---------- CONTACT FORM (full validation) ----------
// To receive messages by email, paste a form-endpoint URL here (e.g. a Formspree link).
// Left empty, the form validates and shows the success message but sends nothing.
const FORM_ENDPOINT = '';
(function () {
  const form = $('#contactForm');
  if (!form) return;
  const submitBtn = $('#cSubmit'), statusEl = $('#cStatus'), success = $('#cSuccess');
  const count = $('#cCount'), msgBox = $('#cMessage');
  const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
  const NAME_RE = /^[A-Za-z][A-Za-z .'-]*$/;
  const PHONE_RE = /^(\+91|91|0)?[6-9]\d{9}$/;

  const rules = {
    name: (v) => !v ? 'Please enter your full name.'
      : v.length < 2 ? 'Name must be at least 2 characters.'
      : !NAME_RE.test(v) ? "Use letters, spaces and . ' - only (no numbers)." : '',
    email: (v) => !v ? 'Please enter your email address.'
      : v.length > 254 || /\.\./.test(v) || !EMAIL_RE.test(v) ? 'Enter a valid email, e.g. name@company.com.' : '',
    phone: (v) => {
      if (!v) return 'Please enter your phone number.';
      const d = v.replace(/[\s-]/g, '');
      return PHONE_RE.test(d) ? '' : 'Enter a valid 10-digit Indian mobile number (starts with 6-9).';
    },
    company: (v) => v.length > 80 ? 'Company name must be 80 characters or fewer.' : '',
    interest: (v) => !v ? 'Please choose what you are interested in.' : '',
    message: (v) => !v ? 'Please tell us a little about your requirement.'
      : v.length < 10 ? 'Message must be at least 10 characters (' + v.length + '/10).'
      : v.length > 500 ? 'Message must be 500 characters or fewer.' : '',
    consent: (_, el) => el.checked ? '' : 'Please tick the box to continue.'
  };
  const fields = $$('input[name], select[name], textarea[name]', form).filter((el) => rules[el.name]);

  function check(el, show) {
    const value = el.type === 'checkbox' ? '' : el.value.trim();
    const msg = rules[el.name](value, el);
    const wrap = el.closest('.field');
    const errEl = $('.err', wrap);
    if (show) {
      wrap.classList.toggle('invalid', !!msg);
      wrap.classList.toggle('valid', !msg && (el.type === 'checkbox' || value !== ''));
      errEl.textContent = msg;
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    }
    return msg;
  }

  // live behaviour
  const phone = $('#cPhone');
  phone.addEventListener('input', () => { phone.value = phone.value.replace(/[^\d+\s-]/g, ''); });
  const updateCount = () => { count.textContent = msgBox.value.length + ' / 500'; };
  msgBox.addEventListener('input', updateCount);
  fields.forEach((el) => {
    const evt = el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'blur';
    el.addEventListener(evt, () => check(el, true));
    // once a field has been flagged, re-check as the user types so the error clears immediately
    el.addEventListener('input', () => { if (el.closest('.field').classList.contains('invalid')) check(el, true); });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = '';
    const bad = fields.filter((el) => check(el, true));
    if (bad.length) {
      statusEl.textContent = 'Please correct the highlighted fields.';
      bad[0].focus();
      return;
    }
    // spam trap: bots fill hidden fields. Pretend success, send nothing.
    const trapped = $('#cWebsite').value.trim() !== '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    const data = {};
    fields.forEach((el) => { data[el.name] = el.type === 'checkbox' ? el.checked : el.value.trim(); });
    try {
      if (!trapped && FORM_ENDPOINT) {
        const res = await fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
        if (!res.ok) throw new Error('Request failed');
      } else {
        await new Promise((r) => setTimeout(r, 900));
      }
      success.hidden = false;
      if (HAS_GSAP && !REDUCED) gsap.from(success, { opacity: 0, y: 20, duration: 0.5, ease: 'power3.out' });
    } catch (err) {
      statusEl.textContent = 'Sorry, we could not send your message. Please try again or email hello@stackly.ai.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }
  });

  $('#cAgain').addEventListener('click', () => {
    form.reset();
    updateCount();
    $$('.field', form).forEach((f) => { f.classList.remove('invalid', 'valid'); const er = $('.err', f); if (er) er.textContent = ''; });
    fields.forEach((el) => el.removeAttribute('aria-invalid'));
    statusEl.textContent = '';
    success.hidden = true;
    $('#cName').focus();
  });
})();

// ---------- LOGIN FORM ----------
// To connect real sign-in, put your login API URL here. Left empty, the form only validates.
const LOGIN_ENDPOINT = '';
(function () {
  const form = $('#loginForm');
  if (!form) return;
  const email = $('#lEmail'), pass = $('#lPass'), btn = $('#lSubmit'), status = $('#lStatus');
  const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
  const rules = {
    email: (v) => !v ? 'Please enter your email address.'
      : v.length > 254 || /\.\./.test(v) || !EMAIL_RE.test(v) ? 'Enter a valid email, e.g. name@company.com.' : '',
    password: (v) => !v ? 'Please enter your password.'
      : v.length < 8 ? 'Password must be at least 8 characters.'
      : /\s/.test(v) ? 'Password cannot contain spaces.' : ''
  };
  function check(el, show) {
    const v = el.name === 'password' ? el.value : el.value.trim();
    const msg = rules[el.name](v);
    const wrap = el.closest('.field');
    if (show) {
      wrap.classList.toggle('invalid', !!msg);
      wrap.classList.toggle('valid', !msg);
      $('.err', wrap).textContent = msg;
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    }
    return msg;
  }
  [email, pass].forEach((el) => {
    el.addEventListener('blur', () => check(el, true));
    el.addEventListener('input', () => { if (el.closest('.field').classList.contains('invalid')) check(el, true); });
  });
  const tog = $('#pwToggle');
  tog.addEventListener('click', () => {
    const show = pass.type === 'password';
    pass.type = show ? 'text' : 'password';
    tog.textContent = show ? 'Hide' : 'Show';
    tog.setAttribute('aria-pressed', show ? 'true' : 'false');
    tog.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = ''; status.classList.remove('ok');
    const bad = [email, pass].filter((el) => check(el, true));
    if (bad.length) { status.textContent = 'Please correct the highlighted fields.'; bad[0].focus(); return; }
    btn.disabled = true; btn.textContent = 'Signing in...';
    try {
      if (LOGIN_ENDPOINT) {
        const res = await fetch(LOGIN_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.value.trim(), password: pass.value, remember: $('#lRemember').checked }) });
        if (!res.ok) throw new Error('Invalid credentials');
        status.classList.add('ok'); status.textContent = 'Signed in. Redirecting...';
      } else {
        await new Promise((r) => setTimeout(r, 700));
        status.classList.add('ok'); status.textContent = 'Details look good. Sign-in is not connected to a server yet.';
      }
    } catch (err) {
      status.textContent = 'Email or password is incorrect. Please try again.';
    } finally {
      btn.disabled = false; btn.textContent = 'Login';
    }
  });
})();

// ---------- MAGNETIC BUTTONS ----------
if (HAS_GSAP && FINE_POINTER && !REDUCED) {
  $$('.magnetic').forEach((btn) => {
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.25);
      yTo((e.clientY - r.top - r.height / 2) * 0.35);
    });
    btn.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
  });
  // 3D tilt on listing cards
  $$('.listing').forEach((card) => {
    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' });
    gsap.set(card, { transformPerspective: 900 });
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 8);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 8);
    });
    card.addEventListener('mouseleave', () => { rx(0); ry(0); });
  });
}

// ---------- GSAP SCROLL ANIMATIONS ----------
if (HAS_GSAP && window.ScrollTrigger && !REDUCED) {
  gsap.registerPlugin(ScrollTrigger);
  const has = (sel) => !!$(sel);

  // banner / hero parallax
  $$('.hero-img').forEach((img) => gsap.to(img, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: img.closest('section'), start: 'top top', end: 'bottom top', scrub: true } }));
  $$('.float-chip').forEach((c, i) => gsap.to(c, { y: i % 2 ? 14 : -14, duration: 2.4 + i * 0.6, ease: 'sine.inOut', yoyo: true, repeat: -1 }));

  // entrance after preloader (home hero or inner-page banner)
  window.playHeroEntrance = function () {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.hero .eyebrow, .crumbs', { y: 20, opacity: 0, duration: 0.6 })
      .from('.hero-heading .w > span, .page-title .w > span', { yPercent: 115, duration: 0.95, stagger: 0.09 }, '-=0.3')
      .from('.hero .lead, .hero .btn-row, .page-hero .lead', { y: 26, opacity: 0, duration: 0.7, stagger: 0.12 }, '-=0.55');
    if (has('.search-card')) tl.from('.search-card', { y: 50, opacity: 0, duration: 0.9 }, '-=0.45');
    if (has('.float-chip')) tl.from('.float-chip', { scale: 0, opacity: 0, duration: 0.6, stagger: 0.15, ease: 'back.out(2)' }, '-=0.4');
  };
  if (SKIP || !$('#preloader')) window.playHeroEntrance();

  // headings: word-by-word rise
  $$('.split').forEach((el) => {
    if (el.closest('.hero, .page-hero')) return;
    gsap.from($$('.w > span', el), { yPercent: 115, duration: 0.9, ease: 'power4.out', stagger: 0.07, scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' } });
  });

  // eyebrows, descriptions, ticks, buttons
  $$('.sec .head .eyebrow, .sec .head .desc, .ticks li, .btn-navy, .more-row .btn, .filters, .cta-copy > *, .cta-actions > *').forEach((el) => {
    gsap.from(el, { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: 'play none none reverse' } });
  });

  // image frames: wipe reveal + inner parallax
  $$('.img-frame').forEach((frame) => {
    const img = $('img', frame);
    gsap.fromTo(frame, { clipPath: 'inset(0 0 100% 0 round 18px)' }, { clipPath: 'inset(0 0 0% 0 round 18px)', duration: 1.3, ease: 'power3.inOut', clearProps: 'clipPath', scrollTrigger: { trigger: frame, start: 'top 88%', once: true } });
    if (img) gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  if (has('.exp-badge')) gsap.from('.exp-badge', { x: -40, opacity: 0, scale: 0.8, duration: 0.9, ease: 'back.out(1.7)', scrollTrigger: { trigger: '.about-media', start: 'top 70%' } });

  // grids: staggered rise (one trigger per grid so several grids per page work)
  $$('.flip-grid').forEach((g) => gsap.from($$('.fcard', g), { y: 60, opacity: 0, duration: 0.8, stagger: 0.09, ease: 'power3.out', scrollTrigger: { trigger: g, start: 'top 85%' } }));
  $$('.listing-grid').forEach((g) => gsap.from($$('.listing', g), { y: 70, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out', clearProps: 'opacity', scrollTrigger: { trigger: g, start: 'top 85%' } }));
  $$('.svc-grid').forEach((g) => gsap.from($$('.svc', g), { y: 60, opacity: 0, duration: 0.85, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: g, start: 'top 85%' } }));

  // process line draws on scroll
  const steps = $('.steps');
  if (steps) {
    gsap.to('#stepsFill', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: steps, start: 'top 75%', end: 'bottom 55%', scrub: true } });
    gsap.from($$('.step', steps), { y: 40, opacity: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out', scrollTrigger: { trigger: steps, start: 'top 85%' } });
    gsap.from($$('.dot', steps), { scale: 0, duration: 0.6, stagger: 0.2, ease: 'back.out(2.5)', scrollTrigger: { trigger: steps, start: 'top 85%' } });
  }

  // stats count-up
  $$('.stat').forEach((s, i) => {
    gsap.from(s, { y: 40, opacity: 0, duration: 0.8, delay: i * 0.1, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 92%' } });
    const el = $('.num', s);
    const end = parseFloat(el.dataset.count), suffix = el.dataset.suffix || '', prefix = el.dataset.prefix || '';
    const c = { v: 0 };
    gsap.to(c, { v: end, duration: 2, ease: 'power2.out', scrollTrigger: { trigger: s, start: 'top 92%', once: true },
      onUpdate: () => { el.textContent = prefix + Math.round(c.v).toLocaleString('en-IN') + suffix; } });
  });

  $$('.c-card').forEach((c, i) => gsap.from(c, { y: 40, opacity: 0, duration: 0.7, delay: (i % 2) * 0.1, ease: 'power3.out', scrollTrigger: { trigger: c, start: 'top 92%' } }));
  if (has('.form-card')) gsap.from('.form-card', { y: 60, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.form-card', start: 'top 88%' } });
  if (has('.map-frame')) gsap.from('.map-frame', { y: 50, opacity: 0, scale: 0.97, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.map-frame', start: 'top 88%' } });
  gsap.from('.cta-card', { y: 60, opacity: 0, scale: 0.97, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.cta-card', start: 'top 88%' } });
  gsap.from('.footer-top > div', { y: 40, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: 'footer', start: 'top 88%' } });
}

window.addEventListener('load', () => { if (window.ScrollTrigger) ScrollTrigger.refresh(); });