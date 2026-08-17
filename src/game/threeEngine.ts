import * as THREE from 'three';
import {
  AvatarCustomization,
  GameMode,
  Pet,
  SandboxBlock,
  TycoonButton,
} from '../types';
import { sounds } from '../audio/soundManager';
import {
  ArticulatedCharacter,
  buildBlockyAvatar,
  create3DPetMesh,
} from './characterBuilder';
import { buildObbyWorld, ObbyObstacle, ObbyStageInfo } from './worlds/obbyWorld';
import {
  buildTycoonWorld,
  buildTycoonStructure,
  createDefaultTycoonButtons,
  DroppedCandy,
} from './worlds/tycoonWorld';
import { buildLavaWorld, LavaArenaPlatform } from './worlds/lavaWorld';
import { buildSandboxGrid, instantiateSandboxBlock, generateSandboxPreset } from './worlds/sandboxWorld';
import { buildLobbyWorld, PortalTrigger } from './worlds/lobbyWorld';

export interface GameEngineCallbacks {
  onCoinsEarned: (amount: number, reason: string) => void;
  onGemsEarned: (amount: number, reason: string) => void;
  onStageChange: (stage: number, stageName: string) => void;
  onObbyFinish: () => void;
  onPortalEnter: (mode: GameMode | 'shop' | 'pets') => void;
  onTycoonCashUpdate: (uncollected: number, total: number) => void;
  onLavaRoundEnd: (survived: boolean) => void;
  onLavaTimeUpdate: (timeLeft: number, lavaHeight: number) => void;
  onInteractiveNearby: (text: string | null) => void;
}

