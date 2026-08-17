import * as THREE from 'three';
import { GameMode } from '../../types';

export interface PortalTrigger {
  name: string;
  mode: GameMode | 'shop' | 'pets';
  position: THREE.Vector3;
  color: string;
  icon: string;
  mesh: THREE.Group;
}

export function buildLobbyWorld(scene: THREE.Group): {
  portals: PortalTrigger[];
  spawnPoint: THREE.Vector3;
  fountainMesh: THREE.Group;
  decorations: THREE.Object3D[];
} {
  const portals: PortalTrigger[] = [];
  const decorations: THREE.Object3D[] = [];

  // Main Town Plaza circular island
  const plazaGeo = new THREE.CylinderGeometry(35, 36, 2, 32);
  const plazaMat = new THREE.MeshStandardMaterial({
    color: 0x86efac, // lush meadow green
    roughness: 0.7,
  });
  const plaza = new THREE.Mesh(plazaGeo, plazaMat);
  plaza.position.set(0, -1, 0);
  plaza.receiveShadow = true;
  scene.add(plaza);

  // Cobblestone center ring
  const stoneRingGeo = new THREE.RingGeometry(0, 18, 32);
  const stoneRingMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.5,
    side: THREE.DoubleSide,
  });
  const stoneRing = new THREE.Mesh(stoneRingGeo, stoneRingMat);
  stoneRing.rotation.x = -Math.PI / 2;
  stoneRing.position.y = 0.05;
  stoneRing.receiveShadow = true;
  scene.add(stoneRing);

  // Center Fountain
  const fountainGroup = new THREE.Group();
  const basinGeo = new THREE.CylinderGeometry(5, 5.5, 1.2, 24);
  const basinMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3 });
  const basin = new THREE.Mesh(basinGeo, basinMat);
  basin.position.y = 0.6;
  fountainGroup.add(basin);

  const waterGeo = new THREE.CylinderGeometry(4.6, 4.6, 0.2, 24);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.1,
    emissive: 0x0284c7,
    emissiveIntensity: 0.3,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.position.y = 1.1;
  fountainGroup.add(water);

  const centerPillar = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1.4, 3, 16),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.7, roughness: 0.2 })
  );
  centerPillar.position.y = 2.5;
  fountainGroup.add(centerPillar);

  // Floating Blox Diamond on top of fountain
  const diamond = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.2),
    new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.8,
      metalness: 0.9,
    })
  );
  diamond.position.y = 4.8;
  fountainGroup.add(diamond);
  scene.add(fountainGroup);

  // Portal definitions around the circular plaza
  const portalDefs: { name: string; mode: GameMode | 'shop' | 'pets'; angle: number; color: number; icon: string; title: string }[] = [
    { name: 'Mega Obby', mode: 'obby', angle: -Math.PI / 2, color: 0xec4899, icon: '🏃', title: 'RAINBOW OBBY' },
    { name: 'Candy Tycoon', mode: 'tycoon', angle: -Math.PI / 6, color: 0x3b82f6, icon: '🍭', title: 'CANDY TYCOON' },
    { name: 'Floor is Lava', mode: 'lava', angle: Math.PI / 6, color: 0xef4444, icon: '🌋', title: 'LAVA SURVIVAL' },
    { name: 'Pet Hatchery', mode: 'pets', angle: Math.PI / 2, color: 0xa855f7, icon: '🥚', title: 'PET HATCHERY' },
    { name: 'Studio Builder', mode: 'sandbox', angle: (5 * Math.PI) / 6, color: 0x10b981, icon: '🛠️', title: 'STUDIO BUILDER' },
    { name: 'Avatar Shop', mode: 'shop', angle: -(5 * Math.PI) / 6, color: 0xf59e0b, icon: '🛍️', title: 'AVATAR SHOP' },
  ];

  const portalRadius = 24;

  portalDefs.forEach((pd) => {
    const pGroup = new THREE.Group();
    const x = Math.cos(pd.angle) * portalRadius;
    const z = Math.sin(pd.angle) * portalRadius;
    pGroup.position.set(x, 0, z);
    pGroup.lookAt(0, 0, 0);

    // Arch Pillars
    const archMat = new THREE.MeshStandardMaterial({
      color: pd.color,
      roughness: 0.2,
      metalness: 0.3,
    });

    const leftCol = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 7, 16), archMat);
    leftCol.position.set(-2.5, 3.5, 0);
    pGroup.add(leftCol);

    const rightCol = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 7, 16), archMat);
    rightCol.position.set(2.5, 3.5, 0);
    pGroup.add(rightCol);

    const topArch = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1, 1), archMat);
    topArch.position.set(0, 7.2, 0);
    pGroup.add(topArch);

    // Swirling Portal Gate Canvas Texture
    const gateGeo = new THREE.PlaneGeometry(4.4, 6.2);
    const gateMat = new THREE.MeshBasicMaterial({
      color: pd.color,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    });
    const gateMesh = new THREE.Mesh(gateGeo, gateMat);
    gateMesh.position.set(0, 3.5, 0);
    pGroup.add(gateMesh);

    // Base Pad
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 3.8, 0.4, 16),
      new THREE.MeshStandardMaterial({ color: pd.color, emissive: pd.color, emissiveIntensity: 0.3 })
    );
    pad.position.y = 0.2;
    pGroup.add(pad);

    scene.add(pGroup);

    portals.push({
      name: pd.title,
      mode: pd.mode,
      position: new THREE.Vector3(x, 1, z),
      color: `#${pd.color.toString(16)}`,
      icon: pd.icon,
      mesh: pGroup,
    });
  });

  // Playground Trampoline in lobby
  const trampGeo = new THREE.CylinderGeometry(3, 3, 0.6, 16);
  const trampMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xeab308,
    emissiveIntensity: 0.4,
  });
  const tramp = new THREE.Mesh(trampGeo, trampMat);
  tramp.position.set(12, 0.3, 12);
  scene.add(tramp);
  decorations.push(tramp);

  // Palm Trees around perimeter
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8 + 0.3;
    const dist = 31;
    const treeGroup = new THREE.Group();
    treeGroup.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.6, 6, 8),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 })
    );
    trunk.position.y = 3;
    trunk.rotation.z = Math.sin(i) * 0.1;
    treeGroup.add(trunk);

    const leaves = new THREE.Mesh(
      new THREE.ConeGeometry(3.5, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 })
    );
    leaves.position.y = 6.5;
    treeGroup.add(leaves);

    scene.add(treeGroup);
    decorations.push(treeGroup);
  }

  return {
    portals,
    spawnPoint: new THREE.Vector3(0, 1.5, 10),
    fountainMesh: fountainGroup,
    decorations,
  };
}
