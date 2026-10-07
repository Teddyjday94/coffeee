// Everything 3D on the main page: renderer setup, the procedurally modeled
// cups, the floating bean field and the ingredient "burst" used by the drinks
// carousel. No model files needed; swap in GLTF models later if you get scans.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const { smoothstep, lerp, clamp } = THREE.MathUtils;
const rand = (a, b) => a + Math.random() * (b - a);
const v2 = ([x, y]) => new THREE.Vector2(x, y);

export const CUP_H = 2.1;

export const ease = {
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: (t) => 1 - Math.pow(1 - t, 3),
  outBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

/* ---------- Renderer, scene, camera, lights ---------- */

export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.75;

  const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 60);
  camera.position.set(0, 1, 12);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight('#fff6ea', '#4a2c1e', 1.1));
  const key = new THREE.DirectionalLight('#fff1e2', 2.4);
  key.position.set(-5, 6, 7);
  const rim = new THREE.DirectionalLight('#ffd7b0', 3);
  rim.position.set(6, 4, -5);
  scene.add(key, rim);

  return { renderer, scene, camera };
}

export function canvasTexture(w, h, draw, { color = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function shadowTexture(strength = 0.55) {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, `rgba(30,12,6,${strength})`);
    g.addColorStop(0.45, `rgba(30,12,6,${strength * 0.45})`);
    g.addColorStop(1, 'rgba(30,12,6,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }, { color: false });
}

/* ---------- Hot to-go cup (hero) ---------- */

function cupLabelTexture() {
  return canvasTexture(2048, 410, (ctx, w, h) => {
    ctx.fillStyle = '#f2e3cf';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#7d2418';
    ctx.fillRect(0, 0, w, 26);
    ctx.fillRect(0, h - 26, w, 26);

    const cx = w / 2;
    ctx.fillStyle = '#7d2418';
    ctx.beginPath();
    ctx.roundRect(cx - 130, 66, 260, 58, 29);
    ctx.fill();
    ctx.fillStyle = '#f2e3cf';
    ctx.font = '600 30px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '6px';
    ctx.fillText('SINCE 2019', cx, 96);

    ctx.fillStyle = '#24130d';
    ctx.letterSpacing = '2px';
    ctx.font = '400 128px Anton, Impact, sans-serif';
    ctx.fillText('EMBER & OAK', cx, 220);
    ctx.font = '600 30px Inter, sans-serif';
    ctx.letterSpacing = '9px';
    ctx.fillText('SMALL BATCH · ROASTED WEEKLY', cx, 320);
  });
}

function buildHotCup() {
  const g = new THREE.Group();
  const black = new THREE.MeshStandardMaterial({ color: '#1d1513', roughness: 0.55, side: THREE.DoubleSide });
  const lidMat = new THREE.MeshStandardMaterial({ color: '#2a1e1a', roughness: 0.3, side: THREE.DoubleSide });

  g.add(new THREE.Mesh(
    new THREE.LatheGeometry([[0, 0], [0.56, 0], [0.585, 0.03], [0.8, 2.0], [0.8, 2.02]].map(v2), 72),
    black,
  ));

  // Label band follows the taper of the cup.
  const rAt = (y) => 0.585 + (0.8 - 0.585) * ((y - 0.03) / 1.97) + 0.006;
  const y0 = 0.55, y1 = 1.45;
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(rAt(y1), rAt(y0), y1 - y0, 96, 1, true),
    new THREE.MeshStandardMaterial({ map: cupLabelTexture(), roughness: 0.6 }),
  );
  band.position.y = (y0 + y1) / 2;
  band.rotation.y = Math.PI; // centre of the label faces the camera
  g.add(band);

  const lid = new THREE.Mesh(
    new THREE.LatheGeometry(
      [[0, 0.25], [0.28, 0.25], [0.42, 0.23], [0.52, 0.16], [0.6, 0.14], [0.78, 0.12], [0.85, 0.08], [0.86, 0.02], [0.84, -0.05], [0.79, -0.05]].map(v2),
      72,
    ),
    lidMat,
  );
  lid.position.y = 2.0;
  g.add(lid);

  const sip = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.14, 4, 10), new THREE.MeshBasicMaterial({ color: '#0d0807' }));
  sip.position.set(0, 2.205, 0.47);
  sip.rotation.set(0.62, 0, Math.PI / 2);
  g.add(sip);

  g.userData.update = buildSteam(g, new THREE.Vector3(0, 2.26, 0.42));
  return g;
}

/* ---------- Steam (hot cup) ---------- */

function steamTexture() {
  // A soft, slightly lumpy puff so overlapping sprites read as vapour, not discs.
  return canvasTexture(128, 128, (ctx, w) => {
    const c = w / 2;
    for (let i = 0; i < 7; i++) {
      const x = c + rand(-18, 18), y = c + rand(-18, 18), r = rand(26, 46);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,0.32)');
      g.addColorStop(0.55, 'rgba(255,255,255,0.12)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, w);
    }
  }, { color: false });
}

