import * as THREE from 'three';
import { SandboxBlock } from '../../types';

export function buildSandboxGrid(scene: THREE.Group): {
  gridHelper: THREE.GridHelper;
  basePlane: THREE.Mesh;
} {
  const size = 80;
  const divisions = 40;
  const gridHelper = new THREE.GridHelper(size, divisions, 0x3b82f6, 0x94a3b8);
  gridHelper.position.y = 0.05;
  scene.add(gridHelper);

  const planeGeo = new THREE.PlaneGeometry(size, size);
  const planeMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.8,
  });
  const basePlane = new THREE.Mesh(planeGeo, planeMat);
  basePlane.rotation.x = -Math.PI / 2;
  basePlane.receiveShadow = true;
  scene.add(basePlane);

  return { gridHelper, basePlane };
}

export function instantiateSandboxBlock(block: SandboxBlock, scene: THREE.Group): THREE.Object3D {
  let geo: THREE.BufferGeometry;
  let mat: THREE.Material;

  const color = new THREE.Color(block.color);

  if (block.type === 'cube') {
    geo = new THREE.BoxGeometry(block.scale[0], block.scale[1], block.scale[2]);
    mat = new THREE.MeshStandardMaterial({ color, roughness: 0.3 });
  } else if (block.type === 'ramp') {
    // Triangular prism wedge for ramp
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(block.scale[2], 0);
    shape.lineTo(0, block.scale[1]);
    shape.closePath();

    const extrudeSettings = { depth: block.scale[0], bevelEnabled: false };
    geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    mat = new THREE.MeshStandardMaterial({ color, roughness: 0.3 });
  } else if (block.type === 'bounce' || block.type === 'trampoline') {
    geo = new THREE.CylinderGeometry(block.scale[0] / 2, block.scale[0] / 2, block.scale[1], 16);
    mat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 0.5,
    });
  } else if (block.type === 'speed') {
    geo = new THREE.BoxGeometry(block.scale[0], 0.2, block.scale[2]);
    mat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.7,
    });
  } else if (block.type === 'lava') {
    geo = new THREE.BoxGeometry(block.scale[0], block.scale[1], block.scale[2]);
    mat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.8,
    });
  } else if (block.type === 'spinner') {
    geo = new THREE.BoxGeometry(block.scale[0] * 2, 0.4, 0.8);
    mat = new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xbe185d, emissiveIntensity: 0.4 });
  } else if (block.type === 'coin') {
    geo = new THREE.CylinderGeometry(0.7, 0.7, 0.2, 16);
    mat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, emissive: 0xeab308, emissiveIntensity: 0.4 });
  } else {
    // Checkpoint
    geo = new THREE.CylinderGeometry(2, 2, 0.3, 16);
    mat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.5 });
  }

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(block.position[0], block.position[1], block.position[2]);
  mesh.rotation.set(block.rotation[0], block.rotation[1], block.rotation[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = block.id;

  scene.add(mesh);
  return mesh;
}

export function generateSandboxPreset(name: string): SandboxBlock[] {
  const blocks: SandboxBlock[] = [];
  let idCounter = 1;

  const nextId = () => `preset_block_${idCounter++}`;

  if (name === 'spiral') {
    const rainbow = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899'];
    const totalSteps = 24;
    for (let i = 0; i < totalSteps; i++) {
      const angle = i * 0.35;
      const radius = 8;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      const y = (i + 1) * 1.0;
      const color = rainbow[i % rainbow.length];

      blocks.push({
        id: nextId(),
        type: 'cube',
        position: [x, y, z],
        rotation: [0, -angle, 0],
        color,
        scale: [3, 0.8, 3],
      });

      if (i % 4 === 0 && i > 0) {
        blocks.push({
          id: nextId(),
          type: 'coin',
          position: [x, y + 1.5, z],
          rotation: [0, 0, 0],
          color: '#facc15',
          scale: [1, 1, 1],
        });
      }
    }

    // Top peak platform with super trampoline
    blocks.push({
      id: nextId(),
      type: 'cube',
      position: [Math.sin(totalSteps * 0.35) * 8, (totalSteps + 1) * 1.0, Math.cos(totalSteps * 0.35) * 8],
      rotation: [0, 0, 0],
      color: '#facc15',
      scale: [6, 1, 6],
    });

    blocks.push({
      id: nextId(),
      type: 'trampoline',
      position: [Math.sin(totalSteps * 0.35) * 8, (totalSteps + 1) * 1.0 + 0.8, Math.cos(totalSteps * 0.35) * 8],
      rotation: [0, 0, 0],
      color: '#facc15',
      scale: [3, 0.5, 3],
    });
  } else if (name === 'trampoline') {
    // Floating island trampolines launching from one to another
    const islandPositions: [number, number, number][] = [
      [0, 1, 0],
      [0, 4, 12],
      [12, 10, 12],
      [12, 16, -2],
      [-4, 22, -6],
      [-16, 28, 4],
      [0, 36, 0],
    ];

    islandPositions.forEach((pos, idx) => {
      blocks.push({
        id: nextId(),
        type: 'cube',
        position: [pos[0], pos[1], pos[2]],
        rotation: [0, 0, 0],
        color: idx === islandPositions.length - 1 ? '#eab308' : '#3b82f6',
        scale: [6, 1, 6],
      });

      if (idx < islandPositions.length - 1) {
        blocks.push({
          id: nextId(),
          type: 'trampoline',
          position: [pos[0], pos[1] + 0.6, pos[2]],
          rotation: [0, 0, 0],
          color: '#facc15',
          scale: [3.5, 0.4, 3.5],
        });
      } else {
        // Goal Checkpoint and Coins on top peak
        blocks.push({
          id: nextId(),
          type: 'checkpoint',
          position: [pos[0], pos[1] + 0.6, pos[2]],
          rotation: [0, 0, 0],
          color: '#10b981',
          scale: [3, 0.4, 3],
        });
        blocks.push({
          id: nextId(),
          type: 'coin',
          position: [pos[0], pos[1] + 2, pos[2]],
          rotation: [0, 0, 0],
          color: '#facc15',
          scale: [1, 1, 1],
        });
      }
    });
  } else if (name === 'obby') {
    // Linear obstacle course
    let curZ = -10;
    blocks.push({
      id: nextId(),
      type: 'cube',
      position: [0, 1, curZ],
      rotation: [0, 0, 0],
      color: '#10b981',
      scale: [6, 1, 6],
    });

    // Speed runway
    curZ += 8;
    blocks.push({
      id: nextId(),
      type: 'speed',
      position: [0, 1, curZ],
      rotation: [0, 0, 0],
      color: '#38bdf8',
      scale: [4, 0.4, 8],
    });

    // Lava gaps
    curZ += 8;
    blocks.push({
      id: nextId(),
      type: 'lava',
      position: [0, 0.6, curZ],
      rotation: [0, 0, 0],
      color: '#ef4444',
      scale: [8, 0.8, 6],
    });

    // Stepping stones across lava
    [-2, 2].forEach((x, i) => {
      blocks.push({
        id: nextId(),
        type: 'cube',
        position: [x, 2 + i * 0.5, curZ + (i === 0 ? -1.5 : 1.5)],
        rotation: [0, 0, 0],
        color: '#facc15',
        scale: [2, 1, 2],
      });
    });

    // Trampoline launch to goal
    curZ += 8;
    blocks.push({
      id: nextId(),
      type: 'trampoline',
      position: [0, 1, curZ],
      rotation: [0, 0, 0],
      color: '#facc15',
      scale: [4, 0.6, 4],
    });

    // High goal platform
    blocks.push({
      id: nextId(),
      type: 'cube',
      position: [0, 14, curZ + 12],
      rotation: [0, 0, 0],
      color: '#a855f7',
      scale: [8, 1, 8],
    });
    blocks.push({
      id: nextId(),
      type: 'coin',
      position: [0, 16, curZ + 12],
      rotation: [0, 0, 0],
      color: '#facc15',
      scale: [1.2, 1.2, 1.2],
    });
  } else if (name === 'castle') {
    // Castle 4 pillars + walls + stairs
    for (let x = -8; x <= 8; x += 16) {
      for (let z = -8; z <= 8; z += 16) {
        for (let y = 1; y <= 9; y += 2) {
          blocks.push({
            id: nextId(),
            type: 'cube',
            position: [x, y, z],
            rotation: [0, 0, 0],
            color: '#64748b',
            scale: [3, 2, 3],
          });
        }
      }
    }

    // High walkway
    blocks.push({
      id: nextId(),
      type: 'cube',
      position: [0, 9, -8],
      rotation: [0, 0, 0],
      color: '#475569',
      scale: [14, 1, 3],
    });
    blocks.push({
      id: nextId(),
      type: 'cube',
      position: [0, 9, 8],
      rotation: [0, 0, 0],
      color: '#475569',
      scale: [14, 1, 3],
    });
    blocks.push({
      id: nextId(),
      type: 'cube',
      position: [-8, 9, 0],
      rotation: [0, 0, 0],
      color: '#475569',
      scale: [3, 1, 14],
    });
    blocks.push({
      id: nextId(),
      type: 'cube',
      position: [8, 9, 0],
      rotation: [0, 0, 0],
      color: '#475569',
      scale: [3, 1, 14],
    });

    // Trampoline in courtyard
    blocks.push({
      id: nextId(),
      type: 'trampoline',
      position: [0, 0.6, 0],
      rotation: [0, 0, 0],
      color: '#facc15',
      scale: [4, 0.5, 4],
    });
  }

  return blocks;
}
