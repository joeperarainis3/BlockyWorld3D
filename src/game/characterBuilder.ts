import * as THREE from 'three';
import { AvatarCustomization, Pet } from '../types';

export interface ArticulatedCharacter {
  root: THREE.Group;
  head: THREE.Mesh;
  torso: THREE.Mesh;
  leftArmPivot: THREE.Group;
  leftArm: THREE.Mesh;
  rightArmPivot: THREE.Group;
  rightArm: THREE.Mesh;
  leftLegPivot: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLegPivot: THREE.Group;
  rightLeg: THREE.Mesh;
  hatGroup: THREE.Group;
  backGroup: THREE.Group;
  heldGroup: THREE.Group;
  propellerMesh?: THREE.Mesh;
  wingsMesh?: THREE.Group;
}

// Generate face canvas texture for avatar expression
export function createFaceTexture(expression: AvatarCustomization['faceExpression'], skinColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Skin background base
  ctx.fillStyle = skinColor;
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';

  if (expression === 'smile') {
    // Round eyes
    ctx.beginPath();
    ctx.arc(80, 100, 16, 0, Math.PI * 2);
    ctx.arc(176, 100, 16, 0, Math.PI * 2);
    ctx.fill();

    // Eye highlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(75, 94, 6, 0, Math.PI * 2);
    ctx.arc(171, 94, 6, 0, Math.PI * 2);
    ctx.fill();

    // Big happy smile
    ctx.strokeStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(128, 140, 50, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    // Rosy cheeks
    ctx.fillStyle = '#f43f5e';
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(60, 135, 14, 0, Math.PI * 2);
    ctx.arc(196, 135, 14, 0, Math.PI * 2);
    ctx.fill();
  } else if (expression === 'cool') {
    // Sunglasses
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(50, 80, 65, 45, 8);
    ctx.roundRect(141, 80, 65, 45, 8);
    ctx.fill();

    // Sunglasses bridge
    ctx.fillRect(110, 92, 36, 10);

    // Sunglasses sheen
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(60, 90);
    ctx.lineTo(85, 115);
    ctx.moveTo(150, 90);
    ctx.lineTo(175, 115);
    ctx.stroke();

    // Smirk
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(120, 160);
    ctx.quadraticCurveTo(160, 175, 180, 150);
    ctx.stroke();
  } else if (expression === 'wink') {
    // Left open eye
    ctx.beginPath();
    ctx.arc(80, 100, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(75, 94, 7, 0, Math.PI * 2);
    ctx.fill();

    // Right wink curve
    ctx.strokeStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(176, 105, 20, 1.2 * Math.PI, 1.8 * Math.PI);
    ctx.stroke();

    // Open happy mouth with tongue
    ctx.fillStyle = '#be123c';
    ctx.beginPath();
    ctx.arc(128, 150, 36, 0, Math.PI);
    ctx.fill();
  } else if (expression === 'cat') {
    // Cute cat eyes
    ctx.beginPath();
    ctx.arc(75, 100, 18, 0, Math.PI * 2);
    ctx.arc(181, 100, 18, 0, Math.PI * 2);
    ctx.fill();

    // :3 cat mouth
    ctx.beginPath();
    ctx.arc(110, 150, 18, 0.2 * Math.PI, 1.1 * Math.PI);
    ctx.arc(146, 150, 18, -0.1 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();

    // Whiskers
    ctx.beginPath();
    ctx.moveTo(40, 125); ctx.lineTo(15, 120);
    ctx.moveTo(40, 140); ctx.lineTo(15, 145);
    ctx.moveTo(216, 125); ctx.lineTo(241, 120);
    ctx.moveTo(216, 140); ctx.lineTo(241, 145);
    ctx.stroke();
  } else if (expression === 'excited') {
    // Star eyes
    drawStar(ctx, 80, 100, 5, 22, 11, '#eab308');
    drawStar(ctx, 176, 100, 5, 22, 11, '#eab308');

    // Huge joyful open mouth
    ctx.fillStyle = '#be123c';
    ctx.beginPath();
    ctx.arc(128, 145, 45, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.rect(105, 145, 46, 12);
    ctx.fill();
  } else if (expression === 'ninja') {
    // Ninja mask slot
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 256, 75);
    ctx.fillRect(0, 135, 256, 121);

    // Fierce sharp eyes
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(75, 105, 24, 12, -0.2, 0, Math.PI * 2);
    ctx.ellipse(181, 105, 24, 12, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(75, 105, 8, 0, Math.PI * 2);
    ctx.arc(181, 105, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerR: number, innerR: number, fill: string) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerR;
    y = cy + Math.sin(rot) * outerR;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerR;
    y = cy + Math.sin(rot) * innerR;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerR);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

export function buildBlockyAvatar(config: AvatarCustomization): ArticulatedCharacter {
  const root = new THREE.Group();

  // Torso (2 width, 2 height, 1 depth)
  const torsoGeo = new THREE.BoxGeometry(2, 2, 1);
  const torsoMat = new THREE.MeshStandardMaterial({
    color: config.torsoColor,
    roughness: 0.3,
    metalness: 0.1,
  });
  const torso = new THREE.Mesh(torsoGeo, torsoMat);
  torso.position.y = 2.5;
  torso.castShadow = true;
  torso.receiveShadow = true;
  root.add(torso);

  // Head (1.2 x 1.2 x 1.2)
  const headGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
  const skinMat = new THREE.MeshStandardMaterial({
    color: config.skinColor,
    roughness: 0.4,
  });
  const faceTexture = createFaceTexture(config.faceExpression, config.skinColor);
  const faceMat = new THREE.MeshStandardMaterial({
    map: faceTexture,
    roughness: 0.4,
  });

  // Material array: [right, left, top, bottom, front (face), back]
  const headMaterials = [skinMat, skinMat, skinMat, skinMat, faceMat, skinMat];
  const head = new THREE.Mesh(headGeo, headMaterials);
  head.position.set(0, 1.6, 0);
  head.castShadow = true;
  torso.add(head);

  // Left Arm Pivot at shoulder
  const armGeo = new THREE.BoxGeometry(1, 2, 1);
  const leftArmMat = new THREE.MeshStandardMaterial({ color: config.leftArmColor, roughness: 0.4 });
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-1.5, 1, 0);

  const leftArm = new THREE.Mesh(armGeo, leftArmMat);
  leftArm.position.set(0, -1, 0);
  leftArm.castShadow = true;
  leftArmPivot.add(leftArm);
  torso.add(leftArmPivot);

  // Right Arm Pivot
  const rightArmMat = new THREE.MeshStandardMaterial({ color: config.rightArmColor, roughness: 0.4 });
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(1.5, 1, 0);

  const rightArm = new THREE.Mesh(armGeo, rightArmMat);
  rightArm.position.set(0, -1, 0);
  rightArm.castShadow = true;
  rightArmPivot.add(rightArm);
  torso.add(rightArmPivot);

  // Left Leg Pivot at hip
  const legGeo = new THREE.BoxGeometry(1, 2, 1);
  const leftLegMat = new THREE.MeshStandardMaterial({ color: config.leftLegColor, roughness: 0.4 });
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.5, -1, 0);

  const leftLeg = new THREE.Mesh(legGeo, leftLegMat);
  leftLeg.position.set(0, -1, 0);
  leftLeg.castShadow = true;
  leftLegPivot.add(leftLeg);
  torso.add(leftLegPivot);

  // Right Leg Pivot at hip
  const rightLegMat = new THREE.MeshStandardMaterial({ color: config.rightLegColor, roughness: 0.4 });
  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.5, -1, 0);

  const rightLeg = new THREE.Mesh(legGeo, rightLegMat);
  rightLeg.position.set(0, -1, 0);
  rightLeg.castShadow = true;
  rightLegPivot.add(rightLeg);
  torso.add(rightLegPivot);

  // Hat Group attached to head
  const hatGroup = new THREE.Group();
  hatGroup.position.set(0, 0.6, 0);
  head.add(hatGroup);

  let propellerMesh: THREE.Mesh | undefined;
  attachHat(hatGroup, config.hat, (prop) => (propellerMesh = prop));

  // Back accessory attached to torso
  const backGroup = new THREE.Group();
  backGroup.position.set(0, 0, -0.6);
  torso.add(backGroup);

  let wingsMesh: THREE.Group | undefined;
  attachBackAccessory(backGroup, config.backAccessory, (wings) => (wingsMesh = wings));

  // Held Item attached to right hand
  const heldGroup = new THREE.Group();
  heldGroup.position.set(0, -0.9, 0.6);
  rightArm.add(heldGroup);
  attachHeldItem(heldGroup, config.heldItem);

  return {
    root,
    head,
    torso,
    leftArmPivot,
    leftArm,
    rightArmPivot,
    rightArm,
    leftLegPivot,
    leftLeg,
    rightLegPivot,
    rightLeg,
    hatGroup,
    backGroup,
    heldGroup,
    propellerMesh,
    wingsMesh,
  };
}

function attachHat(group: THREE.Group, hatType: string, setPropeller?: (m: THREE.Mesh) => void) {
  // Clear any existing
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }

  if (hatType === 'tophat') {
    const brimGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.1, 16);
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.2 });
    const brim = new THREE.Mesh(brimGeo, blackMat);
    group.add(brim);

    const bodyGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.8, 16);
    const body = new THREE.Mesh(bodyGeo, blackMat);
    body.position.y = 0.45;
    group.add(body);

    const ribbonGeo = new THREE.CylinderGeometry(0.66, 0.66, 0.15, 16);
    const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    const ribbon = new THREE.Mesh(ribbonGeo, redMat);
    ribbon.position.y = 0.15;
    group.add(ribbon);
  } else if (hatType === 'crown') {
    const crownBase = new THREE.CylinderGeometry(0.7, 0.65, 0.4, 8, 1, true);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });
    const crown = new THREE.Mesh(crownBase, goldMat);
    crown.position.y = 0.2;
    group.add(crown);

    // Jewels
    const gemGeo = new THREE.OctahedronGeometry(0.12);
    const gemMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, metalness: 0.9, roughness: 0.1 });
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const gem = new THREE.Mesh(gemGeo, gemMat);
      gem.position.set(Math.cos(angle) * 0.68, 0.35, Math.sin(angle) * 0.68);
      group.add(gem);
    }
  } else if (hatType === 'party') {
    const coneGeo = new THREE.ConeGeometry(0.5, 0.9, 16);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.3 });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = 0.45;
    group.add(cone);

    const pomGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const pomMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e });
    const pom = new THREE.Mesh(pomGeo, pomMat);
    pom.position.y = 0.95;
    group.add(pom);
  } else if (hatType === 'catears') {
    const earGeo = new THREE.ConeGeometry(0.25, 0.45, 4);
    const pinkMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.4 });
    
    const leftEar = new THREE.Mesh(earGeo, pinkMat);
    leftEar.position.set(-0.4, 0.25, 0);
    leftEar.rotation.z = 0.25;
    group.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, pinkMat);
    rightEar.position.set(0.4, 0.25, 0);
    rightEar.rotation.z = -0.25;
    group.add(rightEar);
  } else if (hatType === 'halo') {
    const torusGeo = new THREE.TorusGeometry(0.65, 0.08, 12, 24);
    const haloMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfef08a,
      emissiveIntensity: 0.7,
      roughness: 0.1,
    });
    const halo = new THREE.Mesh(torusGeo, haloMat);
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.5;
    group.add(halo);
  } else if (hatType === 'propeller') {
    const capGeo = new THREE.CylinderGeometry(0.68, 0.7, 0.3, 16);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.15;
    group.add(cap);

    const rodGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.25);
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.position.y = 0.4;
    group.add(rod);

    const propGeo = new THREE.BoxGeometry(0.9, 0.04, 0.12);
    const propMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
    const prop = new THREE.Mesh(propGeo, propMat);
    prop.position.y = 0.52;
    group.add(prop);

    if (setPropeller) setPropeller(prop);
  }
}