// Wisps rise from the sip hole, widen, drift and fade. Returns update(dt, time).
function buildSteam(parent, origin, count = 30) {
  const map = steamTexture();
  const puffs = Array.from({ length: count }, (_, i) => {
    const mat = new THREE.SpriteMaterial({ map, color: '#fffaf4', transparent: true, depthWrite: false, opacity: 0 });
    const s = new THREE.Sprite(mat);
    s.renderOrder = 5;
    parent.add(s);
    return { s, life: i / count, speed: rand(0.24, 0.36), sway: rand(0, Math.PI * 2), spin: rand(-0.6, 0.6), drift: rand(-0.12, 0.12) };
  });
  return (dt, time) => {
    for (const p of puffs) {
      p.life = (p.life + dt * p.speed) % 1;
      const k = p.life;
      // Rise and curl: two sine layers so the column bends instead of wobbling.
      const curl = Math.sin(time * 0.7 + k * 4 + p.sway) * 0.22 + Math.sin(time * 1.3 + k * 7) * 0.08;
      p.s.position.set(
        origin.x + (curl + p.drift) * k,
        origin.y + k * 2.3,
        origin.z - k * 0.3,
      );
      const size = 0.28 + k * 1.3;
      p.s.scale.set(size, size * 1.2, 1);
      p.s.material.rotation = p.sway + time * p.spin * 0.3;
      // Quick fade in at the lid, long soft fade out as it spreads.
      p.s.material.opacity = smoothstep(k, 0, 0.1) * (1 - smoothstep(k, 0.25, 1)) * 0.95;
    }
  };
}

/* ---------- Iced drink cup (carousel) ---------- */

const R0 = 0.52, R1 = 0.78, FILL = 1.72, BASE = 0.04;
const rAt = (y) => R0 + (R1 - R0) * (y / CUP_H);
const liquidR = (y) => rAt(y) - 0.035;

function cupPrintTexture() {
  return canvasTexture(1400, 300, (ctx, w, h) => {
    const cx = w / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, 92, 62, 0, Math.PI * 2);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '400 50px Anton, Impact, sans-serif';
    ctx.fillText('E&O', cx, 95);
    ctx.font = '400 64px Anton, Impact, sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('EMBER & OAK', cx, 205);
    ctx.font = '600 22px Inter, sans-serif';
    ctx.letterSpacing = '10px';
    ctx.fillText('ICED · HANDCRAFTED', cx, 265);
  });
}

function foamGeometry() {
  // A soft dome that sits on top of the liquid, following the cup's taper.
  const SIDE = 0.17, DOME = 0.1;
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const y = -0.03 + (SIDE + 0.03) * (i / 8);
    pts.push(v2([liquidR(FILL + y), y]));
  }
  const rTop = liquidR(FILL + SIDE);
  for (let j = 1; j <= 12; j++) {
    const a = (j / 12) * (Math.PI / 2);
    pts.push(v2([rTop * Math.cos(a), SIDE + DOME * Math.sin(a)]));
  }
  pts.push(v2([0, SIDE + DOME]));
  const g = new THREE.LatheGeometry(pts, 72);
  // a little lumpy, like real foam
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = 1 + 0.012 * Math.sin(x * 31 + z * 17) * Math.sin(z * 23 - y * 13);
    p.setXYZ(i, x * n, y + (y > SIDE ? 0.012 * Math.sin(x * 19) * Math.cos(z * 21) : 0), z * n);
  }
  g.computeVertexNormals();
  g.userData.top = SIDE + DOME;
  g.userData.rTop = rTop;
  return g;
}

const WHIP_SEGMENTS = 260, WHIP_RADIAL = 24, WHIP_R = 0.1;
const whipTaper = (t) => 1 - 0.35 * t * t; // the bead thins toward the peak

function whipGeometry() {
  // Piped cream: a tube along a narrowing helix, with star-nozzle ridges
  // pushed into it. TubeGeometry builds its triangles in order along the
  // path, so the swirl can be "piped" by growing the draw range.
  const pts = [];
  const TURNS = 3.2, N = 160;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = t * TURNS * Math.PI * 2;
    const r = lerp(0.56, 0.06, Math.pow(t, 0.85));
    pts.push(new THREE.Vector3(Math.cos(a) * r, 0.08 + t * 0.5, Math.sin(a) * r));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const g = new THREE.TubeGeometry(curve, WHIP_SEGMENTS, WHIP_R, WHIP_RADIAL, false);
  const p = g.attributes.position, n = g.attributes.normal;
  const v = new THREE.Vector3(), nv = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    const seg = Math.floor(i / (WHIP_RADIAL + 1)), rad = i % (WHIP_RADIAL + 1);
    v.fromBufferAttribute(p, i);
    nv.fromBufferAttribute(n, i);
    const center = v.clone().addScaledVector(nv, -WHIP_R);
    const ridge = 1 + 0.28 * Math.cos((rad / WHIP_RADIAL) * Math.PI * 2 * 8); // 8-point star nozzle
    v.copy(center).addScaledVector(nv, WHIP_R * ridge * whipTaper(seg / WHIP_SEGMENTS));
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  g.userData.curve = curve;
  return g;
}

const easeOutBounce = (x) => {
  const n = 7.5625, d = 2.75;
  if (x < 1 / d) return n * x * x;
  if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
  if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
  return n * (x -= 2.625 / d) * x + 0.984375;
};

function drizzleOnFoam(foamTop, rTop) {
  // zig-zag lines of sauce across the foam dome
  const pts = [];
  const lines = 7;
  for (let i = 0; i < lines; i++) {
    const zz = lerp(-rTop * 0.8, rTop * 0.8, i / (lines - 1));
    const half = Math.sqrt(Math.max(0, rTop * rTop - zz * zz)) * 0.9;
    const xs = i % 2 ? [half, -half] : [-half, half];
    for (const x of xs) {
      const rr = Math.min(1, Math.hypot(x, zz) / rTop);
      pts.push(new THREE.Vector3(x, foamTop - 0.1 * (1 - Math.sqrt(1 - rr * rr)) + 0.01, zz));
    }
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.2), 260, 0.014, 6);
}

