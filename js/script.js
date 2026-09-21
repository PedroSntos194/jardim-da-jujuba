/* o jardim da jujuba: abertura, capítulos, surpresas */

/* ---------- edite aqui ---------- */

const dataInicioNamoro = new Date("2025-11-21T00:00:00"); // ← a data de vocês

/* ---------- utilidades ---------- */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function refreshIcons() {
  if (window.lucide) lucide.createIcons({ attrs: { 'stroke-width': 1.4 } });
}

const Progress = {
  key: 'jardim-da-jujuba',
  data: { unlocked: [], daisies: [], planted: { daisy: 0, tulip: 0, lily: 0 }, bouquet: [], found: [] },

  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) Object.assign(this.data, JSON.parse(raw));
    } catch (err) { /* sem memória, sem problema */ }
  },
  save() {
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (err) { /* idem */ }
  },
  unlock(id) {
    if (this.data.unlocked.includes(id)) return;
    this.data.unlocked.push(id);
    this.save();
  },
  has(id) {
    return this.data.unlocked.includes(id);
  },
  find(id) {
    if (this.data.found.includes(id)) return;
    this.data.found.push(id);
    this.save();
  },
  syncPlanted() {
    this.data.planted = Garden.planted();
    this.save();
  },
};

/* ---------- scroll ---------- */

let lenis = null;

function setupScroll() {
  if (window.Lenis && finePointer && !reduceMotion) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    lenis.stop();
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-scroll]');
    if (!trigger) return;
    e.preventDefault();
    scrollToEl($(trigger.dataset.scroll));
  });
}

function scrollToEl(el, offset = -16) {
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.8 });
  else el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
}

/* ---------- pequenas mensagens ---------- */

const Whisper = (() => {
  const el = $('#whisper');
  let timer = null;

  function show(text, duration = 4200) {
    clearTimeout(timer);
    el.textContent = text;
    el.classList.add('is-visible');
    timer = setTimeout(() => el.classList.remove('is-visible'), duration);
  }

  return { show };
})();

/* ---------- ícones da história ---------- */

const StoryIcons = (() => {
  const root = $('#story-icons');

  function light(name) {
    const icon = root.querySelector(`[data-story="${name}"]`);
    if (icon) icon.classList.add('is-lit');
  }

  function update() {
    light('amor');
    if (Progress.has('ch1-done')) light('crescimento');
    if (Progress.has('memorias')) light('florescer');
  }

  function show() {
    root.classList.add('is-visible');
    update();
  }

  return { light, update, show };
})();

/* ---------- desbloqueio de seções ---------- */

const Unlock = (() => {
  function unlock(id, options = {}) {
    const section = document.getElementById(id);
    if (!section) return;
    const wasHidden = section.hidden;
    section.hidden = false;
    Progress.unlock(id);

    if (wasHidden && !options.silent) {
      section.classList.add('is-unlocking');
      if (options.scroll !== false) setTimeout(() => scrollToEl(section), 150);
    }
    StoryIcons.update();
  }

  function init() {
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-unlock]');
      if (trigger) unlock(trigger.dataset.unlock);
    });
  }

  return { init, unlock };
})();

/* ---------- aparecer ao rolar ---------- */

const Reveal = (() => {
  const handlers = new Map();
  let observer;

  function defaultReveal(el) {
    el.style.setProperty('--rd', `${rand(0, 0.3).toFixed(2)}s`);
    el.classList.add('is-visible');

    $$('.flower', el)
      .filter((flower) => !flower.classList.contains('is-grown'))
      .forEach((flower, i) => Flowers.grow(flower, { delay: i * 220 }));

    if (el.dataset.plant && !el.dataset.planted) {
      el.dataset.planted = '1';
      Garden.plant(el.dataset.plant, 1);
      Progress.syncPlanted();
    }

    if (el.dataset.unlockOnView) {
      setTimeout(() => Unlock.unlock(el.dataset.unlockOnView, { scroll: false }), 900);
    }
  }

  function init() {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        observer.unobserve(el);
        const handler = handlers.get(el) || defaultReveal;
        handlers.delete(el);
        handler(el);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });

    $$('.reveal, #petal-path').forEach((el) => observer.observe(el));
  }

  function observe(el, handler) {
    if (handler) handlers.set(el, handler);
    observer.observe(el);
  }

  return { init, observe };
})();