function attachBackAccessory(group: THREE.Group, accType: string, setWings?: (w: THREE.Group) => void) {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }

  if (accType === 'angelWings' || accType === 'demonWings') {
    const wingsGroup = new THREE.Group();
    const isDemon = accType === 'demonWings';
    const wingMat = new THREE.MeshStandardMaterial({
      color: isDemon ? 0x991b1b : 0xffffff,
      emissive: isDemon ? 0x450a0a : 0xe0f2fe,
      emissiveIntensity: 0.3,
      side: THREE.DoubleSide,
    });

    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.8, 1.2, 1.8, 1.0);
    shape.quadraticCurveTo(1.6, 0.2, 0.8, -0.4);
    shape.quadraticCurveTo(0.4, -0.3, 0, 0);

    const extrudeSettings = { depth: 0.1, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.04, bevelThickness: 0.04 };
    const wingGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.set(0.2, 0, 0);
    wingsGroup.add(rightWing);

    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(-0.2, 0, 0);
    leftWing.scale.set(-1, 1, 1);
    wingsGroup.add(leftWing);

    group.add(wingsGroup);
    if (setWings) setWings(wingsGroup);
  } else if (accType === 'jetpack') {
    const tankGeo = new THREE.CylinderGeometry(0.22, 0.22, 1.2, 12);
    const silverMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });

    const leftTank = new THREE.Mesh(tankGeo, silverMat);
    leftTank.position.set(-0.4, 0, 0);
    group.add(leftTank);

    const rightTank = new THREE.Mesh(tankGeo, silverMat);
    rightTank.position.set(0.4, 0, 0);
    group.add(rightTank);

    // Rocket tips
    const coneGeo = new THREE.ConeGeometry(0.23, 0.35, 12);
    const leftTip = new THREE.Mesh(coneGeo, redMat);
    leftTip.position.set(-0.4, 0.7, 0);
    group.add(leftTip);

    const rightTip = new THREE.Mesh(coneGeo, redMat);
    rightTip.position.set(0.4, 0.7, 0);
    group.add(rightTip);
  } else if (accType === 'cape') {
    const capeGeo = new THREE.BoxGeometry(1.6, 2.2, 0.08);
    const capeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
    const cape = new THREE.Mesh(capeGeo, capeMat);
    cape.position.set(0, -0.4, -0.1);
    cape.rotation.x = 0.15;
    group.add(cape);
  } else if (accType === 'sword') {
    const bladeGeo = new THREE.BoxGeometry(0.12, 2.2, 0.04);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });
    const sword1 = new THREE.Mesh(bladeGeo, bladeMat);
    sword1.rotation.z = 0.65;
    group.add(sword1);

    const sword2 = new THREE.Mesh(bladeGeo, bladeMat);
    sword2.rotation.z = -0.65;
    group.add(sword2);
  }
}

