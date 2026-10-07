// Renders a realistic stand-up coffee pouch for every bean, once, into PNG
// images (a front view and a three-quarter view) used by the shop cards.
// Rendering to images keeps the shop to a single extra WebGL context that is
// thrown away afterwards, instead of a live 3D canvas per card.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { canvasTexture, shadowTexture } from './scene.js';
import { bagArt } from './product-art.mjs';

const W = 1.0, H = 1.45, D = 0.42;
const { smoothstep } = THREE.MathUtils;

// light: true papers get a brighter label so it doesn't look muddy.
const PAPER = {
  kraft: { base: '#c39a6b', ink: '#2a170d', roughness: 0.92, speckle: 0.5 },
  black: { base: '#1f1b1a', ink: '#efe6da', roughness: 0.7, speckle: 0.25 },
  white: { base: '#ece6db', ink: '#2a170d', roughness: 0.78, speckle: 0.3, light: true },
  forest: { base: '#24412f', ink: '#f1e8d6', roughness: 0.75, speckle: 0.25 },
  navy: { base: '#1d2840', ink: '#efe6da', roughness: 0.72, speckle: 0.25 },
  blush: { base: '#d99c94', ink: '#3a1a18', roughness: 0.8, speckle: 0.3, light: true },
};
const isDark = (kind) => !PAPER[kind].light && kind !== 'kraft'; // dark bags get a dark valve

/* ---------- Geometry ---------- */

// Depth of the pouch at a point on its face: pillowed across the width,
// pinched flat into the heat seal at the top, gusseted out at the bottom.
function depthAt(u, v) {
  const across = Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(u), 3)));
  const top = 1 - smoothstep(v, 0.3, 1.0) * 0.93;
  const bottom = 1 + 0.12 * smoothstep(-v, 0.4, 1.0);
  return (D / 2) * top * (0.22 + 0.78 * across) * bottom;
}

function pouchGeometry() {
  const g = new THREE.BoxGeometry(W, H, D, 32, 44, 12);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const u = x / (W / 2), v = y / (H / 2), t = z / (D / 2);
    z = t * depthAt(u, v);
    x *= 1 + 0.025 * Math.cos(v * Math.PI / 2); // sides belly out a touch
    // soft paper wrinkles, strongest on the faces
    const wr = 0.005 * Math.sin(x * 23 + y * 7) * Math.sin(y * 17 - x * 5) + 0.003 * Math.sin(x * 51 - y * 33);
    z += wr * t;
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}

/* ---------- Textures ---------- */

let noiseTile;
function getNoiseTile() {
  if (noiseTile) return noiseTile;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = n;
    img.data[i + 3] = 40;
  }
  ctx.putImageData(img, 0, 0);
  noiseTile = c;
  return c;
}

function paper(ctx, w, h, kind) {
  const p = PAPER[kind];
  ctx.fillStyle = p.base;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = p.speckle;
  ctx.fillStyle = ctx.createPattern(getNoiseTile(), 'repeat');
  ctx.fillRect(0, 0, w, h);
  // fibres
  ctx.globalAlpha = 1;
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * w, y = Math.random() * h, l = 4 + Math.random() * 14, a = Math.random() * Math.PI;
    ctx.strokeStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1 + Math.random();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }
}

function fitText(ctx, text, maxW, size, weightFamily) {
  let s = size;
  do { ctx.font = `${weightFamily.replace('{s}', s)}`; s -= 4; } while (ctx.measureText(text).width > maxW && s > 20);
}

