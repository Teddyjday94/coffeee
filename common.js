// Shared by every page: nav, footer, bag drawer, toast, scroll reveals,
// opening-hours helpers and a cache for the rendered bean-bag images.
import { createCart } from './cart.js';
import { BEANS, HOURS, LOCATION } from './content.js';

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const money = (n) => `$${n.toFixed(2)}`;
export const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
export const ease = { out: (t) => 1 - Math.pow(1 - t, 3) };

const PAGES = [
  { id: 'menu', href: 'menu.html', label: 'Menu' },
  { id: 'shop', href: 'shop.html', label: 'Shop' },
  { id: 'visit', href: 'visit.html', label: 'Visit' },
];

/* ---------- Opening hours ---------- */

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const fmtHour = (h) => {
  const hr = Math.floor(h) % 12 || 12;
  const min = Math.round((h % 1) * 60);
  return `${hr}${min ? `:${String(min).padStart(2, '0')}` : ''}${h < 12 ? 'am' : 'pm'}`;
};
export const hoursFor = (day) => HOURS.find((x) => x.days.includes(day));

export function openStatus(now = new Date()) {
  const day = now.getDay();
  const h = now.getHours() + now.getMinutes() / 60;
  const today = hoursFor(day);
  if (today && h >= today.open && h < today.close) return { open: true, text: `Open now · until ${fmtHour(today.close)}` };
  if (today && h < today.open) return { open: false, text: `Closed · opens ${fmtHour(today.open)} today` };
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    const next = hoursFor(d);
    if (next) return { open: false, text: `Closed · opens ${fmtHour(next.open)} ${i === 1 ? 'tomorrow' : DAY_NAMES[d]}` };
  }
  return { open: false, text: 'Closed' };
}

export function weekHours() {
  // Monday-first list of every day for the full hours table.
  return [1, 2, 3, 4, 5, 6, 0].map((d) => ({ day: d, name: DAY_NAMES[d], hours: hoursFor(d) }));
}

export const directionsURL = () =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${LOCATION.street}, ${LOCATION.city}`)}`;
export const telURL = () => `tel:${LOCATION.phone.replace(/[^\d+]/g, '')}`;

/* ---------- Bag images (rendered once per page, on demand) ---------- */

const bagCache = new Map();
let bagQueue = Promise.resolve();

// Renders in the order `names` lists them; onEach fires as each bag is ready.
export function getBagImages(names = BEANS.map((b) => b.name), onEach) {
  bagQueue = bagQueue.then(async () => {
    const missing = names.map((n) => BEANS.find((b) => b.name === n)).filter((b) => b && !bagCache.has(b.name));
    if (missing.length) {
      const { renderBagImages } = await import('./bags.js');
      await renderBagImages(missing, {
        onEach: (name, urls) => { bagCache.set(name, urls); onEach?.(name, urls); },
      });
    }
    return bagCache;
  }).catch((err) => { console.warn('Bag renders failed', err); return bagCache; });
  return bagQueue;
}

/* ---------- Chrome: nav, footer, drawer, toast ---------- */

function navHTML(page) {
  const link = (p) => `<a href="${p.href}"${p.id === page ? ' aria-current="page"' : ''}>${p.label}</a>`;
  return `
    <header class="nav">
      <nav class="nav-links" aria-label="Primary">${PAGES.slice(0, 2).map(link).join('')}</nav>
      <a class="logo" href="index.html" aria-label="Ember &amp; Oak home"${page === 'home' ? ' aria-current="page"' : ''}><span>Ember</span><span>&amp; Oak</span></a>
      <div class="nav-actions">
        <nav class="nav-links" aria-label="Secondary">${link(PAGES[2])}</nav>
        <button type="button" class="bag-btn" id="bag-btn" aria-haspopup="dialog">Bag (<span id="bag-count">0</span>)</button>
        <button type="button" class="menu-btn" id="menu-btn" aria-expanded="false" aria-controls="mobile-nav">Menu</button>
      </div>
    </header>
    <div class="mobile-nav" id="mobile-nav" inert>
      <nav aria-label="Mobile">
        <a href="index.html"${page === 'home' ? ' aria-current="page"' : ''}>Home</a>
        ${PAGES.map(link).join('')}
      </nav>
      <p class="mobile-status" data-open-status></p>
    </div>`;
}

function footerHTML() {
  return `
    <footer class="site-footer">
      <div class="footer-grid">
        <div>
          <p class="footer-brand">Ember &amp; Oak</p>
          <p class="footer-blurb">Small-batch coffee roasters. Roasted Tuesday, poured daily, since 2019.</p>
        </div>
        <div>
          <p class="footer-h">Explore</p>
          <a href="index.html">Home</a>${PAGES.map((p) => `<a href="${p.href}">${p.label}</a>`).join('')}
        </div>
        <div>
          <p class="footer-h">Find us</p>
          <p>${LOCATION.street}<br>${LOCATION.city}</p>
          <p data-open-status></p>
        </div>
        <div>
          <p class="footer-h">Follow</p>
          <a href="#">Instagram</a><a href="#">TikTok</a><a href="#">Newsletter</a>
        </div>
      </div>
      <p class="wordmark" aria-hidden="true">Ember &amp; Oak</p>
      <div class="footer-base">
        <span>© ${new Date().getFullYear()} Ember &amp; Oak Coffee Roasters</span>
        <span>Placeholder content · Demo checkout</span>
      </div>
    </footer>`;
}

