// ===== TYPE DEFINITIONS =====

export type GamePhase =
  | 'CHARACTER_SELECT' | 'MINE' | 'MAP' | 'BATTLE' | 'ELITE'
  | 'MERCHANT' | 'REST' | 'REWARD' | 'BOSS' | 'GAME_OVER' | 'VICTORY';

export type BlockType = 'dirt' | 'stone' | 'coal' | 'iron' | 'gold' | 'diamond' | 'emerald';

export const ALL_BLOCKS: BlockType[] = ['dirt', 'stone', 'coal', 'iron', 'gold', 'diamond', 'emerald'];

export interface CardDef {
  id: string;
  name: string;
  cost: number;
  type: 'attack' | 'skill' | 'power';
  description: string;
  rarity: 'starter' | 'common' | 'uncommon' | 'rare';
  character: 'steve' | 'alex' | 'both';
  damage?: number;
  block?: number;
  hits?: number;
  vulnerable?: number;
  weak?: number;
  poison?: number;
  draw?: number;
  strength?: number;
}

export interface CardInstance extends CardDef {
  uid: number;
}

export interface CharacterDef {
  id: 'steve' | 'alex';
  name: string;
  maxHP: number;
  startingDeckIds: string[];
  description: string;
  emoji: string;
  color: string;
}

export interface EnemyMove {
  name: string;
  damage?: number;
  block?: number;
  strength?: number;
  vulnerable?: number;
  weak?: number;
}

export interface EnemyDef {
  id: string;
  name: string;
  maxHP: number;
  moves: EnemyMove[];
  emoji: string;
  floor: number;
  isElite?: boolean;
  isBoss?: boolean;
}

export interface MerchantItem {
  id: string;
  name: string;
  description: string;
  type: 'card' | 'potion' | 'remove';
  costs: Partial<Record<BlockType, number>>;
  cardId?: string;
  healAmount?: number;
  strengthAmount?: number;
}

export interface MineCell {
  blockType: BlockType | 'grass' | 'bedrock' | 'air';
  mined: boolean;
}

export interface MapNodeDef {
  id: number;
  type: 'battle' | 'elite' | 'merchant' | 'rest' | 'boss';
  completed: boolean;
}

// ===== BLOCK CONSTANTS =====

export const BLOCK_COLORS: Record<string, string> = {
  grass: '#4CAF50',
  dirt: '#92692A',
  stone: '#8a8a8a',
  coal: '#4a4a4a',
  iron: '#D4A574',
  gold: '#FFD700',
  diamond: '#00E5FF',
  emerald: '#00E676',
  bedrock: '#1a1a2e',
  air: 'transparent',
};

export const BLOCK_NAMES: Record<string, string> = {
  dirt: 'Dirt', stone: 'Stone', coal: 'Coal', iron: 'Iron',
  gold: 'Gold', diamond: 'Diamond', emerald: 'Emerald',
};

export const BLOCK_EMOJI: Record<BlockType, string> = {
  dirt: '🟫', stone: '⬜', coal: '⬛', iron: '🟧', gold: '🟨', diamond: '💎', emerald: '💚',
};

// ===== CARD DEFINITIONS =====