export class ThreeGameEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private animationFrameId: number | null = null;
  private clock: THREE.Clock;

  // Active Game Mode
  public currentMode: GameMode = 'lobby';
  private callbacks: GameEngineCallbacks;

  // World Sub-groups
  private worldGroup: THREE.Group;
  private lobbyGroup: THREE.Group | null = null;
  private obbyGroup: THREE.Group | null = null;
  private tycoonGroup: THREE.Group | null = null;
  private lavaGroup: THREE.Group | null = null;
  private sandboxGroup: THREE.Group | null = null;

  // Player & Character
  private playerCustomization: AvatarCustomization;
  private character: ArticulatedCharacter | null = null;
  private playerPos: THREE.Vector3 = new THREE.Vector3(0, 2, 0);
  private playerVelocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private playerRotationY: number = 0;
  private isGrounded: boolean = true;
  private canDoubleJump: boolean = true;
  private currentStageIndex: number = 0;
  private currentCheckpoint: THREE.Vector3 = new THREE.Vector3(0, 2, 0);

  // Active Emote
  public activeEmote: string | null = null;
  private emoteTimer: number = 0;

  // Pets
  private equippedPets: Pet[] = [];
  private petMeshes: THREE.Group[] = [];

  // Controls State
  private keys: { [key: string]: boolean } = {};
  private joystickVector: { x: number; y: number } = { x: 0, y: 0 };
  private isSprint: boolean = false;
  private isJumpRequested: boolean = false;

  // Camera Orbit
  private cameraAngleH: number = 0;
  private cameraAngleV: number = 0.35;
  private cameraDistance: number = 14;
  private isDraggingMouse: boolean = false;
  private previousMousePosition = { x: 0, y: 0 };

  // World specific runtime state
  // Obby
  private obbyObstacles: ObbyObstacle[] = [];
  private obbyCheckpoints: THREE.Vector3[] = [];
  private obbyStages: ObbyStageInfo[] = [];

  // Tycoon
  private tycoonButtons: TycoonButton[] = createDefaultTycoonButtons();
  private tycoonButtonMeshes: Map<string, THREE.Group> = new Map();
  private droppedCandies: DroppedCandy[] = [];
  private uncollectedTycoonCash: number = 0;
  private totalTycoonCash: number = 0;
  private candyDropTimer: number = 0;

  // Lava
  private lavaMesh: THREE.Mesh | null = null;
  private lavaPlatforms: LavaArenaPlatform[] = [];
  private lavaHeight: number = -5;
  private lavaRoundTimer: number = 60;
  private isLavaActive: boolean = false;
  private lavaSurvived: boolean = false;

  // Sandbox
  private sandboxBlocks: SandboxBlock[] = [];
  private sandboxMeshes: Map<string, THREE.Object3D> = new Map();
  private sandboxObstacles: { id: string; type: string; box: THREE.Box3; mesh: THREE.Object3D; isSolid: boolean; update?: (d: number, t: number) => void }[] = [];
  public isSandboxEditMode: boolean = true;
  private isDeleteMode: boolean = false;
  private selectedBlockType: SandboxBlock['type'] = 'cube';
  private selectedColor: string = '#ef4444';
  private blockRotationY: number = 0;
  private previewGhostMesh: THREE.Mesh | null = null;
  private sandboxBasePlane: THREE.Mesh | null = null;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouseVector: THREE.Vector2 = new THREE.Vector2();
  private hoverGridPos: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  private isHoveringValid: boolean = false;

  // Portals
  private lobbyPortals: PortalTrigger[] = [];

  // Particle System
  private particleGroup: THREE.Group;
  private activeParticles: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number; maxLife: number }[] = [];

  constructor(container: HTMLElement, customization: AvatarCustomization, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.playerCustomization = customization;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    // Init Three.js Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x38bdf8); // Sky blue
    this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.005);

    // Camera
    const aspect = container.clientWidth / container.clientHeight || 1;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 1000);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(this.renderer.domElement);

    // Lighting
    this.setupLighting();

    // Groups
    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);

    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);

    // Build Character
    this.rebuildPlayerCharacter();

    // Attach Event Listeners
    this.setupInputs();

    // Start in Lobby
    this.setGameMode('lobby');

    // Run Render Loop
    this.startLoop();
  }

  private setupLighting() {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x86efac, 0.65);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.2);
    dirLight.position.set(40, 80, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 300;
    const d = 50;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    this.scene.add(dirLight);

    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);
  }

  public rebuildPlayerCharacter() {
    if (this.character) {
      this.scene.remove(this.character.root);
    }
    this.character = buildBlockyAvatar(this.playerCustomization);
    this.scene.add(this.character.root);
    this.updatePetMeshes();
  }

  public setAvatarCustomization(customization: AvatarCustomization) {
    this.playerCustomization = customization;
    this.rebuildPlayerCharacter();
  }

  public setEquippedPets(pets: Pet[]) {
    this.equippedPets = pets;
    this.updatePetMeshes();
  }

  private updatePetMeshes() {
    this.petMeshes.forEach((pm) => this.scene.remove(pm));
    this.petMeshes = [];

    this.equippedPets.forEach((pet) => {
      const pMesh = create3DPetMesh(pet);
      this.scene.add(pMesh);
      this.petMeshes.push(pMesh);
    });
  }

  public setGameMode(mode: GameMode) {
    this.currentMode = mode;
    this.activeEmote = null;

    // Clear world group
    while (this.worldGroup.children.length > 0) {
      this.worldGroup.remove(this.worldGroup.children[0]);
    }

    if (mode === 'lobby') {
      this.scene.background = new THREE.Color(0x38bdf8);
      this.lobbyGroup = new THREE.Group();
      this.worldGroup.add(this.lobbyGroup);
      const res = buildLobbyWorld(this.lobbyGroup);
      this.lobbyPortals = res.portals;
      this.playerPos.copy(res.spawnPoint);
      this.currentCheckpoint.copy(res.spawnPoint);
    } else if (mode === 'obby') {
      this.scene.background = new THREE.Color(0x0284c7);
      this.obbyGroup = new THREE.Group();
      this.worldGroup.add(this.obbyGroup);
      const res = buildObbyWorld(this.obbyGroup);
      this.obbyObstacles = res.obstacles;
      this.obbyCheckpoints = res.checkpoints;
      this.obbyStages = res.stages;
      this.currentStageIndex = 0;
      if (this.obbyCheckpoints.length > 0) {
        this.playerPos.copy(this.obbyCheckpoints[0]);
        this.currentCheckpoint.copy(this.obbyCheckpoints[0]);
      }
      this.callbacks.onStageChange(1, this.obbyStages[0]?.name || 'Stage 1');
    } else if (mode === 'tycoon') {
      this.scene.background = new THREE.Color(0xf472b6);
      this.tycoonGroup = new THREE.Group();
      this.worldGroup.add(this.tycoonGroup);
      const res = buildTycoonWorld(this.tycoonGroup, this.tycoonButtons, (btn) => this.handleTycoonButton(btn));
      this.tycoonButtonMeshes = res.buttonMeshes;
      this.playerPos.copy(res.spawnPoint);
      this.currentCheckpoint.copy(res.spawnPoint);
    } else if (mode === 'lava') {
      this.scene.background = new THREE.Color(0x7f1d1d);
      this.lavaGroup = new THREE.Group();
      this.worldGroup.add(this.lavaGroup);
      const res = buildLavaWorld(this.lavaGroup);
      this.lavaMesh = res.lavaMesh;
      this.lavaPlatforms = res.platforms;
      this.playerPos.copy(res.spawnPoint);
      this.currentCheckpoint.copy(res.spawnPoint);
      this.lavaHeight = -5;
      this.lavaRoundTimer = 60;
      this.isLavaActive = true;
      this.lavaSurvived = false;
    } else if (mode === 'sandbox') {
      this.scene.background = new THREE.Color(0x0f172a);
      this.sandboxGroup = new THREE.Group();
      this.worldGroup.add(this.sandboxGroup);
      const res = buildSandboxGrid(this.sandboxGroup);
      this.sandboxBasePlane = res.basePlane;
      this.playerPos.set(0, 2, 0);
      this.currentCheckpoint.set(0, 2, 0);
      this.isSandboxEditMode = true;
      this.initGhostPreviewMesh();
      if (this.sandboxBlocks.length === 0) {
        this.loadSandboxPreset('spiral');
      } else {
        this.rebuildAllSandboxMeshes();
      }
    }

    this.playerVelocity.set(0, 0, 0);
  }

  // Sandbox Course Builder Public APIs
  public setSandboxBlockType(type: SandboxBlock['type']) {
    this.selectedBlockType = type;
    this.updateGhostPreviewGeometry();
  }

  public setSandboxColor(color: string) {
    this.selectedColor = color;
    if (this.previewGhostMesh) {
      (this.previewGhostMesh.material as THREE.MeshStandardMaterial).color.set(color);
    }
  }

  public setSandboxDeleteMode(isDelete: boolean) {
    this.isDeleteMode = isDelete;
    if (this.previewGhostMesh) {
      if (isDelete) {
        (this.previewGhostMesh.material as THREE.MeshStandardMaterial).color.set('#ef4444');
      } else {
        (this.previewGhostMesh.material as THREE.MeshStandardMaterial).color.set(this.selectedColor);
      }
    }
  }

  public setSandboxEditMode(isEdit: boolean) {
    this.isSandboxEditMode = isEdit;
    if (this.previewGhostMesh) {
      this.previewGhostMesh.visible = isEdit;
    }
  }

  public rotateSandboxBlock() {
    this.blockRotationY = (this.blockRotationY + Math.PI / 2) % (Math.PI * 2);
    if (this.previewGhostMesh) {
      this.previewGhostMesh.rotation.y = this.blockRotationY;
    }
    sounds.playJump();
  }

  public placeBlockAt(pos: THREE.Vector3, type?: SandboxBlock['type'], color?: string, rotY?: number): SandboxBlock {
    const blockType = type || this.selectedBlockType;
    const blockColor = color || this.selectedColor;
    const blockRotY = rotY !== undefined ? rotY : this.blockRotationY;

    let scale: [number, number, number] = [2, 2, 2];
    if (blockType === 'ramp') scale = [2, 2, 2];
    else if (blockType === 'trampoline' || blockType === 'bounce') scale = [3, 0.6, 3];
    else if (blockType === 'speed') scale = [3, 0.4, 3];
    else if (blockType === 'lava') scale = [2, 2, 2];
    else if (blockType === 'spinner') scale = [4, 0.4, 0.8];
    else if (blockType === 'coin') scale = [1, 1, 1];
    else if (blockType === 'checkpoint') scale = [3, 0.4, 3];

    const blockId = `block_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newBlock: SandboxBlock = {
      id: blockId,
      type: blockType,
      position: [pos.x, pos.y, pos.z],
      rotation: [0, blockRotY, 0],
      color: blockColor,
      scale,
    };

    this.sandboxBlocks.push(newBlock);
    if (this.sandboxGroup) {
      const mesh = instantiateSandboxBlock(newBlock, this.sandboxGroup);
      this.sandboxMeshes.set(blockId, mesh);
      this.registerSandboxObstacle(newBlock, mesh);
    }

    sounds.playBlockPlace();
    this.spawnConfettiBurst(pos, new THREE.Color(blockColor).getHex(), 8);
    return newBlock;
  }

  public placeBlockInFrontOfPlayer() {
    const forwardDist = 3.5;
    const targetX = Math.round((this.playerPos.x + Math.sin(this.playerRotationY) * forwardDist) / 2) * 2;
    const targetZ = Math.round((this.playerPos.z + Math.cos(this.playerRotationY) * forwardDist) / 2) * 2;
    const targetY = Math.max(1, Math.round(this.playerPos.y));

    const pos = new THREE.Vector3(targetX, targetY, targetZ);
    this.placeBlockAt(pos);
  }

  public removeBlockAt(posOrId: THREE.Vector3 | string) {
    let blockId: string | null = null;
    if (typeof posOrId === 'string') {
      blockId = posOrId;
    } else {
      // Find block closest to position
      let closestDist = 2.5;
      this.sandboxBlocks.forEach((b) => {
        const d = Math.hypot(b.position[0] - posOrId.x, b.position[1] - posOrId.y, b.position[2] - posOrId.z);
        if (d < closestDist) {
          closestDist = d;
          blockId = b.id;
        }
      });
    }

    if (!blockId) return;

    const mesh = this.sandboxMeshes.get(blockId);
    if (mesh && this.sandboxGroup) {
      this.spawnConfettiBurst(mesh.position, 0xef4444, 10);
      this.sandboxGroup.remove(mesh);
      this.sandboxMeshes.delete(blockId);
    }

    this.sandboxBlocks = this.sandboxBlocks.filter((b) => b.id !== blockId);
    this.sandboxObstacles = this.sandboxObstacles.filter((o) => o.id !== blockId);
    sounds.playBlockDelete();
  }

  public clearSandboxBlocks() {
    this.sandboxBlocks = [];
    this.sandboxMeshes.forEach((mesh) => {
      if (this.sandboxGroup) this.sandboxGroup.remove(mesh);
    });
    this.sandboxMeshes.clear();
    this.sandboxObstacles = [];
    sounds.playBlockDelete();
  }

  public getSandboxBlocks(): SandboxBlock[] {
    return JSON.parse(JSON.stringify(this.sandboxBlocks));
  }

  public loadCustomSandboxBlocks(blocks: SandboxBlock[]) {
    this.clearSandboxBlocks();
    blocks.forEach((b) => {
      this.sandboxBlocks.push(b);
      if (this.sandboxGroup) {
        const mesh = instantiateSandboxBlock(b, this.sandboxGroup);
        this.sandboxMeshes.set(b.id, mesh);
        this.registerSandboxObstacle(b, mesh);
      }
    });

    if (this.sandboxBlocks.length > 0) {
      const first = this.sandboxBlocks[0];
      this.playerPos.set(first.position[0], first.position[1] + 2, first.position[2]);
      this.currentCheckpoint.copy(this.playerPos);
      this.playerVelocity.set(0, 0, 0);
    }
    sounds.playCheckpoint();
  }

  public loadSandboxPreset(presetName: string) {
    this.clearSandboxBlocks();
    const presetBlocks = generateSandboxPreset(presetName);
    presetBlocks.forEach((b) => {
      this.sandboxBlocks.push(b);
      if (this.sandboxGroup) {
        const mesh = instantiateSandboxBlock(b, this.sandboxGroup);
        this.sandboxMeshes.set(b.id, mesh);
        this.registerSandboxObstacle(b, mesh);
      }
    });

    if (this.sandboxBlocks.length > 0) {
      const first = this.sandboxBlocks[0];
      this.playerPos.set(first.position[0], first.position[1] + 2, first.position[2]);
      this.currentCheckpoint.copy(this.playerPos);
      this.playerVelocity.set(0, 0, 0);
    }
    sounds.playCheckpoint();
  }

  private registerSandboxObstacle(block: SandboxBlock, mesh: THREE.Object3D) {
    const isSolid = block.type === 'cube' || block.type === 'ramp' || block.type === 'trampoline' || block.type === 'bounce' || block.type === 'speed' || block.type === 'checkpoint';
    const obsEntry: { id: string; type: string; box: THREE.Box3; mesh: THREE.Object3D; isSolid: boolean; update?: (d: number, t: number) => void } = {
      id: block.id,
      type: block.type,
      box: new THREE.Box3().setFromObject(mesh),
      mesh,
      isSolid,
    };

    if (block.type === 'spinner') {
      obsEntry.update = (d: number, t: number) => {
        mesh.rotation.y += d * 3.5;
        obsEntry.box.setFromObject(mesh);
      };
    } else if (block.type === 'coin') {
      obsEntry.update = (d: number, t: number) => {
        mesh.rotation.y += d * 3;
        mesh.position.y = block.position[1] + Math.sin(t * 3) * 0.2;
        obsEntry.box.setFromObject(mesh);
      };
    }

    this.sandboxObstacles.push(obsEntry);
  }

  private rebuildAllSandboxMeshes() {
    this.sandboxMeshes.forEach((mesh) => {
      if (this.sandboxGroup) this.sandboxGroup.remove(mesh);
    });
    this.sandboxMeshes.clear();
    this.sandboxObstacles = [];

    this.sandboxBlocks.forEach((b) => {
      if (this.sandboxGroup) {
        const mesh = instantiateSandboxBlock(b, this.sandboxGroup);
        this.sandboxMeshes.set(b.id, mesh);
        this.registerSandboxObstacle(b, mesh);
      }
    });
  }

  private initGhostPreviewMesh() {
    if (this.previewGhostMesh && this.sandboxGroup) {
      this.sandboxGroup.remove(this.previewGhostMesh);
    }

    const geo = new THREE.BoxGeometry(2, 2, 2);
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.selectedColor),
      transparent: true,
      opacity: 0.55,
      roughness: 0.3,
      emissive: new THREE.Color(this.selectedColor),
      emissiveIntensity: 0.3,
    });

    this.previewGhostMesh = new THREE.Mesh(geo, mat);
    this.previewGhostMesh.position.set(0, 1, 0);
    this.previewGhostMesh.visible = this.isSandboxEditMode;
    if (this.sandboxGroup) {
      this.sandboxGroup.add(this.previewGhostMesh);
    }
  }

  private updateGhostPreviewGeometry() {
    if (!this.previewGhostMesh) return;
    this.previewGhostMesh.geometry.dispose();

    if (this.selectedBlockType === 'ramp') {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(2, 0);
      shape.lineTo(0, 2);
      shape.closePath();
      this.previewGhostMesh.geometry = new THREE.ExtrudeGeometry(shape, { depth: 2, bevelEnabled: false });
    } else if (this.selectedBlockType === 'trampoline' || this.selectedBlockType === 'bounce') {
      this.previewGhostMesh.geometry = new THREE.CylinderGeometry(1.5, 1.5, 0.6, 16);
    } else if (this.selectedBlockType === 'speed') {
      this.previewGhostMesh.geometry = new THREE.BoxGeometry(3, 0.4, 3);
    } else if (this.selectedBlockType === 'spinner') {
      this.previewGhostMesh.geometry = new THREE.BoxGeometry(4, 0.4, 0.8);
    } else if (this.selectedBlockType === 'coin') {
      this.previewGhostMesh.geometry = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 16);
    } else if (this.selectedBlockType === 'checkpoint') {
      this.previewGhostMesh.geometry = new THREE.CylinderGeometry(1.8, 1.8, 0.3, 16);
    } else {
      this.previewGhostMesh.geometry = new THREE.BoxGeometry(2, 2, 2);
    }
  }

  public respawn() {
    this.playerPos.copy(this.currentCheckpoint);
    this.playerVelocity.set(0, 0, 0);
    this.spawnConfettiBurst(this.playerPos, 0x38bdf8);
    sounds.playBoing();
  }

  public triggerEmote(emote: string) {
    this.activeEmote = emote;
    this.emoteTimer = 0;
    if (emote === 'backflip') {
      sounds.playBoing();
    } else {
      sounds.playJump();
    }
  }

  // Tycoon Button Purchasing
  public handleTycoonButton(btn: TycoonButton) {
    if (btn.cost <= this.totalTycoonCash && !btn.built) {
      this.totalTycoonCash -= btn.cost;
      btn.built = true;
      sounds.playTycoonBuy();
      this.spawnConfettiBurst(new THREE.Vector3(btn.position[0], btn.position[1] + 1, btn.position[2]), 0x10b981);

      if (this.tycoonGroup) {
        buildTycoonStructure(btn.action, btn.id, this.tycoonGroup);
      }

      const mesh = this.tycoonButtonMeshes.get(btn.id);
      if (mesh) mesh.visible = false;

      this.callbacks.onTycoonCashUpdate(this.uncollectedTycoonCash, this.totalTycoonCash);
      this.callbacks.onCoinsEarned(btn.cost > 0 ? Math.floor(btn.cost / 2) : 10, 'Tycoon Upgrade!');
    }
  }

  // Touch & Joystick Input Setters
  public setJoystickVector(x: number, y: number) {
    this.joystickVector = { x, y };
  }

  public requestJump() {
    this.isJumpRequested = true;
  }

  public setSprint(sprint: boolean) {
    this.isSprint = sprint;
  }

  private setupInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space') {
        this.isJumpRequested = true;
      }
      if (e.code === 'KeyR') {
        if (this.currentMode === 'sandbox' && this.isSandboxEditMode) {
          this.rotateSandboxBlock();
        } else {
          this.respawn();
        }
      }
      if (e.code === 'KeyF' || e.code === 'KeyB') {
        if (this.currentMode === 'sandbox' && this.isSandboxEditMode) {
          this.placeBlockInFrontOfPlayer();
        }
      }
      if (e.code === 'KeyX' || e.code === 'Delete') {
        if (this.currentMode === 'sandbox' && this.isSandboxEditMode) {
          if (this.isHoveringValid) {
            this.removeBlockAt(this.hoverGridPos);
          } else {
            this.removeBlockAt(this.playerPos);
          }
        }
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.isSprint = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.isSprint = false;
      }
    });

    const dom = this.renderer.domElement;
    let mouseDownPos = { x: 0, y: 0 };

    dom.addEventListener('mousedown', (e) => {
      this.isDraggingMouse = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
      mouseDownPos = { x: e.clientX, y: e.clientY };
    });

    dom.addEventListener('contextmenu', (e) => {
      if (this.currentMode === 'sandbox' && this.isSandboxEditMode) {
        e.preventDefault();
        if (this.isHoveringValid) {
          this.removeBlockAt(this.hoverGridPos);
        }
      }
    });

    window.addEventListener('mousemove', (e) => {
      // 1. Camera orbit if dragging
      if (this.isDraggingMouse) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;

        this.cameraAngleH -= deltaX * 0.007;
        this.cameraAngleV = Math.max(0.05, Math.min(1.4, this.cameraAngleV + deltaY * 0.007));

        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }

      // 2. Sandbox Raycast Ghost Update
      if (this.currentMode === 'sandbox' && this.isSandboxEditMode && this.previewGhostMesh) {
        const rect = dom.getBoundingClientRect();
        this.mouseVector.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouseVector.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouseVector, this.camera);
        const intersectables: THREE.Object3D[] = [];
        if (this.sandboxBasePlane) intersectables.push(this.sandboxBasePlane);
        this.sandboxMeshes.forEach((mesh) => intersectables.push(mesh));

        const hits = this.raycaster.intersectObjects(intersectables, true);
        if (hits.length > 0) {
          const hit = hits[0];
          let targetX = 0;
          let targetY = 1;
          let targetZ = 0;

          if (hit.object === this.sandboxBasePlane || hit.point.y < 0.1) {
            targetX = Math.round(hit.point.x / 2) * 2;
            targetZ = Math.round(hit.point.z / 2) * 2;
            targetY = 1;
          } else if (hit.face) {
            const normal = hit.face.normal.clone().applyQuaternion(hit.object.quaternion);
            const targetPos = hit.point.clone().add(normal.clone().multiplyScalar(1.0));
            targetX = Math.round(targetPos.x / 2) * 2;
            targetY = Math.max(1, Math.round(targetPos.y));
            targetZ = Math.round(targetPos.z / 2) * 2;
          } else {
            targetX = Math.round(hit.point.x / 2) * 2;
            targetY = Math.max(1, Math.round(hit.point.y / 2) * 2);
            targetZ = Math.round(hit.point.z / 2) * 2;
          }

          this.hoverGridPos.set(targetX, targetY, targetZ);
          this.previewGhostMesh.position.set(targetX, targetY, targetZ);
          this.previewGhostMesh.rotation.y = this.blockRotationY;
          this.previewGhostMesh.visible = true;
          this.isHoveringValid = true;
        } else {
          this.isHoveringValid = false;
        }
      }
    });

    window.addEventListener('mouseup', (e) => {
      const clickDist = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);
      this.isDraggingMouse = false;

      // Clean Click (not a drag) on Canvas in Sandbox Mode
      if (clickDist < 8 && this.currentMode === 'sandbox' && this.isSandboxEditMode && this.isHoveringValid) {
        if (e.button === 2 || this.isDeleteMode) {
          this.removeBlockAt(this.hoverGridPos);
        } else if (e.button === 0) {
          this.placeBlockAt(this.hoverGridPos);
        }
      }
    });

    // Touch swipe camera rotation
    let touchStartX = 0;
    let touchStartY = 0;
    dom.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    });

    dom.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;

        // Rotate only if significant swipe
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          this.cameraAngleH -= dx * 0.006;
          this.cameraAngleV = Math.max(0.05, Math.min(1.4, this.cameraAngleV + dy * 0.006));
        }

        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    });

    // Zoom with scroll wheel
    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cameraDistance = Math.max(6, Math.min(30, this.cameraDistance + e.deltaY * 0.02));
    }, { passive: false });

    // Handle Resize
    window.addEventListener('resize', () => {
      if (!this.container) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  // Animation and Physics update loop
  private update(delta: number, time: number) {
    // 1. Calculate pet stat boosts
    let speedMult = 1.0;
    let jumpMult = 1.0;
    this.equippedPets.forEach((p) => {
      speedMult += p.speedBoost;
      jumpMult += p.jumpBoost;
    });

    // Accessory / held items boosts
    if (this.playerCustomization.heldItem === 'speedCoil') speedMult += 0.6;
    if (this.playerCustomization.heldItem === 'gravityCoil') jumpMult += 0.5;
    if (this.playerCustomization.backAccessory === 'jetpack' || this.playerCustomization.backAccessory === 'angelWings') {
      jumpMult += 0.2;
    }

    const moveSpeed = (this.isSprint ? 18 : 11) * speedMult;

    // 2. Input Direction relative to camera horizontal orientation
    let inputX = 0;
    let inputZ = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) inputZ -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) inputZ += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) inputX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) inputX += 1;

    // Merge with virtual joystick
    if (Math.abs(this.joystickVector.x) > 0.05 || Math.abs(this.joystickVector.y) > 0.05) {
      inputX = this.joystickVector.x;
      inputZ = -this.joystickVector.y;
    }

    const hasMovement = Math.abs(inputX) > 0.01 || Math.abs(inputZ) > 0.01;
    if (hasMovement) {
      this.activeEmote = null; // cancel emote on walk
    }

    const moveVector = new THREE.Vector3(inputX, 0, inputZ);
    if (moveVector.lengthSq() > 1) moveVector.normalize();

    // Rotate input by camera horizontal angle
    moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraAngleH);

    this.playerVelocity.x = moveVector.x * moveSpeed;
    this.playerVelocity.z = moveVector.z * moveSpeed;

    // 3. Jump Logic & Gravity
    const gravity = -32;
    this.playerVelocity.y += gravity * delta;

    if (this.isJumpRequested) {
      this.isJumpRequested = false;
      if (this.isGrounded) {
        this.playerVelocity.y = 16 * jumpMult;
        this.isGrounded = false;
        this.canDoubleJump = true;
        sounds.playJump();
      } else if (this.canDoubleJump) {
        this.playerVelocity.y = 15 * jumpMult;
        this.canDoubleJump = false;
        sounds.playDoubleJump();
        this.spawnConfettiBurst(this.playerPos, 0x38bdf8, 6);
      }
    }

    // 4. Update Position
    this.playerPos.x += this.playerVelocity.x * delta;
    this.playerPos.y += this.playerVelocity.y * delta;
    this.playerPos.z += this.playerVelocity.z * delta;

    // Character rotation facing movement direction
    if (hasMovement) {
      const targetAngle = Math.atan2(this.playerVelocity.x, this.playerVelocity.z);
      this.playerRotationY = targetAngle;
    }

    // 5. Floor & Obstacle Collision Checks
    this.checkCollisions(delta, time);

    // Fall below world check
    if (this.playerPos.y < -25) {
      this.respawn();
      sounds.playLavaDefeat();
    }

    // 6. Character mesh transformation & articulated limb animation
    if (this.character) {
      this.character.root.position.copy(this.playerPos);
      this.character.root.rotation.y = this.playerRotationY;

      // Animate Propeller hat if equipped
      if (this.character.propellerMesh) {
        this.character.propellerMesh.rotation.y += delta * 15;
      }

      // Animate Wings flapping
      if (this.character.wingsMesh) {
        const wingFlap = Math.sin(time * 6) * 0.2;
        this.character.wingsMesh.children[0]?.rotation.set(0, wingFlap, 0);
        this.character.wingsMesh.children[1]?.rotation.set(0, -wingFlap, 0);
      }

      this.animateAvatarLimbs(delta, time, hasMovement);
    }

    // 7. Pets Following Lerp
    this.updatePetPositions(delta, time);

    // 8. World Specific Mechanics
    if (this.currentMode === 'obby') {
      this.updateObbyMechanics(delta, time);
    } else if (this.currentMode === 'tycoon') {
      this.updateTycoonMechanics(delta, time);
    } else if (this.currentMode === 'lava') {
      this.updateLavaMechanics(delta, time);
    } else if (this.currentMode === 'sandbox') {
      this.updateSandboxMechanics(delta, time);
    } else if (this.currentMode === 'lobby') {
      this.updateLobbyMechanics();
    }

    // 9. Particle Updates
    this.updateParticles(delta);

    // 10. Update 3rd person follow Camera
    this.updateCamera();
  }

  private animateAvatarLimbs(delta: number, time: number, isMoving: boolean) {
    if (!this.character) return;

    if (this.activeEmote) {
      this.emoteTimer += delta;
      if (this.activeEmote === 'floss') {
        // Floss dance
        const armPhase = Math.sin(this.emoteTimer * 8);
        this.character.leftArmPivot.rotation.z = armPhase * 0.8;
        this.character.rightArmPivot.rotation.z = armPhase * 0.8;
        this.character.leftArmPivot.rotation.x = Math.cos(this.emoteTimer * 8) * 0.3;
        this.character.rightArmPivot.rotation.x = Math.cos(this.emoteTimer * 8) * 0.3;
        this.character.torso.rotation.y = -armPhase * 0.4;
      } else if (this.activeEmote === 'hype') {
        // Hype dance
        const jumpPhase = Math.abs(Math.sin(this.emoteTimer * 10));
        this.character.torso.position.y = 2.5 + jumpPhase * 0.6;
        this.character.leftArmPivot.rotation.x = -Math.PI / 2 + Math.sin(this.emoteTimer * 10) * 0.5;
        this.character.rightArmPivot.rotation.x = -Math.PI / 2 - Math.sin(this.emoteTimer * 10) * 0.5;
      } else if (this.activeEmote === 'backflip') {
        // Full somersault
        const rot = this.emoteTimer * Math.PI * 3;
        this.character.root.rotation.x = -rot;
        this.character.root.position.y = this.playerPos.y + Math.sin(this.emoteTimer * Math.PI * 1.5) * 2.5;
        if (this.emoteTimer > 0.8) {
          this.activeEmote = null;
          this.character.root.rotation.x = 0;
        }
      } else if (this.activeEmote === 'wave') {
        this.character.rightArmPivot.rotation.x = -Math.PI * 0.8;
        this.character.rightArmPivot.rotation.z = Math.sin(this.emoteTimer * 12) * 0.4 + 0.3;
      } else if (this.activeEmote === 'cheer') {
        this.character.leftArmPivot.rotation.x = -Math.PI * 0.85;
        this.character.rightArmPivot.rotation.x = -Math.PI * 0.85;
        this.character.torso.position.y = 2.5 + Math.abs(Math.sin(this.emoteTimer * 8)) * 0.4;
      }
      return;
    }

    // Default Walk / Run / Jump animation
    if (!this.isGrounded) {
      // In air
      this.character.leftArmPivot.rotation.x = -Math.PI * 0.6;
      this.character.rightArmPivot.rotation.x = -Math.PI * 0.6;
      this.character.leftLegPivot.rotation.x = 0.4;
      this.character.rightLegPivot.rotation.x = -0.3;
    } else if (isMoving) {
      // Walking / running limb swing
      const limbSpeed = this.isSprint ? 16 : 11;
      const swing = Math.sin(time * limbSpeed) * 0.8;

      this.character.leftArmPivot.rotation.x = swing;
      this.character.rightArmPivot.rotation.x = -swing;
      this.character.leftLegPivot.rotation.x = -swing;
      this.character.rightLegPivot.rotation.x = swing;

      this.character.torso.position.y = 2.5 + Math.abs(Math.sin(time * limbSpeed * 2)) * 0.15;
    } else {
      // Idle breathing
      const breath = Math.sin(time * 2) * 0.05;
      this.character.leftArmPivot.rotation.x = breath;
      this.character.rightArmPivot.rotation.x = breath;
      this.character.leftLegPivot.rotation.x = 0;
      this.character.rightLegPivot.rotation.x = 0;
      this.character.torso.position.y = 2.5 + breath * 0.3;
    }
  }

  private updatePetPositions(delta: number, time: number) {
    this.petMeshes.forEach((mesh, index) => {
      const angle = this.playerRotationY + Math.PI + (index - (this.petMeshes.length - 1) / 2) * 0.6;
      const targetX = this.playerPos.x + Math.sin(angle) * 3;
      const targetZ = this.playerPos.z + Math.cos(angle) * 3;
      const targetY = this.playerPos.y + 2 + Math.sin(time * 3 + index) * 0.4;

      mesh.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), delta * 8);
      mesh.rotation.y = this.playerRotationY;
    });
  }

  private checkCollisions(delta: number, time: number) {
    // Ground base plane
    let groundY = 0;
    if (this.currentMode === 'lobby') {
      const distFromCenter = Math.hypot(this.playerPos.x, this.playerPos.z);
      if (distFromCenter < 35) groundY = 0.05;
    } else if (this.currentMode === 'sandbox') {
      groundY = 0.05;
    }

    if (this.playerPos.y <= groundY + 0.01 && this.playerVelocity.y <= 0) {
      this.playerPos.y = groundY;
      this.playerVelocity.y = 0;
      this.isGrounded = true;
      this.canDoubleJump = true;
    } else {
      this.isGrounded = false;
    }
  }

  private updateObbyMechanics(delta: number, time: number) {
    const playerBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(this.playerPos.x, this.playerPos.y + 1.5, this.playerPos.z),
      new THREE.Vector3(1.8, 3, 1.8)
    );

    this.obbyObstacles.forEach((obs) => {
      if (obs.update) obs.update(delta, time);

      const obsBox = obs.box || new THREE.Box3().setFromObject(obs.mesh);

      if (playerBox.intersectsBox(obsBox)) {
        if (obs.type === 'static' || obs.type === 'fading') {
          // Landing on platform top
          if (this.playerVelocity.y <= 0 && this.playerPos.y >= obsBox.max.y - 1.2) {
            this.playerPos.y = obsBox.max.y;
            this.playerVelocity.y = 0;
            this.isGrounded = true;
            this.canDoubleJump = true;
          }
        } else if (obs.type === 'trampoline') {
          this.playerVelocity.y = 30; // Launch high!
          this.isGrounded = false;
          sounds.playBoing();
          this.spawnConfettiBurst(this.playerPos, 0xfacc15, 8);
        } else if (obs.type === 'speed') {
          this.playerVelocity.z += 25;
          sounds.playSpeedBoost();
        } else if (obs.type === 'lava') {
          this.respawn();
          sounds.playLavaDefeat();
        } else if (obs.type === 'checkpoint') {
          if (obs.stageIndex > this.currentStageIndex) {
            this.currentStageIndex = obs.stageIndex;
            this.currentCheckpoint.copy(this.obbyCheckpoints[obs.stageIndex]);
            sounds.playCheckpoint();
            this.spawnConfettiBurst(this.playerPos, 0x10b981, 15);
            this.callbacks.onStageChange(obs.stageIndex + 1, this.obbyStages[obs.stageIndex]?.name || `Stage ${obs.stageIndex + 1}`);
            this.callbacks.onCoinsEarned(25, `Cleared Stage ${obs.stageIndex + 1}!`);
          }
        } else if (obs.type === 'coin') {
          sounds.playCoin();
          this.callbacks.onCoinsEarned(10, 'Obby Coin Picked Up!');
          this.spawnConfettiBurst(obs.mesh.position, 0xfacc15, 8);
          this.scene.remove(obs.mesh);
          obs.box = new THREE.Box3(); // disable
        } else if (obs.type === 'gem') {
          sounds.playGem();
          this.callbacks.onGemsEarned(2, 'Sparkle Gem Found!');
          this.spawnConfettiBurst(obs.mesh.position, 0x06b6d4, 12);
          this.scene.remove(obs.mesh);
          obs.box = new THREE.Box3();
        } else if (obs.type === 'finish') {
          this.callbacks.onObbyFinish();
          this.callbacks.onCoinsEarned(200, 'Obby Champion Victory!');
          this.callbacks.onGemsEarned(10, 'Obby Champion Crown!');
          sounds.playVictory();
          this.spawnConfettiBurst(this.playerPos, 0xfbbf24, 40);
        }
      }
    });
  }

  private updateTycoonMechanics(delta: number, time: number) {
    this.candyDropTimer += delta;

    // Check droppers active
    const activeDroppers = this.tycoonButtons.filter((b) => b.built && b.action === 'dropper');
    if (this.candyDropTimer > 1.2 && activeDroppers.length > 0) {
      this.candyDropTimer = 0;
      activeDroppers.forEach((d) => {
        // Spawn a dropping candy
        const val = d.id === 'btn_claim' ? 2 : d.id === 'btn_dropper1' ? 8 : d.id === 'btn_dropper2' ? 20 : 50;
        const color = d.id === 'btn_claim' ? 0x10b981 : d.id === 'btn_dropper1' ? 0xec4899 : d.id === 'btn_dropper2' ? 0x8b5cf6 : 0x78350f;
        const candyMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.5, 8, 8),
          new THREE.MeshStandardMaterial({ color, roughness: 0.2, emissive: color, emissiveIntensity: 0.3 })
        );
        candyMesh.position.set(-3, 2.5, d.position[2]);
        if (this.tycoonGroup) {
          this.tycoonGroup.add(candyMesh);
          this.droppedCandies.push({
            mesh: candyMesh,
            value: val,
            progress: 0,
            type: d.id,
          });
        }
      });
    }

    // Move dropped candies along conveyor
    for (let i = this.droppedCandies.length - 1; i >= 0; i--) {
      const c = this.droppedCandies[i];
      c.progress += delta * 0.6;
      c.mesh.position.x = THREE.MathUtils.lerp(-3, 0, Math.min(1, c.progress * 2));
      c.mesh.position.z = THREE.MathUtils.lerp(c.mesh.position.z, 2, c.progress);

      if (c.progress >= 1) {
        this.uncollectedTycoonCash += c.value;
        if (this.tycoonGroup) this.tycoonGroup.remove(c.mesh);
        this.droppedCandies.splice(i, 1);
        this.callbacks.onTycoonCashUpdate(this.uncollectedTycoonCash, this.totalTycoonCash);
      }
    }

    // Auto-collect Elf if built
    const elfBuilt = this.tycoonButtons.find((b) => b.id === 'btn_elf' && b.built);
    if (elfBuilt && this.uncollectedTycoonCash > 0) {
      this.totalTycoonCash += this.uncollectedTycoonCash;
      this.callbacks.onCoinsEarned(Math.floor(this.uncollectedTycoonCash), 'Auto-Collected Tycoon Cash!');
      this.uncollectedTycoonCash = 0;
      this.callbacks.onTycoonCashUpdate(this.uncollectedTycoonCash, this.totalTycoonCash);
    }

    // Check player stepping on collect cash pad
    const playerBox = new THREE.Box3().setFromCenterAndSize(this.playerPos, new THREE.Vector3(3, 3, 3));
    const collectBox = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(6, 1, 4), new THREE.Vector3(5, 2, 5));
    if (playerBox.intersectsBox(collectBox) && this.uncollectedTycoonCash > 0) {
      this.totalTycoonCash += this.uncollectedTycoonCash;
      sounds.playTycoonBuy();
      this.spawnConfettiBurst(new THREE.Vector3(6, 2, 4), 0x10b981, 10);
      this.callbacks.onCoinsEarned(this.uncollectedTycoonCash, 'Collected Tycoon Revenue!');
      this.uncollectedTycoonCash = 0;
      this.callbacks.onTycoonCashUpdate(this.uncollectedTycoonCash, this.totalTycoonCash);
    }

    // Check stepping on purchase buttons
    this.tycoonButtons.forEach((btn) => {
      if (!btn.built) {
        const btnPos = new THREE.Vector3(btn.position[0], btn.position[1], btn.position[2]);
        if (this.playerPos.distanceTo(btnPos) < 2.5) {
          this.handleTycoonButton(btn);
        }
      }
    });
  }

  private updateLavaMechanics(delta: number, time: number) {
    if (!this.isLavaActive) return;

    this.lavaRoundTimer -= delta;
    this.callbacks.onLavaTimeUpdate(Math.max(0, Math.ceil(this.lavaRoundTimer)), this.lavaHeight);

    // Lava rises continuously up to tower height 30
    if (this.lavaRoundTimer > 10) {
      this.lavaHeight = -5 + ((60 - this.lavaRoundTimer) / 50) * 33;
    }

    if (this.lavaMesh) {
      this.lavaMesh.position.y = this.lavaHeight;
    }

    // Platform collisions
    const playerBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(this.playerPos.x, this.playerPos.y + 1.5, this.playerPos.z),
      new THREE.Vector3(1.8, 3, 1.8)
    );

    this.lavaPlatforms.forEach((p) => {
      if (p.update) p.update(delta, time);
      const pBox = new THREE.Box3().setFromObject(p.mesh);

      if (playerBox.intersectsBox(pBox)) {
        if (p.type === 'static' && this.playerVelocity.y <= 0 && this.playerPos.y >= pBox.max.y - 1.2) {
          this.playerPos.y = pBox.max.y;
          this.playerVelocity.y = 0;
          this.isGrounded = true;
          this.canDoubleJump = true;
        } else if (p.type === 'bounce') {
          this.playerVelocity.y = 35;
          sounds.playBoing();
          this.spawnConfettiBurst(this.playerPos, 0xfacc15, 8);
        }
      }
    });

    // Lava burning check
    if (this.playerPos.y <= this.lavaHeight + 0.5) {
      sounds.playLavaDefeat();
      this.isLavaActive = false;
      this.callbacks.onLavaRoundEnd(false);
      this.respawn();
    }

    // Survived full round!
    if (this.lavaRoundTimer <= 0 && !this.lavaSurvived) {
      this.lavaSurvived = true;
      this.isLavaActive = false;
      sounds.playVictory();
      this.spawnConfettiBurst(this.playerPos, 0xfbbf24, 30);
      this.callbacks.onCoinsEarned(150, 'Surviving Floor is Lava!');
      this.callbacks.onGemsEarned(5, 'Lava Master!');
      this.callbacks.onLavaRoundEnd(true);
    }
  }

  private updateSandboxMechanics(delta: number, time: number) {
    const playerBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(this.playerPos.x, this.playerPos.y + 1.5, this.playerPos.z),
      new THREE.Vector3(1.8, 3, 1.8)
    );

    this.sandboxObstacles.forEach((obs) => {
      if (obs.update) obs.update(delta, time);
      const obsBox = obs.box || new THREE.Box3().setFromObject(obs.mesh);

      if (playerBox.intersectsBox(obsBox)) {
        if (obs.isSolid) {
          if (this.playerVelocity.y <= 0 && this.playerPos.y >= obsBox.max.y - 1.2) {
            this.playerPos.y = obsBox.max.y;
            this.playerVelocity.y = 0;
            this.isGrounded = true;
            this.canDoubleJump = true;
          }

          if (obs.type === 'trampoline' || obs.type === 'bounce') {
            this.playerVelocity.y = 34; // Super launch!
            this.isGrounded = false;
            sounds.playBoing();
            this.spawnConfettiBurst(this.playerPos, 0xfacc15, 10);
          } else if (obs.type === 'speed') {
            this.playerVelocity.x += Math.sin(this.playerRotationY) * 25;
            this.playerVelocity.z += Math.cos(this.playerRotationY) * 25;
            sounds.playSpeedBoost();
          } else if (obs.type === 'checkpoint') {
            this.currentCheckpoint.set(obs.mesh.position.x, obs.mesh.position.y + 1, obs.mesh.position.z);
            sounds.playCheckpoint();
            this.spawnConfettiBurst(this.playerPos, 0x10b981, 10);
          }
        } else if (obs.type === 'lava') {
          this.respawn();
          sounds.playLavaDefeat();
        } else if (obs.type === 'coin') {
          sounds.playCoin();
          this.callbacks.onCoinsEarned(10, 'Sandbox Coin Picked Up!');
          this.spawnConfettiBurst(obs.mesh.position, 0xfacc15, 8);
          this.removeBlockAt(obs.id);
        } else if (obs.type === 'spinner') {
          // Push player away from spinner center
          const pushDir = new THREE.Vector3(
            this.playerPos.x - obs.mesh.position.x,
            2,
            this.playerPos.z - obs.mesh.position.z
          ).normalize();
          this.playerVelocity.x = pushDir.x * 20;
          this.playerVelocity.z = pushDir.z * 20;
          this.playerVelocity.y = 12;
          this.isGrounded = false;
          sounds.playBoing();
        }
      }
    });
  }

  private updateLobbyMechanics() {
    let nearestPortal: PortalTrigger | null = null;
    this.lobbyPortals.forEach((p) => {
      p.mesh.children[3]?.rotation.set(0, 0, Math.sin(this.clock.getElapsedTime() * 2) * 0.1);
      if (this.playerPos.distanceTo(p.position) < 4.5) {
        nearestPortal = p;
      }
    });

    if (nearestPortal) {
      const p = nearestPortal as PortalTrigger;
      this.callbacks.onInteractiveNearby(`Press [E] or Click to enter ${p.name}`);
      if (this.keys['KeyE']) {
        this.keys['KeyE'] = false;
        sounds.playCheckpoint();
        this.callbacks.onPortalEnter(p.mode);
      }
    } else {
      this.callbacks.onInteractiveNearby(null);
    }
  }

  private spawnConfettiBurst(pos: THREE.Vector3, color: number, count: number = 10) {
    const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const mat = new THREE.MeshBasicMaterial({ color });

    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(geo, mat);
      p.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 2, (Math.random() - 0.5) * 2));
      this.particleGroup.add(p);
      this.activeParticles.push({
        mesh: p,
        vel: new THREE.Vector3((Math.random() - 0.5) * 12, Math.random() * 12 + 6, (Math.random() - 0.5) * 12),
        life: 0,
        maxLife: 1.2 + Math.random() * 0.5,
      });
    }
  }

  private updateParticles(delta: number) {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const pt = this.activeParticles[i];
      pt.life += delta;
      pt.vel.y -= 25 * delta; // gravity
      pt.mesh.position.addScaledVector(pt.vel, delta);
      pt.mesh.rotation.x += delta * 6;
      pt.mesh.rotation.y += delta * 6;

      if (pt.life >= pt.maxLife) {
        this.particleGroup.remove(pt.mesh);
        this.activeParticles.splice(i, 1);
      }
    }
  }

  private updateCamera() {
    const target = new THREE.Vector3(this.playerPos.x, this.playerPos.y + 2.5, this.playerPos.z);

    const x = target.x + this.cameraDistance * Math.sin(this.cameraAngleH) * Math.cos(this.cameraAngleV);
    const y = target.y + this.cameraDistance * Math.sin(this.cameraAngleV);
    const z = target.z + this.cameraDistance * Math.cos(this.cameraAngleH) * Math.cos(this.cameraAngleV);

    this.camera.position.lerp(new THREE.Vector3(x, y, z), 0.15);
    this.camera.lookAt(target);
  }

  private startLoop() {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(0.1, this.clock.getDelta());
      const time = this.clock.getElapsedTime();

      this.update(delta, time);
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  public destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