const drawerHTML = `
  <div class="scrim" id="scrim"></div>
  <aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" aria-hidden="true">
    <header class="drawer-head">
      <h2 id="drawer-title">Your bag</h2>
      <button type="button" class="icon-btn" id="drawer-close" aria-label="Close bag">×</button>
    </header>
    <div class="drawer-body" id="drawer-body"></div>
    <footer class="drawer-foot" id="drawer-foot"></footer>
  </aside>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>`;

let toastTimer;
export function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

const revealer = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add('in');
    e.target.dispatchEvent(new Event('reveal'));
    revealer.unobserve(e.target);
  }
}, { threshold: 0.12 });
export const reveal = (root = document) => {
  const els = root.matches?.('[data-reveal]') ? [root] : $$('[data-reveal]:not(.in)', root);
  els.forEach((el) => revealer.observe(el));
};

export function countUp(el, to) {
  if (reduceMotion) { el.textContent = to.toLocaleString(); return; }
  const start = performance.now();
  const tick = (now) => {
    const k = Math.min((now - start) / 1400, 1);
    el.textContent = Math.round(to * ease.out(k)).toLocaleString();
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function renderStatus() {
  const s = openStatus();
  $$('[data-open-status]').forEach((el) => {
    el.textContent = s.text;
    el.classList.add('status');
    el.classList.toggle('is-open', s.open);
  });
}

export function initChrome(page) {
  document.body.insertAdjacentHTML('afterbegin', navHTML(page));
  $('main').insertAdjacentHTML('afterend', footerHTML());
  document.body.insertAdjacentHTML('beforeend', drawerHTML);

  // Mobile menu
  const menuBtn = $('#menu-btn');
  const mobileNav = $('#mobile-nav');
  const setMenu = (open) => {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Close' : 'Menu';
    mobileNav.classList.toggle('open', open);
    mobileNav.inert = !open;
    document.body.classList.toggle('menu-open', open);
  };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // Bag, with bag-image thumbnails for any beans in it
  const syncThumbs = (items) => {
    const names = [...new Set(items.filter((i) => i.bean).map((i) => i.bean))];
    if (names.length) getBagImages(names).then((map) => cart.setImages(map));
  };
  const cart = createCart({
    countEl: $('#bag-count'),
    bagBtn: $('#bag-btn'),
    onAdd: (item) => toast(`${item.name} added to your bag`),
    onChange: syncThumbs,
  });
  $('#bag-btn').addEventListener('click', () => syncThumbs(cart.items()), { once: true });

  renderStatus();
  setInterval(renderStatus, 60000);
  reveal();

  return { cart };
}

/* ---------- 3D page helpers ---------- */

export async function fontsReady(fonts = ['400 100px Anton', '600 30px Inter', 'italic 500 38px Inter']) {
  await Promise.race([
    Promise.all(fonts.map((f) => document.fonts.load(f))),
    new Promise((r) => setTimeout(r, 2500)),
  ]).catch(() => {});
}

// Pointer position (for tilt) and drag-to-spin on the given elements.
export function createSpin(elements, { onSwipe } = {}) {
  const state = { x: 0, y: 0, sx: 0, sy: 0, angle: 0, vel: 0, drag: null };
  addEventListener('pointermove', (e) => {
    state.x = (e.clientX / innerWidth) * 2 - 1;
    state.y = -((e.clientY / innerHeight) * 2 - 1);
    if (!state.drag) return;
    const dx = e.clientX - state.drag.x;
    state.drag.x = e.clientX;
    state.drag.total += dx;
    state.angle += dx * 0.012;
    state.vel = dx * 0.012;
  });
  for (const el of elements) {
    el.addEventListener('pointerdown', (e) => {
      if (e.target.closest('a, button, select, input')) return;
      state.drag = { x: e.clientX, total: 0, t: performance.now() };
    });
  }
  addEventListener('pointerup', () => {
    const d = state.drag;
    state.drag = null;
    if (d && Math.abs(d.total) > 90 && performance.now() - d.t < 600) onSwipe?.(d.total < 0 ? 1 : -1);
  });
  state.step = (dt) => {
    const k = 1 - Math.exp(-dt * 4);
    state.sx += (state.x - state.sx) * k;
    state.sy += (state.y - state.sy) * k;
    if (!state.drag) {
      state.angle += state.vel;
      state.vel *= Math.pow(0.04, dt);
    }
  };
  return state;
}