export const CARDS: Record<string, CardDef> = {
  strike: {
    id: 'strike', name: 'Strike', cost: 1, type: 'attack',
    description: 'Deal 6 damage.', rarity: 'starter', character: 'both', damage: 6,
  },
  defend: {
    id: 'defend', name: 'Defend', cost: 1, type: 'skill',
    description: 'Gain 5 Block.', rarity: 'starter', character: 'both', block: 5,
  },
  // STEVE CARDS
  bash: {
    id: 'bash', name: 'Bash', cost: 2, type: 'attack',
    description: 'Deal 8 damage.\nApply 2 Vulnerable.', rarity: 'common', character: 'steve',
    damage: 8, vulnerable: 2,
  },
  body_slam: {
    id: 'body_slam', name: 'Body Slam', cost: 1, type: 'attack',
    description: 'Deal damage equal\nto your Block.', rarity: 'uncommon', character: 'steve',
    damage: -1, // special flag
  },
  iron_wave: {
    id: 'iron_wave', name: 'Iron Wave', cost: 1, type: 'attack',
    description: 'Gain 5 Block.\nDeal 5 damage.', rarity: 'common', character: 'steve',
    damage: 5, block: 5,
  },
  sword_boomerang: {
    id: 'sword_boomerang', name: 'Sword Boomerang', cost: 1, type: 'attack',
    description: 'Deal 3 damage\n3 times.', rarity: 'uncommon', character: 'steve',
    damage: 3, hits: 3,
  },
  shrug_it_off: {
    id: 'shrug_it_off', name: 'Shrug It Off', cost: 1, type: 'skill',
    description: 'Gain 8 Block.\nDraw 1 card.', rarity: 'uncommon', character: 'steve',
    block: 8, draw: 1,
  },
  heavy_blow: {
    id: 'heavy_blow', name: 'Heavy Blow', cost: 2, type: 'attack',
    description: 'Deal 14 damage.', rarity: 'common', character: 'steve', damage: 14,
  },
  fortify: {
    id: 'fortify', name: 'Fortify', cost: 2, type: 'skill',
    description: 'Gain 15 Block.', rarity: 'uncommon', character: 'steve', block: 15,
  },
  inflame: {
    id: 'inflame', name: 'Inflame', cost: 1, type: 'power',
    description: 'Gain 2 Strength.', rarity: 'rare', character: 'steve', strength: 2,
  },
  // ALEX CARDS
  quick_shot: {
    id: 'quick_shot', name: 'Quick Shot', cost: 1, type: 'attack',
    description: 'Deal 4 damage.\nDraw 1 card.', rarity: 'common', character: 'alex',
    damage: 4, draw: 1,
  },
  poison_arrow: {
    id: 'poison_arrow', name: 'Poison Arrow', cost: 1, type: 'attack',
    description: 'Deal 3 damage.\nApply 3 Poison.', rarity: 'common', character: 'alex',
    damage: 3, poison: 3,
  },
  multi_shot: {
    id: 'multi_shot', name: 'Multi-Shot', cost: 2, type: 'attack',
    description: 'Deal 4 damage\n3 times.', rarity: 'uncommon', character: 'alex',
    damage: 4, hits: 3,
  },
  dodge: {
    id: 'dodge', name: 'Dodge', cost: 1, type: 'skill',
    description: 'Gain 8 Block.', rarity: 'common', character: 'alex', block: 8,
  },
  trap_card: {
    id: 'trap_card', name: 'Trap', cost: 1, type: 'skill',
    description: 'Apply 2 Weak.', rarity: 'common', character: 'alex', weak: 2,
  },
  headshot: {
    id: 'headshot', name: 'Headshot', cost: 2, type: 'attack',
    description: 'Deal 12 damage.', rarity: 'uncommon', character: 'alex', damage: 12,
  },
  poison_spray: {
    id: 'poison_spray', name: 'Poison Spray', cost: 1, type: 'skill',
    description: 'Apply 5 Poison.', rarity: 'uncommon', character: 'alex', poison: 5,
  },
  smoke_bomb: {
    id: 'smoke_bomb', name: 'Smoke Bomb', cost: 1, type: 'skill',
    description: 'Gain 6 Block.\nDraw 1 card.', rarity: 'uncommon', character: 'alex',
    block: 6, draw: 1,
  },
  accuracy: {
    id: 'accuracy', name: 'Accuracy', cost: 1, type: 'power',
    description: 'Gain 1 Strength.', rarity: 'rare', character: 'alex', strength: 1,
  },
  // SHARED RARE
  diamond_sword: {
    id: 'diamond_sword', name: 'Diamond Sword', cost: 3, type: 'attack',
    description: 'Deal 25 damage.', rarity: 'rare', character: 'both', damage: 25,
  },
  emerald_shield: {
    id: 'emerald_shield', name: 'Emerald Shield', cost: 2, type: 'skill',
    description: 'Gain 20 Block.', rarity: 'rare', character: 'both', block: 20,
  },
};

// ===== CHARACTER DEFINITIONS =====

