// Renders the 3D iced drinks to static images in img/drinks/ (front + angle
// view per drink), using drinks.js inside headless Chrome.
//
// Usage: serve the site locally (python -m http.server 5192), then run
//   node tools/render-drinks.mjs
// Re-run it whenever you change a drink's colours, toppings or ingredients.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'img', 'drinks');
const SITE = process.env.SITE ?? 'http://localhost:5192/';
const CHROME = process.env.CHROME ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9335;
const profile = join(tmpdir(), 'ember-oak-render-profile');
rmSync(profile, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

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
// Any page works as long as it has the three.js import map; the visit page is the lightest.
await send('Page.navigate', { url: `${SITE}visit.html?render=${Date.now()}` });
await sleep(3000);

const res = await send('Runtime.evaluate', {
  awaitPromise: true,
  returnByValue: true,
  expression: `(async () => {
    await document.fonts.ready;
    const { renderDrinkImages } = await import('./drinks.js');
    const { DRINKS } = await import('./content.js');
    const map = await renderDrinkImages(DRINKS, { width: 960, height: 1140 });
    return [...map].map(([name, urls]) => ({ name, ...urls }));
  })()`,
});
if (res.result.exceptionDetails) throw new Error(res.result.exceptionDetails.exception?.description);

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
for (const { name, front, angle } of res.result.result.value) {
  for (const [view, dataUrl] of [['front', front], ['angle', angle]]) {
    const file = join(OUT, `${slug(name)}-${view}.webp`);
    writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
    console.log('wrote', file);
  }
}
ws.close();
chrome.kill();
