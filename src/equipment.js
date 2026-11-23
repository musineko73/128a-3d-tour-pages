import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const mat = (color, roughness = 0.66) => new THREE.MeshStandardMaterial({ color, roughness });
const black = mat(0x272A2D), steel = mat(0x9A9DA1, 0.39), blue = mat(0x427A88);
const seat = mat(0x5E5049, 0.84), tan = mat(0xB6A18B), orange = mat(0xCA672B), white = mat(0xE5DDD0);
const display = new THREE.MeshStandardMaterial({ color: 0x244344, emissive: 0x183636, emissiveIntensity: 0.65 });

export function equipment(f, group) {
  const { w, d, h } = f;
  const mesh = (geometry, material, x, y, z) => {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z);
    group.add(m);
    return m;
  };
  const box = (width, height, depth, material, x, y, z, r = 0.018) =>
    mesh(new RoundedBoxGeometry(width, height, depth, 2, r), material, x, y, z);
  const rod = (a, b, r, material) => {
    const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b);
    const pos = from.clone().lerp(to, 0.5), direction = to.sub(from);
    const m = mesh(new THREE.CylinderGeometry(r, r, direction.length(), 14), material, pos.x, pos.y, pos.z);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  };
  if (f.type === 'treadmill') {
    box(w, 0.15, d, black, 0, 0.085, 0);
    box(w * 0.85, 0.012, d * 0.73, mat(0x393B3D), -0.04, 0.166, 0);
    for (const z of [-d * 0.4, d * 0.4]) {
      rod([w * 0.40, 0.14, z], [w * 0.29, h - 0.12, z], 0.027, steel);
      rod([w * 0.29, h - 0.12, z], [w * 0.03, h - 0.17, z], 0.031, black);
    }
    box(0.17, 0.055, d * 0.72, black, w * 0.28, h - 0.05, 0).rotation.z = -0.32;
    box(0.093, 0.012, d * 0.4, display, w * 0.28, h - 0.019, 0).rotation.z = -0.32;
  } else if (f.type === 'massage-chair') {
    box(w * 0.86, 0.18, d * 0.89, black, 0, 0.13, 0, 0.06);
    box(w * 0.72, 0.18, d * 0.55, seat, 0, 0.43, 0.03, 0.08);
    box(w * 0.86, 0.79, 0.20, tan, 0, h - 0.42, -d * 0.25, 0.09).rotation.x = -0.23;
    box(w * 0.67, 0.67, 0.13, seat, 0, h - 0.43, -d * 0.16, 0.06).rotation.x = -0.23;
    for (const s of [-1, 1]) {
      box(0.15, 0.31, d * 0.62, tan, s * (w / 2 - 0.075), 0.46, -0.015, 0.057);
      box(w * 0.26, 0.28, 0.24, seat, s * w * 0.17, 0.25, d * 0.32, 0.05);
    }
  } else if (f.type === 'bike-storage') {
    const bike = (width, r, y, z, frame) => {
      const left = [-width / 2, y + r, z], right = [width / 2, y + r, z];
      const crank = [-0.04, y + r * 0.95, z], saddle = [-0.13, y + r * 2.65, z], fork = [width * 0.32, y + r * 2.52, z];
      for (const [x, wy] of [left, right]) {
        mesh(new THREE.TorusGeometry(r, 0.019, 12, 48), black, x, wy, z);
        mesh(new THREE.TorusGeometry(r - 0.018, 0.006, 8, 40), steel, x, wy, z);
        for (let i = 0; i < 10; i++) {
          const a = i * Math.PI / 5;
          rod([x, wy, z], [x + (r - 0.02) * Math.cos(a), wy + (r - 0.02) * Math.sin(a), z], 0.002, steel);
        }
      }
      for (const [a, b] of [[left, crank], [left, saddle], [crank, saddle], [crank, fork], [saddle, fork], [right, fork]]) rod(a, b, 0.013, frame);
      box(0.14, 0.035, 0.105, black, saddle[0], saddle[1] + 0.03, z);
      rod(fork, [fork[0] + 0.04, fork[1] + 0.13, z], 0.014, steel);
      rod([fork[0] + 0.04, fork[1] + 0.13, z - 0.11], [fork[0] + 0.04, fork[1] + 0.13, z + 0.11], 0.014, black);
    };
    bike(0.93, 0.235, 0.025, -0.055, blue);
    bike(0.62, 0.156, 1.0, -0.065, orange);
    const x = -0.25, z = d * 0.32;
    box(0.40, 0.036, 0.092, blue, x, 0.092, z);
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.03, 24).rotateX(Math.PI / 2), black, x + s * 0.2, 0.048, z);
    rod([x + 0.19, 0.1, z], [x + 0.13, 0.76, z], 0.014, steel);
    rod([x + 0.13, 0.76, z - 0.07], [x + 0.13, 0.76, z + 0.07], 0.012, black);
    box(0.73, 0.045, 0.14, steel, 0, 0.97, -d / 2 + 0.07);
  } else {
    const oak = mat(0xA78663);
    for (const y of [0.12, 0.53, 1.02, 1.49]) box(w, 0.032, d, oak, 0, y, 0);
    for (const x of [-w / 2 + 0.02, w / 2 - 0.02]) box(0.036, h, d, oak, x, h / 2, 0);
    const ball = (x, y, r, material, basketball) => {
      const b = mesh(new THREE.SphereGeometry(r, 32, 24), material, x, y, 0.012);
      if (basketball) {
        for (const angle of [0, Math.PI / 2, Math.PI / 4]) mesh(new THREE.TorusGeometry(r - 0.001, 0.003, 8, 48), black, x, y, 0.012).rotation.y = angle;
      } else {
        const geometry = new THREE.IcosahedronGeometry(r * 1.008);
        const points = geometry.attributes.position;
        for (let i = 0; i < points.count; i += 3) {
          if (i % 12 !== 0) continue;
          const center = new THREE.Vector3().fromBufferAttribute(points, i)
            .add(new THREE.Vector3().fromBufferAttribute(points, i + 1))
            .add(new THREE.Vector3().fromBufferAttribute(points, i + 2)).normalize();
          const patch = new THREE.Mesh(new THREE.CircleGeometry(r * 0.22, 5), black);
          patch.position.copy(center.clone().multiplyScalar(r * 1.002));
          patch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), center);
          b.add(patch);
        }
      }
    };
    ball(-0.24, 1.156, 0.119, orange, true);
    ball(0.22, 1.146, 0.108, white, false);
    for (const z of [-0.06, 0.065]) {
      rod([-0.30, 0.585, z], [-0.08, 0.585, z], 0.014, steel);
      for (const x of [-0.29, -0.09]) box(0.047, 0.075, 0.075, black, x, 0.585, z);
    }
    mesh(new THREE.CylinderGeometry(0.067, 0.067, 0.31, 24).rotateZ(Math.PI / 2), blue, 0.23, 0.616, 0.02);
    box(0.33, 0.22, 0.25, tan, -0.23, 0.248, 0);
    box(0.33, 0.18, 0.25, white, 0.23, 0.225, 0);
  }
  return group;
}