export const CHARACTERS: Record<string, CharacterDef> = {
  steve: {
    id: 'steve', name: 'Steve the Warrior', maxHP: 75,
    startingDeckIds: ['strike', 'strike', 'strike', 'strike', 'defend', 'defend', 'defend', 'defend', 'bash', 'body_slam'],
    description: 'A stalwart warrior with high HP and powerful melee attacks. Excels at dealing heavy damage and soaking hits.',
    emoji: '⛏️', color: 'from-blue-600 to-blue-800',
  },
  alex: {
    id: 'alex', name: 'Alex the Ranger', maxHP: 65,
    startingDeckIds: ['strike', 'strike', 'strike', 'strike', 'defend', 'defend', 'defend', 'defend', 'quick_shot', 'poison_arrow'],
    description: 'A cunning ranger who uses poison, speed, and precision. Lower HP but applies debilitating status effects.',
    emoji: '🏹', color: 'from-green-600 to-green-800',
  },
};

// ===== ENEMY DEFINITIONS =====

export const ENEMIES: EnemyDef[] = [
  // Floor 1
  { id: 'zombie', name: 'Zombie', maxHP: 30, floor: 1, emoji: '🧟',
    moves: [
      { name: 'Bite', damage: 6 },
      { name: 'Groan', damage: 8 },
      { name: 'Brace', block: 5 },
    ]},
  { id: 'skeleton', name: 'Skeleton', maxHP: 28, floor: 1, emoji: '💀',
    moves: [
      { name: 'Arrow', damage: 7 },
      { name: 'Quick Shot', damage: 5 },
      { name: 'Dodge', block: 6 },
    ]},
  { id: 'spider', name: 'Spider', maxHP: 22, floor: 1, emoji: '🕷️',
    moves: [
      { name: 'Bite', damage: 5 },
      { name: 'Web Spray', damage: 4, weak: 1 },
      { name: 'Lunge', damage: 9 },
    ]},
  // Floor 2
  { id: 'creeper', name: 'Creeper', maxHP: 45, floor: 2, emoji: '💥',
    moves: [
      { name: 'Hiss', block: 8 },
      { name: 'Explode', damage: 14 },
      { name: 'Approach', damage: 7 },
    ]},
  { id: 'enderman', name: 'Enderman', maxHP: 48, floor: 2, emoji: '👾',
    moves: [
      { name: 'Teleport', block: 10 },
      { name: 'Scratch', damage: 10 },
      { name: 'Stare', damage: 6, vulnerable: 1 },
    ]},
  { id: 'blaze', name: 'Blaze', maxHP: 42, floor: 2, emoji: '🔥',
    moves: [
      { name: 'Fireball', damage: 8 },
      { name: 'Firestorm', damage: 12 },
      { name: 'Shield', block: 6 },
    ]},
  // Floor 2 Elite
  { id: 'wither_skeleton', name: 'Wither Skeleton', maxHP: 65, floor: 2, emoji: '💀', isElite: true,
    moves: [
      { name: 'Wither Strike', damage: 11, weak: 1 },
      { name: 'Bone Shield', block: 12 },
      { name: 'Heavy Slash', damage: 16 },
    ]},
  // Floor 3 Boss
  { id: 'ender_dragon', name: 'Ender Dragon', maxHP: 150, floor: 3, emoji: '🐉', isBoss: true,
    moves: [
      { name: 'Dragon Breath', damage: 12 },
      { name: 'Wing Slam', damage: 16 },
      { name: 'Dive Bomb', damage: 20 },
      { name: 'Roost', block: 15 },
      { name: 'Ender Rage', damage: 10, strength: 2 },
    ]},
];

// ===== MERCHANT ITEMS =====

