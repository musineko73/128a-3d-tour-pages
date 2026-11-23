import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { meterUV } from './look.js';

export const STONE_TILE = 0.78;

export function quartzMaterial() {
  const size = 1024, canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  let seed = 971;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  ctx.fillStyle = '#77736e';
  ctx.fillRect(0, 0, size, size);
  const colors = ['#484644', '#605d59', '#8b8580', '#a19c95', '#b7b2a9', '#d1ccc1'];
  for (let i = 0; i < 29000; i++) {
    const x = rand() * size, y = rand() * size, r = 0.45 + rand() ** 3 * 4;
    ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
    const dx = x + r > size ? -size : x - r < 0 ? size : 0;
    const dy = y + r > size ? -size : y - r < 0 ? size : 0;
    ctx.beginPath();
    for (const px of dx ? [x, x + dx] : [x]) for (const py of dy ? [y, y + dy] : [y]) {
      ctx.moveTo(px - r, py);
      ctx.lineTo(px - r * 0.4, py - r * 0.55);
      ctx.lineTo(px + r * 0.62, py - r * 0.33);
      ctx.lineTo(px + r, py + r * 0.32);
      ctx.lineTo(px + r * 0.1, py + r * 0.64);
      ctx.closePath();
    }
    ctx.fill();
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 8;
  return new THREE.MeshPhysicalMaterial({ map, roughness: 0.29, clearcoat: 0.18, clearcoatRoughness: 0.24 });
}

function roundedLoop(w, d, r) {
  const points = [];
  for (let i = 0; i < 4; i++) {
    const cx = (i === 0 || i === 3 ? 1 : -1) * (w / 2 - r);
    const cz = (i < 2 ? 1 : -1) * (d / 2 - r);
    for (let j = 0; j <= 8; j++) {
      const a = (i + j / 8) * Math.PI / 2;
      points.push(new THREE.Vector2(cx + Math.cos(a) * r, cz + Math.sin(a) * r));
    }
  }
  return points;
}

export function insetSink(group, f, stone, metal) {
  const { w, d } = f, height = f.h ?? 0.9, x = w > 1.4 ? w * 0.15 : 0, z = 0.035;
  const width = Math.min(0.68, w - 0.12), depth = Math.min(0.43, d - 0.16);
  const rim = roundedLoop(width, depth, 0.052);
  const slab = new THREE.Shape([
    new THREE.Vector2(-w / 2 - 0.01, -d / 2 - 0.01),
    new THREE.Vector2(w / 2 + 0.01, -d / 2 - 0.01),
    new THREE.Vector2(w / 2 + 0.01, d / 2 + 0.11),
    new THREE.Vector2(-w / 2 - 0.01, d / 2 + 0.11),
  ]);
  slab.holes.push(new THREE.Path(rim.map(p => new THREE.Vector2(x + p.x, -z - p.y))));
  const solid = new THREE.ExtrudeGeometry(slab, { depth: 0.036, bevelEnabled: false });
  solid.rotateX(-Math.PI / 2);
  const worktop = new THREE.Mesh(meterUV(solid, STONE_TILE), stone);
  worktop.position.y = height - 0.036;
  worktop.castShadow = worktop.receiveShadow = true;
  group.add(worktop);

  const levels = [
    [width + 0.027, depth + 0.027, 0.064, 0.002],
    [width + 0.024, depth + 0.024, 0.063, 0.006],
    [width - 0.008, depth - 0.008, 0.050, 0.004],
    [width - 0.032, depth - 0.030, 0.044, -0.016],
    [width - 0.112, depth - 0.084, 0.062, -0.156],
    [width - 0.168, depth - 0.134, 0.055, -0.182],
  ];
  const p = [], indices = [], n = rim.length;
  for (const [rw, rd, r, y] of levels) for (const point of roundedLoop(rw, rd, r)) {
    p.push(point.x, y, point.y);
  }
  for (let row = 0; row < levels.length - 1; row++) for (let i = 0; i < n; i++) {
    const a = row * n + i, b = row * n + (i + 1) % n;
    indices.push(a, a + n, b, b, a + n, b + n);
  }
  const floor = p.length / 3, inner = (levels.length - 1) * n;
  p.push(0, -0.186, 0);
  for (let i = 0; i < n; i++) indices.push(inner + i, floor, inner + (i + 1) % n);
  const bowl = new THREE.BufferGeometry();
  bowl.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  bowl.setIndex(indices);
  bowl.computeVertexNormals();
  const basin = new THREE.Mesh(bowl, metal);
  basin.position.set(x, height, z);
  basin.receiveShadow = true;
  group.add(basin);
  const drain = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.004, 32), metal);
  const drainZ = z - 0.06;
  drain.position.set(x, height - 0.182, drainZ);
  group.add(drain);
  const dark = new THREE.MeshStandardMaterial({ color: 0x292B2B, roughness: 0.59 });
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.0027, 12).rotateX(-Math.PI / 2), dark);
    hole.position.set(x + Math.cos(angle) * 0.018, height - 0.1798, drainZ + Math.sin(angle) * 0.018);
    group.add(hole);
  }
  return new THREE.Vector3(x, height + 0.085, z + 0.10);
}

