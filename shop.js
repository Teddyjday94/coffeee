import { initChrome, $, $$, reduceMotion, money, slug, reveal, getBagImages } from './common.js';
import { BEANS, GRINDS, BAG_SIZES, SUBSCRIPTION, BREW_GUIDE } from './content.js';

const { cart } = initChrome('shop');
const ROAST = ['Light', 'Light', 'Light-medium', 'Medium', 'Medium-dark', 'Dark'];
const sizePrice = (b, s) => Math.round(b.price * BAG_SIZES[s].mult);
let images = null;
let filter = 'all';
let sort = 'featured';

/* ---------- Grid ---------- */

const grid = $('#bean-grid');

function bagMarkup(name) {
  const urls = images?.get(name);
  return urls
    ? `<img class="bag-img front" src="${urls.front}" alt="12 oz bag of ${name}"><img class="bag-img angle" src="${urls.angle}" alt="" aria-hidden="true">`
    : '<span class="bag-skeleton"></span>';
}

function fillImages(root = document) {
  if (!images) return;
  $$('.bag-slot:not(.ready)', root).forEach((slot) => {
    if (!images.get(slot.dataset.bag)) return;
    slot.innerHTML = bagMarkup(slot.dataset.bag);
    slot.classList.add('ready');
  });
}

function sorted(list) {
  const by = {
    featured: (a, b) => (a.featured ?? 99) - (b.featured ?? 99),
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    'roast-asc': (a, b) => a.roast - b.roast,
    'roast-desc': (a, b) => b.roast - a.roast,
  }[sort];
  return [...list].sort(by);
}

function renderGrid() {
  const list = sorted(BEANS.filter((b) => filter === 'all' || b.type === filter));
  $('#result-count').textContent = `${list.length} coffee${list.length === 1 ? '' : 's'}`;
  grid.innerHTML = list.map((b) => {
    const i = BEANS.indexOf(b);
    return `
    <li class="card" style="--hue:${b.hue}" data-reveal>
      <button type="button" class="card-visual" data-open="${i}" aria-label="View details for ${b.name}">
        ${b.badge ? `<span class="badge">${b.badge}</span>` : ''}
        <span class="roast-chip">${ROAST[b.roast]} roast</span>
        <span class="bag-slot" data-bag="${b.name}">${bagMarkup(b.name)}</span>
      </button>
      <div class="card-body">
        <div class="card-row"><h3><button type="button" class="card-title" data-open="${i}">${b.name}</button></h3><span class="price">$${b.price}</span></div>
        <p class="origin">${b.origin} · ${b.process}</p>
        <p class="notes">${b.notes}</p>
        <div class="buy">
          <label class="sr-only" for="grind-${i}">Grind for ${b.name}</label>
          <select id="grind-${i}">${GRINDS.map((g) => `<option>${g}</option>`).join('')}</select>
          <button type="button" class="add" data-add="${i}">Add</button>
        </div>
      </div>
    </li>`;
  }).join('');
  $$('[data-reveal]', grid).forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 70}ms`; });
  $$('.bag-slot', grid).forEach((s) => { if (images?.get(s.dataset.bag)) s.classList.add('ready'); });
  reveal(grid);
}

function addBean(b, { size = 0, grind = GRINDS[0], qty = 1 } = {}) {
  for (let n = 0; n < qty; n++) {
    cart.add({ kind: 'beans', bean: b.name, name: b.name, option: `${BAG_SIZES[size].label} · ${grind}`, price: sizePrice(b, size), color: `hsl(${b.hue},42%,32%)` });
  }
}

grid.addEventListener('click', (e) => {
  const open = e.target.closest('[data-open]');
  if (open) return openProduct(BEANS[Number(open.dataset.open)]);
  const add = e.target.closest('[data-add]');
  if (add) addBean(BEANS[Number(add.dataset.add)], { grind: $('select', add.closest('.buy')).value });
});
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

$$('.chip').forEach((chip) => chip.addEventListener('click', () => {
  $$('.chip').forEach((c) => c.classList.toggle('active', c === chip));
  filter = chip.dataset.filter;
  renderGrid();
}));
$('#sort').addEventListener('change', (e) => { sort = e.target.value; renderGrid(); });

/* ---------- Product dialog ---------- */

const dialog = $('#product');
let productBean = null;

function roastMeter(r) {
  return `<span class="roast-meter" aria-label="Roast level ${r} of 5">${[1, 2, 3, 4, 5].map((n) => `<i class="${n <= r ? 'on' : ''}"></i>`).join('')}</span>`;
}

function openProduct(b) {
  productBean = b;
  dialog.style.setProperty('--hue', b.hue);
  $('#product-visual').querySelector('.bag-slot')?.remove();
  $('#product-visual').insertAdjacentHTML('afterbegin', `<span class="bag-slot" data-bag="${b.name}">${bagMarkup(b.name)}</span>`);
  setView('front');
  $('#product-info').innerHTML = `
    <p class="eyebrow">${b.origin}${b.badge ? ` · ${b.badge}` : ''}</p>
    <h2 id="product-name">${b.name}</h2>
    <p class="product-notes">${b.notes}</p>
    <p class="product-blurb">${b.blurb}</p>
    <dl class="specs">
      <div><dt>Process</dt><dd>${b.process}</dd></div>
      <div><dt>Altitude</dt><dd>${b.altitude}</dd></div>
      <div><dt>Roast</dt><dd>${roastMeter(b.roast)} ${ROAST[b.roast]}</dd></div>
    </dl>
    <form class="product-form" id="product-form">
      <fieldset class="seg">
        <legend>Size</legend>
        ${BAG_SIZES.map((s, i) => `<label><input type="radio" name="size" value="${i}"${i === 0 ? ' checked' : ''}><span>${s.label} · $${sizePrice(b, i)}</span></label>`).join('')}
      </fieldset>
      <label class="field">Grind
        <select name="grind">${GRINDS.map((g) => `<option>${g}</option>`).join('')}</select>
      </label>
      <div class="product-buy">
        <div class="stepper" role="group" aria-label="Quantity">
          <button type="button" data-q="-1" aria-label="Fewer">−</button>
          <span id="pq">1</span>
          <button type="button" data-q="1" aria-label="More">+</button>
        </div>
        <button type="submit" class="btn" id="product-add">Add to bag · $${sizePrice(b, 0)}</button>
      </div>
    </form>`;
  const form = $('#product-form');
  let qty = 1;
  const update = () => {
    const s = Number(new FormData(form).get('size'));
    $('#pq').textContent = qty;
    $('#product-add').textContent = `Add to bag · $${sizePrice(b, s) * qty}`;
  };
  form.addEventListener('change', update);
  form.addEventListener('click', (e) => {
    const q = e.target.closest('[data-q]');
    if (!q) return;
    qty = Math.max(1, Math.min(9, qty + Number(q.dataset.q)));
    update();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    addBean(b, { size: Number(data.get('size')), grind: data.get('grind'), qty });
    dialog.close();
  });
  history.replaceState(null, '', `#${slug(b.name)}`);
  dialog.showModal();
}

