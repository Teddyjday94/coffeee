import * as THREE from 'three';
import { createStage, createProduct, createBeanField, createIngredientBurst, ease } from './scene.js';
import { renderBagImages } from './bags.js';
import { createCart } from './cart.js';
import { DRINKS, BEANS, GRINDS, HOURS, LOCATION, STORY, LARGE_UPCHARGE } from './content.js';

const { smoothstep, lerp, clamp } = THREE.MathUtils;
const $ = (s, el = document) => el.querySelector(s);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const money = (n) => `$${n.toFixed(2)}`;

// The cup labels are drawn on canvases, so wait for the fonts (but never hang on them).
await Promise.race([
  Promise.all(['400 100px Anton', '600 30px Inter', 'italic 500 38px Inter'].map((f) => document.fonts.load(f))),
  new Promise((r) => setTimeout(r, 2500)),
]).catch(() => {});

/* ---------- 3D setup ---------- */

const { renderer, scene, camera } = createStage($('#stage'));
const product = createProduct();
const beans = createBeanField(reduceMotion ? 18 : 34);
const fx = createIngredientBurst();
scene.add(beans.group, fx.group, product.group);
product.setDrink(DRINKS[0], true);

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
resize();
addEventListener('resize', resize);

// Where the cup sits in the hero vs. the drinks section, in world units.
function layout() {
  const vh = 2 * camera.position.length() * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const vw = vh * camera.aspect;
  const narrow = innerWidth < 760;
  const fit = Math.min(1, vw / 9);
  return {
    vh,
    hero: narrow ? { x: 0, y: -vh * 0.28, s: 0.72 } : { x: vw * 0.17, y: -0.2, s: 1.4 * Math.max(fit, 0.75) },
    drink: narrow ? { x: 0, y: -vh * 0.06, s: 0.72 } : { x: 0, y: -0.35, s: 1.18 * Math.max(fit, 0.75) },
  };
}

/* ---------- Toast + cart ---------- */

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

const cart = createCart({
  countEl: $('#bag-count'),
  bagBtn: $('#bag-btn'),
  onAdd: (item) => toast(`${item.name} added to your bag`),
});

/* ---------- Input: pointer tilt + drag to spin ---------- */

const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
const spin = { angle: 0, vel: 0, drag: null };

addEventListener('pointermove', (e) => {
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = -((e.clientY / innerHeight) * 2 - 1);
  if (!spin.drag) return;
  const dx = e.clientX - spin.drag.x;
  spin.drag.x = e.clientX;
  spin.drag.total += dx;
  spin.angle += dx * 0.012;
  spin.vel = dx * 0.012;
});

for (const el of [$('.hero'), $('.drinks')]) {
  el.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button')) return;
    spin.drag = { x: e.clientX, total: 0, t: performance.now(), el };
  });
}
addEventListener('pointerup', () => {
  const d = spin.drag;
  spin.drag = null;
  // A quick horizontal swipe on the drinks section also changes the drink.
  if (d && d.el.id === 'drinks' && Math.abs(d.total) > 90 && performance.now() - d.t < 600) {
    setDrink(current + (d.total < 0 ? 1 : -1));
  }
});

/* ---------- Drinks carousel ---------- */

const drinksEl = $('#drinks');
const dotsEl = $('#drink-dots');
let current = 0;
let size = 0;
let fxOn = false;
let lastInteraction = 0;

$('#drink-total').textContent = String(DRINKS.length).padStart(2, '0');
DRINKS.forEach((d, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.role = 'tab';
  b.setAttribute('aria-label', d.name);
  b.addEventListener('click', () => setDrink(i));
  dotsEl.append(b);
});

function renderName(name) {
  let i = 0;
  return name.split(' ').map((word) =>
    `<span class="word">${[...word].map((ch) => `<span class="ch" style="--i:${i++}">${ch}</span>`).join('')}</span>`,
  ).join(' ');
}

const drinkPrice = () => DRINKS[current].price + size * LARGE_UPCHARGE;

function setDrink(i, { auto = false } = {}) {
  const dir = i > current ? 1 : -1;
  current = (i + DRINKS.length) % DRINKS.length;
  const d = DRINKS[current];
  if (!auto) lastInteraction = performance.now();

  drinksEl.style.setProperty('--drink-bg', d.bg);
  drinksEl.style.setProperty('--drink-ink', d.ink);
  $('#drink-name').innerHTML = renderName(d.name);
  $('#drink-index').textContent = String(current + 1).padStart(2, '0');
  $('#drink-desc').textContent = d.desc;
  $('#drink-price').textContent = money(drinkPrice());
  [...dotsEl.children].forEach((b, j) => b.setAttribute('aria-selected', String(j === current)));
  const disc = $('.drink-disc');
  disc.classList.remove('pulse');
  void disc.offsetWidth; // restart the CSS animation
  disc.classList.add('pulse');

  product.setDrink(d);
  if (fxOn) fx.show(d);
  if (!reduceMotion) spin.vel += dir * 0.25;
}