function wrapLines(ctx, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function drawPattern(ctx, art, x, y, w, h, ink) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 18);
  ctx.clip();
  ctx.translate(x, y);
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = 4;
  ctx.globalAlpha = 0.12;

  if (art.pattern === 'orbit') {
    for (let r = 90; r < 520; r += 74) {
      ctx.beginPath();
      ctx.ellipse(w * 0.78, h * 0.18, r, r * 0.58, -0.35, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (art.pattern === 'night') {
    for (let i = 0; i < 54; i++) {
      const px = (i * 137) % w, py = (i * 83) % h;
      ctx.beginPath();
      ctx.arc(px, py, i % 7 === 0 ? 5 : 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(w * 0.82, h * 0.18, 150, 0.45, Math.PI * 1.65);
    ctx.stroke();
  } else if (art.pattern === 'botanical') {
    for (let branch = 0; branch < 5; branch++) {
      const bx = 70 + branch * 175;
      ctx.beginPath();
      ctx.moveTo(bx, h + 30);
      ctx.bezierCurveTo(bx - 80, h * 0.66, bx + 120, h * 0.42, bx + 20, -40);
      ctx.stroke();
      for (let n = 0; n < 7; n++) {
        const py = h - 80 - n * 105;
        ctx.beginPath();
        ctx.ellipse(bx + (n % 2 ? 38 : -38), py, 42, 16, n % 2 ? -0.55 : 0.55, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  } else if (art.pattern === 'mosaic') {
    for (let i = -h; i < w + h; i += 92) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i - h, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + h, h); ctx.stroke();
    }
  } else if (art.pattern === 'sunburst') {
    const cx = w * 0.78, cy = h * 0.2;
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 50, cy + Math.sin(a) * 50);
      ctx.lineTo(cx + Math.cos(a) * 410, cy + Math.sin(a) * 410);
      ctx.stroke();
    }
  } else {
    for (let row = -30; row < h + 100; row += 82) {
      ctx.beginPath();
      for (let px = -40; px <= w + 40; px += 20) {
        const py = row + Math.sin(px * 0.018 + row * 0.01) * 28;
        if (px === -40) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

function frontTexture(bean) {
  const kind = bean.paper;
  const art = bagArt(bean);
  return canvasTexture(1024, 1485, (ctx, w, h) => {
    paper(ctx, w, h, kind);
    const ink = PAPER[kind].ink;
    const cx = w / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // A vertical color key makes each origin recognizable from across a shelf.
    ctx.fillStyle = art.accent;
    ctx.fillRect(54, 118, 16, 1248);

    // Brand crest and wordmark.
    ctx.strokeStyle = ink;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, 152, 58, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.font = '400 42px Anton, Impact, sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText('E&O', cx, 154);
    ctx.font = '400 54px Anton, Impact, sans-serif';
    ctx.letterSpacing = '7px';
    ctx.fillText('EMBER & OAK', cx, 246);
    ctx.font = '600 19px Inter, sans-serif';
    ctx.letterSpacing = '8px';
    ctx.globalAlpha = 0.72;
    ctx.fillText('SMALL BATCH ROASTERS · EST. 2019', cx, 298);
    ctx.globalAlpha = 1;

    // Tall origin label with its own visual language per coffee family.
    const lx = 96, ly = 390, lw = w - 192, lh = 820;
    ctx.shadowColor = 'rgba(20,8,4,0.22)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = art.accentDeep;
    ctx.beginPath();
    ctx.roundRect(lx, ly, lw, lh, 22);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    drawPattern(ctx, art, lx, ly, lw, lh, '#fff4e6');
    ctx.strokeStyle = 'rgba(255,245,230,0.48)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(lx + 20, ly + 20, lw - 40, lh - 40, 12);
    ctx.stroke();

    const cream = '#f8efe2';
    ctx.fillStyle = cream;
    ctx.font = '600 21px Inter, sans-serif';
    ctx.letterSpacing = '6px';
    ctx.textAlign = 'left';
    ctx.fillText(art.edition.toUpperCase(), lx + 54, ly + 68);
    ctx.textAlign = 'right';
    ctx.fillText(art.lot, lx + lw - 54, ly + 68);

    ctx.textAlign = 'left';
    ctx.font = '600 28px Inter, sans-serif';
    ctx.letterSpacing = '8px';
    ctx.fillText(bean.origin.toUpperCase(), lx + 54, ly + 148);

    ctx.letterSpacing = '1px';
    fitText(ctx, bean.name.toUpperCase(), lw - 108, 126, '400 {s}px Anton, Impact, sans-serif');
    const nameLines = wrapLines(ctx, bean.name.toUpperCase(), lw - 108).slice(0, 2);
    nameLines.forEach((line, i) => ctx.fillText(line, lx + 54, ly + 252 + i * 104));

    const detailY = ly + (nameLines.length > 1 ? 470 : 390);
    ctx.fillStyle = cream;
    ctx.font = '600 22px Inter, sans-serif';
    ctx.letterSpacing = '3px';
    ctx.globalAlpha = 0.82;
    ctx.fillText(bean.process.toUpperCase(), lx + 54, detailY);
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(248,239,226,0.12)';
    ctx.beginPath();
    ctx.roundRect(lx + 42, detailY + 56, lw - 84, 126, 14);
    ctx.fill();
    ctx.fillStyle = cream;
    ctx.font = 'italic 500 33px Inter, sans-serif';
    ctx.letterSpacing = '0px';
    wrapLines(ctx, bean.notes, lw - 150).slice(0, 2).forEach((line, i) => ctx.fillText(line, lx + 68, detailY + 104 + i * 42));

    // roast meter
    ctx.font = '600 18px Inter, sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('ROAST PROFILE', lx + 54, ly + lh - 134);
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(lx + 64 + i * 40, ly + lh - 86, 11, 0, Math.PI * 2);
      ctx.fillStyle = i < bean.roast ? cream : 'rgba(248,239,226,0.25)';
      ctx.fill();
    }

    ctx.fillStyle = cream;
    ctx.font = '600 18px Inter, sans-serif';
    ctx.letterSpacing = '3px';
    ctx.textAlign = 'right';
    ctx.fillText('12 OZ / 340 G · WHOLE BEAN', lx + lw - 54, ly + lh - 86);

    if (bean.badge) {
      ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(lx + lw - 52, ly + 34);
      ctx.rotate(0.16);
      ctx.fillStyle = art.accentSoft;
      ctx.beginPath();
      ctx.arc(0, 0, 66, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = art.accentDeep;
      ctx.letterSpacing = '2px';
      fitText(ctx, bean.badge.toUpperCase(), 110, 31, '400 {s}px Anton, Impact, sans-serif');
      ctx.fillText(bean.badge.toUpperCase(), 0, 2);
      ctx.restore();
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = ink;
    ctx.globalAlpha = 0.75;
    ctx.font = '600 18px Inter, sans-serif';
    ctx.letterSpacing = '7px';
    ctx.fillText('ROASTED TUESDAY · POURED DAILY', cx, 1328);
    ctx.globalAlpha = 1;
  });
}

function plainTexture(kind, w = 512, h = 512) {
  const t = canvasTexture(w, h, (ctx) => paper(ctx, w, h, kind));
  return t;
}

function crimpBump() {
  const t = canvasTexture(512, 64, (ctx, w, h) => {
    for (let x = 0; x < w; x += 6) {
      const g = ctx.createLinearGradient(x, 0, x + 6, 0);
      g.addColorStop(0, '#000');
      g.addColorStop(0.5, '#fff');
      g.addColorStop(1, '#000');
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, 6, h);
    }
  }, { color: false });
  return t;
}

function valveTexture(kind) {
  return canvasTexture(128, 128, (ctx, w) => {
    const c = w / 2;
    ctx.fillStyle = isDark(kind) ? '#2a2524' : '#f2eee8';
    ctx.fillRect(0, 0, w, w);
    ctx.fillStyle = isDark(kind) ? '#0b0909' : '#9a9088';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(c + Math.cos(a) * 26, c + Math.sin(a) * 26, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(c, c, 6, 0, Math.PI * 2);
    ctx.fill();
  });
}

/* ---------- Render ---------- */

// Yield to the event loop without setTimeout, which Chrome throttles to as
// little as once a minute in background tabs.
function yieldToPage() {
  if (globalThis.scheduler?.yield) return scheduler.yield();
  return new Promise((resolve) => {
    const ch = new MessageChannel();
    ch.port1.onmessage = () => resolve();
    ch.port2.postMessage(0);
  });
}

export async function renderBagImages(beans, { width = 560, height = 680, onEach } = {}) {
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  const key = new THREE.DirectionalLight('#fff3e6', 2.2);
  key.position.set(-3, 4, 5);
  const fill = new THREE.DirectionalLight('#ffe6cc', 0.6);
  fill.position.set(4, 1, 3);
  scene.add(key, fill, new THREE.HemisphereLight('#fff8f0', '#6b4a35', 0.6));

  const camera = new THREE.PerspectiveCamera(24, width / height, 0.1, 50);
  camera.position.set(0, 0.32, 5.2);
  camera.lookAt(0, 0.05, 0);

  const bag = new THREE.Group();
  scene.add(bag);

  const sideMat = new THREE.MeshStandardMaterial();
  const frontMat = new THREE.MeshStandardMaterial();
  const backMat = new THREE.MeshStandardMaterial();
  // BoxGeometry material order: +x, -x, +y, -y, +z (front), -z (back)
  const body = new THREE.Mesh(pouchGeometry(), [sideMat, sideMat, sideMat, sideMat, frontMat, backMat]);
  bag.add(body);

  const bump = crimpBump();
  const sealMat = new THREE.MeshStandardMaterial({ bumpMap: bump, bumpScale: 2 });
  const seal = new THREE.Mesh(new THREE.BoxGeometry(W * 1.01, 0.13, 0.03), sealMat);
  seal.position.y = H / 2 + 0.05;
  bag.add(seal);

  // Zipper rails and a lower gusset line keep the pouch from reading like a
  // flat cardboard box in the product shots.
  const zipperTop = new THREE.Mesh(new THREE.BoxGeometry(W * 0.91, 0.018, 0.026), sealMat);
  zipperTop.position.set(0, H / 2 - 0.085, D * 0.19);
  const zipperBottom = zipperTop.clone();
  zipperBottom.position.y -= 0.038;
  const gusset = new THREE.Mesh(new THREE.TorusGeometry(W * 0.41, 0.009, 6, 60, Math.PI), sealMat);
  gusset.rotation.set(Math.PI / 2, 0, 0);
  gusset.position.set(0, -H / 2 + 0.11, D * 0.31);
  bag.add(zipperTop, zipperBottom, gusset);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.65, 0.72),
    new THREE.MeshBasicMaterial({ map: shadowTexture(0.38), transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, -H / 2 - 0.035, 0.05);
  shadow.renderOrder = -1;
  scene.add(shadow);

  const valveMat = new THREE.MeshStandardMaterial({ roughness: 0.35 });
  const valveSide = new THREE.MeshStandardMaterial({ roughness: 0.35 });
  const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.02, 32), [valveSide, valveMat, valveSide]);
  const vu = 0.66, vv = 0.52; // between the brand line and the label
  valve.position.set(vu * W / 2, vv * H / 2, depthAt(vu, vv) + 0.008);
  valve.rotation.x = Math.PI / 2 - 0.25; // face forward, tilted with the pinch
  bag.add(valve);

  // Synchronous encode: toBlob is throttled to ~1s per call in background tabs.
  // WebP keeps transparency and is far smaller (browsers without WebP encoding fall back to PNG).
  const snapshot = () => canvas.toDataURL('image/webp', 0.92);
  const out = new Map();

  for (const bean of beans) {
    const kind = bean.paper;
    const side = plainTexture(kind);
    const front = frontTexture(bean);
    const back = plainTexture(kind);
    const valveTex = valveTexture(kind);
    const rough = PAPER[kind].roughness;
    Object.assign(sideMat, { map: side, roughness: rough });
    Object.assign(frontMat, { map: front, roughness: rough });
    Object.assign(backMat, { map: back, roughness: rough });
    Object.assign(sealMat, { map: side, roughness: rough });
    valveMat.map = valveTex;
    valveSide.color.set(isDark(kind) ? '#2a2524' : '#f2eee8');
    [sideMat, frontMat, backMat, sealMat, valveMat].forEach((m) => { m.needsUpdate = true; });

    const urls = {};
    for (const [view, rotY] of [['front', -0.16], ['angle', 0.6]]) {
      bag.rotation.y = rotY;
      renderer.render(scene, camera);
      urls[view] = snapshot();
    }
    out.set(bean.name, urls);
    onEach?.(bean.name, urls);
    [side, front, back, valveTex].forEach((t) => t.dispose());
    await yieldToPage(); // let the page breathe between bags
  }

  renderer.dispose();
  renderer.forceContextLoss();
  return out;
}