/* ---------- abertura ---------- */

const Intro = (() => {
  const intro = $('#intro');
  const starsEl = $('#intro-stars');
  const lines = $$('.intro__line');
  const enterBtn = $('#enter-garden');
  const seed = $('#seed');
  const seedFlower = $('#seed-flower');
  const site = $('#site');

  /* quanto tempo cada frase fica na tela (em ms); ajuste aqui se quiser mais lento ou mais rápido */
  const HOLD = [3800, 3800, 3600, 4800];

  /* um toque em qualquer lugar da tela pula pra próxima frase */
  let skipHold = null;
  const hold = (ms) => new Promise((resolve) => {
    const timer = setTimeout(finish, ms);
    function finish() {
      clearTimeout(timer);
      skipHold = null;
      resolve();
    }
    skipHold = finish;
  });

  function makeStars(count = 90) {
    for (let i = 0; i < count; i += 1) {
      const star = document.createElement('span');
      star.className = 'intro-star';
      star.style.setProperty('--x', `${rand(0, 100).toFixed(2)}%`);
      star.style.setProperty('--y', `${rand(0, 100).toFixed(2)}%`);
      star.style.setProperty('--s', `${rand(1, 2.6).toFixed(1)}px`);
      star.style.setProperty('--d', `${rand(2.5, 6).toFixed(2)}s`);
      star.style.setProperty('--delay', `${rand(0, 4).toFixed(2)}s`);
      star.style.setProperty('--o', rand(0.4, 1).toFixed(2));
      starsEl.appendChild(star);
    }
  }

  async function playLines() {
    await wait(1400);
    intro.classList.add('is-lit');
    for (let i = 0; i < lines.length; i += 1) {
      lines[i].classList.add('is-visible');
      await hold(HOLD[i]);
      lines[i].classList.remove('is-visible');
      await wait(1000);
    }
    enterBtn.classList.add('is-visible');
  }

  function enter() {
    enterBtn.classList.remove('is-visible');
    enterBtn.disabled = true;
    lines.forEach((line) => line.classList.remove('is-visible'));
    Music.play();

    const flower = Flowers.create('daisy', { sway: false, seed: 7 });
    seedFlower.appendChild(flower);
    seed.classList.add('is-active');

    if (window.gsap && !reduceMotion) {
      gsap.timeline()
        .to('.seed__ground', { scaleX: 1, duration: 1.3, ease: 'power2.out' })
        .fromTo('.seed__seed', { xPercent: -50, y: -140, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'bounce.out' }, '-=0.5')
        .to('.seed__seed', { y: 5, opacity: 0, duration: 0.7, ease: 'power1.in' })
        .call(() => flower.classList.add('is-grown'))
        .to({}, { duration: 2.3 })
        .call(() => flower.classList.add('is-open'))
        .to({}, { duration: 2.2 })
        .call(leave);
      return;
    }

    seed.classList.add('is-css');
    setTimeout(() => flower.classList.add('is-grown'), 2000);
    setTimeout(() => flower.classList.add('is-open'), 4200);
    setTimeout(leave, 6400);
  }

  function leave() {
    site.hidden = false;
    document.body.classList.remove('is-intro');
    refreshIcons();
    Garden.show();
    Garden.setPetals(6);
    Garden.plant('daisy', 1);
    Progress.syncPlanted();
    Progress.unlock('entered');

    intro.classList.add('is-leaving');
    setTimeout(() => intro.remove(), 2000);
    if (lenis) lenis.start();

    Music.show();
    StoryIcons.show();
    $('#hold-heart').classList.add('is-visible');
    $('#secret-star').classList.add('is-visible');
  }

  function init() {
    makeStars();
    enterBtn.addEventListener('click', enter);
    intro.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      if (skipHold) skipHold();
    });
    playLines();
  }

  return { init };
})();