function setView(view) {
  dialog.dataset.view = view;
  $$('[data-view]', dialog).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
}
$$('[data-view]', dialog).forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
$('#product-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); }); // backdrop
dialog.addEventListener('close', () => { history.replaceState(null, '', location.pathname); productBean = null; });

/* ---------- Subscription ---------- */

const subBean = $('#sub-bean');
subBean.innerHTML = BEANS.map((b, i) => `<option value="${i}">${b.name} · ${b.origin}</option>`).join('');
$('#sub-freq').innerHTML = SUBSCRIPTION.frequencies.map((f) => `<option>${f}</option>`).join('');
$('#sub-grind').innerHTML = GRINDS.map((g) => `<option>${g}</option>`).join('');

function updateSub() {
  const b = BEANS[Number(subBean.value)];
  const price = b.price * (1 - SUBSCRIPTION.discount);
  $('#sub-price').innerHTML = `<s>$${b.price}</s> <strong>${money(price)}</strong> <span>per 12 oz bag, shipping included</span>`;
  const visual = $('#sub-visual');
  visual.style.setProperty('--hue', b.hue);
  visual.innerHTML = `<span class="bag-slot" data-bag="${b.name}">${bagMarkup(b.name)}</span>`;
}
subBean.addEventListener('change', updateSub);
$('#sub-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(e.currentTarget);
  const b = BEANS[Number(data.get('bean'))];
  cart.add({
    kind: 'sub', bean: b.name, name: `${b.name} subscription`,
    option: `${data.get('freq')} · ${data.get('grind')} · first bag`, price: +(b.price * (1 - SUBSCRIPTION.discount)).toFixed(2),
  });
});
updateSub();

/* ---------- Brew guide ---------- */

const GRIND_STEPS = ['Fine', 'Fine-medium', 'Medium', 'Medium', 'Coarse', 'Extra coarse'];
$('#guides').innerHTML = BREW_GUIDE.map((g, i) => `
  <li data-reveal style="transition-delay:${i * 80}ms">
    <h3>${g.method}</h3>
    <dl>
      <div><dt>Ratio</dt><dd>${g.ratio}</dd></div>
      <div><dt>Time</dt><dd>${g.time}</dd></div>
      <div><dt>Water</dt><dd>${g.temp}</dd></div>
    </dl>
    <div class="grind-scale" aria-label="Grind: ${GRIND_STEPS[g.grind]}">
      <span>Grind</span>
      <div class="scale"><i style="left:${(g.grind / 5) * 100}%"></i></div>
      <span class="scale-ends"><em>Fine</em><em>Coarse</em></span>
    </div>
    <p>${g.tip}</p>
  </li>`).join('');

/* ---------- Boot ---------- */

renderGrid();
reveal();
const openFromHash = () => {
  const b = BEANS.find((x) => `#${slug(x.name)}` === location.hash);
  if (b && !dialog.open) openProduct(b);
};
openFromHash();
addEventListener('hashchange', openFromHash);

// Render the bag in an open dialog first, then the grid in display order.
const priority = [
  ...(dialog.open && productBean ? [productBean.name] : []),
  ...$$('#bean-grid .bag-slot').map((s) => s.dataset.bag),
];
getBagImages([...new Set(priority)], (name, urls) => {
  images ??= new Map();
  images.set(name, urls);
  fillImages();
  if (BEANS[Number(subBean.value)].name === name) updateSub();
}).then((map) => {
  images = map;
  fillImages();
  updateSub();
  cart.setImages(map);
});
