import * as THREE from 'three';

export interface ObbyObstacle {
  mesh: THREE.Object3D;
  type: 'static' | 'spinner' | 'fading' | 'trampoline' | 'speed' | 'lava' | 'coin' | 'gem' | 'checkpoint' | 'finish';
  stageIndex: number;
  update?: (delta: number, time: number) => void;
  onPlayerTouch?: () => void;
  isTrigger?: boolean;
  box?: THREE.Box3;
  fadeState?: { currentOpacity: number; fadingOut: boolean; timer: number };
}

export interface ObbyStageInfo {
  id: number;
  name: string;
  spawn: THREE.Vector3;
  color: string;
}

export function buildObbyWorld(scene: THREE.Group): {
  obstacles: ObbyObstacle[];
  checkpoints: THREE.Vector3[];
  stages: ObbyStageInfo[];
} {
  const obstacles: ObbyObstacle[] = [];
  const checkpoints: THREE.Vector3[] = [];
  const stages: ObbyStageInfo[] = [];

  // Base sky platform & stages
  const stageDefs = [
    { id: 1, name: 'Rainbow Steps', color: '#ec4899', startZ: 0 },
    { id: 2, name: 'Laser Spinners', color: '#f97316', startZ: 60 },
    { id: 3, name: 'Bouncy Trampolines', color: '#eab308', startZ: 120 },
    { id: 4, name: 'Fading Clouds', color: '#22c55e', startZ: 180 },
    { id: 5, name: 'Speed Highway', color: '#06b6d4', startZ: 240 },
    { id: 6, name: 'Lava Magma Jump', color: '#ef4444', startZ: 300 },
    { id: 7, name: 'Windmill of Doom', color: '#8b5cf6', startZ: 360 },
    { id: 8, name: 'Sky Tightrope', color: '#ec4899', startZ: 420 },
    { id: 9, name: 'Gravity Helix', color: '#3b82f6', startZ: 480 },
    { id: 10, name: 'Golden Cloud Castle', color: '#fbbf24', startZ: 540 },
  ];

  const colors = [0xef4444, 0xf97316, 0xfacc15, 0x22c55e, 0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xec4899];

  stageDefs.forEach((st, sIdx) => {
    const startPos = new THREE.Vector3(0, sIdx * 6 + 2, st.startZ);
    checkpoints.push(startPos.clone().add(new THREE.Vector3(0, 1.5, 0)));
    stages.push({
      id: st.id,
      name: st.name,
      spawn: startPos.clone().add(new THREE.Vector3(0, 1.5, 0)),
      color: st.color,
    });

    // Checkpoint platform
    const padGeo = new THREE.CylinderGeometry(4, 4.2, 1, 16);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0x059669,
      emissiveIntensity: 0.2,
    });
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.position.copy(startPos);
    padMesh.receiveShadow = true;
    scene.add(padMesh);

    // Glowing stage flag / ring
    const ringGeo = new THREE.TorusGeometry(3.5, 0.2, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.set(startPos.x, startPos.y + 0.6, startPos.z);
    scene.add(ringMesh);

    // Stage signpost
    const poleGeo = new THREE.CylinderGeometry(0.15, 0.15, 4);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(startPos.x - 3.2, startPos.y + 2, startPos.z);
    scene.add(pole);

    const bannerGeo = new THREE.BoxGeometry(2.5, 1.2, 0.1);
    const bannerMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
    const banner = new THREE.Mesh(bannerGeo, bannerMat);
    banner.position.set(startPos.x - 3.2, startPos.y + 3.2, startPos.z);
    scene.add(banner);

    obstacles.push({
      mesh: padMesh,
      type: 'checkpoint',
      stageIndex: sIdx,
      box: new THREE.Box3().setFromObject(padMesh),
    });

    // Generate obstacles for this stage
    const zBase = st.startZ;
    const yBase = sIdx * 6 + 2;

    if (sIdx === 0) {
      // Stage 1: Stepping stones
      for (let i = 1; i <= 6; i++) {
        const xOffset = Math.sin(i * 1.2) * 4;
        const stoneGeo = new THREE.CylinderGeometry(2, 2.2, 0.8, 16);
        const stoneMat = new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.3 });
        const stone = new THREE.Mesh(stoneGeo, stoneMat);
        stone.position.set(xOffset, yBase + i * 0.4, zBase + i * 8);
        stone.castShadow = true;
        stone.receiveShadow = true;
        scene.add(stone);

        obstacles.push({
          mesh: stone,
          type: 'static',
          stageIndex: sIdx,
          box: new THREE.Box3().setFromObject(stone),
        });

        // Floating coin
        spawnCoin(scene, obstacles, stone.position.x, stone.position.y + 2, stone.position.z, sIdx);
      }
    } else if (sIdx === 1) {
      // Stage 2: Laser Spinners
      for (let i = 1; i <= 4; i++) {
        const platGeo = new THREE.BoxGeometry(6, 0.8, 6);
        const platMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
        const plat = new THREE.Mesh(platGeo, platMat);
        plat.position.set(0, yBase + i * 0.5, zBase + i * 12);
        plat.receiveShadow = true;
        scene.add(plat);
        obstacles.push({ mesh: plat, type: 'static', stageIndex: sIdx, box: new THREE.Box3().setFromObject(plat) });

        // Spinning laser beam
        const laserGroup = new THREE.Group();
        laserGroup.position.set(0, yBase + i * 0.5 + 0.6, zBase + i * 12);

        const laserGeo = new THREE.BoxGeometry(7, 0.4, 0.4);
        const laserMat = new THREE.MeshStandardMaterial({
          color: 0xef4444,
          emissive: 0xef4444,
          emissiveIntensity: 1.0,
        });
        const laser = new THREE.Mesh(laserGeo, laserMat);
        laser.castShadow = true;
        laserGroup.add(laser);
        scene.add(laserGroup);

        const speed = (i % 2 === 0 ? 1 : -1) * (1.5 + i * 0.3);
        obstacles.push({
          mesh: laserGroup,
          type: 'lava',
          stageIndex: sIdx,
          update: (delta) => {
            laserGroup.rotation.y += delta * speed;
          },
        });
      }
    } else if (sIdx === 2) {
      // Stage 3: Bouncy Trampolines
      for (let i = 1; i <= 4; i++) {
        const bounceGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.6, 16);
        const bounceMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xd97706,
          emissiveIntensity: 0.3,
          roughness: 0.2,
        });
        const bounce = new THREE.Mesh(bounceGeo, bounceMat);
        const xPos = (i % 2 === 0 ? 5 : -5);
        bounce.position.set(xPos, yBase + (i - 1) * 2, zBase + i * 12);
        scene.add(bounce);

        // Arrow pattern
        const arrowRing = new THREE.Mesh(
          new THREE.TorusGeometry(1.8, 0.15, 8, 16),
          new THREE.MeshBasicMaterial({ color: 0xfef08a })
        );
        arrowRing.rotation.x = Math.PI / 2;
        arrowRing.position.set(bounce.position.x, bounce.position.y + 0.35, bounce.position.z);
        scene.add(arrowRing);

        obstacles.push({
          mesh: bounce,
          type: 'trampoline',
          stageIndex: sIdx,
          box: new THREE.Box3().setFromObject(bounce),
        });

        // Floating Gem
        spawnGem(scene, obstacles, bounce.position.x, bounce.position.y + 4, bounce.position.z + 4, sIdx);
      }
    } else if (sIdx === 3) {
      // Stage 4: Fading Cloud Tiles
      for (let i = 1; i <= 6; i++) {
        const cloudGeo = new THREE.BoxGeometry(3.5, 0.6, 3.5);
        const cloudMat = new THREE.MeshStandardMaterial({
          color: 0xa7f3d0,
          transparent: true,
          opacity: 0.9,
          roughness: 0.2,
        });
        const cloud = new THREE.Mesh(cloudGeo, cloudMat);
        const xPos = Math.sin(i * 2) * 3.5;
        cloud.position.set(xPos, yBase + i * 0.4, zBase + i * 9);
        scene.add(cloud);

        obstacles.push({
          mesh: cloud,
          type: 'fading',
          stageIndex: sIdx,
          box: new THREE.Box3().setFromObject(cloud),
          fadeState: { currentOpacity: 1, fadingOut: false, timer: 0 },
          update: (delta, time) => {
            // Pulsing float
            cloud.position.y = yBase + i * 0.4 + Math.sin(time * 2 + i) * 0.2;
          },
        });

        spawnCoin(scene, obstacles, cloud.position.x, yBase + i * 0.4 + 2, cloud.position.z, sIdx);
      }
    } else if (sIdx === 4) {
      // Stage 5: Speed Highway
      const rampGeo = new THREE.BoxGeometry(4, 0.6, 45);
      const rampMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
      const ramp = new THREE.Mesh(rampGeo, rampMat);
      ramp.position.set(0, yBase + 1, zBase + 25);
      scene.add(ramp);
      obstacles.push({ mesh: ramp, type: 'static', stageIndex: sIdx, box: new THREE.Box3().setFromObject(ramp) });

      // Glowing speed booster strips
      for (let j = 0; j < 5; j++) {
        const padGeo = new THREE.BoxGeometry(3.2, 0.1, 2);
        const padMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.8,
        });
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.set(0, yBase + 1.35, zBase + 8 + j * 8);
        scene.add(pad);
        obstacles.push({ mesh: pad, type: 'speed', stageIndex: sIdx, box: new THREE.Box3().setFromObject(pad) });
      }

      // Small obstacle blocks to jump over while speeding
      for (let k = 0; k < 3; k++) {
        const blockGeo = new THREE.BoxGeometry(3.5, 1.2, 1);
        const blockMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
        const block = new THREE.Mesh(blockGeo, blockMat);
        block.position.set(0, yBase + 1.8, zBase + 14 + k * 12);
        scene.add(block);
        obstacles.push({ mesh: block, type: 'lava', stageIndex: sIdx, box: new THREE.Box3().setFromObject(block) });
      }
    } else if (sIdx === 5) {
      // Stage 6: Lava Magma Jump
      for (let i = 1; i <= 5; i++) {
        const islandGeo = new THREE.CylinderGeometry(2, 2.5, 1, 8);
        const islandMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
        const island = new THREE.Mesh(islandGeo, islandMat);
        island.position.set((i % 2 === 0 ? 3.5 : -3.5), yBase + i * 0.5, zBase + i * 10);
        scene.add(island);
        obstacles.push({ mesh: island, type: 'static', stageIndex: sIdx, box: new THREE.Box3().setFromObject(island) });

        // Floating bubbling lava pool between islands
        const lavaGeo = new THREE.BoxGeometry(10, 0.4, 8);
        const lavaMat = new THREE.MeshStandardMaterial({
          color: 0xef4444,
          emissive: 0xb91c1c,
          emissiveIntensity: 0.6,
        });
        const lava = new THREE.Mesh(lavaGeo, lavaMat);
        lava.position.set(0, yBase - 0.2, zBase + i * 10);
        scene.add(lava);
        obstacles.push({ mesh: lava, type: 'lava', stageIndex: sIdx, box: new THREE.Box3().setFromObject(lava) });

        spawnCoin(scene, obstacles, island.position.x, island.position.y + 2, island.position.z, sIdx);
      }
    } else if (sIdx === 6) {
      // Stage 7: Windmill of Doom
      for (let w = 1; w <= 3; w++) {
        const centerGeo = new THREE.CylinderGeometry(1.2, 1.2, 1);
        const centerMat = new THREE.MeshStandardMaterial({ color: 0x6d28d9 });
        const center = new THREE.Mesh(centerGeo, centerMat);
        center.position.set(0, yBase + w * 1.5, zBase + w * 16);
        scene.add(center);
        obstacles.push({ mesh: center, type: 'static', stageIndex: sIdx, box: new THREE.Box3().setFromObject(center) });

        const windmillGroup = new THREE.Group();
        windmillGroup.position.copy(center.position);

        // 4 rotating arms
        for (let a = 0; a < 4; a++) {
          const armMesh = new THREE.Mesh(
            new THREE.BoxGeometry(7, 0.5, 1.8),
            new THREE.MeshStandardMaterial({ color: colors[a * 2] })
          );
          armMesh.rotation.y = (a * Math.PI) / 2;
          armMesh.castShadow = true;
          armMesh.receiveShadow = true;
          windmillGroup.add(armMesh);
        }
        scene.add(windmillGroup);

        const rotDir = w % 2 === 0 ? 1 : -1;
        obstacles.push({
          mesh: windmillGroup,
          type: 'spinner',
          stageIndex: sIdx,
          update: (delta) => {
            windmillGroup.rotation.y += delta * 0.8 * rotDir;
          },
        });
      }
    } else if (sIdx === 7) {
      // Stage 8: Sky Tightrope
      const ropeGeo = new THREE.BoxGeometry(0.8, 0.4, 45);
      const ropeMat = new THREE.MeshStandardMaterial({ color: 0xf472b6 });
      const rope = new THREE.Mesh(ropeGeo, ropeMat);
      rope.position.set(0, yBase + 1, zBase + 24);
      scene.add(rope);
      obstacles.push({ mesh: rope, type: 'static', stageIndex: sIdx, box: new THREE.Box3().setFromObject(rope) });

      // Swinging pendulums above rope
      for (let p = 0; p < 4; p++) {
        const penGroup = new THREE.Group();
        penGroup.position.set(0, yBase + 8, zBase + 8 + p * 10);

        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 7), new THREE.MeshStandardMaterial({ color: 0x64748b }));
        rod.position.y = -3.5;
        penGroup.add(rod);

        const ball = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 12), new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x991b1b }));
        ball.position.y = -7;
        penGroup.add(ball);
        scene.add(penGroup);

        obstacles.push({
          mesh: penGroup,
          type: 'lava',
          stageIndex: sIdx,
          update: (delta, time) => {
            penGroup.rotation.z = Math.sin(time * 3 + p * 1.5) * 0.9;
          },
        });
      }
    } else if (sIdx === 8) {
      // Stage 9: Gravity Helix
      for (let h = 0; h < 8; h++) {
        const angle = h * 0.8;
        const radius = 5;
        const xPos = Math.cos(angle) * radius;
        const zPos = zBase + 10 + Math.sin(angle) * radius + h * 4;
        const yPos = yBase + h * 1.2;

        const hexGeo = new THREE.CylinderGeometry(2, 2, 0.6, 6);
        const hexMat = new THREE.MeshStandardMaterial({
          color: 0x6366f1,
          emissive: 0x4338ca,
          emissiveIntensity: 0.3,
        });
        const hex = new THREE.Mesh(hexGeo, hexMat);
        hex.position.set(xPos, yPos, zPos);
        scene.add(hex);

        obstacles.push({ mesh: hex, type: 'static', stageIndex: sIdx, box: new THREE.Box3().setFromObject(hex) });
        spawnCoin(scene, obstacles, xPos, yPos + 2, zPos, sIdx);
      }
    } else if (sIdx === 9) {
      // Stage 10: Golden Cloud Castle & Finish Podium!
      const castleGeo = new THREE.CylinderGeometry(8, 9, 2, 32);
      const castleMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xfacc15,
        emissiveIntensity: 0.4,
        roughness: 0.2,
      });
      const castle = new THREE.Mesh(castleGeo, castleMat);
      castle.position.set(0, yBase + 1, zBase + 25);
      castle.receiveShadow = true;
      scene.add(castle);
      obstacles.push({ mesh: castle, type: 'static', stageIndex: sIdx, box: new THREE.Box3().setFromObject(castle) });

      // Golden Trophy in center
      const trophyGroup = new THREE.Group();
      trophyGroup.position.set(0, yBase + 3, zBase + 25);

      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 0.8), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9 }));
      trophyGroup.add(base);

      const cup = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 0.6, 2.5, 16), new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.1 }));
      cup.position.y = 1.6;
      trophyGroup.add(cup);

      const star = new THREE.Mesh(new THREE.OctahedronGeometry(1.2), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfef08a, emissiveIntensity: 1 }));
      star.position.y = 3.6;
      trophyGroup.add(star);

      scene.add(trophyGroup);

      obstacles.push({
        mesh: trophyGroup,
        type: 'finish',
        stageIndex: sIdx,
        box: new THREE.Box3().setFromObject(trophyGroup),
        update: (delta) => {
          trophyGroup.rotation.y += delta * 1.5;
        },
      });

      // Victory Star ring
      const starRingGeo = new THREE.TorusGeometry(6, 0.3, 8, 32);
      const starRingMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
      const starRing = new THREE.Mesh(starRingGeo, starRingMat);
      starRing.rotation.x = Math.PI / 2;
      starRing.position.set(0, yBase + 1.8, zBase + 25);
      scene.add(starRing);
    }
  });

  return { obstacles, checkpoints, stages };
}

