// The bag: state (saved to localStorage), the slide-out drawer, and a demo
// pickup checkout. Nothing is sent anywhere and no payment is taken; wire
// placeOrder() up to Square / Toast / Stripe / your POS when you're ready.
import { HOURS, TAX_RATE } from './content.js';

const KEY = 'ember-oak-bag-v1';
const money = (n) => `$${n.toFixed(2)}`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) ?? []; } catch { return []; }
}
function save(items) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* private mode etc. */ }
}

// Pickup slots: "ASAP" plus the next quarter-hours while we're open today.
function pickupSlots(now = new Date()) {
  const today = HOURS.find((h) => h.days.includes(now.getDay()));
  const slots = [];
  if (!today) return slots;
  const t = new Date(now);
  t.setMinutes(Math.ceil((t.getMinutes() + 15) / 15) * 15, 0, 0);
  while (slots.length < 10) {
    const h = t.getHours() + t.getMinutes() / 60;
    if (h >= today.close) break;
    if (h >= today.open) slots.push(new Date(t));
    t.setMinutes(t.getMinutes() + 15);
  }
  return slots;
}
const timeLabel = (d) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

function isOpenNow(now = new Date()) {
  const today = HOURS.find((h) => h.days.includes(now.getDay()));
  const h = now.getHours() + now.getMinutes() / 60;
  return !!today && h >= today.open && h < today.close - 0.25;
}

