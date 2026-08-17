import * as THREE from 'three';
import { TycoonButton } from '../../types';

export interface DroppedCandy {
  mesh: THREE.Mesh;
  value: number;
  progress: number; // 0 to 1 along conveyor
  type: string;
}

export interface TycoonState {
  plotClaimed: boolean;
  uncollectedCash: number;
  totalCash: number;
  cashPerSecond: number;
  buttons: TycoonButton[];
  droppersActive: string[];
}

export function createDefaultTycoonButtons(): TycoonButton[] {
  return [
    {
      id: 'btn_claim',
      title: 'Claim Plot (Free)',
      cost: 0,
      built: false,
      position: [0, 0.2, 0],
      color: '#10b981',
      icon: 'sparkles',
      action: 'dropper',
    },
    {
      id: 'btn_dropper1',
      title: 'Sugar Dropper #1 ($15)',
      cost: 15,
      built: false,
      requires: 'btn_claim',
      position: [-8, 0.2, -6],
      color: '#ec4899',
      icon: 'candy',
      action: 'dropper',
    },
    {
      id: 'btn_conveyor',
      title: 'Rainbow Conveyor ($40)',
      cost: 40,
      built: false,
      requires: 'btn_dropper1',
      position: [0, 0.2, -6],
      color: '#3b82f6',
      icon: 'arrow-right',
      action: 'conveyor',
    },
    {
      id: 'btn_dropper2',
      title: 'Gummy Bear Dropper ($100)',
      cost: 100,
      built: false,
      requires: 'btn_conveyor',
      position: [-8, 0.2, -12],
      color: '#8b5cf6',
      icon: 'lollipop',
      action: 'dropper',
    },
    {
      id: 'btn_walls',
      title: 'Marshmallow Walls ($250)',
      cost: 250,
      built: false,
      requires: 'btn_dropper2',
      position: [8, 0.2, -6],
      color: '#f43f5e',
      icon: 'shield',
      action: 'wall',
    },
    {
      id: 'btn_dropper3',
      title: 'Chocolate Volcano Dropper ($500)',
      cost: 500,
      built: false,
      requires: 'btn_walls',
      position: [-8, 0.2, -18],
      color: '#78350f',
      icon: 'flame',
      action: 'dropper',
    },
    {
      id: 'btn_roof',
      title: 'Rainbow Glass Roof ($1,000)',
      cost: 1000,
      built: false,
      requires: 'btn_dropper3',
      position: [8, 0.2, -12],
      color: '#eab308',
      icon: 'sun',
      action: 'roof',
    },
    {
      id: 'btn_fountain',
      title: 'Mega Candy Fountain ($2,500)',
      cost: 2500,
      built: false,
      requires: 'btn_roof',
      position: [0, 0.2, -16],
      color: '#06b6d4',
      icon: 'crown',
      action: 'decoration',
    },
    {
      id: 'btn_elf',
      title: 'Auto-Collect Candy Elf ($5,000)',
      cost: 5000,
      built: false,
      requires: 'btn_fountain',
      position: [8, 0.2, -18],
      color: '#10b981',
      icon: 'bot',
      action: 'helper',
    },
  ];
}

