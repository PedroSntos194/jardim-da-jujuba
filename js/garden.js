/* flores desenhadas à mão em svg + o jardim de fundo (céu, vagalumes, campo, pétalas) */

const SVG_NS = 'http://www.w3.org/2000/svg';
const TAU = Math.PI * 2;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/* ---------- flores ---------- */

const Flowers = (() => {
  const f1 = (n) => Number(n).toFixed(1);

  /* gerador com semente: a mesma semente desenha sempre a mesma flor */
  function makeRng(seed) {
    let a = seed | 0;
    const next = () => {
      a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    return (min = 0, max = 1) => min + next() * (max - min);
  }

  const bezier = (t, p0, p1, p2, p3) => {
    const u = 1 - t;
    return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
  };

  /* curva fechada suave passando pelos pontos (catmull-rom → bezier) */
  function smoothClosed(pts) {
    const n = pts.length;
    let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
    for (let i = 0; i < n; i += 1) {
      const p0 = pts[(i - 1 + n) % n];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % n];
      const p3 = pts[(i + 2) % n];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C ${f1(c1[0])} ${f1(c1[1])}, ${f1(c2[0])} ${f1(c2[1])}, ${f1(p2[0])} ${f1(p2[1])}`;
    }
    return `${d} Z`;
  }

  const blob = (rng, radius, points, wobble) =>
    smoothClosed(Array.from({ length: points }, (_, i) => {
      const a = i / points * TAU;
      const rr = radius * rng(1 - wobble, 1 + wobble);
      return [Math.cos(a) * rr, Math.sin(a) * rr];
    }));

  /* haste com leve "s", afinando pra cima */
  function stem(rng, x0, y0, x1, y1, wb = 2, wt = 1.1) {
    const c1x = x0 + rng(-7, 7);
    const c1y = y0 + (y1 - y0) * 0.34;
    const c2x = x0 + rng(-6, 6);
    const c2y = y0 + (y1 - y0) * 0.66;
    const path =
      `M${f1(x0 - wb)} ${y0} C ${f1(c1x - wb * 0.9)} ${f1(c1y)}, ${f1(c2x - wt * 1.2)} ${f1(c2y)}, ${f1(x1 - wt)} ${y1} ` +
      `L ${f1(x1 + wt)} ${y1} C ${f1(c2x + wt * 1.2)} ${f1(c2y)}, ${f1(c1x + wb * 0.9)} ${f1(c1y)}, ${f1(x0 + wb)} ${y0} Z`;
    const highlight =
      `M${f1(x0 - wb * 0.4)} ${y0 - 6} C ${f1(c1x - 0.7)} ${f1(c1y)}, ${f1(c2x - 0.4)} ${f1(c2y)}, ${f1(x1 - 0.3)} ${y1 + 6}`;
    const at = (t) => [bezier(t, x0, c1x, c2x, x1), bezier(t, y0, c1y, c2y, y1)];
    const markup = `<g class="flower__stem-group"><path class="flower__stem" d="${path}"/><path class="flower__stem-hl" d="${highlight}"/></g>`;
    return { markup, at };
  }

  const LEAVES = {
    daisyL: ['M0 0 C -13 -3, -27 -14, -30 -29 C -31 -35, -29 -38, -26 -38 C -13 -33, -3 -16, 0 0 Z', 'M-1 -3 C -10 -11, -20 -21, -26 -34'],
    daisyR: ['M0 0 C 12 -4, 24 -14, 25 -27 C 26 -32, 24 -35, 21 -34 C 10 -28, 3 -14, 0 0 Z', 'M1 -3 C 8 -10, 17 -19, 22 -31'],
    tulipL: ['M0 0 C -14 -10, -32 -40, -34 -78 C -33 -88, -30 -92, -27 -90 C -16 -70, -6 -36, 0 0 Z', 'M-1 -4 C -12 -30, -22 -56, -28 -84'],
    tulipR: ['M0 0 C 12 -8, 26 -30, 26 -56 C 26 -62, 24 -66, 21 -64 C 12 -46, 4 -22, 0 0 Z', 'M1 -4 C 9 -22, 17 -42, 22 -60'],
    lilyL: ['M0 0 C -12 -6, -28 -22, -30 -46 C -30 -52, -28 -55, -25 -54 C -14 -40, -4 -18, 0 0 Z', 'M-1 -3 C -10 -16, -20 -32, -26 -50'],
    lilyR: ['M0 0 C 12 -6, 26 -20, 28 -42 C 28 -48, 26 -51, 23 -50 C 13 -37, 4 -17, 0 0 Z', 'M1 -3 C 9 -15, 18 -29, 24 -46'],
    smallL: ['M0 0 C -7 -2, -14 -8, -15 -16 C -15 -19, -14 -20, -12 -20 C -6 -16, -2 -8, 0 0 Z', 'M-1 -2 C -5 -6, -9 -11, -12 -17'],
  };

  function leaf(kind, side, [x, y], rot, scale) {
    const [shape, vein] = LEAVES[kind + side];
    return `<g class="flower__leaf flower__leaf--${side.toLowerCase()}">` +
      `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)}) scale(${f1(scale)})">` +
      `<path d="${shape}"/><path class="flower__vein" d="${vein}"/></g></g>`;
  }

  const head = (x, y, tilt, inner) =>
    `<g class="flower__head"><g transform="translate(${x} ${y}) rotate(${f1(tilt)})">${inner}</g></g>`;

  /* margarida: duas fileiras de pétalas irregulares, miolo pontilhado */
  function daisy(rng) {
    const tones = ['#FFFDF6', '#F8F3E8', '#F2EBDC'];
    const petalPath = (L, w, bend) =>
      `M0 0 C ${f1(w)} ${f1(-L * 0.28)}, ${f1(w * 0.85 + bend)} ${f1(-L * 0.82)}, ${f1(bend)} ${f1(-L)} ` +
      `C ${f1(-w * 0.85 + bend)} ${f1(-L * 0.82)}, ${f1(-w)} ${f1(-L * 0.28)}, 0 0 Z`;

    const ring = (count, baseL, baseW, offset, cls, tone) =>
      Array.from({ length: count }, (_, i) => {
        const a = i * 360 / count + offset + rng(-5, 5);
        const d = petalPath(baseL * rng(0.85, 1.12), baseW * rng(0.8, 1.2), rng(-3, 3));
        const fill = tone || tones[Math.floor(rng(0, tones.length))];
        return `<g transform="rotate(${f1(a)})"><path class="flower__petal flower__petal--unfurl ${cls}" d="${d}" fill="${fill}" style="--d:${Math.floor(rng(0, 750))}ms"/></g>`;
      }).join('');

    const n = 13 + Math.floor(rng(0, 3));
    const back = ring(n, 30, 6.4, 180 / n, 'flower__petal--back', '#E6DFD0');
    const front = ring(n, 33, 7, 0, '');

    const dots = Array.from({ length: 18 }, () => {
      const a = rng(0, TAU);
      const rr = Math.sqrt(rng()) * 7.5;
      return `<circle cx="${f1(Math.cos(a) * rr)}" cy="${f1(Math.sin(a) * rr)}" r="${f1(rng(0.6, 1.4))}"/>`;
    }).join('');

    const sepals = Array.from({ length: 6 }, (_, i) =>
      `<path d="M0 0 C 3 -3, 3 -8, 0 -11 C -3 -8, -3 -3, 0 0 Z" transform="rotate(${i * 60 + 30}) translate(0 -3)"/>`
    ).join('');

    const s = stem(rng, 60, 214, 60, 84);
    return s.markup +
      leaf('daisy', 'L', s.at(rng(0.3, 0.42)), rng(-10, 8), rng(0.85, 1.15)) +
      leaf('daisy', 'R', s.at(rng(0.5, 0.62)), rng(-8, 10), rng(0.75, 1.05)) +
      head(60, 76, rng(-12, 12), `
        <circle class="flower__halo" r="36"/>
        <g class="flower__calyx">${sepals}</g>
        <g class="flower__petals">${back}${front}</g>
        <path class="flower__core" d="${blob(rng, 10.5, 10, 0.07)}"/>
        <path class="flower__core-shade" d="M-8 3 C -5 9, 5 9, 8 3 C 5 6, -5 6, -8 3 Z"/>
        <g class="flower__dots">${dots}</g>`);
  }

  /* tulipa: taça com pétalas sobrepostas, uma folha longa abraçando a haste */
  function tulip(rng) {
    const h = rng(0.92, 1.08);
    const tone = rng() < 0.5 ? 'g-tulip' : 'g-tulip-2';
    const y = (v) => f1(v * h);
    const petals = `
      <path class="flower__petal flower__petal--back" d="M-19 0 C -25 ${y(-30)}, -14 ${y(-54)}, -3 ${y(-61)} C 2 ${y(-64)}, 8 ${y(-58)}, 12 ${y(-55)} C 22 ${y(-40)}, 24 ${y(-20)}, 19 0 Z"/>
      <path class="flower__petal flower__petal--l" style="--o:${f1(-rng(7, 12))}deg" fill="url(#${tone})" d="M-19 0 C -27 ${y(-26)}, -21 ${y(-50)}, -9 ${y(-60)} C -6 ${y(-58)}, -2 ${y(-46)}, 0 ${y(-30)} C 1 ${y(-16)}, 0.5 ${y(-6)}, 0 0 Z"/>
      <path class="flower__petal flower__petal--r" style="--o:${f1(rng(8, 14))}deg" fill="url(#${tone})" d="M19 0 C 27 ${y(-26)}, 21 ${y(-50)}, 9 ${y(-60)} C 6 ${y(-58)}, 2 ${y(-46)}, 0 ${y(-30)} C -1 ${y(-16)}, -0.5 ${y(-6)}, 0 0 Z"/>
      <path class="flower__petal flower__petal--front" fill="url(#${tone})" d="M-13 0 C -19 ${y(-24)}, -11 ${y(-46)}, ${f1(rng(-3, 3))} ${y(-54)} C 9 ${y(-46)}, 19 ${y(-24)}, 13 0 Z"/>
      <path class="flower__petal-hl" d="M-8 -8 C -12 ${y(-22)}, -8 ${y(-38)}, -1 ${y(-48)}"/>
      <ellipse class="flower__base" cx="0" cy="0" rx="19" ry="4.5"/>`;

    const s = stem(rng, 60, 214, 60, 90, 2.2, 1.3);
    return s.markup +
      leaf('tulip', 'L', s.at(rng(0.06, 0.14)), rng(-6, 6), rng(0.9, 1.1)) +
      leaf('tulip', 'R', s.at(rng(0.18, 0.28)), rng(-6, 8), rng(0.8, 1)) +
      head(60, 90, rng(-8, 8), `<circle class="flower__halo" r="34" cy="-30"/><g class="flower__petals">${petals}</g>`);
  }

  /* lírio: seis pétalas lanceoladas com ponta virada, pintas na base, estames */
  function lily(rng) {
    const petals = Array.from({ length: 6 }, (_, i) => {
      const a = i * 60 + rng(-6, 6);
      const L = 64 * rng(0.9, 1.1);
      const w = 12 * rng(0.85, 1.15);
      const c = rng(-6, 6);
      const d =
        `M0 0 C ${f1(w * 0.8)} ${f1(-L * 0.2)}, ${f1(w * 1.05)} ${f1(-L * 0.55)}, ${f1(w * 0.45 + c)} ${f1(-L * 0.82)} ` +
        `C ${f1(w * 0.55 + c)} ${f1(-L * 0.9)}, ${f1(w * 0.5 + c)} ${f1(-L * 0.98)}, ${f1(w * 0.3 + c * 1.5)} ${f1(-L)} ` +
        `C ${f1(c * 1.2)} ${f1(-L * 0.95)}, ${f1(-w * 0.2 + c)} ${f1(-L * 0.88)}, ${f1(-w * 0.45 + c)} ${f1(-L * 0.82)} ` +
        `C ${f1(-w * 1.05)} ${f1(-L * 0.55)}, ${f1(-w * 0.8)} ${f1(-L * 0.2)}, 0 0 Z`;
      const vein = `M0 -3 C ${f1(c * 0.2)} ${f1(-L * 0.4)}, ${f1(c * 0.5)} ${f1(-L * 0.7)}, ${f1(w * 0.2 + c)} ${f1(-L * 0.9)}`;
      const spots = Array.from({ length: 6 }, () =>
        `<circle cx="${f1(rng(-w * 0.4, w * 0.4))}" cy="${f1(-L * rng(0.12, 0.42))}" r="${f1(rng(0.5, 1.1))}"/>`
      ).join('');
      return `<g transform="rotate(${f1(a)})"><g class="flower__petal flower__petal--unfurl ${i % 2 ? 'flower__petal--alt' : ''}" style="--d:${Math.floor(rng(0, 600))}ms">` +
        `<path d="${d}"/><path class="flower__vein" d="${vein}"/><g class="flower__spots">${spots}</g></g></g>`;
    }).join('');

    const stamens = Array.from({ length: 6 }, (_, i) => {
      const a = (i * 60 + 30) * Math.PI / 180;
      const len = rng(16, 22);
      const x = Math.cos(a) * len;
      const yy = Math.sin(a) * len;
      const cx = Math.cos(a + 0.35) * len * 0.5;
      const cy = Math.sin(a + 0.35) * len * 0.5;
      return `<path class="flower__stamen" d="M0 0 Q ${f1(cx)} ${f1(cy)} ${f1(x)} ${f1(yy)}"/>` +
        `<ellipse class="flower__anther" cx="${f1(x)}" cy="${f1(yy)}" rx="2.8" ry="1.5" transform="rotate(${f1(i * 60 + 30 + rng(-15, 15))} ${f1(x)} ${f1(yy)})"/>`;
    }).join('');

    const s = stem(rng, 70, 214, 70, 94, 2.2, 1.3);
    return s.markup +
      leaf('lily', 'L', s.at(rng(0.14, 0.26)), rng(-8, 6), rng(0.9, 1.15)) +
      leaf('lily', 'R', s.at(rng(0.34, 0.46)), rng(-6, 8), rng(0.8, 1.05)) +
      head(70, 84, rng(-15, 15), `
        <circle class="flower__halo" r="44"/>
        <g class="flower__petals">${petals}</g>
        <g class="flower__stamens">${stamens}<circle class="flower__pistil" r="3"/></g>`);
  }

  /* flor diferente (não-me-esqueças) */
  function secret(rng) {
    const petals = Array.from({ length: 5 }, (_, i) => {
      const a = i * 72 + rng(-8, 8);
      const rr = rng(7.5, 9.5);
      return `<g transform="rotate(${f1(a)}) translate(0 -9)"><path class="flower__petal flower__petal--unfurl ${i % 2 ? 'flower__petal--alt' : ''}" d="${blob(rng, rr, 8, 0.08)}" style="--d:${Math.floor(rng(0, 500))}ms"/></g>`;
    }).join('');
    const s = stem(rng, 40, 136, 40, 54, 1.3, 0.8);
    return s.markup +
      leaf('small', 'L', s.at(rng(0.25, 0.4)), rng(-10, 10), rng(0.9, 1.1)) +
      head(40, 46, rng(-10, 10), `<g class="flower__petals">${petals}</g><path class="flower__core" d="${blob(rng, 3.6, 8, 0.1)}"/>`);
  }

  /* flor rara (bem pequena, dourada) */
  function rare(rng) {
    const petals = Array.from({ length: 5 }, (_, i) => {
      const a = i * 72 + rng(-8, 8);
      const L = rng(12, 15);
      const w = rng(4, 5.5);
      return `<g transform="rotate(${f1(a)})"><path class="flower__petal flower__petal--unfurl" d="M0 0 C ${f1(w)} ${f1(-L * 0.35)}, ${f1(w * 0.6)} ${f1(-L * 0.8)}, 0 ${f1(-L)} C ${f1(-w * 0.6)} ${f1(-L * 0.8)}, ${f1(-w)} ${f1(-L * 0.35)}, 0 0 Z" style="--d:${Math.floor(rng(0, 500))}ms"/></g>`;
    }).join('');
    const s = stem(rng, 30, 98, 30, 44, 1.1, 0.7);
    return s.markup + head(30, 42, rng(-10, 10), `<g class="flower__petals">${petals}</g><path class="flower__core" d="${blob(rng, 3, 8, 0.1)}"/>`);
  }

  const builders = { daisy, tulip, lily, secret, rare };
  const viewBoxes = {
    daisy: '0 0 120 220',
    tulip: '0 0 120 220',
    lily: '0 0 140 220',
    secret: '0 0 80 140',
    rare: '0 0 60 100',
  };

  function create(type, options = {}) {
    const seed = options.seed ?? Math.floor(Math.random() * 1e6);
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', viewBoxes[type]);
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('flower', `flower--${type}`);
    svg.innerHTML = builders[type](makeRng(seed));
    svg.style.setProperty('--sway-delay', `${(-Math.random() * 7).toFixed(2)}s`);
    svg.style.setProperty('--sway-dur', `${rand(6, 9.5).toFixed(2)}s`);

    if (options.sway !== false) svg.classList.add('is-swaying');
    if (options.instant) svg.classList.add('is-instant');
    if (options.grown || options.open) svg.classList.add('is-grown');
    if (options.open) svg.classList.add('is-open');
    return svg;
  }

  function grow(svg, options = {}) {
    if (!svg) return;
    const { open = true, delay = 0, openDelay = 1600 } = options;
    setTimeout(() => svg.classList.add('is-grown'), delay);
    if (open) setTimeout(() => svg.classList.add('is-open'), delay + openDelay + rand(0, 400));
  }

  function fillSlots(root = document) {
    root.querySelectorAll('.flower-slot[data-flower]').forEach((slot, i) => {
      if (slot.firstElementChild) return;
      const instant = slot.hasAttribute('data-open');
      slot.appendChild(create(slot.dataset.flower, { open: instant, instant, seed: 300 + i * 17 }));
    });
  }

  return { create, grow, fillSlots };
})();

