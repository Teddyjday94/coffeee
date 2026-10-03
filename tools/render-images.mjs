// Pre-renders the 3D product shots used on the site, inside headless Chrome:
//   img/drinks/<drink>-front.webp / -angle.webp   (drinks.js)
//   img/bags/<bean>-front.webp / -angle.webp      (bags.js)
//
// Usage: serve the site locally (python -m http.server 5192), then run
//   node tools/render-images.mjs           (both)
//   node tools/render-images.mjs drinks    (just drinks)
//   node tools/render-images.mjs bags      (just bags)
// Re-run it whenever you add or change a drink or a coffee in content.js.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = process.env.SITE ?? 'http://localhost:5192/';
const CHROME = process.env.CHROME ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const which = process.argv[2] ?? 'all';
const PORT = 9335;
const profile = join(tmpdir(), 'ember-oak-render-profile');
rmSync(profile, { recursive: true, force: true });

const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let ws;
for (let i = 0; i < 60 && !ws; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  } catch { await sleep(250); }
}
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  pending.get(msg.id)?.(msg);
  pending.delete(msg.id);
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

await send('Page.enable');
// Any page works as long as it has the three.js import map and the site fonts.
await send('Page.navigate', { url: `${SITE}visit.html?render=${Date.now()}` });
await sleep(3000);

async function run(expression) {
  const res = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (res.result.exceptionDetails) throw new Error(res.result.exceptionDetails.exception?.description);
  return res.result.result.value;
}

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
function save(dir, shots) {
  mkdirSync(join(ROOT, 'img', dir), { recursive: true });
  for (const { name, front, angle } of shots) {
    for (const [view, dataUrl] of [['front', front], ['angle', angle]]) {
      const file = join(ROOT, 'img', dir, `${slug(name)}-${view}.webp`);
      writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
      console.log('wrote', file);
    }
  }
}

const fonts = `await Promise.all(['400 100px Anton', '600 30px Inter', 'italic 500 38px Inter'].map((f) => document.fonts.load(f)));`;

if (which === 'all' || which === 'drinks') {
  save('drinks', await run(`(async () => {
    ${fonts}
    const { renderDrinkImages } = await import('./drinks.js');
    const { DRINKS } = await import('./content.js');
    const map = await renderDrinkImages(DRINKS, { width: 960, height: 1140 });
    return [...map].map(([name, urls]) => ({ name, ...urls }));
  })()`));
}
if (which === 'all' || which === 'bags') {
  save('bags', await run(`(async () => {
    ${fonts}
    const { renderBagImages } = await import('./bags.js');
    const { BEANS } = await import('./content.js');
    const map = await renderBagImages(BEANS, { width: 840, height: 1020 });
    return [...map].map(([name, urls]) => ({ name, ...urls }));
  })()`));
}
ws.close();
chrome.kill();
