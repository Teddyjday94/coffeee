import * as THREE from 'three';
import { createStage, createProduct, createIngredientBurst, ease } from './scene.js';
import { initChrome, $, $$, reduceMotion, money, slug, reveal, fontsReady, createSpin, drinkImage } from './common.js';
import { DRINKS, MENU, EXTRAS, LARGE_UPCHARGE } from './content.js';

const { lerp } = THREE.MathUtils;
const { cart } = initChrome('menu');

/* ---------- Full menu list ---------- */

const TAG_LABEL = { V: 'Vegan', GF: 'Gluten free' };
const item = ({ name, price, desc, tags = [] }, extra = '', thumb = '') => `
  <li class="menu-item" data-reveal>
    ${thumb ? `<img class="menu-thumb" src="${thumb}" alt="" width="960" height="1140" loading="lazy" decoding="async">` : ''}
    <div class="menu-item-main">
      <div class="menu-row"><h4>${name}</h4><span class="leader" aria-hidden="true"></span><span class="menu-price">${money(price)}</span></div>
      <p>${desc}${tags.map((t) => ` <abbr class="tag" title="${TAG_LABEL[t]}">${t}</abbr>`).join('')}</p>
    </div>
    <div class="menu-item-actions">
      ${extra}
      <button type="button" class="plus" data-add="${name}" aria-label="Add ${name} to order">+</button>
    </div>
  </li>`;

$('#menu-sections').innerHTML = `
  <section class="menu-section" id="signature">
    <div class="menu-section-head"><h3>Signature iced</h3><p>Our house creations. Tap "View" to see one up close.</p></div>
    <ul class="menu-items">
      ${DRINKS.map((d) => item(d, `<button type="button" class="view-btn" data-view="${slug(d.name)}" style="--c:${d.liquid.top}">View</button>`, drinkImage(d.name).front)).join('')}
    </ul>
  </section>
  ${MENU.map((sec) => `
    <section class="menu-section" id="${sec.id}">
      <div class="menu-section-head"><h3>${sec.title}</h3><p>${sec.note}</p></div>
      <ul class="menu-items">${sec.items.map((i) => item(i)).join('')}</ul>
    </section>`).join('')}`;
$('#extras').textContent = EXTRAS;

const allItems = [...DRINKS.map((d) => ({ ...d, iced: true })), ...MENU.flatMap((s) => s.items)];
$('#menu-sections').addEventListener('click', (e) => {
  const add = e.target.closest('[data-add]');
  if (add) {
    const it = allItems.find((i) => i.name === add.dataset.add);
    cart.add({ kind: 'drink', name: it.name, option: it.iced ? '12 oz · Iced' : 'Regular', price: it.price, color: it.liquid?.top ?? '#8a5a3b', image: it.iced ? drinkImage(it.name).front : undefined });
  }
  const view = e.target.closest('[data-view]');
  if (view) {
    setDrink(DRINKS.findIndex((d) => slug(d.name) === view.dataset.view));
    scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
});
reveal();

/* ---------- Carousel ---------- */

const drinksEl = $('#drinks');
const dotsEl = $('#drink-dots');
let current = DRINKS.findIndex((d) => `#${slug(d.name)}` === location.hash);
if (current < 0) current = 0;
let size = 0;
let fxOn = false;
let lastInteraction = 0;
let product = null;
let fx = null;
let spinKick = 0;

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
  $('#drink-name').style.setProperty('--len', d.name.length); // long names shrink to fit
  $('#drink-index').textContent = String(current + 1).padStart(2, '0');
  $('#drink-desc').textContent = d.desc;
  $('#drink-price').textContent = money(drinkPrice());
  [...dotsEl.children].forEach((b, j) => b.setAttribute('aria-selected', String(j === current)));
  const disc = $('.drink-disc');
  disc.classList.remove('pulse');
  void disc.offsetWidth;
  disc.classList.add('pulse');
  if (!auto) history.replaceState(null, '', `#${slug(d.name)}`);
  if (product) measureSlot(); // the name can change height between one and two lines
  product?.setDrink(d);
  if (fxOn) fx.show(d);
  if (!reduceMotion) spinKick += dir * 0.25;
}