/* ---------- capítulo 1: margaridas ---------- */

const Chapter1 = (() => {
  const MESSAGES = [
    'eu amo até os dias onde a gente não faz nada, pq se for com vc, pra mim já valeu',
    'vc conseguiu transformar momentos normais em algumas das minhas memórias favoritas',
    'às vezes eu só olho pra vc e penso como eu tive tanta sorte',
    'eu amo nossas risadas idiotas, nossas conversas, nossos momentos e até nossas implicâncias',
  ];
  const POSITIONS = [
    { x: 12, w: 84 },
    { x: 36, w: 74 },
    { x: 64, w: 80 },
    { x: 88, w: 70 },
  ];

  const field = $('#daisy-field');
  const tags = $('#daisy-tags');
  const closing = $('#ch1-closing');

  const daisies = [];
  const done = new Set();
  let tulip;

  function build() {
    const scale = window.innerWidth >= 768 ? 1.3 : 1.12;

    MESSAGES.forEach((_, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'field-flower field-flower--daisy';
      btn.dataset.cursor = 'flower';
      btn.setAttribute('aria-label', 'uma margarida');
      btn.style.setProperty('--x', `${POSITIONS[i].x}%`);
      btn.style.setProperty('--w', `${Math.round(POSITIONS[i].w * scale)}px`);
      btn.appendChild(Flowers.create('daisy', { seed: 11 + i * 7 }));
      btn.addEventListener('click', () => open(i));
      field.appendChild(btn);
      daisies.push(btn);
    });

    const tulipWrap = document.createElement('div');
    tulipWrap.className = 'field-flower field-flower--tulip';
    tulipWrap.style.setProperty('--x', '50%');
    tulip = Flowers.create('tulip', { seed: 51 });
    tulipWrap.appendChild(tulip);
    field.appendChild(tulipWrap);

    const secret = document.createElement('button');
    secret.type = 'button';
    secret.className = 'field-flower field-flower--secret';
    secret.dataset.cursor = 'secret';
    secret.setAttribute('aria-label', 'uma flor');
    secret.style.setProperty('--x', '24%');
    secret.appendChild(Flowers.create('secret', { seed: 63 }));
    secret.addEventListener('click', () => Cativou.show());
    field.appendChild(secret);
  }

  function growAll() {
    daisies.forEach((btn, i) => {
      Flowers.grow(btn.querySelector('.flower'), { open: done.has(i), delay: 300 + i * 260 });
    });
    Flowers.grow($('.field-flower--secret .flower'), { delay: 2200 });
    if (done.size === MESSAGES.length) finish(true);
  }

  function addTag(i) {
    const tag = document.createElement('p');
    tag.className = i % 2 ? 'tag tag--right' : 'tag';
    tag.style.setProperty('--tilt', `${rand(-2, 2).toFixed(1)}deg`);
    tag.textContent = MESSAGES[i];
    tags.appendChild(tag);
  }

  function open(i) {
    if (done.has(i)) return;
    done.add(i);
    Progress.data.daisies = [...done];
    Progress.save();

    const btn = daisies[i];
    btn.classList.add('is-done');
    btn.querySelector('.flower').classList.add('is-open');
    addTag(i);
    Garden.plant('daisy', 1);
    Progress.syncPlanted();

    if (done.size === MESSAGES.length) finish(false);
  }

  async function finish(instant) {
    if (!instant) await wait(1100);

    daisies.forEach((btn, i) => {
      const side = i < 2 ? -1 : 1;
      btn.style.setProperty('--bow', `${(side * rand(7, 12)).toFixed(0)}deg`);
      btn.classList.add('is-bowing');
    });
    Flowers.grow(tulip, { delay: instant ? 200 : 800, openDelay: 2000 });

    if (!instant) {
      await wait(3000);
      closing.classList.add('is-unlocking');
      Garden.plant('daisy', 2);
      Progress.syncPlanted();
    }
    closing.hidden = false;
    Progress.unlock('ch1-done');
    Unlock.unlock('cap-tulipas', { scroll: false, silent: true });
    StoryIcons.update();
  }

  function restore() {
    Progress.data.daisies.forEach((i) => {
      done.add(i);
      daisies[i].classList.add('is-done');
      addTag(i);
    });
  }

  function init() {
    build();
    restore();
    Reveal.observe(field, growAll);
  }

  return { init };
})();