function drizzleOnWhip(curve) {
  const pts = [];
  for (let i = 0; i <= 120; i++) {
    const t = i / 120;
    const p = curve.getPointAt(Math.min(t * 0.92, 1));
    const out = new THREE.Vector3(p.x, 0, p.z).normalize().multiplyScalar(0.085);
    pts.push(new THREE.Vector3(p.x + out.x, p.y + 0.07 + Math.sin(t * 40) * 0.02, p.z + out.z));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.016, 6);
}

export function buildIcedCup() {
  const g = new THREE.Group();

  // Liquid: a lathe with per-vertex colours so we can paint a layered pour.
  const pts = [v2([0, BASE])];
  const ROWS = 48;
  for (let i = 0; i <= ROWS; i++) {
    const y = BASE + (FILL - BASE) * (i / ROWS);
    pts.push(v2([liquidR(y), y]));
  }
  pts.push(v2([0, FILL]));
  const liquidGeo = new THREE.LatheGeometry(pts, 72);
  const pos = liquidGeo.attributes.position;
  liquidGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3));
  const liquid = new THREE.Mesh(liquidGeo, new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.24, clearcoat: 0.48, clearcoatRoughness: 0.12 }));
  g.add(liquid);

  // A separate glossy surface gives the drink a convincing meniscus instead
  // of letting the top read like a flat cap on the lathed liquid mesh.
  const surfaceMat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.04, transparent: true, opacity: 0.72, depthWrite: false });
  const meniscus = new THREE.Mesh(new THREE.CircleGeometry(1, 72), surfaceMat);
  meniscus.rotation.x = -Math.PI / 2;
  meniscus.renderOrder = 1;
  g.add(meniscus);

  // Clear plastic shell. (Transmission would look nicer but needs an opaque
  // background, and our canvas is transparent over the CSS colours.)
  const shellMat = new THREE.MeshPhysicalMaterial({
    color: '#f5fbff', roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.035,
    transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false,
  });
  const shell = new THREE.Mesh(
    new THREE.LatheGeometry([[0, 0], [R0, 0], [R0 + 0.01, 0.02], [R1, CUP_H - 0.02], [R1 + 0.02, CUP_H]].map(v2), 72),
    shellMat,
  );
  shell.renderOrder = 2;
  g.add(shell);
  const rimMat = shellMat.clone();
  rimMat.opacity = 0.55;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R1 + 0.02, 0.018, 10, 72), rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = CUP_H;
  rim.renderOrder = 2;
  const lip = new THREE.Mesh(new THREE.TorusGeometry(R1 - 0.012, 0.032, 12, 72), rimMat);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = CUP_H - 0.026;
  lip.renderOrder = 2;
  const foot = new THREE.Mesh(new THREE.TorusGeometry(R0 + 0.008, 0.014, 8, 72), rimMat);
  foot.rotation.x = Math.PI / 2;
  foot.position.y = 0.02;
  g.add(rim, lip, foot);

  // Printed logo on the cup, wrapping with the taper.
  const py0 = 0.5, py1 = 1.1;
  const print = new THREE.Mesh(
    new THREE.CylinderGeometry(rAt(py1) + 0.012, rAt(py0) + 0.012, py1 - py0, 96, 1, true),
    new THREE.MeshBasicMaterial({ map: cupPrintTexture(), transparent: true, opacity: 0.94, depthWrite: false, toneMapped: false }),
  );
  print.position.y = (py0 + py1) / 2;
  print.rotation.y = Math.PI;
  print.renderOrder = 3;
  g.add(print);

  // Condensation: tiny flattened droplets hugging the cold part of the cup,
  // plus a few longer drips.
  const DROPS = 300;
  const drops = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 10, 8),
    new THREE.MeshPhysicalMaterial({ color: '#f4fbff', roughness: 0.08, clearcoat: 1, transparent: true, opacity: 0.4, depthWrite: false }),
    DROPS,
  );
  const d = new THREE.Object3D();
  for (let i = 0; i < DROPS; i++) {
    const y = rand(0.12, FILL - 0.04);
    const a = rand(0, Math.PI * 2);
    const r = rAt(y) + 0.016;
    d.position.set(Math.sin(a) * r, y, Math.cos(a) * r);
    d.lookAt(Math.sin(a) * 2, y, Math.cos(a) * 2);
    const drip = i < 10;
    const s = drip ? rand(0.011, 0.015) : Math.random() < 0.08 ? rand(0.018, 0.026) : rand(0.004, 0.011);
    d.scale.set(s, drip ? s * rand(3, 5) : s * rand(1, 1.3), s * 0.45);
    d.updateMatrix();
    drops.setMatrixAt(i, d.matrix);
  }
  drops.renderOrder = 3;
  g.add(drops);

  // Ice
  const iceMat = new THREE.MeshPhysicalMaterial({
    color: '#edf9ff', roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.04,
    transparent: true, opacity: 0.72, depthWrite: false, emissive: '#102a34', emissiveIntensity: 0.12,
  });
  const iceGeo = new RoundedBoxGeometry(0.28, 0.28, 0.28, 3, 0.06);
  // Each cube has a resting spot in a little pile on the bottom of the empty
  // cup, and a spot where it floats once the cup is full.
  const PILE = [
    [-0.16, 0.17, -0.12], [0.16, 0.17, -0.14], [-0.1, 0.17, 0.17], [0.17, 0.17, 0.14],
    [0.02, 0.43, -0.02], [-0.19, 0.45, 0.04], [0.19, 0.46, 0.06], [0.0, 0.44, 0.22],
    [-0.28, 0.7, -0.06], [0.27, 0.72, -0.1], [-0.1, 0.72, 0.24], [0.1, 0.76, -0.24],
  ];
  const ice = PILE.map((rest, i) => {
    const m = new THREE.Mesh(iceGeo, iceMat);
    const a = (i / PILE.length) * Math.PI * 2 + rand(-0.2, 0.2);
    const r = i % 2 ? 0.38 : 0.18;
    m.userData = {
      rest: new THREE.Vector3(...rest),
      float: new THREE.Vector3(Math.cos(a) * r, 0.09 - (i % 3) * 0.09, Math.sin(a) * r), // y is relative to the surface; poke up through it
      rot: new THREE.Euler(rand(0, 3), rand(0, 3), rand(0, 3)),
      spin: new THREE.Vector3(rand(-6, 6), rand(-6, 6), rand(-6, 6)),
      dropAt: i * 0.075,
    };
    const cubeScale = rand(0.82, 1.08);
    m.scale.set(cubeScale, cubeScale * rand(0.88, 1.08), cubeScale);
    m.userData.baseScale = m.scale.clone();
    m.rotation.copy(m.userData.rot);
    m.renderOrder = 1;
    g.add(m);
    return m;
  });

  const strawMat = new THREE.MeshStandardMaterial({ color: '#2b140a', roughness: 0.35 });
  const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.3, 18), strawMat);
  const strawShine = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.009, 2.18, 8),
    new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.28, toneMapped: false }),
  );
  strawShine.position.set(-0.026, 0.02, 0.038);
  straw.add(strawShine);
  const STRAW_Y = 1.95;
  straw.position.set(0.2, STRAW_Y, -0.1);
  straw.rotation.set(0.1, 0, -0.2);
  g.add(straw);

  // Pour stream: a glossy column whose top is far above the cup and whose
  // bottom tracks the rising surface. Unit height, hanging down from y = 0.
  const streamMat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.1 });
  const streamGeo = new THREE.CylinderGeometry(0.06, 0.05, 1, 24, 1);
  streamGeo.translate(0, -0.5, 0);
  const stream = new THREE.Mesh(streamGeo, streamMat);
  stream.position.set(-0.08, 0, 0.05);
  stream.visible = false;
  g.add(stream);
  const STREAM_TOP = 6;

  // Ripples where the stream hits the surface.
  const rippleMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false });
  const ripples = [0, 1, 2].map(() => {
    const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 8, 48), rippleMat.clone());
    r.rotation.x = Math.PI / 2;
    r.visible = false;
    g.add(r);
    return r;
  });

  // Toppings
  const topping = new THREE.Group();
  topping.position.y = FILL;
  g.add(topping);
  const creamMat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.75, sheen: 1, sheenRoughness: 0.6, sheenColor: '#ffffff' });
  const sauceMat = new THREE.MeshPhysicalMaterial({ color: '#b5641c', roughness: 0.15, clearcoat: 1 });
  const foamGeo = foamGeometry();
  const foam = new THREE.Mesh(foamGeo, creamMat);
  const bubbleMat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.48, clearcoat: 0.35 });
  const foamBubbles = new THREE.Group();
  for (let i = 0; i < 22; i++) {
    const a = rand(0, Math.PI * 2), r = Math.sqrt(Math.random()) * foamGeo.userData.rTop * 0.8;
    const bubble = new THREE.Mesh(new THREE.SphereGeometry(rand(0.012, 0.025), 10, 8), bubbleMat);
    bubble.position.set(Math.cos(a) * r, foamGeo.userData.top + rand(-0.018, 0.018), Math.sin(a) * r);
    bubble.scale.y = rand(0.55, 0.9);
    foamBubbles.add(bubble);
  }
  const whipGeo = whipGeometry();
  const whipCurve = whipGeo.userData.curve;
  const whip = new THREE.Group();
  whip.add(new THREE.Mesh(whipGeo, creamMat));
  const whipBase = new THREE.Mesh(foamGeo, creamMat);
  whipBase.scale.y = 0.7;
  whip.add(whipBase);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.16, 16), creamMat);
  tip.position.y = 0.66;
  whip.add(tip);
  // The nozzle bead: rounds off the growing end of the swirl while it's piped.
  const bead = new THREE.Mesh(new THREE.SphereGeometry(WHIP_R * 1.05, 20, 14), creamMat);
  whip.add(bead);

  function setWhip(p) {
    const segs = Math.round(p * WHIP_SEGMENTS);
    whipGeo.setDrawRange(0, segs * WHIP_RADIAL * 6);
    bead.visible = segs > 0;
    if (bead.visible) {
      const k = segs / WHIP_SEGMENTS;
      bead.position.copy(whipCurve.getPointAt(k));
      bead.scale.setScalar(whipTaper(k));
    }
  }
  const drizzleFoam = new THREE.Mesh(drizzleOnFoam(foamGeo.userData.top, foamGeo.userData.rTop * 0.92), sauceMat);
  const drizzleWhip = new THREE.Mesh(drizzleOnWhip(whipGeo.userData.curve), sauceMat);
  topping.add(foam, foamBubbles, whip, drizzleFoam, drizzleWhip);

  function applyTopping(t) {
    foam.visible = t?.type === 'foam';
    foamBubbles.visible = foam.visible;
    whip.visible = t?.type === 'whip';
    drizzleFoam.visible = foam.visible && !!t.drizzle;
    drizzleWhip.visible = whip.visible && !!t.drizzle;
    if (t) {
      creamMat.color.set(t.color);
      bubbleMat.color.set(t.color).offsetHSL(0, -0.05, 0.05);
    }
    if (t?.drizzle) sauceMat.color.set(t.drizzle);
  }

  // Colour state, eased toward the target drink every frame.
  const cur = { bottom: new THREE.Color(), top: new THREE.Color(), straw: new THREE.Color(), split: 0.5 };
  const tgt = { bottom: new THREE.Color(), top: new THREE.Color(), straw: new THREE.Color(), split: 0.5 };
  const colors = liquidGeo.attributes.color;
  const tmp = new THREE.Color();

  function paint() {
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const t = (y - BASE) / (FILL - BASE);
      const a = Math.atan2(x, z);
      const edge = cur.split + 0.045 * Math.sin(a * 3 + y * 5) + 0.025 * Math.sin(a * 7 - y * 9 + 1.3);
      const k = smoothstep(t, edge - 0.14, edge + 0.14);
      tmp.copy(cur.bottom).lerp(cur.top, k);
      colors.setXYZ(i, tmp.r, tmp.g, tmp.b);
    }
    colors.needsUpdate = true;
    surfaceMat.color.copy(cur.top).offsetHSL(0, -0.06, 0.08);
    strawMat.color.copy(cur.straw);
  }

  /*
   * Pour timeline (seconds from the start of a drink change):
   *   0.00–0.35  drain: old drink empties, old ice clears, topping shrinks,
   *              straw lifts out
   *   0.40–1.45  ice: fresh cubes tumble in one by one and bounce into a pile
   *   1.30–2.90  pour: the bottom layer pours in first, then the top layer,
   *              which blooms down into it; the ice lifts off and floats
   *   2.90–3.10  the stream's tail falls into the cup
   *   2.95–4.60  straw drops in; foam pops on, or whipped cream is piped
   *              in a swirl, then the drizzle lands
   */
  const T = { drainEnd: 0.35, iceStart: 0.4, iceFall: 0.55, pourStart: 1.3, pourEnd: 2.9, tailEnd: 3.1, strawIn: 2.95, toppingStart: 2.9, end: 4.6 };
  const pour = { t: -1, level: 1, topping: null, wait: 0 };
  const surfaceY = () => BASE + (FILL - BASE) * pour.level;
  let shownSplit = 0.5;

  function setTopping(s) {
    topping.scale.set(Math.max(s, 1e-3), Math.max(s, 1e-3), Math.max(s, 1e-3));
  }

  function setDrink(drink, instant = false, { fromEmpty = false, delay = 0 } = {}) {
    pour.wait = delay;
    tgt.bottom.set(drink.liquid.bottom);
    tgt.top.set(drink.liquid.top);
    tgt.straw.set(drink.straw);
    tgt.split = drink.liquid.split;
    pour.topping = drink.topping;
    if (instant) {
      pour.t = -1;
      pour.level = 1;
      cur.bottom.copy(tgt.bottom);
      cur.top.copy(tgt.top);
      cur.straw.copy(tgt.straw);
      cur.split = shownSplit = tgt.split;
      paint();
      applyTopping(drink.topping);
      setTopping(1);
      finishWhip();
      straw.position.y = STRAW_Y;
      straw.visible = true;
      layout(0);
      return;
    }
    // A fresh cup skips the drain and starts pouring straight away.
    pour.t = fromEmpty ? T.drainEnd : 0;
    if (fromEmpty) {
      pour.level = 0;
      setTopping(0);
      straw.position.y = STRAW_Y + 3;
      straw.visible = false;
      switchColors();
    }
  }

  // Swap to the new drink's colours while the cup is empty.
  function switchColors() {
    cur.bottom.copy(tgt.bottom);
    cur.top.copy(tgt.top);
    cur.straw.copy(tgt.straw);
    shownSplit = 1; // all bottom layer until the top layer starts pouring
    cur.split = shownSplit;
    paint();
    applyTopping(pour.topping);
  }

  function finishWhip() {
    setWhip(1);
    tip.scale.setScalar(1);
    whipBase.scale.set(1, 0.7, 1);
    drizzleWhip.visible = whip.visible && !!pour.topping?.drizzle;
  }

  // Place everything that depends on the liquid level and the ice drop.
  // t is the time into the current drink change (Infinity when idle).
  function layout(time, t = Infinity) {
    liquid.visible = pour.level > 0.04;
    liquid.scale.y = Math.max(pour.level, 0.01);
    const surface = surfaceY();
    meniscus.visible = pour.level > 0.04;
    meniscus.position.y = surface + 0.008;
    meniscus.scale.setScalar(liquidR(surface) * 0.98);
    ice.forEach((m, i) => {
      const u = m.userData;
      // Old ice clears out while the cup drains.
      if (t < T.drainEnd) {
        m.visible = true;
        m.scale.copy(u.baseScale).multiplyScalar(Math.max(1 - t / T.drainEnd, 1e-3));
        return;
      }
      m.scale.copy(u.baseScale);
      // New ice tumbles in from above and bounces into a pile.
      const fall = (t - T.iceStart - u.dropAt) / T.iceFall;
      m.visible = fall >= 0;
      if (fall < 0) return;
      if (fall < 1) {
        const k = easeOutBounce(fall);
        m.position.set(u.rest.x, lerp(CUP_H + 2.6, u.rest.y, k), u.rest.z);
        const tumble = (1 - Math.min(1, fall * 1.4)) * 1.2;
        m.rotation.set(u.rot.x + u.spin.x * tumble, u.rot.y + u.spin.y * tumble, u.rot.z + u.spin.z * tumble);
        return;
      }
      // Resting in the pile until the rising liquid lifts it to float.
      m.rotation.copy(u.rot);
      const floatY = surface + u.float.y + Math.sin(time * 1.3 + i * 1.7) * 0.02 * pour.level;
      const lift = clamp((floatY - u.rest.y) / 0.7, 0, 1);
      m.position.set(
        lerp(u.rest.x, u.float.x, lift),
        Math.max(u.rest.y, floatY),
        lerp(u.rest.z, u.float.z, lift),
      );
    });
  }

  function update(dt, time) {
    if (pour.t < 0 || pour.wait > 0) {
      pour.wait -= dt;
      layout(time, pour.t < 0 ? Infinity : pour.t); // a fresh cup stays empty while it waits
      return;
    }
    const prev = pour.t;
    pour.t += dt;
    const t = pour.t;
    const pourK = clamp((t - T.pourStart) / (T.pourEnd - T.pourStart), 0, 1);

    // Liquid level
    if (t < T.drainEnd) pour.level = 1 - ease.inOut(t / T.drainEnd);
    else if (t < T.pourStart) pour.level = 0;
    else pour.level = Math.min(1, ease.out(pourK) * 0.15 + pourK * 0.85);
    if (prev < T.drainEnd && t >= T.drainEnd) {
      switchColors();
      setWhip(0);
      tip.scale.setScalar(1e-3);
      drizzleWhip.visible = false;
    }

    // Topping out, then back in once the pour is done
    const tw = t - T.toppingStart;
    if (t < T.drainEnd) setTopping(1 - clamp(t / 0.22, 0, 1));
    else if (tw < 0) setTopping(0);
    else if (pour.topping?.type === 'whip') {
      // Whipped cream is piped: a soft base, then the swirl winds up to a peak.
      setTopping(1);
      const b = ease.outBack(clamp(tw / 0.3, 0, 1));
      whipBase.scale.set(Math.max(b, 1e-3), Math.max(0.7 * b, 1e-3), Math.max(b, 1e-3));
      setWhip(ease.inOut(clamp((tw - 0.15) / 1.15, 0, 1)));
      tip.scale.setScalar(Math.max(ease.outBack(clamp((tw - 1.25) / 0.3, 0, 1)), 1e-3));
      drizzleWhip.visible = !!pour.topping.drizzle && tw > 1.4;
    } else setTopping(ease.outBack(clamp(tw / 0.7, 0, 1)));

    // Straw lifts out, then drops back in
    if (t < T.drainEnd) straw.position.y = STRAW_Y + ease.inOut(t / T.drainEnd) * 3;
    else if (t < T.strawIn) straw.position.y = STRAW_Y + 3;
    else straw.position.y = STRAW_Y + 3 * (1 - ease.outBack(clamp((t - T.strawIn) / 0.55, 0, 1)));
    straw.visible = straw.position.y < STRAW_Y + 1.6; // hidden while lifted out, so it can't read as a second stream

    // Two-stage pour: bottom layer first, then the top layer blooms down into it
    const topStart = 1 - tgt.split * 0.85; // when the top layer starts pouring
    const pouringTop = pourK >= topStart;
    if (t >= T.pourStart) {
      const bloom = clamp((pourK - topStart) / (1 - topStart + 0.25), 0, 1);
      const split = lerp(1, tgt.split, ease.out(bloom));
      if (Math.abs(split - shownSplit) > 0.002) {
        shownSplit = cur.split = split;
        paint();
      }
    }

    // Stream
    const surface = surfaceY();
    stream.visible = t >= T.pourStart && t < T.tailEnd;
    if (stream.visible) {
      const tail = clamp((t - T.pourEnd) / (T.tailEnd - T.pourEnd), 0, 1);
      const top = lerp(STREAM_TOP, surface, ease.inOut(tail));
      stream.position.y = top;
      stream.scale.y = Math.max(top - surface, 0.001);
      const wobble = 1 + 0.08 * Math.sin(time * 38) + 0.05 * Math.sin(time * 23 + 1);
      const thin = t > T.pourEnd ? 1 - tail * 0.6 : Math.min(1, (t - T.pourStart) / 0.12);
      stream.scale.x = stream.scale.z = wobble * thin;
      streamMat.color.copy(pouringTop ? cur.top : cur.bottom);
    }

    // Ripples spreading from where the stream lands
    ripples.forEach((r, i) => {
      const phase = ((t * 2.6 + i / ripples.length) % 1);
      r.visible = t >= T.pourStart + 0.1 && t < T.pourEnd && pour.level > 0.05;
      if (!r.visible) return;
      const rad = 0.08 + phase * 0.45;
      r.position.set(stream.position.x, surface + 0.01, stream.position.z);
      r.scale.set(rad, rad, rad * 0.4);
      r.material.opacity = 0.45 * (1 - phase);
    });

    layout(time, t);
    if (t >= T.end) {
      pour.t = -1;
      if (pour.topping?.type === 'whip') finishWhip();
    }
  }

  return { group: g, setDrink, update, busy: () => pour.t >= 0 };
}

