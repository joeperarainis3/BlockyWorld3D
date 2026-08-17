export type GameMode = 'lobby' | 'obby' | 'tycoon' | 'lava' | 'sandbox';

export interface AvatarCustomization {
  skinColor: string;
  torsoColor: string;
  leftArmColor: string;
  rightArmColor: string;
  leftLegColor: string;
  rightLegColor: string;
  faceExpression: 'smile' | 'cool' | 'wink' | 'cat' | 'excited' | 'ninja';
  hat: string; // 'none' | 'tophat' | 'crown' | 'party' | 'catears' | 'viking' | 'halo' | 'propeller'
  backAccessory: string; // 'none' | 'angelWings' | 'demonWings' | 'cape' | 'jetpack' | 'sword'
  heldItem: string; // 'none' | 'speedCoil' | 'gravityCoil' | 'magicWand' | 'balloon' | 'popsicle'
  trail: string; // 'none' | 'rainbow' | 'sparkles' | 'fire' | 'bubbles' | 'hearts'
  title: string;
}

export interface Pet {
  id: string;
  name: string;
  species: 'dog' | 'cat' | 'dragon' | 'unicorn' | 'alien' | 'phoenix' | 'panda' | 'dino';
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  color: string;
  coinMultiplier: number;
  speedBoost: number;
  jumpBoost: number;
  level: number;
  equipped: boolean;
}

export interface EggType {
  id: string;
  name: string;
  cost: number;
  currency: 'coins' | 'gems';
  color: string;
  icon: string;
  drops: {
    species: Pet['species'];
    name: string;
    rarity: Pet['rarity'];
    color: string;
    chance: number; // 0-100
    coinMultiplier: number;
    speedBoost: number;
    jumpBoost: number;
  }[];
}

export interface TycoonButton {
  id: string;
  title: string;
  cost: number;
  built: boolean;
  requires?: string;
  position: [number, number, number];
  color: string;
  icon: string;
  action: 'dropper' | 'conveyor' | 'wall' | 'roof' | 'decoration' | 'multiplier' | 'helper';
}

export interface ObbyStage {
  id: number;
  name: string;
  theme: string;
  color: string;
  spawnPoint: [number, number, number];
  description: string;
}

export interface SandboxBlock {
  id: string;
  type: 'cube' | 'ramp' | 'bounce' | 'speed' | 'lava' | 'spinner' | 'coin' | 'checkpoint' | 'trampoline';
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  scale: [number, number, number];
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  color: string;
  isSystem?: boolean;
  time: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  score: number;
  stage: number;
  coins: number;
  isPlayer?: boolean;
}
