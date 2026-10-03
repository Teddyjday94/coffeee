# Ember & Oak Coffee

An interactive 3D coffee shop site. A to-go cup floats among coffee beans in the hero, spins into an iced drink as you scroll, and leads into a colour-shifting drinks carousel, a story section, a shop of 3D-rendered bean bags, and a visit page with live open/closed status.

Plain HTML, CSS and JavaScript with [three.js](https://threejs.org) loaded from a CDN, so there is no install or build step. All 3D models are generated in code; there are no model or image files.

## Run it locally

ES modules need to be served over HTTP (opening `index.html` directly won't work):

```bash
python -m http.server 5192
```

Then open http://localhost:5192.

## Files

Four pages, each with its own script:

| Page | Script | What's on it |
| --- | --- | --- |
| `index.html` | `home.js` | 3D hero cup with floating beans, story, featured drinks and beans, visit strip |
| `menu.html` | `menu.js` | 3D iced-drink carousel, then the full menu with add-to-order |
| `shop.html` | `shop.js` | Bean grid with filters and sorting, product dialog, subscriptions, brew guide |
| `visit.html` | `visit.js` | Map, live open status, weekly hours, amenities, getting here, FAQ, contact form |

Shared modules:

| File | What it does |
| --- | --- |
| `content.js` | All copy and data: drinks, menu, beans, hours, address, story, FAQ. Edit this to rebrand. |
| `common.js` | Nav, mobile menu, footer, toast, scroll reveals, hours helpers, bag-image cache. |
| `cart.js` | Bag drawer, quantities, pickup checkout. Saved to localStorage so it follows you across pages. |
| `scene.js` | Three.js scene: the hot and iced cups, toppings, floating beans, ingredient bursts. |
| `bags.js` | Models a stand-up coffee pouch and renders product images for each bean. |
| `style.css` | All styles. |

The drink photos on the home page (`img/drinks/*.webp`) are renders of the 3D drinks, made by `drinks.js`. If you change a drink in `content.js`, serve the site locally and run `node tools/render-drinks.mjs` to re-render them.

Deep links work: `menu.html#mocha-midnight` opens that drink in the carousel, and `shop.html#gesha-reserve` opens that coffee's detail dialog.

## Before going live

- Replace the placeholder name, address, phone, prices and story in `content.js`.
- Checkout is a demo: no payment is taken and nothing is sent. Connect `placeOrder()` in `cart.js` to Square, Toast, Stripe or your POS.
- The map is an illustration; swap in a real map embed once the address is real.

## Deploy

Any static host works (Vercel, Netlify, GitHub Pages). On Vercel, import the repo with the default static settings; no build command is needed.