/**
 * The hero product: one spinner holding both cups so the scroll can
 * cross-fade (by scale) from the hot to-go cup to the iced drink.
 */
export function createProduct() {
  const group = new THREE.Group();
  const spinner = new THREE.Group();
  group.add(spinner);

  const hot = new THREE.Group();
  const hotCup = buildHotCup();
  hotCup.position.y = -CUP_H / 2;
  hot.add(hotCup);

  const iced = new THREE.Group();
  const icedCup = buildIcedCup();
  icedCup.group.position.y = -CUP_H / 2;
  iced.add(icedCup.group);

  spinner.add(hot, iced);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 2.4),
    new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.8 }),
  );
  shadow.rotation.x = -Math.PI / 2 + 0.22;
  shadow.position.y = -CUP_H / 2 - 0.02;
  shadow.renderOrder = -1;
  group.add(shadow);

  return {
    group, spinner, hot, iced, shadow,
    setDrink: icedCup.setDrink,
    busy: icedCup.busy, // true while a drink is draining, pouring or being topped
    update(dt, time) {
      if (iced.visible) icedCup.update(dt, time);
      if (hot.visible) hotCup.userData.update(dt, time);
    },
  };
}

/* ---------- Coffee bean geometry & floating field ---------- */

function beanGeometry() {
  const g = new THREE.SphereGeometry(1, 36, 24);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    if (v.y > 0) {
      v.y *= 0.6; // flat side
      const off = v.x - 0.07 * Math.sin(v.z * 3); // slightly S-shaped crease
      const crease = Math.exp(-(off * off) / (2 * 0.07 * 0.07));
      v.y *= 1 - 0.65 * crease;
    }
    v.multiply(new THREE.Vector3(0.12, 0.1, 0.17));
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

const beanMaterial = () => new THREE.MeshPhysicalMaterial({
  color: '#ffffff', roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.35,
});

const dummy = new THREE.Object3D();

export function createBeanField(count = 34) {
  const mesh = new THREE.InstancedMesh(beanGeometry(), beanMaterial(), count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const color = new THREE.Color();
  const items = [];
  for (let i = 0; i < count; i++) {
    // Keep a loose clearing around the centre so beans frame the cup.
    let x, y;
    do { x = rand(-7.5, 7.5); y = rand(-3.6, 3.6); } while (Math.abs(x - 1.5) < 1.3 && Math.abs(y) < 1.6);
    // Big close-up beans stay off the headline/copy (left on desktop, top on phones)
    // so they never sit right behind the text.
    let z = rand(-5, 3.2);
    if (z > -0.5 && (x < 0.5 || y > 0.8)) z = rand(-5, -2);
    items.push({
      pos: new THREE.Vector3(x, y, z),
      rot: new THREE.Euler(rand(0, 6), rand(0, 6), rand(0, 6)),
      spin: new THREE.Vector3(rand(-0.6, 0.6), rand(-0.6, 0.6), rand(-0.6, 0.6)),
      scale: rand(1.2, 2.6),
      phase: rand(0, Math.PI * 2),
    });
    mesh.setColorAt(i, color.set(i % 4 ? '#5a2e18' : '#6f3a1f'));
  }
  const group = new THREE.Group();
  group.add(mesh);

  function update(time, visibility) {
    items.forEach((it, i) => {
      dummy.position.copy(it.pos);
      dummy.position.y += Math.sin(time * 0.7 + it.phase) * 0.12;
      dummy.rotation.set(it.rot.x + it.spin.x * time, it.rot.y + it.spin.y * time, it.rot.z + it.spin.z * time);
      dummy.scale.setScalar(it.scale * visibility);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    group.visible = visibility > 0.001;
  }

  return { group, update };
}

/* ---------- Ingredient burst (drinks carousel) ---------- */

function leafGeometry() {
  const g = new THREE.SphereGeometry(1, 20, 12);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) * 0.13, y = p.getY(i) * 0.016, z = p.getZ(i) * 0.3;
    p.setXYZ(i, x, y + 1.6 * z * z, z); // gentle curl
  }
  g.computeVertexNormals();
  return g;
}

function berryGeometry() {
  const g = new THREE.IcosahedronGeometry(0.16, 4);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    v.multiplyScalar(1 + 0.07 * Math.sin(v.x * 55) * Math.sin(v.y * 55) * Math.sin(v.z * 55));
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

function chipGeometry() {
  // an irregular shard: chocolate curl / coconut flake
  const g = new THREE.DodecahedronGeometry(0.15, 0);
  g.scale(1, 0.32, 0.75);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) * (1 + 0.25 * Math.sin(p.getZ(i) * 20)));
  g.computeVertexNormals();
  return g;
}

function stickGeometry() {
  // a rolled cinnamon stick: a tube with a seam
  const g = new THREE.CylinderGeometry(0.045, 0.045, 0.62, 18, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const a = Math.atan2(p.getX(i), p.getZ(i));
    const r = 1 + 0.12 * Math.sin(a * 2) + 0.05 * Math.sin(a * 9);
    p.setX(i, p.getX(i) * r);
    p.setZ(i, p.getZ(i) * r);
  }
  g.computeVertexNormals();
  return g;
}

const CITRUS = {
  orange: { rind: '#f07a12', pith: '#fff1d6', inner: '#ffc266', outer: '#ff8c1a' },
  lemon: { rind: '#e8bd0c', pith: '#fff6c8', inner: '#ffe45c', outer: '#f5c816' },
};

function sliceFaceTexture(kind = 'orange') {
  const p = CITRUS[kind];
  return canvasTexture(256, 256, (ctx, w) => {
    const c = w / 2;
    ctx.fillStyle = p.rind;
    ctx.beginPath(); ctx.arc(c, c, c, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.pith;
    ctx.beginPath(); ctx.arc(c, c, c * 0.9, 0, Math.PI * 2); ctx.fill();
    const n = 10;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2 + 0.05, a1 = ((i + 1) / n) * Math.PI * 2 - 0.05;
      const g = ctx.createRadialGradient(c, c, 4, c, c, c * 0.84);
      g.addColorStop(0, p.inner);
      g.addColorStop(1, p.outer);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(c, c); ctx.arc(c, c, c * 0.84, a0, a1); ctx.closePath(); ctx.fill();
    }
  });
}

function fxDefs() {
  const glossy = () => new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.35, clearcoat: 0.5 });
  const matte = () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.75 });
  const face = new THREE.MeshStandardMaterial({ map: sliceFaceTexture('orange'), roughness: 0.4 });
  const lemonFace = new THREE.MeshStandardMaterial({ map: sliceFaceTexture('lemon'), roughness: 0.4 });
  return {
    bean: { geo: beanGeometry(), mat: beanMaterial(), size: 1.7 },
    leaf: { geo: leafGeometry(), mat: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5, side: THREE.DoubleSide }), size: 1.2 },
    berry: { geo: berryGeometry(), mat: glossy(), size: 1 },
    slice: { geo: new THREE.CylinderGeometry(0.28, 0.28, 0.06, 40), mat: [new THREE.MeshStandardMaterial({ color: '#f07a12', roughness: 0.5 }), face, face], size: 1 },
    lemon: { geo: new THREE.CylinderGeometry(0.26, 0.26, 0.05, 40), mat: [new THREE.MeshStandardMaterial({ color: '#f2d21b', roughness: 0.5 }), lemonFace, lemonFace], size: 1 },
    cube: { geo: new RoundedBoxGeometry(0.26, 0.26, 0.26, 3, 0.05), mat: glossy(), size: 1 },
    chip: { geo: chipGeometry(), mat: glossy(), size: 1.3 },
    bud: { geo: new THREE.CapsuleGeometry(0.045, 0.1, 4, 10), mat: matte(), size: 1.3 },
    stick: { geo: stickGeometry(), mat: matte(), size: 1 },
  };
}

