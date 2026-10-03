// Renders product shots of the 3D iced drinks (cup, toppings and floating
// ingredients) into images, the same way bags.js does for the coffee bags.
// Used by the "Iced, layered, ridiculous" cards on the home page.
import * as THREE from 'three';
import { createStage, buildIcedCup, createIngredientBurst, shadowTexture, CUP_H } from './scene.js';

// Yield without setTimeout, which Chrome throttles in background tabs.
function yieldToPage() {
  if (globalThis.scheduler?.yield) return scheduler.yield();
  return new Promise((resolve) => {
    const ch = new MessageChannel();
    ch.port1.onmessage = () => resolve();
    ch.port2.postMessage(0);
  });
}

export async function renderDrinkImages(drinks, { width = 640, height = 760, onEach } = {}) {
  const canvas = document.createElement('canvas');
  const { renderer, scene, camera } = createStage(canvas);
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  const root = new THREE.Group();
  scene.add(root);

  const cup = buildIcedCup();
  cup.group.position.y = -CUP_H / 2;
  const cupWrap = new THREE.Group();
  cupWrap.add(cup.group);
  cupWrap.position.y = -0.45;
  cupWrap.scale.setScalar(1.45);
  root.add(cupWrap);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 2.6),
    new THREE.MeshBasicMaterial({ map: shadowTexture(0.5), transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2 + 0.22;
  shadow.position.y = -0.45 - (CUP_H / 2) * 1.45 - 0.02;
  shadow.renderOrder = -1;
  scene.add(shadow);

  const fx = createIngredientBurst();
  fx.group.scale.setScalar(0.66);
  fx.group.position.y = -0.2;
  root.add(fx.group);

  const out = new Map();
  for (const drink of drinks) {
    cup.setDrink(drink, true);
    cup.update(0.016, 0);
    fx.hide();
    fx.update(10, 0); // clear the previous drink's ingredients
    fx.show(drink);
    fx.update(10, 0); // settle every ingredient at its resting spot

    const urls = {};
    for (const [view, rotY] of [['front', -0.2], ['angle', 0.7]]) {
      root.rotation.y = rotY;
      renderer.render(scene, camera);
      urls[view] = canvas.toDataURL('image/webp', 0.92);
    }
    out.set(drink.name, urls);
    onEach?.(drink.name, urls);
    await yieldToPage();
  }

  renderer.dispose();
  renderer.forceContextLoss();
  return out;
}