/* ---------- capítulo 2: as tulipas em volta da frase ---------- */

const Chapter2 = (() => {
  const TULIPS = [
    { x: 8, y: 0, w: 70, o: 0.55 },
    { x: 22, y: 14, w: 56, o: 0.4 },
    { x: 38, y: -6, w: 84, o: 0.7 },
    { x: 62, y: -4, w: 80, o: 0.65 },
    { x: 78, y: 16, w: 52, o: 0.4 },
    { x: 92, y: 2, w: 68, o: 0.55 },
    { x: 50, y: 26, w: 44, o: 0.3 },
  ];

  function init() {
    const wrap = $('#choice-flowers');
    const scale = window.innerWidth >= 768 ? 1.1 : 0.85;
    TULIPS.forEach((t, i) => {
      const el = document.createElement('div');
      el.className = 'choice-tulip';
      el.style.setProperty('--x', `${t.x}%`);
      el.style.setProperty('--y', `${t.y}px`);
      el.style.setProperty('--w', `${Math.round(t.w * scale)}px`);
      el.style.setProperty('--o', t.o);
      el.appendChild(Flowers.create('tulip', { seed: 120 + i * 13 }));
      wrap.appendChild(el);
    });
  }

  return { init };
})();

/* ---------- linha do tempo ---------- */

const Timeline = (() => {
  function init() {
    $$('.timeline__item').forEach((item, i) => {
      const slot = item.querySelector('.timeline__flower');
      slot.appendChild(Flowers.create(item.dataset.flower || 'daisy', { seed: 200 + i * 9 }));
    });
  }

  return { init };
})();

/* ---------- contador ---------- */

const Counter = (() => {
  const values = {};
  const start = dataInicioNamoro;

  function addMonths(date, n) {
    const d = new Date(date.getTime());
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + n);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, last));
    return d;
  }

  function parts(now) {
    let months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
    if (addMonths(start, months) > now) months -= 1;
    const rest = now - addMonths(start, months);
    return {
      months,
      days: Math.floor(rest / 864e5),
      hours: Math.floor(rest / 36e5) % 24,
      minutes: Math.floor(rest / 6e4) % 60,
      seconds: Math.floor(rest / 1000) % 60,
    };
  }

  function set(unit, value) {
    const el = values[unit];
    const text = unit === 'months' ? String(value) : String(value).padStart(2, '0');
    if (el.textContent === text) return;
    el.textContent = text;
    el.classList.remove('is-ticking');
    void el.offsetWidth;
    el.classList.add('is-ticking');
  }

  function tick() {
    const now = new Date();
    if (Number.isNaN(start.getTime()) || start > now) {
      Object.keys(values).forEach((unit) => { values[unit].textContent = '—'; });
      return;
    }
    const p = parts(now);
    Object.keys(p).forEach((unit) => set(unit, p[unit]));
  }

  function init() {
    $$('.counter__value').forEach((el) => { values[el.dataset.unit] = el; });
    tick();
    setInterval(tick, 1000);
  }

  return { init };
})();

/* ---------- buquê ---------- */