export function createCart({ countEl, bagBtn, onAdd, onChange }) {
  let items = load();
  let step = 'bag';
  let images = new Map();
  let lastOrder = null;

  const drawer = document.getElementById('drawer');
  const scrim = document.getElementById('scrim');
  const body = document.getElementById('drawer-body');
  const foot = document.getElementById('drawer-foot');
  const title = document.getElementById('drawer-title');

  const count = () => items.reduce((n, i) => n + i.qty, 0);
  const subtotal = () => items.reduce((n, i) => n + i.qty * i.price, 0);

  function commit() {
    save(items);
    countEl.textContent = count();
    render();
    onChange?.(items);
  }

  // Another tab or page changed the bag.
  addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    items = load();
    countEl.textContent = count();
    render();
    onChange?.(items);
  });

  function add(item) {
    const id = `${item.kind}|${item.name}|${item.option}`;
    const existing = items.find((i) => i.id === id);
    if (existing) existing.qty++;
    else items.push({ ...item, id, qty: 1 });
    step = 'bag';
    commit();
    bagBtn.classList.remove('bump');
    void bagBtn.offsetWidth;
    bagBtn.classList.add('bump');
    onAdd?.(item);
  }

  function setQty(id, qty) {
    items = qty <= 0 ? items.filter((i) => i.id !== id) : items.map((i) => (i.id === id ? { ...i, qty } : i));
    commit();
  }

  function thumb(i) {
    if (i.image) return `<img src="${esc(i.image)}" alt="">`;
    const img = i.bean && images.get(i.bean);
    if (img) return `<img src="${img.front}" alt="">`;
    return `<span class="thumb-cup" style="--c:${i.color}"></span>`;
  }

  function renderBag() {
    title.textContent = 'Your bag';
    if (!items.length) {
      body.innerHTML = `
        <div class="empty">
          <p class="empty-title">Your bag is empty</p>
          <p>Grab a drink for pickup or a bag of beans for home.</p>
          <div class="empty-actions">
            <a class="btn" href="menu.html" data-close>Browse drinks</a>
            <a class="btn ghost" href="shop.html" data-close>Shop beans</a>
          </div>
        </div>`;
      foot.innerHTML = '';
      return;
    }
    body.innerHTML = `<ul class="lines">${items.map((i) => `
      <li class="bag-line">
        <div class="thumb">${thumb(i)}</div>
        <div class="bag-line-main">
          <div class="bag-line-row"><strong>${esc(i.name)}</strong><span>${money(i.price * i.qty)}</span></div>
          <p class="bag-line-opt">${esc(i.option)}</p>
          <div class="bag-line-row">
            <div class="stepper" role="group" aria-label="Quantity of ${esc(i.name)}">
              <button type="button" data-qty="${esc(i.id)}" data-d="-1" aria-label="Remove one">−</button>
              <span aria-live="polite">${i.qty}</span>
              <button type="button" data-qty="${esc(i.id)}" data-d="1" aria-label="Add one">+</button>
            </div>
            <button type="button" class="link" data-remove="${esc(i.id)}">Remove</button>
          </div>
        </div>
      </li>`).join('')}</ul>`;
    foot.innerHTML = `
      <div class="sum"><span>Subtotal</span><strong>${money(subtotal())}</strong></div>
      <button type="button" class="btn block" data-step="checkout">Checkout for pickup</button>
      <p class="fine">Taxes calculated at checkout.</p>`;
  }

  function renderCheckout() {
    title.textContent = 'Pickup details';
    const slots = pickupSlots();
    const tax = subtotal() * TAX_RATE;
    body.innerHTML = `
      <form class="checkout" id="checkout-form" novalidate>
        <label>Name for the order
          <input name="name" autocomplete="given-name" required placeholder="Who's picking up?">
        </label>
        <label>Pickup time
          <select name="time">
            ${isOpenNow() ? '<option value="asap">As soon as possible (~10 min)</option>' : ''}
            ${slots.map((s) => `<option value="${s.toISOString()}">${timeLabel(s)}</option>`).join('')}
            ${!slots.length ? '<option value="tomorrow">We\'re closed for today. First thing tomorrow</option>' : ''}
          </select>
        </label>
        <label>Notes for the barista <span class="opt">(optional)</span>
          <textarea name="note" rows="2" placeholder="Extra hot, half sweet…"></textarea>
        </label>
        <ul class="summary">
          ${items.map((i) => `<li><span>${i.qty} × ${esc(i.name)} <em>${esc(i.option)}</em></span><span>${money(i.qty * i.price)}</span></li>`).join('')}
        </ul>
      </form>`;
    foot.innerHTML = `
      <div class="sum small"><span>Subtotal</span><span>${money(subtotal())}</span></div>
      <div class="sum small"><span>Tax</span><span>${money(tax)}</span></div>
      <div class="sum"><span>Total</span><strong>${money(subtotal() + tax)}</strong></div>
      <button type="submit" form="checkout-form" class="btn block">Place pickup order</button>
      <button type="button" class="link center" data-step="bag">← Back to bag</button>
      <p class="fine">Demo checkout: no payment is taken and no order is sent.</p>`;
    body.querySelector('form').addEventListener('submit', placeOrder);
  }

  function placeOrder(e) {
    e.preventDefault();
    const fields = e.currentTarget.elements;
    const name = fields.namedItem('name').value.trim();
    if (!name) {
      fields.namedItem('name').setAttribute('aria-invalid', 'true');
      fields.namedItem('name').focus();
      return;
    }
    const time = fields.namedItem('time').value;
    const ready = time === 'asap' ? new Date(Date.now() + 10 * 60000) : time === 'tomorrow' ? null : new Date(time);
    lastOrder = {
      number: `EO-${Math.floor(1000 + Math.random() * 9000)}`,
      name,
      ready: ready ? timeLabel(ready) : 'tomorrow morning',
      total: subtotal() * (1 + TAX_RATE),
    };
    items = [];
    step = 'done';
    commit();
  }

  function renderDone() {
    title.textContent = 'Order placed';
    body.innerHTML = `
      <div class="done">
        <div class="check" aria-hidden="true">✓</div>
        <p class="eyebrow">Order ${esc(lastOrder.number)}</p>
        <p class="done-title">Thanks, ${esc(lastOrder.name)}!</p>
        <p>We'll have it ready around <strong>${esc(lastOrder.ready)}</strong>. Pay ${money(lastOrder.total)} at the counter.</p>
      </div>`;
    foot.innerHTML = '<button type="button" class="btn block" data-close>Back to the shop</button>';
  }

  function render() {
    if (step === 'checkout' && !items.length) step = 'bag';
    if (step === 'bag') renderBag();
    else if (step === 'checkout') renderCheckout();
    else renderDone();
  }

  let returnFocus = null;
  function open() {
    returnFocus = document.activeElement;
    drawer.classList.add('open');
    scrim.classList.add('open');
    drawer.inert = false;
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('drawer-open');
    render();
    requestAnimationFrame(() => document.getElementById('drawer-close').focus());
  }
  function close() {
    drawer.classList.remove('open');
    scrim.classList.remove('open');
    drawer.inert = true;
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('drawer-open');
    if (step === 'done') step = 'bag';
    returnFocus?.focus?.();
  }

  drawer.addEventListener('click', (e) => {
    const t = e.target.closest('button, a');
    if (!t) return;
    if (t.dataset.qty) {
      const item = items.find((i) => i.id === t.dataset.qty);
      if (item) setQty(item.id, item.qty + Number(t.dataset.d));
    } else if (t.dataset.remove) setQty(t.dataset.remove, 0);
    else if (t.dataset.step) { step = t.dataset.step; render(); }
    else if ('close' in t.dataset) close();
  });
  document.getElementById('drawer-close').addEventListener('click', close);
  scrim.addEventListener('click', close);
  bagBtn.addEventListener('click', open);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('open')) close(); });

  drawer.inert = true;
  countEl.textContent = count();

  return {
    add,
    open,
    items: () => items,
    setImages(map) { images = map; if (drawer.classList.contains('open')) render(); },
  };
}