export function displayCabinets(group, f, box, stone, mats) {
  const back = -f.d / 2 - 0.11, bottom = 1.53, top = 2.23, depth = 0.32;
  const led = new THREE.MeshStandardMaterial({ color: 0xFFF6E7, emissive: 0xFFE4BB, emissiveIntensity: 2.1 });
  const crockery = new THREE.MeshStandardMaterial({ color: 0xE8DED0, roughness: 0.37 });
  const dish = new THREE.LatheGeometry([
    new THREE.Vector2(0.002, 0), new THREE.Vector2(0.050, 0), new THREE.Vector2(0.103, 0.020),
    new THREE.Vector2(0.105, 0.024), new THREE.Vector2(0.051, 0.007), new THREE.Vector2(0.002, 0.007),
  ], 32);
  for (const [i, [a, b]] of f.upper.entries()) {
    const width = b - a, x = (a + b) / 2, z = back + depth / 2;
    const display = i === 0 ? 0 : Math.min(0.45, width * 0.31);
    box(width, 0.025, depth, mats.greige, x, bottom, z);
    box(width, 0.026, depth, mats.greige, x, top - 0.026, z);
    box(width, top - bottom - 0.05, 0.022, mats.oak, x, bottom + 0.025, back + 0.016);
    for (const edge of [a + 0.012, b - 0.012]) box(0.024, top - bottom - 0.05, depth, mats.greige, edge, bottom + 0.025, z);
    const count = Math.max(1, Math.round((width - display) / 0.52));
    const unit = (width - display - 0.038) / count;
    for (let j = 0; j < count; j++) {
      const geometry = new RoundedBoxGeometry(unit - 0.004, top - bottom - 0.02, 0.032, 2, 0.004);
      const door = new THREE.Mesh(geometry, mats.greige);
      door.position.set(a + display + 0.019 + (j + 0.5) * unit, (top + bottom) / 2, back + depth + 0.008);
      door.castShadow = door.receiveShadow = true;
      group.add(door);
    }
    if (display) {
      const sx = a + display / 2;
      box(display - 0.018, 0.02, depth - 0.045, mats.oak, sx, 1.88, z);
      box(0.019, top - bottom - 0.05, depth, mats.oak, a + display, bottom + 0.025, z);
      for (const y of [bottom + 0.025, 1.9]) for (let j = 0; j < 4; j++) {
        const plate = new THREE.Mesh(dish, crockery);
        plate.position.set(sx + j * 0.002, y + j * 0.008, z + 0.028);
        plate.castShadow = plate.receiveShadow = true;
        group.add(plate);
      }
    }
    box(width, bottom - (f.h ?? 0.9), 0.019, stone, x, f.h ?? 0.9, back + 0.01, STONE_TILE);
    const strip = box(width - 0.09, 0.009, 0.022, led, x, bottom - 0.009, back + depth - 0.056);
    strip.castShadow = false;
    const spots = Math.max(1, Math.ceil(width / 0.46));
    for (let j = 0; j < spots; j++) {
      const lx = a + (j + 0.5) * width / spots;
      const light = new THREE.SpotLight(0xFFE8C9, 1.6, 1.38, 1.09, 0.96, 2);
      light.position.set(lx, bottom - 0.017, back + depth - 0.055);
      light.target.position.set(lx, 0.91, back + 0.24);
      group.add(light, light.target);
    }
  }
}