drinksEl.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => {
  size = Number(b.dataset.size);
  drinksEl.querySelectorAll('[data-size]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  $('#drink-price').textContent = money(drinkPrice());
  lastInteraction = performance.now();
}));
$('#drink-add').addEventListener('click', () => {
  const d = DRINKS[current];
  lastInteraction = performance.now();
  cart.add({ kind: 'drink', name: d.name, option: `${size ? '16 oz' : '12 oz'} · Iced`, price: drinkPrice(), color: d.liquid.top });
});

$('#drink-prev').addEventListener('click', () => setDrink(current - 1));
$('#drink-next').addEventListener('click', () => setDrink(current + 1));
addEventListener('keydown', (e) => {
  if (document.body.classList.contains('drawer-open') || e.target.closest?.('input, select, textarea')) return;
  const r = drinksEl.getBoundingClientRect();
  if (r.top > innerHeight * 0.5 || r.bottom < innerHeight * 0.5) return;
  if (e.key === 'ArrowRight') setDrink(current + 1);
  if (e.key === 'ArrowLeft') setDrink(current - 1);
});

let drinksVisible = false;
new IntersectionObserver(([e]) => { drinksVisible = e.isIntersecting; }, { threshold: 0.6 }).observe(drinksEl);
if (!reduceMotion) {
  setInterval(() => {
    const busy = spin.drag || document.body.classList.contains('drawer-open') || drinksEl.matches(':hover');
    if (drinksVisible && !busy && performance.now() - lastInteraction > 8000) setDrink(current + 1, { auto: true });
  }, 6000);
}
setDrink(0, { auto: true });

/* ---------- Reveal on scroll ---------- */

const revealer = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add('in');
    e.target.dispatchEvent(new Event('reveal'));
    revealer.unobserve(e.target);
  }
}, { threshold: 0.15 });
const reveal = (el) => revealer.observe(el);

/* ---------- Story ---------- */

const storyText = $('#story-text');
storyText.innerHTML = STORY.text.split(' ').map((w) => `<span>${w}</span>`).join(' ');
const storyWords = [...storyText.children];

function updateStory() {
  const r = storyText.getBoundingClientRect();
  const prog = clamp((innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35), 0, 1);
  const lit = Math.round(prog * storyWords.length);
  storyWords.forEach((w, i) => w.classList.toggle('lit', i < lit));
}
let storyQueued = false;
addEventListener('scroll', () => {
  if (storyQueued) return;
  storyQueued = true;
  requestAnimationFrame(() => { storyQueued = false; updateStory(); });
}, { passive: true });
updateStory();

const statsEl = $('#stats');
statsEl.innerHTML = STORY.stats.map((s) => `
  <li data-reveal><strong data-to="${s.value}">0</strong><span>${s.label}</span></li>`).join('');