export function createIngredientBurst(max = 24) {
  const group = new THREE.Group();
  const pools = {};
  const white = new THREE.Color('#ffffff');
  const color = new THREE.Color();

  for (const [type, def] of Object.entries(fxDefs())) {
    const mesh = new THREE.InstancedMesh(def.geo, def.mat, max);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < max; i++) mesh.setColorAt(i, white);
    const items = Array.from({ length: max }, () => ({
      state: 'off', t: 0, delay: 0, s: 1, phase: rand(0, 6),
      from: new THREE.Vector3(), home: new THREE.Vector3(), cur: new THREE.Vector3(),
      rot: new THREE.Euler(), spin: new THREE.Vector3(),
    }));
    pools[type] = { mesh, items, size: def.size };
    group.add(mesh);
  }

  function hide() {
    for (const pool of Object.values(pools)) {
      for (const it of pool.items) {
        if (it.state === 'in') { it.state = 'out'; it.t = 0; it.from.copy(it.cur); }
      }
    }
  }

  function show(drink) {
    hide();
    for (const { type, colors, count } of drink.fx) {
      const pool = pools[type];
      let n = 0;
      pool.items.forEach((it, i) => {
        if (n >= count || it.state !== 'off') return;
        const a = rand(0, Math.PI * 2);
        it.state = 'in';
        it.t = 0;
        it.delay = n * 0.04 + rand(0, 0.12);
        it.home.set(Math.cos(a) * rand(1.7, 3.8), Math.sin(a) * rand(0.7, 2.4), rand(-1.6, 1.8));
        it.from.set(rand(-0.2, 0.2), rand(-0.4, 0.4), 0);
        it.s = rand(0.75, 1.35) * pool.size;
        it.rot.set(rand(0, 6), rand(0, 6), rand(0, 6));
        it.spin.set(rand(-0.8, 0.8), rand(-0.8, 0.8), rand(-0.8, 0.8));
        pool.mesh.setColorAt(i, color.set(colors[n % colors.length]));
        n++;
      });
      pool.mesh.instanceColor.needsUpdate = true;
    }
  }

  function update(dt, time) {
    for (const pool of Object.values(pools)) {
      pool.items.forEach((it, i) => {
        let scale = 0;
        if (it.state === 'in') {
          it.t += dt;
          const k = clamp((it.t - it.delay) / 0.9, 0, 1);
          it.cur.lerpVectors(it.from, it.home, ease.outBack(k));
          it.cur.y += Math.sin(time * 0.9 + it.phase) * 0.1 * k;
          scale = it.s * ease.out(k);
        } else if (it.state === 'out') {
          it.t += dt;
          const k = Math.min(it.t / 0.5, 1);
          it.cur.copy(it.from).multiplyScalar(1 + 0.6 * k * k);
          it.cur.y -= k * k * 0.8;
          scale = it.s * (1 - k);
          if (k >= 1) it.state = 'off';
        }
        dummy.position.copy(it.cur);
        dummy.rotation.set(it.rot.x + it.spin.x * time, it.rot.y + it.spin.y * time, it.rot.z + it.spin.z * time);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        pool.mesh.setMatrixAt(i, dummy.matrix);
      });
      pool.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  return { group, show, hide, update };
}
