import * as THREE from 'three';

export interface LavaArenaPlatform {
  mesh: THREE.Mesh;
  box: THREE.Box3;
  type: 'static' | 'bounce' | 'moving';
  update?: (delta: number, time: number) => void;
}

export function buildLavaWorld(scene: THREE.Group): {
  lavaMesh: THREE.Mesh;
  platforms: LavaArenaPlatform[];
  spawnPoint: THREE.Vector3;
  safePerch: THREE.Vector3;
} {
  const platforms: LavaArenaPlatform[] = [];

  // Lava floor (rises dynamically)
  const lavaGeo = new THREE.CylinderGeometry(50, 50, 4, 32);
  const lavaMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 0.8,
    roughness: 0.2,
  });
  const lavaMesh = new THREE.Mesh(lavaGeo, lavaMat);
  lavaMesh.position.set(0, -5, 0);
  scene.add(lavaMesh);

  // Outer arena boundary / stone pillars
  const arenaBase = new THREE.Mesh(
    new THREE.CylinderGeometry(48, 50, 2, 32),
    new THREE.MeshStandardMaterial({ color: 0x334155 })
  );
  arenaBase.position.set(0, -6, 0);
  arenaBase.receiveShadow = true;
  scene.add(arenaBase);

  // Central Mega Tower
  const towerHeight = 35;
  for (let lvl = 0; lvl < 7; lvl++) {
    const y = lvl * 4 + 1;
    const rad = 14 - lvl * 1.5;
    const towerGeo = new THREE.CylinderGeometry(rad, rad + 0.5, 1.2, 16);
    const towerMat = new THREE.MeshStandardMaterial({
      color: lvl % 2 === 0 ? 0x64748b : 0x475569,
      roughness: 0.4,
    });
    const towerLvl = new THREE.Mesh(towerGeo, towerMat);
    towerLvl.position.set(0, y, 0);
    towerLvl.receiveShadow = true;
    scene.add(towerLvl);

    platforms.push({
      mesh: towerLvl,
      box: new THREE.Box3().setFromObject(towerLvl),
      type: 'static',
    });

    // Outer spiral steps
    for (let s = 0; s < 3; s++) {
      const angle = (lvl * 1.2) + (s * 0.4);
      const stepDist = rad + 3;
      const stepGeo = new THREE.BoxGeometry(4, 0.8, 4);
      const stepMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
      const step = new THREE.Mesh(stepGeo, stepMat);
      step.position.set(Math.cos(angle) * stepDist, y + s * 1.2, Math.sin(angle) * stepDist);
      scene.add(step);

      platforms.push({
        mesh: step,
        box: new THREE.Box3().setFromObject(step),
        type: 'static',
      });
    }
  }

  // 4 Outer High Towers with Jump Trampolines
  const towerPositions = [
    { x: 22, z: 22, color: 0x3b82f6 },
    { x: -22, z: 22, color: 0x10b981 },
    { x: 22, z: -22, color: 0x8b5cf6 },
    { x: -22, z: -22, color: 0xec4899 },
  ];

  towerPositions.forEach((tp) => {
    // High Pillar
    const colGeo = new THREE.CylinderGeometry(3, 4, 30, 16);
    const colMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const col = new THREE.Mesh(colGeo, colMat);
    col.position.set(tp.x, 14, tp.z);
    scene.add(col);

    // Top Platform
    const topGeo = new THREE.CylinderGeometry(5, 5, 1, 16);
    const topMat = new THREE.MeshStandardMaterial({ color: tp.color });
    const topMesh = new THREE.Mesh(topGeo, topMat);
    topMesh.position.set(tp.x, 29, tp.z);
    scene.add(topMesh);

    platforms.push({
      mesh: topMesh,
      box: new THREE.Box3().setFromObject(topMesh),
      type: 'static',
    });

    // Trampoline at base of pillar
    const trampGeo = new THREE.CylinderGeometry(3, 3, 0.8, 16);
    const trampMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 0.5,
    });
    const tramp = new THREE.Mesh(trampGeo, trampMat);
    tramp.position.set(tp.x * 0.6, 2, tp.z * 0.6);
    scene.add(tramp);

    platforms.push({
      mesh: tramp,
      box: new THREE.Box3().setFromObject(tramp),
      type: 'bounce',
    });
  });

  // Floating Airship at top (Peak Safe Zone)
  const shipGeo = new THREE.BoxGeometry(16, 2, 8);
  const shipMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 0.3 });
  const ship = new THREE.Mesh(shipGeo, shipMat);
  ship.position.set(0, 32, 0);
  scene.add(ship);

  platforms.push({
    mesh: ship,
    box: new THREE.Box3().setFromObject(ship),
    type: 'static',
    update: (delta, time) => {
      ship.position.y = 32 + Math.sin(time * 1.5) * 0.5;
    },
  });

  return {
    lavaMesh,
    platforms,
    spawnPoint: new THREE.Vector3(0, 3, 10),
    safePerch: new THREE.Vector3(0, 34, 0),
  };
}