statsEl.querySelectorAll('li').forEach((li) => {
  const num = $('strong', li);
  li.addEventListener('reveal', () => {
    const to = Number(num.dataset.to);
    if (reduceMotion) { num.textContent = to.toLocaleString(); return; }
    const start = performance.now();
    const tick = (now) => {
      const k = Math.min((now - start) / 1400, 1);
      num.textContent = Math.round(to * ease.out(k)).toLocaleString();
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
});

const ICONS = {
  leaf: '<path d="M6 30 C 6 14, 18 6, 34 6 C 34 22, 26 34, 10 34"/><path d="M6 34 L 22 18"/>',
  flame: '<path d="M20 36 C 10 36, 6 29, 6 23 C 6 15, 13 12, 14 4 C 20 9, 22 14, 21 19 C 24 17, 25 14, 25 12 C 31 17, 34 22, 34 26 C 34 32, 28 36, 20 36 Z"/>',
  cup: '<path d="M6 14 H 28 V 24 C 28 31, 23 35, 17 35 C 11 35, 6 31, 6 24 Z"/><path d="M28 17 H 31 C 34 17, 35 20, 35 21 C 35 24, 32 26, 28 25"/><path d="M12 9 C 12 7, 14 6, 14 4 M 19 9 C 19 7, 21 6, 21 4"/>',
};
$('#process').innerHTML = STORY.steps.map((s, i) => `
  <li data-reveal style="transition-delay:${i * 90}ms">
    <svg viewBox="0 0 40 40" aria-hidden="true">${ICONS[s.icon]}</svg>
    <span class="step-num">0${i + 1}</span>
    <h3>${s.title}</h3>
    <p>${s.text}</p>
  </li>`).join('');

/* ---------- Beans shop ---------- */

const grid = $('#bean-grid');
const ROAST = ['Light', 'Light', 'Light-medium', 'Medium', 'Medium-dark', 'Dark'];
let bagImages = null;

function fillBagImages() {
  if (!bagImages) return;
  grid.querySelectorAll('.bag-slot:not(.ready)').forEach((slot) => {
    const urls = bagImages.get(slot.dataset.bag);
    if (!urls) return;
    slot.innerHTML = `
      <img class="bag-img front" src="${urls.front}" alt="12 oz bag of ${slot.dataset.bag}">
      <img class="bag-img angle" src="${urls.angle}" alt="" aria-hidden="true">`;
    slot.classList.add('ready');
  });
}

function renderBeans(filter = 'all') {
  grid.innerHTML = BEANS.map((b, i) => ({ b, i })).filter(({ b }) => filter === 'all' || b.type === filter).map(({ b, i }) => `
    <li class="card" style="--hue:${b.hue}" data-reveal>
      <div class="card-visual">
        ${b.badge ? `<span class="badge">${b.badge}</span>` : ''}
        <span class="roast-chip">${ROAST[b.roast]} roast</span>
        <div class="bag-slot" data-bag="${b.name}"><div class="bag-skeleton"></div></div>
      </div>
      <div class="card-body">
        <div class="card-row"><h3>${b.name}</h3><span class="price">$${b.price}</span></div>
        <p class="origin">${b.origin} · ${b.process}</p>
        <p class="notes">${b.notes}</p>
        <div class="buy">
          <label class="sr-only" for="grind-${i}">Grind for ${b.name}</label>
          <select id="grind-${i}">${GRINDS.map((g) => `<option>${g}</option>`).join('')}</select>
          <button type="button" class="add" data-i="${i}">Add</button>
        </div>
      </div>
    </li>`).join('');
  grid.querySelectorAll('[data-reveal]').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 70}ms`;
    reveal(el);
  });
  fillBagImages();
}

grid.addEventListener('pointermove', (e) => {
  const card = e.target.closest('.card');
  if (!card || reduceMotion || e.pointerType !== 'mouse') return;
  const r = card.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  card.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-6px)`;
  card.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
  card.style.setProperty('--my', `${(y + 0.5) * 100}%`);
});
grid.addEventListener('pointerout', (e) => {
  const card = e.target.closest('.card');
  if (card && !card.contains(e.relatedTarget)) card.style.transform = '';
});
grid.addEventListener('click', (e) => {
  const btn = e.target.closest('.add');
  if (!btn) return;
  const b = BEANS[Number(btn.dataset.i)];
  const grind = $('select', btn.closest('.buy')).value;
  cart.add({ kind: 'beans', name: b.name, option: `12 oz · ${grind}`, price: b.price, color: `hsl(${b.hue},42%,32%)` });
});

document.querySelectorAll('.chip').forEach((chip) => chip.addEventListener('click', () => {
  document.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === chip));
  renderBeans(chip.dataset.filter);
}));

renderBeans();

/* ---------- Visit ---------- */

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const fmtHour = (h) => {
  const hr = Math.floor(h) % 12 || 12;
  const min = Math.round((h % 1) * 60);
  return `${hr}${min ? `:${String(min).padStart(2, '0')}` : ''}${h < 12 ? 'am' : 'pm'}`;
};

function openStatus(now = new Date()) {
  const day = now.getDay();
  const h = now.getHours() + now.getMinutes() / 60;
  const today = HOURS.find((x) => x.days.includes(day));
  if (today && h >= today.open && h < today.close) return { open: true, text: `Open now · until ${fmtHour(today.close)}` };
  if (today && h < today.open) return { open: false, text: `Closed · opens ${fmtHour(today.open)} today` };
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    const next = HOURS.find((x) => x.days.includes(d));
    if (next) return { open: false, text: `Closed · opens ${fmtHour(next.open)} ${i === 1 ? 'tomorrow' : DAY_NAMES[d]}` };
  }
  return { open: false, text: 'Closed' };
}