function attachHeldItem(group: THREE.Group, itemType: string) {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }

  if (itemType === 'speedCoil') {
    // Red Spring coil
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.4, 0),
      new THREE.Vector3(0.2, -0.2, 0.2),
      new THREE.Vector3(-0.2, 0, -0.2),
      new THREE.Vector3(0.2, 0.2, 0.2),
      new THREE.Vector3(-0.2, 0.4, -0.2),
      new THREE.Vector3(0, 0.6, 0),
    ]);
    const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.09, 8, false);
    const redGlow = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.4 });
    const coil = new THREE.Mesh(tubeGeo, redGlow);
    group.add(coil);
  } else if (itemType === 'gravityCoil') {
    // Blue Gravity coil
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.4, 0),
      new THREE.Vector3(0.2, -0.2, 0.2),
      new THREE.Vector3(-0.2, 0, -0.2),
      new THREE.Vector3(0.2, 0.2, 0.2),
      new THREE.Vector3(-0.2, 0.4, -0.2),
      new THREE.Vector3(0, 0.6, 0),
    ]);
    const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.09, 8, false);
    const blueGlow = new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x1d4ed8, emissiveIntensity: 0.4 });
    const coil = new THREE.Mesh(tubeGeo, blueGlow);
    group.add(coil);
  } else if (itemType === 'magicWand') {
    const handleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.2);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
    const wand = new THREE.Mesh(handleGeo, woodMat);
    group.add(wand);

    const starGeo = new THREE.OctahedronGeometry(0.2);
    const starMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xfacc15, emissiveIntensity: 0.8 });
    const star = new THREE.Mesh(starGeo, starMat);
    star.position.y = 0.65;
    group.add(star);
  } else if (itemType === 'balloon') {
    const stringGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.2);
    const stringMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const str = new THREE.Mesh(stringGeo, stringMat);
    str.position.y = 0.6;
    group.add(str);

    const ballGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.1 });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.position.y = 1.4;
    group.add(ball);
  } else if (itemType === 'popsicle') {
    const stickGeo = new THREE.BoxGeometry(0.1, 0.6, 0.04);
    const stickMat = new THREE.MeshStandardMaterial({ color: 0xfde047 });
    const stick = new THREE.Mesh(stickGeo, stickMat);
    group.add(stick);

    const popGeo = new THREE.BoxGeometry(0.4, 0.9, 0.18);
    const popMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.2 });
    const pop = new THREE.Mesh(popGeo, popMat);
    pop.position.y = 0.6;
    group.add(pop);
  }
}