/* ---------- jardim de fundo ---------- */

const Garden = (() => {
  const root = document.getElementById('garden');
  const field = document.getElementById('garden-field');
  const starsCanvas = document.getElementById('stars');
  const petalsCanvas = document.getElementById('petals');
  const firefliesEl = document.getElementById('fireflies');
  const light = document.getElementById('garden-light');

  const SLOTS = [
    { type: 'daisy', x: 6, y: 4, w: 64, depth: 0.9 },
    { type: 'daisy', x: 22, y: 10, w: 48, depth: 0.55 },
    { type: 'daisy', x: 41, y: 2, w: 70, depth: 1 },
    { type: 'daisy', x: 58, y: 12, w: 44, depth: 0.45 },
    { type: 'daisy', x: 74, y: 6, w: 58, depth: 0.8 },
    { type: 'daisy', x: 91, y: 3, w: 66, depth: 0.95 },
    { type: 'daisy', x: 33, y: 16, w: 40, depth: 0.35 },
    { type: 'daisy', x: 84, y: 14, w: 42, depth: 0.4 },
    { type: 'tulip', x: 14, y: 8, w: 56, depth: 0.7 },
    { type: 'tulip', x: 29, y: 4, w: 66, depth: 0.9 },
    { type: 'tulip', x: 50, y: 9, w: 52, depth: 0.6 },
    { type: 'tulip', x: 66, y: 2, w: 72, depth: 1 },
    { type: 'tulip', x: 80, y: 10, w: 50, depth: 0.55 },
    { type: 'tulip', x: 96, y: 8, w: 54, depth: 0.65 },
    { type: 'tulip', x: 3, y: 14, w: 42, depth: 0.4 },
    { type: 'tulip', x: 45, y: 17, w: 38, depth: 0.3 },
    { type: 'lily', x: 10, y: 1, w: 78, depth: 1 },
    { type: 'lily', x: 37, y: 7, w: 62, depth: 0.7 },
    { type: 'lily', x: 62, y: 15, w: 46, depth: 0.4 },
    { type: 'lily', x: 87, y: 1, w: 80, depth: 1 },
    { type: 'lily', x: 25, y: 13, w: 44, depth: 0.4 },
    { type: 'lily', x: 71, y: 5, w: 64, depth: 0.8 },
    { type: 'lily', x: 53, y: 3, w: 70, depth: 0.9 },
    { type: 'lily', x: 18, y: 17, w: 40, depth: 0.3 },
  ];

  const state = {
    running: false,
    petalTarget: 0,
    petals: [],
    stars: [],
    shooting: null,
    nextShooting: 0,
    mouse: { x: 0, y: 0, tx: 0, ty: 0 },
  };

  let starsCtx;
  let petalsCtx;
  let width = 0;
  let height = 0;

  /* campo de flores */

  const widthScale = () => (window.innerWidth < 768 ? 0.74 : 1);

  function plantSlot(slot, options = {}) {
    if (slot.el) return false;
    const wrap = document.createElement('div');
    wrap.className = `garden-flower garden-flower--${slot.type}`;
    wrap.style.setProperty('--x', `${slot.x}%`);
    wrap.style.setProperty('--y', `${slot.y}%`);
    wrap.style.setProperty('--w', `${Math.round(slot.w * widthScale())}px`);
    wrap.style.setProperty('--o', (0.45 + slot.depth * 0.5).toFixed(2));
    wrap.style.setProperty('--blur', `${((1 - slot.depth) * 1.6).toFixed(2)}px`);
    wrap.style.setProperty('--depth', slot.depth);
    wrap.style.zIndex = Math.round(slot.depth * 10);

    const flower = Flowers.create(slot.type, {
      instant: options.instant,
      open: options.instant,
      grown: options.instant,
      seed: 1000 + SLOTS.indexOf(slot) * 31,
    });
    wrap.appendChild(flower);
    field.appendChild(wrap);
    slot.el = wrap;

    if (!options.instant) {
      requestAnimationFrame(() => Flowers.grow(flower, { delay: options.delay || 0 }));
    }
    return true;
  }

  function plant(type, count = 1, options = {}) {
    let planted = 0;
    for (const slot of SLOTS) {
      if (planted >= count) break;
      if (slot.type !== type || slot.el) continue;
      plantSlot(slot, { ...options, delay: (options.delay || 0) + planted * 420 });
      planted += 1;
    }
    return planted;
  }

  function planted() {
    return SLOTS.reduce((acc, slot) => {
      if (slot.el) acc[slot.type] = (acc[slot.type] || 0) + 1;
      return acc;
    }, { daisy: 0, tulip: 0, lily: 0 });
  }

  function restore(counts = {}) {
    Object.entries(counts).forEach(([type, n]) => plant(type, n, { instant: true }));
  }

  function bloomAll() {
    const order = ['daisy', 'tulip', 'lily'];
    order.forEach((type, phase) => {
      const base = phase * 1700;
      SLOTS.filter((s) => s.type === type).forEach((slot, i) => {
        const delay = base + i * 180 + rand(0, 200);
        if (slot.el) {
          setTimeout(() => slot.el.querySelector('.flower').classList.add('is-grown', 'is-open'), delay);
        } else {
          plantSlot(slot, { delay });
        }
      });
    });
  }

  function refit() {
    SLOTS.forEach((slot) => {
      if (slot.el) slot.el.style.setProperty('--w', `${Math.round(slot.w * widthScale())}px`);
    });
  }

  /* vagalumes */

  function makeFireflies(count = 14) {
    for (let i = 0; i < count; i += 1) {
      const f = document.createElement('span');
      f.className = 'firefly';
      f.style.setProperty('--x', `${rand(2, 98).toFixed(1)}%`);
      f.style.setProperty('--y', `${rand(38, 88).toFixed(1)}%`);
      f.style.setProperty('--g', `${rand(2.2, 4.5).toFixed(2)}s`);
      f.style.setProperty('--d', `${rand(12, 24).toFixed(2)}s`);
      f.style.setProperty('--delay', `${(-rand(0, 20)).toFixed(2)}s`);
      for (let k = 1; k <= 4; k += 1) {
        f.style.setProperty(`--dx${k}`, `${rand(-70, 70).toFixed(0)}px`);
        f.style.setProperty(`--dy${k}`, `${rand(-50, 50).toFixed(0)}px`);
      }
      firefliesEl.appendChild(f);
    }
  }

  /* céu */

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    [starsCanvas, petalsCanvas].forEach((canvas) => {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    makeStars();
    refit();
    if (reduceMotion) drawStars(0);
  }

  function makeStars() {
    const count = Math.round((width * height) / 9000);
    state.stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.72,
      r: rand(0.3, 1.5),
      phase: Math.random() * TAU,
      speed: rand(0.25, 1.1),
      base: rand(0.25, 0.75),
    }));
  }

  function drawStars(t) {
    starsCtx.clearRect(0, 0, width, height);
    starsCtx.fillStyle = '#FFF9F2';
    for (const s of state.stars) {
      const alpha = reduceMotion ? s.base : s.base + Math.sin(t * 0.001 * s.speed + s.phase) * 0.28;
      starsCtx.globalAlpha = clamp(alpha, 0.04, 1);
      starsCtx.beginPath();
      starsCtx.arc(s.x, s.y, s.r, 0, TAU);
      starsCtx.fill();
    }
    starsCtx.globalAlpha = 1;
    drawShootingStar(t);
  }

  function drawShootingStar(t) {
    if (!state.shooting) {
      if (t > state.nextShooting) {
        state.shooting = { x: rand(width * 0.2, width * 0.9), y: rand(20, height * 0.3), life: 0 };
      }
      return;
    }
    const s = state.shooting;
    s.life += 1;
    s.x -= 7;
    s.y += 2.6;
    const fade = 1 - s.life / 60;
    const grad = starsCtx.createLinearGradient(s.x, s.y, s.x + 90, s.y - 34);
    grad.addColorStop(0, `rgba(255,249,242,${0.8 * fade})`);
    grad.addColorStop(1, 'rgba(255,249,242,0)');
    starsCtx.strokeStyle = grad;
    starsCtx.lineWidth = 1.2;
    starsCtx.beginPath();
    starsCtx.moveTo(s.x, s.y);
    starsCtx.lineTo(s.x + 90, s.y - 34);
    starsCtx.stroke();
    if (s.life > 60) {
      state.shooting = null;
      state.nextShooting = t + rand(16000, 34000);
    }
  }

  /* pétalas */

  const PETAL_COLORS = ['217,140,149', '248,246,238', '207,198,219'];

  function newPetal() {
    return {
      x: Math.random() * width,
      y: -20,
      size: rand(5, 11),
      vx: rand(-0.3, 0.3),
      vy: rand(0.45, 1.2),
      rot: Math.random() * TAU,
      vr: rand(-0.02, 0.02),
      sway: Math.random() * TAU,
      color: pick(PETAL_COLORS),
      alpha: rand(0.45, 0.85),
    };
  }

  function drawPetals() {
    petalsCtx.clearRect(0, 0, width, height);
    if (state.petals.length < state.petalTarget && Math.random() < 0.12) {
      state.petals.push(newPetal());
    }
    for (let i = state.petals.length - 1; i >= 0; i -= 1) {
      const p = state.petals[i];
      p.sway += 0.018;
      p.x += p.vx + Math.sin(p.sway) * 0.45;
      p.y += p.vy;
      p.rot += p.vr;
      if (p.y > height + 20) {
        if (state.petals.length > state.petalTarget) state.petals.splice(i, 1);
        else Object.assign(p, newPetal());
        continue;
      }
      petalsCtx.save();
      petalsCtx.translate(p.x, p.y);
      petalsCtx.rotate(p.rot);
      petalsCtx.fillStyle = `rgba(${p.color},${p.alpha})`;
      petalsCtx.beginPath();
      petalsCtx.ellipse(0, 0, p.size * 0.55, p.size, 0, 0, TAU);
      petalsCtx.fill();
      petalsCtx.restore();
    }
  }

  function setPetals(target) {
    state.petalTarget = reduceMotion ? 0 : target;
  }

  /* luz que segue o mouse + parallax do campo */

  function bindPointer() {
    if (finePointer && !reduceMotion) {
      window.addEventListener('mousemove', (e) => {
        state.mouse.tx = e.clientX;
        state.mouse.ty = e.clientY;
        field.style.setProperty('--mx', ((e.clientX / width - 0.5) * 2).toFixed(3));
      }, { passive: true });
      light.classList.add('is-on');
    } else {
      window.addEventListener('scroll', () => {
        field.style.setProperty('--mx', (Math.sin(window.scrollY / 520) * 0.6).toFixed(3));
      }, { passive: true });
    }
  }

  function moveLight() {
    if (!finePointer) return;
    state.mouse.x += (state.mouse.tx - state.mouse.x) * 0.06;
    state.mouse.y += (state.mouse.ty - state.mouse.y) * 0.06;
    const half = Math.max(width, height) * 0.3;
    light.style.transform = `translate(${(state.mouse.x - half).toFixed(1)}px, ${(state.mouse.y - half).toFixed(1)}px)`;
  }

  /* loop */

  function frame(t) {
    if (!state.running) return;
    if (!document.hidden) {
      if (!reduceMotion) drawStars(t);
      drawPetals();
      moveLight();
    }
    requestAnimationFrame(frame);
  }

  function start() {
    if (state.running) return;
    state.running = true;
    requestAnimationFrame(frame);
  }

  function show() {
    root.classList.add('is-visible');
    start();
  }

  function init() {
    starsCtx = starsCanvas.getContext('2d');
    petalsCtx = petalsCanvas.getContext('2d');
    state.mouse.tx = window.innerWidth / 2;
    state.mouse.ty = window.innerHeight / 2;
    resize();
    makeFireflies(reduceMotion ? 6 : 14);
    bindPointer();
    window.addEventListener('resize', resize);
  }

  return { init, show, plant, planted, restore, bloomAll, setPetals };
})();