export const ALL_MERCHANT_ITEMS: MerchantItem[] = [
  { id: 'hp_potion', name: 'Health Potion', description: 'Heal 25 HP', type: 'potion',
    costs: { iron: 4 }, healAmount: 25 },
  { id: 'str_potion', name: 'Strength Potion', description: '+2 permanent Strength', type: 'potion',
    costs: { diamond: 3 }, strengthAmount: 2 },
  { id: 'big_hp', name: 'Greater Health Potion', description: 'Heal 40 HP', type: 'potion',
    costs: { gold: 3, iron: 2 }, healAmount: 40 },
  { id: 'm_iron_wave', name: 'Iron Wave Card', description: 'Gain 5 Block, Deal 5 dmg', type: 'card',
    costs: { iron: 3, coal: 2 }, cardId: 'iron_wave' },
  { id: 'm_fortify', name: 'Fortify Card', description: 'Gain 15 Block', type: 'card',
    costs: { gold: 3, iron: 2 }, cardId: 'fortify' },
  { id: 'm_headshot', name: 'Headshot Card', description: 'Deal 12 damage', type: 'card',
    costs: { gold: 3, iron: 2 }, cardId: 'headshot' },
  { id: 'm_multi', name: 'Multi-Shot Card', description: 'Deal 4 dmg x3', type: 'card',
    costs: { gold: 2, coal: 3 }, cardId: 'multi_shot' },
  { id: 'm_sword_boom', name: 'Sword Boomerang', description: 'Deal 3 dmg x3', type: 'card',
    costs: { iron: 4 }, cardId: 'sword_boomerang' },
  { id: 'm_poison_spray', name: 'Poison Spray Card', description: 'Apply 5 Poison', type: 'card',
    costs: { iron: 3, coal: 2 }, cardId: 'poison_spray' },
  { id: 'm_diamond_sword', name: 'Diamond Sword Card', description: 'Deal 25 damage!', type: 'card',
    costs: { diamond: 4, gold: 2 }, cardId: 'diamond_sword' },
  { id: 'm_emerald_shield', name: 'Emerald Shield Card', description: 'Gain 20 Block', type: 'card',
    costs: { emerald: 4, gold: 2 }, cardId: 'emerald_shield' },
  { id: 'remove_card', name: 'Remove a Card', description: 'Remove a card from your deck', type: 'remove',
    costs: { diamond: 3 } },
];

// ===== UTILITY FUNCTIONS =====