// 3D Pet Mesh builder
export function create3DPetMesh(pet: Pet): THREE.Group {
  const group = new THREE.Group();

  const bodyGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  const mat = new THREE.MeshStandardMaterial({
    color: pet.color,
    roughness: 0.3,
    metalness: pet.rarity === 'Mythic' || pet.rarity === 'Legendary' ? 0.6 : 0.1,
  });
  const body = new THREE.Mesh(bodyGeo, mat);
  body.castShadow = true;
  group.add(body);

  // Cute face texture for pet
  const faceTexture = createPetFace(pet.species);
  const faceMat = new THREE.MeshStandardMaterial({ map: faceTexture });
  const facePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), faceMat);
  facePlane.position.set(0, 0, 0.41);
  group.add(facePlane);

  // Special species features
  if (pet.species === 'cat' || pet.species === 'dog') {
    const earGeo = new THREE.ConeGeometry(0.16, 0.28, 4);
    const leftEar = new THREE.Mesh(earGeo, mat);
    leftEar.position.set(-0.25, 0.5, 0);
    group.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, mat);
    rightEar.position.set(0.25, 0.5, 0);
    group.add(rightEar);
  } else if (pet.species === 'dragon') {
    // Tiny wings and horns
    const hornGeo = new THREE.ConeGeometry(0.1, 0.3, 4);
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
    const leftHorn = new THREE.Mesh(hornGeo, hornMat);
    leftHorn.position.set(-0.25, 0.5, -0.1);
    group.add(leftHorn);

    const rightHorn = new THREE.Mesh(hornGeo, hornMat);
    rightHorn.position.set(0.25, 0.5, -0.1);
    group.add(rightHorn);
  } else if (pet.species === 'unicorn') {
    // Golden Horn
    const hornGeo = new THREE.ConeGeometry(0.1, 0.45, 8);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfde047, metalness: 0.8 });
    const horn = new THREE.Mesh(hornGeo, goldMat);
    horn.position.set(0, 0.55, 0.2);
    horn.rotation.x = 0.2;
    group.add(horn);
  }

  // Floating glow ring for legendary/mythic
  if (pet.rarity === 'Legendary' || pet.rarity === 'Mythic') {
    const haloGeo = new THREE.TorusGeometry(0.6, 0.04, 8, 24);
    const haloMat = new THREE.MeshBasicMaterial({ color: pet.rarity === 'Mythic' ? 0xff00ff : 0xfacc15 });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.6;
    group.add(halo);
  }

  return group;
}

function createPetFace(species: Pet['species']): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = '#0f172a';

  // Big cute shiny eyes
  ctx.beginPath();
  ctx.arc(38, 55, 12, 0, Math.PI * 2);
  ctx.arc(90, 55, 12, 0, Math.PI * 2);
  ctx.fill();

  // Eye highlights
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(34, 50, 5, 0, Math.PI * 2);
  ctx.arc(86, 50, 5, 0, Math.PI * 2);
  ctx.fill();

  // Snout / mouth
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(56, 85, 8, 0, Math.PI);
  ctx.arc(72, 85, 8, 0, Math.PI);
  ctx.stroke();

  // Cheeks
  ctx.fillStyle = '#fb7185';
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.arc(26, 75, 8, 0, Math.PI * 2);
  ctx.arc(102, 75, 8, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