const Bouquet = (() => {
  const ANGLES = [0, -16, 16, -30, 30, -8, 8, -42, 42, -24, 24, 4];
  const LIFTS = [0, 6, 6, 14, 14, -12, -12, 24, 24, 2, 2, -20];
  const MAX = ANGLES.length;

  const container = $('#bouquet-flowers');
  const msg = $('#bouquet-msg');
  const picked = [];

  function add(type, instant = false) {
    if (picked.length >= MAX) {
      Whisper.show('acho que esse buquê já não cabe nas minhas mãos');
      return;
    }
    const i = picked.length;
    const wrap = document.createElement('div');
    wrap.className = `bouquet__flower bouquet__flower--${type}`;
    wrap.style.setProperty('--rot', `${ANGLES[i]}deg`);
    wrap.style.setProperty('--lift', `${LIFTS[i]}px`);
    wrap.style.zIndex = 40 - Math.abs(ANGLES[i]);
    if (instant) wrap.style.animation = 'none';
    wrap.appendChild(Flowers.create(type, { open: true, instant: true, sway: false }));
    container.appendChild(wrap);
    picked.push(type);

    Progress.data.bouquet = [...picked];
    Progress.save();

    if (picked.length === 5) msg.classList.add('is-visible');
    if (picked.length >= 3 && !instant) {
      setTimeout(() => Unlock.unlock('caminho', { scroll: false, silent: true }), 1500);
    }
  }

  function reset() {
    container.innerHTML = '';
    picked.length = 0;
    msg.classList.remove('is-visible');
    Progress.data.bouquet = [];
    Progress.save();
  }

  function init() {
    $$('[data-pick]').forEach((btn) => btn.addEventListener('click', () => add(btn.dataset.pick)));
    $('#bouquet-reset').addEventListener('click', reset);
    Progress.data.bouquet.forEach((type) => add(type, true));
  }

  return { init };
})();

/* ---------- caminho de pétalas ---------- */

const Path = (() => {
  const COLORS = ['', 'path-petal--light', 'path-petal--lily'];

  function init() {
    const path = $('#petal-path');
    for (let i = 0; i < 18; i += 1) {
      const angle = (150 + i * (240 / 17)) * Math.PI / 180;
      const petal = document.createElement('span');
      petal.className = `path-petal ${COLORS[i % 3]}`;
      petal.style.setProperty('--x', `${(50 + Math.cos(angle) * 44 + rand(-2, 2)).toFixed(1)}%`);
      petal.style.setProperty('--y', `${(52 + Math.sin(angle) * 40 + rand(-2, 2)).toFixed(1)}%`);
      petal.style.setProperty('--r', `${rand(-60, 60).toFixed(0)}deg`);
      petal.style.setProperty('--d', `${(i * 0.14).toFixed(2)}s`);
      path.appendChild(petal);
    }
  }

  return { init };
})();

/* ---------- presente escondido ---------- */

const Gift = (() => {
  const gift = $('#gift');
  const sparks = $('.gift__sparks');
  const msg = $('#gift-msg');

  function burst() {
    for (let i = 0; i < 22; i += 1) {
      const s = document.createElement('span');
      s.className = 'spark';
      s.style.setProperty('--tx', `${rand(-70, 70).toFixed(0)}px`);
      s.style.setProperty('--ty', `${rand(-140, -40).toFixed(0)}px`);
      s.style.setProperty('--d', `${rand(0, 0.8).toFixed(2)}s`);
      sparks.appendChild(s);
    }
    setTimeout(() => { sparks.innerHTML = ''; }, 4000);
  }

  async function open() {
    if (gift.classList.contains('is-open')) return;
    gift.classList.add('is-open');
    Progress.find('gift');
    await wait(500);
    burst();
    await wait(900);
    msg.classList.add('is-visible');
  }

  function init() {
    gift.addEventListener('click', open);
    if (Progress.data.found.includes('gift')) {
      gift.classList.add('is-open');
      msg.classList.add('is-visible');
    }
  }

  return { init };
})();

/* ---------- carta ---------- */

