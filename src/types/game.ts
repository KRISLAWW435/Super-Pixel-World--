/**
 * Super Pixel World - Core Game & Editor Types
 */

export type ThemeId = 'green_islands' | 'candy_land' | 'ice_world' | 'alien_jungle';

export type HeroId = 'leo' | 'bolt' | 'pippin' | 'astro';

export type ToolMode = 'brush' | 'line' | 'erase' | 'select' | 'move';

export type PaletteCategory = 'platforms' | 'objects' | 'enemies' | 'backgrounds' | 'heroes';

export type TileId =
  // Platforms & Blocks
  | 'grass_dirt'
  | 'stone'
  | 'wood'
  | 'brick'
  | 'ice'
  | 'ice_block'
  | 'cloud'
  | 'cloud_platform'
  | 'mushroom'
  | 'candy'
  | 'crystal_block'
  | 'pipe_green'
  | 'pipe_green_entrance'
  | 'pipe_green_exit'
  // Interactive Items
  | 'coin'
  | 'star'
  | 'crystal'
  | 'bonus_heart'
  | 'question_block'
  | 'spring'
  | 'spikes'
  | 'checkpoint'
  | 'goal'
  // Enemies (4 distinct attack types)
  | 'enemy_chaser'
  | 'enemy_patrol'
  | 'enemy_jumper'
  | 'enemy_slime'
  // Markers
  | 'player_spawn';

export interface CloudIsland {
  id: string;
  tiles: { x: number; y: number; id: string }[];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  offsetX: number;
  offsetY: number;
  prevOffsetX: number;
  prevOffsetY: number;
  axis: 'y' | 'x';
  amplitude: number;
  speed: number;
  phase: number;
}

export interface LevelItem {
  id: string; // unique id
  tileId: TileId;
  x: number; // grid cell x (0..width-1)
  y: number; // grid cell y (0..height-1)
  variant?: string;
  properties?: Record<string, unknown>;
}

export interface LevelData {
  version: number;
  name: string;
  author?: string;
  width: number; // grid columns, e.g. 160
  height: number; // grid rows, default 24
  bgTheme: ThemeId;
  heroId: HeroId;
  items: LevelItem[];
  timeLimit: number; // seconds
}

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  subtitle: string;
  image: string;
  skyColor: string;
  accentColor: string;
  particleColor: string;
}

export interface HeroConfig {
  id: HeroId;
  name: string;
  title: string;
  description: string;
  primaryColor: string;
  jumpPower: number;
  speed: number;
  perk: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'square' | 'star' | 'sparkle';
  rotation?: number;
  vRot?: number;
}

export type EnemyTileId =
  | 'enemy_chaser'
  | 'enemy_patrol'
  | 'enemy_jumper'
  | 'enemy_slime';

export interface ActiveEnemy {
  id: string;
  tileId: EnemyTileId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  direction: 1 | -1;
  isSquashed: boolean;
  squashTimer: number;
  animTimer: number;
  initialX: number;
  initialY: number;
  patrolRadius: number; // e.g. 160px for 4 cells
  isChasing: boolean;
  jumpCooldown: number;
  isGrounded?: boolean;
  pauseTimer?: number;
  preparingJump?: boolean;
}

export interface ActiveBlockBump {
  x: number;
  y: number;
  offsetY: number;
  vy: number;
  tileId: TileId;
}

export interface SpawnedLootItem {
  id: string;
  tileId: 'coin' | 'bonus_heart' | 'crystal';
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  collected: boolean;
}

export interface GameStats {
  coinsCollected: number;
  totalCoins: number;
  starsCollected: number;
  totalStars: number;
  crystalsCollected: number;
  enemiesDefeated: number;
  timeRemaining: number;
  timeTaken: number;
  score: number;
  lives: number;
}