$$('[data-size]', drinksEl).forEach((b) => b.addEventListener('click', () => {
  size = Number(b.dataset.size);
  $$('[data-size]', drinksEl).forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  $('#drink-price').textContent = money(drinkPrice());
  lastInteraction = performance.now();
}));
$('#drink-add').addEventListener('click', () => {
  const d = DRINKS[current];
  lastInteraction = performance.now();
  cart.add({ kind: 'drink', name: d.name, option: `${size ? '16 oz' : '12 oz'} · Iced`, price: drinkPrice(), color: d.liquid.top, image: drinkImage(d.name).front });
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
const spin = createSpin([drinksEl], { onSwipe: (dir) => setDrink(current + dir) });
setDrink(current, { auto: true });

/* ---------- 3D ---------- */

await fontsReady();
const { renderer, scene, camera } = createStage($('#stage'));
product = createProduct();
fx = createIngredientBurst();
product.hot.visible = false;
product.setDrink(DRINKS[current], true);
scene.add(fx.group, product.group);

// On phones the drink name sits above the cup and the controls below it, so
// fit the cup into the gap between them (works for short 9:16 screens too).
let slot = null;
function measureSlot() {
  if (innerWidth >= 760) { slot = null; return; }
  const top = $('#drink-name').getBoundingClientRect().bottom + scrollY - drinksEl.offsetTop;
  const bottom = $('.drinks-bottom').getBoundingClientRect().top + scrollY - drinksEl.offsetTop;
  slot = { center: (top + bottom) / 2, size: Math.max(bottom - top, 120) };
}

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  measureSlot();
}
resize();
addEventListener('resize', resize);

// The iced cup plus a little straw spans about 2.5 units, centred 0.2 above its
// origin; the rest of the straw is allowed to poke up into the drink name.
const CUP_SPAN = 2.5, CUP_CENTER = 0.2;
function layout() {
  const vh = 2 * camera.position.length() * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const vw = vh * camera.aspect;
  if (slot) {
    const s = Math.min(0.85, (slot.size * 0.95 / innerHeight) * vh / CUP_SPAN);
    return { vh, x: 0, y: (0.5 - slot.center / innerHeight) * vh - CUP_CENTER * s, s };
  }
  const fit = Math.min(1, vw / 9);
  return { vh, x: 0, y: -0.35, s: 1.18 * Math.max(fit, 0.75) };
}

const clock = new THREE.Clock();
let scrollP = 0;
let intro = reduceMotion ? 1 : 0;
let cleared = false;

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  const L = layout();
  const target = scrollY / innerHeight;
  scrollP = reduceMotion ? target : lerp(scrollP, target, 1 - Math.exp(-dt * 10));
  const p = scrollP;
  document.body.classList.add('ready');

  if (p > 1.2) {
    if (!cleared) { renderer.clear(); cleared = true; }
    if (fxOn) { fx.hide(); fxOn = false; }
    return;
  }
  cleared = false;

  intro = Math.min(1, intro + dt / 1.4);
  const introK = ease.outBack(intro);
  spin.vel += spinKick;
  spinKick = 0;
  spin.step(dt);
  const bob = reduceMotion ? 0 : Math.sin(t * 1.2) * 0.06;

  product.group.position.set(L.x, L.y + p * L.vh + bob, 0);
  product.group.scale.setScalar(L.s * introK);
  product.group.rotation.x = -spin.sy * 0.12;
  product.group.rotation.z = -spin.sx * 0.06;
  const idle = reduceMotion ? 0 : Math.sin(t * 0.45) * 0.35 + (1 - intro) * -4;
  product.spinner.rotation.y = idle + spin.angle;

  const wantFx = intro > 0.5 && p < 0.55;
  if (wantFx && !fxOn) { fx.show(DRINKS[current]); fxOn = true; }
  if (!wantFx && fxOn) { fx.hide(); fxOn = false; }
  fx.group.position.set(L.x + spin.sx * 0.25, L.y + p * L.vh + spin.sy * 0.15, 0);
  fx.group.scale.setScalar(L.s * 0.8);
  fx.update(dt, reduceMotion ? 0 : t);

  product.update(dt, t);
  renderer.render(scene, camera);
});