const Letter = (() => {
  const letter = $('.letter');
  const lines = $$('.letter__line');
  const heart = $('.letter__heart');
  const openBtn = $('#open-letter');
  const finalBtn = $('#open-final');

  async function write() {
    for (const line of lines) {
      line.classList.add('is-visible');
      await wait(1300);
    }
    heart.classList.add('is-visible');
    await wait(1600);
    finalBtn.hidden = false;
    finalBtn.classList.add('is-unlocking');
    Progress.unlock('carta-lida');
  }

  function init() {
    openBtn.addEventListener('click', () => {
      Unlock.unlock('carta');
      openBtn.disabled = true;
    });
    Reveal.observe(letter, write);
    finalBtn.addEventListener('click', () => Final.play());
  }

  return { init };
})();

/* ---------- final ---------- */

const Final = (() => {
  const final = $('#final');
  const backdrop = $('#final-backdrop');
  const steps = {};
  let playing = false;

  const show = (n) => steps[n].classList.add('is-visible');
  const hide = (n) => steps[n].classList.remove('is-visible');

  function lock(state) {
    document.body.classList.toggle('is-final', state);
    document.body.classList.toggle('is-dark', state);
    document.body.style.overflow = state ? 'hidden' : '';
    if (lenis) {
      if (state) lenis.stop();
      else lenis.start();
    }
  }

  async function play() {
    if (playing) return;
    playing = true;
    Object.keys(steps).forEach(hide);
    lock(true);
    final.hidden = false;
    backdrop.hidden = false;
    await wait(60);
    backdrop.classList.add('is-visible');
    await wait(2400);

    show(1);
    await wait(4400);
    hide(1);
    await wait(1000);
    show(2);
    await wait(4200);
    hide(2);
    await wait(1200);

    document.body.classList.remove('is-dark');
    Garden.bloomAll();
    Garden.setPetals(90);
    Progress.syncPlanted();
    await wait(5000);

    show(3);
    await wait(2600);
    show(4);
    await wait(2400);
    show(5);
    await wait(1800);
    show(6);
    await wait(2000);
    show(7);
    await wait(1800);
    show(8);

    Garden.setPetals(20);
    Progress.unlock('final');
    Progress.unlock('memorias');
    StoryIcons.update();
    playing = false;
  }

  function back() {
    final.hidden = true;
    backdrop.classList.remove('is-visible');
    setTimeout(() => { backdrop.hidden = true; }, 2200);
    lock(false);
    Garden.setPetals(10);
  }

  function init() {
    $$('[data-step]', final).forEach((el) => { steps[el.dataset.step] = el; });
    $('#final-back').addEventListener('click', back);
  }

  return { init, play };
})();

/* ---------- "vc me cativou" ---------- */

const Cativou = (() => {
  const el = $('#cativou');
  const steps = $$('[data-step]', el);

  async function show() {
    Progress.find('secret-flower');
    steps.forEach((s) => s.classList.remove('is-visible'));
    el.hidden = false;
    await wait(40);
    el.classList.add('is-visible');
    await wait(900);
    steps[0].classList.add('is-visible');
    await wait(3000);
    steps[1].classList.add('is-visible');
    await wait(2800);
    steps[2].classList.add('is-visible');
    await wait(3200);
    steps[3].classList.add('is-visible');
  }

  function close() {
    el.classList.remove('is-visible');
    setTimeout(() => { el.hidden = true; }, 1400);
  }

  function init() {
    $('.cativou__close').addEventListener('click', close);
  }

  return { init, show };
})();

/* ---------- surpresas ---------- */

