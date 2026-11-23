import * as THREE from 'three';
import { meterUV, texMat, TILE } from './look.js';

function artwork(colors, clock) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#eee6d7';
  ctx.fillRect(0, 0, 512, 512);
  if (clock) {
    ctx.translate(256, 256);
    ctx.strokeStyle = colors[0];
    for (let i = 0; i < 12; i++) {
      ctx.rotate(Math.PI / 6);
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, -199); ctx.lineTo(0, -218); ctx.stroke();
    }
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-74, -49); ctx.lineTo(0, 0); ctx.lineTo(95, -72); ctx.stroke();
  } else {
    ctx.fillStyle = colors[0];
    ctx.beginPath(); ctx.arc(342, 149, 61, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = colors[i + 1];
      ctx.beginPath();
      ctx.moveTo(0, 259 + i * 61);
      ctx.bezierCurveTo(168, 154 + i * 70, 310, 374 + i * 31, 512, 219 + i * 70);
      ctx.lineTo(512, 512); ctx.lineTo(0, 512); ctx.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.91 });
}

export function styleWalls(house) {
  const finishes = house.S.style?.wallDecor;
  if (!finishes?.length) return;
  const frame = new THREE.MeshStandardMaterial({ color: 0x594538, roughness: 0.45 });
  const trim = new THREE.MeshStandardMaterial({ color: 0xB39A71, metalness: 0.48, roughness: 0.48 });
  const lightFace = new THREE.MeshStandardMaterial({ color: 0xFFF5E5, emissive: 0xFFD1A1, emissiveIntensity: 0.65 });
  for (const { x, z, rot, width, tint, palette, decor = 'art', light = false } of finishes) {
    const group = new THREE.Group();
    group.name = 'Interior wall finish';
    group.position.set(x, 0, z);
    group.rotation.y = THREE.MathUtils.degToRad(rot);
    house.group.add(group);
    const add = (geo, mat, u, y, d) => {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(u, y, d);
      mesh.receiveShadow = true;
      group.add(mesh);
      return mesh;
    };
    const H = house.H - 0.08;
    const geometry = meterUV(new THREE.PlaneGeometry(width, H), TILE.limewash);
    add(geometry, texMat('limewash', { color: tint, bump: 0.27, roughness: 0.86 }), 0, H / 2 + 0.06, 0);
    for (const u of [-width / 2 + 0.014, width / 2 - 0.014]) {
      add(new THREE.BoxGeometry(0.009, H, 0.009), trim, u, H / 2 + 0.06, 0.005);
    }
    if (decor === 'clock') {
      add(new THREE.CircleGeometry(0.205, 48), frame, 0, 1.62, 0.017);
      add(new THREE.CircleGeometry(0.186, 48), artwork(palette, true), 0, 1.62, 0.019);
    } else {
      const offsets = decor === 'pair' ? [-0.30, 0.30] : [0];
      for (const u of offsets) {
        const colors = u > 0 ? [palette[2], palette[3], palette[1], palette[0]] : palette;
        add(new THREE.BoxGeometry(0.48, 0.57, 0.026), frame, u, 1.55, 0.018);
        add(new THREE.PlaneGeometry(0.443, 0.533), artwork(colors, false), u, 1.55, 0.032);
      }
    }
    if (light) {
      add(new THREE.BoxGeometry(0.53, 0.022, 0.085), trim, 0, 1.96, 0.063);
      add(new THREE.BoxGeometry(0.47, 0.009, 0.036), lightFace, 0, 1.944, 0.082);
      for (const u of [-0.19, 0.19]) {
        const lamp = new THREE.SpotLight(0xFFE1BE, 0.24, 1.05, 0.96, 1, 2);
        lamp.position.set(u, 1.92, 0.11);
        lamp.target.position.set(u, 1.53, 0.02);
        group.add(lamp, lamp.target);
      }
    }
  }
}
