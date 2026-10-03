// Renders a realistic stand-up coffee pouch for every bean, once, into PNG
// images (a front view and a three-quarter view) used by the shop cards.
// Rendering to images keeps the shop to a single extra WebGL context that is
// thrown away afterwards, instead of a live 3D canvas per card.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { canvasTexture } from './scene.js';

const W = 1.0, H = 1.45, D = 0.42;
const { smoothstep } = THREE.MathUtils;

const PAPER = {
  kraft: { base: '#c39a6b', ink: '#2a170d', roughness: 0.92, speckle: 0.5 },
  black: { base: '#1f1b1a', ink: '#efe6da', roughness: 0.7, speckle: 0.25 },
  white: { base: '#ece6db', ink: '#2a170d', roughness: 0.78, speckle: 0.3 },
};

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

function frontTexture(bean) {
  const kind = bean.paper;
  return canvasTexture(1024, 1485, (ctx, w, h) => {
    paper(ctx, w, h, kind);
    const ink = PAPER[kind].ink;
    const cx = w / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // brand mark
    ctx.fillStyle = ink;
    ctx.font = '400 66px Anton, Impact, sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('EMBER & OAK', cx, 205);
    ctx.font = '600 22px Inter, sans-serif';
    ctx.letterSpacing = '9px';
    ctx.fillText('COFFEE ROASTERS · EST. 2019', cx, 262);

    // label sticker
    const lx = 120, ly = 470, lw = w - 240, lh = 760;
    const labelBg = kind === 'white' ? `hsl(${bean.hue}, 50%, 40%)` : `hsl(${bean.hue}, 42%, 32%)`;
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = labelBg;
    ctx.beginPath();
    ctx.roundRect(lx, ly, lw, lh, 14);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(255,245,230,0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(lx + 22, ly + 22, lw - 44, lh - 44, 8);
    ctx.stroke();

    const cream = '#f8efe2';
    ctx.fillStyle = cream;
    ctx.font = '600 26px Inter, sans-serif';
    ctx.letterSpacing = '8px';
    ctx.fillText(bean.origin.toUpperCase(), cx, ly + 95);

    ctx.letterSpacing = '2px';
    fitText(ctx, bean.name.toUpperCase(), lw - 110, 132, '400 {s}px Anton, Impact, sans-serif');
    ctx.fillText(bean.name.toUpperCase(), cx, ly + 215);

    ctx.font = '500 26px Inter, sans-serif';
    ctx.letterSpacing = '3px';
    ctx.globalAlpha = 0.85;
    ctx.fillText(bean.process.toUpperCase(), cx, ly + 315);
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(248,239,226,0.4)';
    ctx.fillRect(cx - 160, ly + 365, 320, 2);

    ctx.fillStyle = cream;
    ctx.font = 'italic 500 38px Inter, sans-serif';
    ctx.letterSpacing = '0px';
    wrapLines(ctx, bean.notes, lw - 140).forEach((line, i) => ctx.fillText(line, cx, ly + 435 + i * 50));

    // roast meter
    ctx.font = '600 20px Inter, sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('ROAST', cx, ly + 575);
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(cx - 88 + i * 44, ly + 620, 13, 0, Math.PI * 2);
      ctx.fillStyle = i < bean.roast ? cream : 'rgba(248,239,226,0.25)';
      ctx.fill();
    }

    ctx.fillStyle = cream;
    ctx.font = '600 22px Inter, sans-serif';
    ctx.letterSpacing = '4px';
    ctx.textAlign = 'left';
    ctx.fillText('12 OZ · 340 G', lx + 60, ly + lh - 70);
    ctx.textAlign = 'right';
    ctx.fillText('WHOLE BEAN', lx + lw - 60, ly + lh - 70);

    if (bean.badge) {
      ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(lx + lw - 40, ly + 30);
      ctx.rotate(0.25);
      ctx.fillStyle = '#d9a441';
      ctx.beginPath();
      ctx.arc(0, 0, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a170d';
      ctx.font = '400 32px Anton, Impact, sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText(bean.badge.toUpperCase(), 0, 2);
      ctx.restore();
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = ink;
    ctx.globalAlpha = 0.75;
    ctx.font = '600 20px Inter, sans-serif';
    ctx.letterSpacing = '8px';
    ctx.fillText('ROASTED IN SMALL BATCHES', cx, 1330);
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
    ctx.fillStyle = kind === 'black' ? '#2a2524' : '#f2eee8';
    ctx.fillRect(0, 0, w, w);
    ctx.fillStyle = kind === 'black' ? '#0b0909' : '#9a9088';
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

export async function renderBagImages(beans, { width = 560, height = 680 } = {}) {
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

  const valveMat = new THREE.MeshStandardMaterial({ roughness: 0.35 });
  const valveSide = new THREE.MeshStandardMaterial({ roughness: 0.35 });
  const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.02, 32), [valveSide, valveMat, valveSide]);
  const vu = 0.66, vv = 0.52; // between the brand line and the label
  valve.position.set(vu * W / 2, vv * H / 2, depthAt(vu, vv) + 0.008);
  valve.rotation.x = Math.PI / 2 - 0.25; // face forward, tilted with the pinch
  bag.add(valve);

  const toBlobURL = () => new Promise((resolve) => canvas.toBlob((b) => resolve(URL.createObjectURL(b)), 'image/png'));
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
    valveSide.color.set(kind === 'black' ? '#2a2524' : '#f2eee8');
    [sideMat, frontMat, backMat, sealMat, valveMat].forEach((m) => { m.needsUpdate = true; });

    const urls = {};
    for (const [view, rotY] of [['front', -0.16], ['angle', 0.6]]) {
      bag.rotation.y = rotY;
      renderer.render(scene, camera);
      urls[view] = await toBlobURL();
    }
    out.set(bean.name, urls);
    [side, front, back, valveTex].forEach((t) => t.dispose());
    await new Promise((r) => setTimeout(r)); // let the page breathe between bags
  }

  renderer.dispose();
  renderer.forceContextLoss();
  return out;
}
