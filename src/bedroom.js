import * as THREE from 'three';
import { fabric } from './props.js';

function drapedCover(bed, height, color) {
  const width = bed.w, foot = bed.d / 2;
  const geometry = new THREE.PlaneGeometry(width + 0.44, 1.42, 72, 64);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.attributes.position, uv = geometry.attributes.uv;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), z = positions.getZ(i) + foot - 0.47;
    const side = Math.max(0, Math.abs(x) - width / 2 + 0.035);
    const end = Math.max(0, z - foot + 0.035);
    const drop = Math.min(0.235, Math.hypot(side, end));
    const sideFold = Math.sin(z * 39 + x * 7) * Math.min(0.023, side * 0.14);
    const endFold = Math.sin(x * 34 + z * 5) * Math.min(0.021, end * 0.15);
    const wrinkle = 0.011 * Math.sin(13 * x + 4 * z + Math.sin(9 * z))
      + 0.005 * Math.sin(28 * z - x * 11);
    positions.setXYZ(i,
      x - Math.sign(x) * side * 0.78 + sideFold,
      height + 0.055 - drop + wrinkle,
      z - end * 0.8 + endFold);
    uv.setXY(i, x / 0.62, -z / 0.62);
  }
  geometry.computeVertexNormals();
  const material = fabric(color).clone();
  material.side = THREE.DoubleSide;
  const cover = new THREE.Mesh(geometry, material);
  cover.castShadow = cover.receiveShadow = true;
  return cover;
}

export function dressBed(bedObject, bed, color) {
  const ray = new THREE.Raycaster();
  bedObject.updateWorldMatrix(true, true);
  const center = bedObject.localToWorld(new THREE.Vector3(0, 2, bed.d * 0.20));
  ray.set(center, new THREE.Vector3(0, -1, 0));
  const surface = ray.intersectObject(bedObject, true)[0];
  if (surface) bedObject.add(drapedCover(bed, surface.point.y, color));
}

export function stageBedroom(house, furniture, scene) {
  const S = house.S;
  const room = S.style?.bedroomStudy;
  const bed = S.furniture.find(f => f.type === 'bed-single' && house.roomAt(f.x, f.z)?.name === room);
  if (!room || !bed) return;
  const group = new THREE.Group();
  group.name = 'Bedroom study staging';
  scene.add(group);
  const navy = new THREE.MeshStandardMaterial({ color: 0x202839, roughness: 0.77 });
  const blue = new THREE.MeshStandardMaterial({ color: 0x294578, roughness: 0.58 });
  const ivory = new THREE.MeshStandardMaterial({ color: 0xDED9CC, roughness: 0.64 });
  const glow = new THREE.MeshStandardMaterial({ color: 0xFFF4DA, emissive: 0xFFD698, emissiveIntensity: 1.55 });
  const box = (w, h, d, mat, x, y, z, rotation = 0) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotation;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const canvas = document.createElement('canvas');
  canvas.width = 8; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 128, 0, 0);
  gradient.addColorStop(0, 'rgba(255,219,160,0.65)');
  gradient.addColorStop(0.35, 'rgba(255,219,160,0.20)');
  gradient.addColorStop(1, 'rgba(255,219,160,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 8, 128);
  const washTexture = new THREE.CanvasTexture(canvas);
  washTexture.colorSpace = THREE.SRGBColorSpace;
  const wash = new THREE.MeshBasicMaterial({ map: washTexture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.65 });

  // The low treatment stays below the window and above the original baseboard.
  for (const [x, z, length, rotation] of [
    [16.617, 9.19, 3.69, -Math.PI / 2],
    [14.80, 11.09, 3.61, Math.PI],
  ]) {
    box(length, 0.74, 0.016, navy, x, 0.44, z, rotation);
    const ribs = Math.floor(length / 0.032);
    const slats = new THREE.InstancedMesh(new THREE.BoxGeometry(0.022, 0.74, 0.014), navy, ribs);
    const rib = new THREE.Object3D();
    rib.rotation.y = rotation;
    for (let i = 0; i < ribs; i++) {
      const u = ((i + 0.5) / ribs - 0.5) * length;
      rib.position.set(x + Math.cos(rotation) * u + Math.sin(rotation) * 0.013, 0.44, z - Math.sin(rotation) * u + Math.cos(rotation) * 0.013);
      rib.updateMatrix();
      slats.setMatrixAt(i, rib.matrix);
    }
    slats.receiveShadow = true;
    group.add(slats);
    box(length, 0.008, 0.022, glow, x, 0.815, z, rotation);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(length, 0.08), wash);
    halo.position.set(x + Math.sin(rotation) * 0.006, 0.858, z + Math.cos(rotation) * 0.006);
    halo.rotation.y = rotation;
    halo.userData.noAO = true;
    group.add(halo);
  }

  for (const z of [8.89, 9.86]) box(0.052, 0.65, 0.041, blue, 16.58, 1.51, z);
  for (const y of [1.30, 1.69]) {
    box(0.24, 0.026, 1.28, ivory, 16.49, y, 9.38);
    box(0.015, 0.008, 1.14, glow, 16.42, y - 0.018, 9.38);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 0.29), wash);
    halo.position.set(16.613, y - 0.157, 9.38);
    halo.rotation.set(0, -Math.PI / 2, Math.PI);
    halo.userData.noAO = true;
    group.add(halo);
  }
  for (let i = 0; i < 3; i++) box(0.145, 0.022, 0.23, blue, 16.47, 1.715 + 0.023 * i, 9.51 + 0.013 * i);
  const ceramic = new THREE.Mesh(new THREE.LatheGeometry([
    [0, 0], [0.044, 0], [0.081, 0.075], [0.039, 0.155], [0.024, 0.155], [0.024, 0.132],
  ].map(([r, y]) => new THREE.Vector2(r, y)), 32), navy);
  ceramic.position.set(16.48, 1.703, 8.98);
  group.add(ceramic);

  const bedObject = furniture.group.children.find(o => o.userData.furniture === 'bed-single' && o.position.x === bed.x && o.position.z === bed.z);
  if (!bedObject) return;
  dressBed(bedObject, bed, '#827C75');
  for (const z of [-0.62, -0.21, 0.21, 0.62]) {
    const light = new THREE.SpotLight(0xFFD5A0, 0.24, 0.85, 1.12, 0.94, 2);
    light.position.set(bed.w * 0.42, 0.15, z);
    light.target.position.set(bed.w * 0.64, 0, z);
    bedObject.add(light, light.target);
  }
}