function spawnCoin(scene: THREE.Group, obstacles: ObbyObstacle[], x: number, y: number, z: number, stageIdx: number) {
  const coinGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.15, 16);
  const coinMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0xeab308,
    emissiveIntensity: 0.3,
  });
  const coin = new THREE.Mesh(coinGeo, coinMat);
  coin.rotation.x = Math.PI / 2;
  coin.position.set(x, y, z);
  scene.add(coin);

  obstacles.push({
    mesh: coin,
    type: 'coin',
    stageIndex: stageIdx,
    update: (delta, time) => {
      coin.rotation.z += delta * 3;
      coin.position.y = y + Math.sin(time * 3 + x) * 0.25;
    },
  });
}

function spawnGem(scene: THREE.Group, obstacles: ObbyObstacle[], x: number, y: number, z: number, stageIdx: number) {
  const gemGeo = new THREE.OctahedronGeometry(0.8);
  const gemMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    metalness: 0.9,
    roughness: 0.1,
    emissive: 0x0891b2,
    emissiveIntensity: 0.5,
  });
  const gem = new THREE.Mesh(gemGeo, gemMat);
  gem.position.set(x, y, z);
  scene.add(gem);

  obstacles.push({
    mesh: gem,
    type: 'gem',
    stageIndex: stageIdx,
    update: (delta, time) => {
      gem.rotation.y += delta * 2.5;
      gem.rotation.x += delta * 1.2;
      gem.position.y = y + Math.sin(time * 3) * 0.3;
    },
  });
}