function renderVisit() {
  const status = openStatus();
  const s = $('#open-status');
  s.textContent = status.text;
  s.classList.toggle('is-open', status.open);
  const todayIdx = new Date().getDay();
  $('#hours').innerHTML = HOURS.map((h) => `
    <div class="${h.days.includes(todayIdx) ? 'today' : ''}"><dt>${h.label}</dt><dd>${fmtHour(h.open)} – ${fmtHour(h.close)}</dd></div>`).join('');
}
$('#address').innerHTML = `${LOCATION.street}<br>${LOCATION.city}<br><span class="address-notes">${LOCATION.notes}</span>`;
$('#directions').href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${LOCATION.street}, ${LOCATION.city}`)}`;
$('#call').href = `tel:${LOCATION.phone.replace(/[^\d+]/g, '')}`;
$('#call').textContent = `Call ${LOCATION.phone}`;
$('#map-street').textContent = LOCATION.street;
$('#year').textContent = new Date().getFullYear();
renderVisit();
setInterval(renderVisit, 60000);

document.querySelectorAll('[data-reveal]').forEach(reveal);

/* ---------- Frame loop ---------- */

const clock = new THREE.Clock();
let scrollP = -1;
let intro = reduceMotion ? 1 : 0;
let cleared = false;
let bagsRequested = false;

function startBagRender() {
  if (bagsRequested) return;
  bagsRequested = true;
  // Give the intro animation a head start, then bake the bag images.
  setTimeout(() => {
    renderBagImages(BEANS)
      .then((map) => { bagImages = map; fillBagImages(); cart.setImages(map); })
      .catch((err) => console.warn('Bag renders failed', err));
  }, 700);
}

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  const L = layout();

  // p = -1 with the hero in view, 0 with the drinks section filling the screen.
  const target = Math.max(-1, (scrollY - drinksEl.offsetTop) / innerHeight);
  scrollP = reduceMotion ? target : lerp(scrollP, target, 1 - Math.exp(-dt * 10));
  const p = scrollP;

  if (p > 1.3) {
    if (!cleared) { renderer.clear(); cleared = true; }
    document.body.classList.add('ready');
    startBagRender();
    return;
  }
  cleared = false;

  intro = Math.min(1, intro + dt / 1.6);
  const introK = ease.outBack(intro);

  pointer.sx = lerp(pointer.sx, pointer.x, 1 - Math.exp(-dt * 4));
  pointer.sy = lerp(pointer.sy, pointer.y, 1 - Math.exp(-dt * 4));

  // m: 0 = hot cup in the hero, 1 = iced drink in the carousel
  const m = smoothstep(p, -0.8, -0.12);
  const e = ease.inOut(m);
  const bob = reduceMotion ? 0 : Math.sin(t * 1.2) * 0.06;

  product.group.position.set(
    lerp(L.hero.x, L.drink.x, e),
    lerp(L.hero.y, L.drink.y, e) + Math.max(0, p) * L.vh + bob,
    0,
  );
  product.group.scale.setScalar(lerp(L.hero.s, L.drink.s, e) * introK);
  product.group.rotation.x = -pointer.sy * 0.12;
  product.group.rotation.z = -pointer.sx * 0.06;

  const hotS = 1 - smoothstep(m, 0.3, 0.6);
  const icedS = smoothstep(m, 0.45, 0.8);
  product.hot.scale.setScalar(Math.max(hotS, 1e-4));
  product.iced.scale.setScalar(Math.max(icedS, 1e-4));
  product.hot.visible = hotS > 0.001;
  product.iced.visible = icedS > 0.001;
  product.shadow.scale.setScalar(Math.max(hotS, icedS));

  if (!spin.drag) {
    spin.angle += spin.vel;
    spin.vel *= Math.pow(0.04, dt);
  }
  const idle = reduceMotion ? 0 : Math.sin(t * 0.45) * 0.35 + (1 - intro) * -3;
  product.spinner.rotation.y = idle + spin.angle + e * Math.PI * 2;

  // Beans fill the hero and drift away as you scroll into the drinks.
  beans.update(reduceMotion ? 0 : t, (1 - smoothstep(p, -0.85, -0.35)) * introK);
  beans.group.position.set(pointer.sx * 0.35, (p + 1) * L.vh * 0.6 + pointer.sy * 0.2, 0);

  const wantFx = m > 0.9 && p < 0.55;
  if (wantFx && !fxOn) { fx.show(DRINKS[current]); fxOn = true; }
  if (!wantFx && fxOn) { fx.hide(); fxOn = false; }
  fx.group.position.set(product.group.position.x + pointer.sx * 0.25, product.group.position.y - bob + pointer.sy * 0.15, 0);
  fx.group.scale.setScalar(L.drink.s * 0.8);
  fx.update(dt, reduceMotion ? 0 : t);

  product.update(dt, t);
  renderer.render(scene, camera);

  if (!document.body.classList.contains('ready')) {
    document.body.classList.add('ready');
    startBagRender();
  }
});