export function buildTycoonWorld(
  scene: THREE.Group,
  buttons: TycoonButton[],
  onButtonClick: (btn: TycoonButton) => void
): {
  buttonMeshes: Map<string, THREE.Group>;
  droppers: THREE.Group[];
  conveyor: THREE.Mesh | null;
  collectorBox: THREE.Box3;
  spawnPoint: THREE.Vector3;
  collectorPadMesh: THREE.Mesh;
  wallGroup: THREE.Group;
  roofGroup: THREE.Group;
  fountainGroup: THREE.Group;
} {
  const buttonMeshes = new Map<string, THREE.Group>();
  const droppers: THREE.Group[] = [];

  // Main floating candy island base
  const baseGeo = new THREE.CylinderGeometry(24, 25, 2, 32);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xfdf2f8, // cotton candy pink
    roughness: 0.4,
  });
  const island = new THREE.Mesh(baseGeo, baseMat);
  island.position.set(0, -1, -10);
  island.receiveShadow = true;
  scene.add(island);

  // Candy fence trim
  const rimGeo = new THREE.TorusGeometry(24, 0.6, 8, 32);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xf472b6 });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 0.1, -10);
  scene.add(rim);

  // Cash collector pad
  const collectorGeo = new THREE.CylinderGeometry(3.5, 3.5, 0.4, 24);
  const collectorMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x059669,
    emissiveIntensity: 0.5,
  });
  const collectorPadMesh = new THREE.Mesh(collectorGeo, collectorMat);
  collectorPadMesh.position.set(6, 0.2, 4);
  scene.add(collectorPadMesh);

  // Floating dollar sign above collector
  const dollarGeo = new THREE.TorusGeometry(1.5, 0.2, 8, 16);
  const dollarMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const dollar = new THREE.Mesh(dollarGeo, dollarMat);
  dollar.position.set(6, 3, 4);
  scene.add(dollar);

  const collectorBox = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(6, 1, 4),
    new THREE.Vector3(6, 3, 6)
  );

  // Conveyor Belt
  const conveyorGeo = new THREE.BoxGeometry(3, 0.3, 20);
  const conveyorMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.2,
  });
  const conveyor = new THREE.Mesh(conveyorGeo, conveyorMat);
  conveyor.position.set(0, 0.2, -10);
  conveyor.visible = false;
  scene.add(conveyor);

  // Collector bin at the end of conveyor
  const binGeo = new THREE.BoxGeometry(4, 1.5, 4);
  const binMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.5 });
  const bin = new THREE.Mesh(binGeo, binMat);
  bin.position.set(0, 0.75, 1);
  bin.visible = false;
  scene.add(bin);

  // Groups for progressive builds
  const wallGroup = new THREE.Group();
  scene.add(wallGroup);

  const roofGroup = new THREE.Group();
  scene.add(roofGroup);

  const fountainGroup = new THREE.Group();
  scene.add(fountainGroup);

  // Render Buttons
  buttons.forEach((btn) => {
    const btnGroup = new THREE.Group();
    btnGroup.position.set(btn.position[0], btn.position[1], btn.position[2]);

    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2.2, 0.4, 16),
      new THREE.MeshStandardMaterial({
        color: btn.built ? 0x64748b : new THREE.Color(btn.color),
        emissive: btn.built ? 0x000000 : new THREE.Color(btn.color),
        emissiveIntensity: 0.3,
      })
    );
    btnGroup.add(pad);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.8, 0.1, 8, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.22;
    btnGroup.add(ring);

    btnGroup.visible = !btn.built;
    scene.add(btnGroup);
    buttonMeshes.set(btn.id, btnGroup);
  });

  return {
    buttonMeshes,
    droppers,
    conveyor,
    collectorBox,
    spawnPoint: new THREE.Vector3(0, 1.5, 8),
    collectorPadMesh,
    wallGroup,
    roofGroup,
    fountainGroup,
  };
}

export function buildTycoonStructure(type: TycoonButton['action'], id: string, scene: THREE.Group): THREE.Object3D {
  const group = new THREE.Group();

  if (id === 'btn_dropper1') {
    // Sugar Dropper Pipe 1
    const pipeGeo = new THREE.CylinderGeometry(0.8, 0.8, 4, 16);
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0xec4899, metalness: 0.4 });
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.position.set(-3, 4, -4);
    group.add(pipe);

    // Spout
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.5, 16), new THREE.MeshStandardMaterial({ color: 0xf43f5e }));
    spout.position.set(-3, 2, -4);
    group.add(spout);
  } else if (id === 'btn_dropper2') {
    // Gummy Bear Dropper
    const pipeGeo = new THREE.CylinderGeometry(0.9, 0.9, 4, 16);
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, metalness: 0.4 });
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.position.set(-3, 4, -10);
    group.add(pipe);
  } else if (id === 'btn_dropper3') {
    // Chocolate Dropper
    const pipeGeo = new THREE.CylinderGeometry(1.1, 1.1, 4, 16);
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x78350f, metalness: 0.6 });
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.position.set(-3, 4, -16);
    group.add(pipe);
  } else if (id === 'btn_walls') {
    // Marshmallow Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xfce7f3, roughness: 0.3 });
    // Left wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1, 6, 22), wallMat);
    leftWall.position.set(-14, 3, -10);
    group.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, 6, 22), wallMat);
    rightWall.position.set(14, 3, -10);
    group.add(rightWall);

    // Back wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(29, 6, 1), wallMat);
    backWall.position.set(0, 3, -21);
    group.add(backWall);
  } else if (id === 'btn_roof') {
    // Rainbow arched roof
    const roofGeo = new THREE.CylinderGeometry(15, 15, 23, 16, 1, false, 0, Math.PI);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.z = Math.PI / 2;
    roof.position.set(0, 6, -10);
    group.add(roof);
  } else if (id === 'btn_fountain') {
    // Fountain
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4, 1, 16), new THREE.MeshStandardMaterial({ color: 0xf472b6 }));
    basin.position.set(7, 0.5, -10);
    group.add(basin);

    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 3, 16), new THREE.MeshStandardMaterial({ color: 0xfde047 }));
    pillar.position.set(7, 2, -10);
    group.add(pillar);

    const ball = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 16), new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.6 }));
    ball.position.set(7, 4, -10);
    group.add(ball);
  }

  scene.add(group);
  return group;
}