let _uid = 0;
export function makeCardInstance(cardDef: CardDef): CardInstance {
  return { ...cardDef, uid: _uid++ };
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateMineGrid(width = 22, height = 12): MineCell[][] {
  const grid: MineCell[][] = [];
  for (let y = 0; y < height; y++) {
    const row: MineCell[] = [];
    for (let x = 0; x < width; x++) {
      let bt: MineCell['blockType'] = 'stone';
      if (y === 0) {
        bt = 'grass';
      } else if (y <= 2) {
        bt = Math.random() < 0.8 ? 'dirt' : 'stone';
      } else if (y <= 5) {
        const r = Math.random();
        if (r < 0.12) bt = 'coal';
        else if (r < 0.18) bt = 'iron';
        else bt = 'stone';
      } else if (y <= 8) {
        const r = Math.random();
        if (r < 0.10) bt = 'coal';
        else if (r < 0.20) bt = 'iron';
        else if (r < 0.27) bt = 'gold';
        else bt = 'stone';
      } else if (y <= 10) {
        const r = Math.random();
        if (r < 0.08) bt = 'coal';
        else if (r < 0.18) bt = 'iron';
        else if (r < 0.28) bt = 'gold';
        else if (r < 0.35) bt = 'diamond';
        else if (r < 0.40) bt = 'emerald';
        else bt = 'stone';
      } else {
        bt = 'bedrock';
      }
      row.push({ blockType: bt, mined: false });
    }
    grid.push(row);
  }
  return grid;
}

export function generateMap(floor: number): MapNodeDef[] {
  if (floor === 1) {
    return [
      { id: 0, type: 'battle', completed: false },
      { id: 1, type: 'battle', completed: false },
      { id: 2, type: 'merchant', completed: false },
      { id: 3, type: 'battle', completed: false },
      { id: 4, type: 'rest', completed: false },
    ];
  } else if (floor === 2) {
    return [
      { id: 0, type: 'battle', completed: false },
      { id: 1, type: 'elite', completed: false },
      { id: 2, type: 'merchant', completed: false },
      { id: 3, type: 'battle', completed: false },
      { id: 4, type: 'rest', completed: false },
    ];
  } else {
    return [
      { id: 0, type: 'battle', completed: false },
      { id: 1, type: 'battle', completed: false },
      { id: 2, type: 'rest', completed: false },
      { id: 3, type: 'boss', completed: false },
    ];
  }
}

export function getEnemyForFloor(floor: number, type: 'battle' | 'elite' | 'boss'): EnemyDef {
  if (type === 'boss') {
    return ENEMIES.find(e => e.isBoss && e.floor === floor) || ENEMIES[ENEMIES.length - 1];
  }
  if (type === 'elite') {
    const elites = ENEMIES.filter(e => e.isElite && e.floor === floor);
    return pickRandom(elites.length > 0 ? elites : ENEMIES.filter(e => e.floor === floor));
  }
  const pool = ENEMIES.filter(e => e.floor === floor && !e.isElite && !e.isBoss);
  return pickRandom(pool);
}

export function getCardRewards(character: string, count = 3): CardDef[] {
  const pool = Object.values(CARDS).filter(c =>
    c.rarity !== 'starter' &&
    (c.character === character || c.character === 'both')
  );
  const rewards: CardDef[] = [];
  let attempts = 0;
  while (rewards.length < count && attempts < 50) {
    attempts++;
    const roll = Math.random();
    let rarity: string;
    if (roll < 0.12) rarity = 'rare';
    else if (roll < 0.42) rarity = 'uncommon';
    else rarity = 'common';
    const filtered = pool.filter(c => c.rarity === rarity);
    if (filtered.length > 0) {
      const pick = pickRandom(filtered);
      if (!rewards.find(r => r.id === pick.id)) {
        rewards.push(pick);
      }
    } else {
      const pick = pickRandom(pool);
      if (!rewards.find(r => r.id === pick.id)) {
        rewards.push(pick);
      }
    }
  }
  return rewards;
}

export function getBlockRewards(floor: number): Partial<Record<BlockType, number>> {
  const r: Partial<Record<BlockType, number>> = {};
  if (floor === 1) {
    r.dirt = randInt(2, 4);
    r.stone = randInt(1, 3);
    r.coal = randInt(1, 2);
    if (Math.random() < 0.4) r.iron = 1;
  } else if (floor === 2) {
    r.stone = randInt(1, 2);
    r.coal = randInt(2, 3);
    r.iron = randInt(1, 3);
    if (Math.random() < 0.4) r.gold = randInt(1, 2);
  } else {
    r.coal = randInt(1, 2);
    r.iron = randInt(1, 2);
    r.gold = randInt(1, 2);
    if (Math.random() < 0.35) r.diamond = 1;
    if (Math.random() < 0.25) r.emerald = 1;
  }
  return r;
}

export function getMerchantItems(count = 4): MerchantItem[] {
  const shuffled = shuffle([...ALL_MERCHANT_ITEMS]);
  return shuffled.slice(0, count);
}

export function createStartingDeck(characterId: string): CardInstance[] {
  const char = CHARACTERS[characterId];
  if (!char) return [];
  return char.startingDeckIds.map(id => makeCardInstance(CARDS[id]));
}

export function canAfford(costs: Partial<Record<BlockType, number>>, blocks: Record<BlockType, number>): boolean {
  for (const bt of ALL_BLOCKS) {
    if ((costs[bt] || 0) > (blocks[bt] || 0)) return false;
  }
  return true;
}

export function payCosts(costs: Partial<Record<BlockType, number>>, blocks: Record<BlockType, number>): Record<BlockType, number> {
  const newBlocks = { ...blocks };
  for (const bt of ALL_BLOCKS) {
    newBlocks[bt] = (newBlocks[bt] || 0) - (costs[bt] || 0);
  }
  return newBlocks;
}

export function addBlockRewards(
  current: Record<BlockType, number>,
  rewards: Partial<Record<BlockType, number>>
): Record<BlockType, number> {
  const newBlocks = { ...current };
  for (const bt of ALL_BLOCKS) {
    newBlocks[bt] = (newBlocks[bt] || 0) + (rewards[bt] || 0);
  }
  return newBlocks;
}

export function emptyBlocks(): Record<BlockType, number> {
  return { dirt: 0, stone: 0, coal: 0, iron: 0, gold: 0, diamond: 0, emerald: 0 };
}
