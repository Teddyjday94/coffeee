import * as THREE from 'three';
import { createStage, createProduct, createBeanField, ease } from './scene.js';
import { initChrome, $, $$, reduceMotion, money, slug, reveal, countUp, fontsReady, createSpin, getBagImages, hoursFor, fmtHour } from './common.js';
import { DRINKS, BEANS, STORY, LOCATION } from './content.js';

const { smoothstep, lerp, clamp } = THREE.MathUtils;
initChrome('home');

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

$('#stats').innerHTML = STORY.stats.map((s) => `
  <li data-reveal><strong data-to="${s.value}">0</strong><span>${s.label}</span></li>`).join('');
$$('#stats li').forEach((li) => li.addEventListener('reveal', () => {
  const n = $('strong', li);
  countUp(n, Number(n.dataset.to));
}));

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

/* ---------- Featured drinks + beans ---------- */

const FEATURED_DRINKS = ['Caramel Cloud', 'Mocha Midnight', 'Matcha Meadow'];
$('#featured-drinks').innerHTML = FEATURED_DRINKS.map((n) => DRINKS.find((d) => d.name === n)).map((d, i) => `
  <li data-reveal style="--bg:${d.bg};--ink:${d.ink};--top:${d.liquid.top};--bottom:${d.liquid.bottom};transition-delay:${i * 80}ms">
    <a href="menu.html#${slug(d.name)}" class="drink-card">
      <span class="mini-cup" aria-hidden="true"><i></i></span>
      <span class="drink-card-name">${d.name}</span>
      <span class="drink-card-desc">${d.desc}</span>
      <span class="drink-card-price">${money(d.price)}</span>
    </a>
  </li>`).join('');

const featuredBeans = BEANS.filter((b) => b.featured).sort((a, b) => a.featured - b.featured).slice(0, 3);
$('#featured-beans').innerHTML = featuredBeans.map((b, i) => `
  <li data-reveal style="--hue:${b.hue};transition-delay:${i * 80}ms">
    <a href="shop.html#${slug(b.name)}" class="bean-tile">
      <span class="bean-tile-visual"><span class="bag-slot" data-bag="${b.name}"><span class="bag-skeleton"></span></span></span>
      <span class="bean-tile-row"><strong>${b.name}</strong><span>$${b.price}</span></span>
      <span class="bean-tile-notes">${b.origin} · ${b.notes}</span>
    </a>
  </li>`).join('');

/* ---------- Visit strip ---------- */

$('#strip-address').innerHTML = `${LOCATION.street}<br>${LOCATION.city}`;
const today = hoursFor(new Date().getDay());
$('#strip-today').textContent = today ? `Today: ${fmtHour(today.open)} – ${fmtHour(today.close)}` : 'Closed today';

reveal();

/* ---------- 3D hero ---------- */

await fontsReady();
const { renderer, scene, camera } = createStage($('#stage'));
const product = createProduct();
const beans = createBeanField(reduceMotion ? 18 : 34);
product.iced.visible = false;
scene.add(beans.group, product.group);
const spin = createSpin([$('.hero')]);

// On phones, fit the cup into the space between the hero buttons and the tab bar.
let slot = null;
function measureSlot() {
  if (innerWidth >= 760) { slot = null; return; }
  const top = $('.hero .actions').getBoundingClientRect().bottom + scrollY + 12;
  const bottom = ($('.tabbar')?.getBoundingClientRect().top ?? innerHeight) - 8;
  slot = { center: (top + bottom) / 2, size: Math.max(bottom - top, 140) };
}

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  measureSlot();
}
resize();
addEventListener('resize', resize);

// The to-go cup, lid included, spans about 2.3 units, centred 0.09 above its origin.
const CUP_SPAN = 2.3, CUP_CENTER = 0.09;
function layout() {
  const vh = 2 * camera.position.length() * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const vw = vh * camera.aspect;
  if (slot) {
    const s = Math.max(0.42, Math.min(0.8, (slot.size * 0.9 / innerHeight) * vh / CUP_SPAN));
    return { vh, x: 0, y: (0.5 - slot.center / innerHeight) * vh - CUP_CENTER * s, s };
  }
  const fit = Math.min(1, vw / 9);
  return { vh, x: vw * 0.17, y: -0.2, s: 1.4 * Math.max(fit, 0.75) };
}

const clock = new THREE.Clock();
let scrollP = 0;
let intro = reduceMotion ? 1 : 0;
let cleared = false;
let bagsRequested = false;

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  const L = layout();
  const target = scrollY / innerHeight;
  scrollP = reduceMotion ? target : lerp(scrollP, target, 1 - Math.exp(-dt * 10));
  const p = scrollP;

  document.body.classList.add('ready');
  if (!bagsRequested) {
    bagsRequested = true;
    // Give the intro a head start, then bake the bag images for the featured row.
    setTimeout(() => getBagImages(featuredBeans.map((b) => b.name)).then((map) => {
      $$('#featured-beans .bag-slot').forEach((slot) => {
        const urls = map.get(slot.dataset.bag);
        if (urls) slot.innerHTML = `<img class="bag-img front" src="${urls.front}" alt="12 oz bag of ${slot.dataset.bag}"><img class="bag-img angle" src="${urls.angle}" alt="" aria-hidden="true">`;
      });
    }), 700);
  }

  if (p > 1.2) {
    if (!cleared) { renderer.clear(); cleared = true; }
    return;
  }
  cleared = false;

  intro = Math.min(1, intro + dt / 1.6);
  const introK = ease.outBack(intro);
  spin.step(dt);
  const bob = reduceMotion ? 0 : Math.sin(t * 1.2) * 0.06;

  product.group.position.set(L.x, L.y + p * L.vh + bob, 0);
  product.group.scale.setScalar(L.s * introK);
  product.group.rotation.x = -spin.sy * 0.12;
  product.group.rotation.z = -spin.sx * 0.06;
  const idle = reduceMotion ? 0 : Math.sin(t * 0.45) * 0.35 + (1 - intro) * -3;
  product.spinner.rotation.y = idle + spin.angle;

  beans.update(reduceMotion ? 0 : t, (1 - smoothstep(p, 0.3, 0.9)) * introK);
  beans.group.position.set(spin.sx * 0.35, p * L.vh * 1.4 + spin.sy * 0.2, 0);

  renderer.render(scene, camera);
});