const Eggs = (() => {
  function name() {
    let clicks = 0;
    let timer = null;
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.jujuba')) return;
      clicks += 1;
      clearTimeout(timer);
      timer = setTimeout(() => { clicks = 0; }, 4000);
      if (clicks >= 5) {
        clicks = 0;
        Whisper.show('sim, eu sou completamente apaixonado por vc', 5000);
      }
    });
  }

  function star() {
    const star = $('#secret-star');
    star.addEventListener('click', () => {
      star.classList.add('is-found');
      Progress.find('star');
      Whisper.show('até o céu fica sem graça perto de vc');
    });
  }

  function rare() {
    const btn = $('#rare-flower');
    btn.appendChild(Flowers.create('rare', { open: true, instant: true, seed: 99 }));
    btn.addEventListener('click', () => {
      btn.classList.add('is-found');
      Progress.find('rare');
      Whisper.show('se vc achou isso, ganhou mais um eu te amo', 5000);
    });
  }

  function holdHeart() {
    const btn = $('#hold-heart');
    const HOLD_MS = 3000;
    let start = 0;
    let frame = null;
    let holding = false;

    const setProgress = (p) => btn.style.setProperty('--p', (p * 100).toFixed(1));

    const release = () => {
      if (!holding) return;
      holding = false;
      cancelAnimationFrame(frame);
      btn.classList.remove('is-holding');
      setProgress(0);
    };

    const tickHold = (now) => {
      if (!holding) return;
      const p = Math.min(1, (now - start) / HOLD_MS);
      setProgress(p);
      if (p >= 1) {
        release();
        Whisper.show('achou mesmo que eu ia deixar vc ir embora sem falar mais uma vez que eu te amo?', 6500);
        return;
      }
      frame = requestAnimationFrame(tickHold);
    };

    const press = (e) => {
      if (e.button && e.button !== 0) return;
      e.preventDefault();
      holding = true;
      btn.classList.add('is-holding');
      start = performance.now();
      frame = requestAnimationFrame(tickHold);
    };

    btn.addEventListener('pointerdown', press);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((type) => btn.addEventListener(type, release));
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  function init() {
    name();
    star();
    rare();
    holdHeart();
  }

  return { init };
})();

/* ---------- cursor (só desktop) ---------- */

const Cursor = (() => {
  function init() {
    if (!finePointer || reduceMotion) return;

    const cursor = $('.cursor');
    const dot = $('.cursor__dot');
    const ring = $('.cursor__ring');
    const pos = { x: -100, y: -100, rx: -100, ry: -100 };
    let current = '';

    document.body.classList.add('has-cursor');

    window.addEventListener('mousemove', (e) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      dot.style.left = `${pos.x}px`;
      dot.style.top = `${pos.y}px`;
      cursor.style.opacity = '1';
    }, { passive: true });

    document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });

    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('[data-cursor]');
      const kind = target ? target.dataset.cursor : e.target.closest('button, a, input') ? 'button' : '';
      if (kind === current) return;
      if (current) cursor.classList.remove(`cursor--${current}`);
      if (kind) cursor.classList.add(`cursor--${kind}`);
      current = kind;
    });

    const follow = () => {
      pos.rx += (pos.x - pos.rx) * 0.16;
      pos.ry += (pos.y - pos.ry) * 0.16;
      ring.style.left = `${pos.rx.toFixed(1)}px`;
      ring.style.top = `${pos.ry.toFixed(1)}px`;
      requestAnimationFrame(follow);
    };
    requestAnimationFrame(follow);
  }

  return { init };
})();

/* ---------- início ---------- */

function restoreProgress() {
  Progress.data.unlocked.forEach((id) => Unlock.unlock(id, { silent: true }));
  Garden.restore(Progress.data.planted);
  if (Progress.has('carta-lida')) $('#open-final').hidden = false;
  if (Progress.data.found.includes('star')) $('#secret-star').classList.add('is-found');
  if (Progress.data.found.includes('rare')) $('#rare-flower').classList.add('is-found');
}

document.addEventListener('DOMContentLoaded', () => {
  Progress.load();
  document.body.classList.add('is-intro');
  refreshIcons();

  Garden.init();
  Music.init();
  Flowers.fillSlots();
  setupScroll();
  Reveal.init();
  Unlock.init();

  Chapter1.init();
  Chapter2.init();
  Timeline.init();
  Counter.init();
  Bouquet.init();
  Path.init();
  Gift.init();
  Letter.init();
  Final.init();
  Cativou.init();
  Eggs.init();
  Cursor.init();

  restoreProgress();
  Intro.init();
});
