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

| File | What it does |
| --- | --- |
| `content.js` | All copy and data: drinks, beans, hours, address, story. Edit this to rebrand. |
| `scene.js` | Three.js scene: the hot and iced cups, toppings, floating beans, ingredient bursts. |
| `bags.js` | Models a stand-up coffee pouch and renders one product image per bean. |
| `cart.js` | Bag drawer, quantities, pickup checkout (saved to localStorage). |
| `main.js` | Scroll choreography, carousel, shop, story and visit wiring. |
| `style.css` | All styles. |

## Before going live

- Replace the placeholder name, address, phone, prices and story in `content.js`.
- Checkout is a demo: no payment is taken and nothing is sent. Connect `placeOrder()` in `cart.js` to Square, Toast, Stripe or your POS.
- The map is an illustration; swap in a real map embed once the address is real.

## Deploy

Any static host works (Vercel, Netlify, GitHub Pages). On Vercel, import the repo with the default static settings; no build command is needed.
