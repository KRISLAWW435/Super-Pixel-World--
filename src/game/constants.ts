/**
 * Super Pixel World - Constants & Catalog
 */

import bgGreenIslands from '../assets/images/bg_green_islands.webp';
import bgCandyLand from '../assets/images/bg_candy_land_1792080622482.jpg';
import bgIceWorld from '../assets/images/bg_ice_world_1792080624384.jpg';
import bgAlienJungle from '../assets/images/bg_alien_jungle_1792080637269.jpg';
import { HeroConfig, HeroId, PaletteCategory, ThemeConfig, ThemeId, TileId } from '../types/game';

export const CELL_SIZE = 40; // 40px per tile
export const GRID_ROWS = 24; // 24 cells high (expanded from 16 to allow building 8 rows below)
export const DEFAULT_GRID_COLS = 160; // 160 cells long world (~6400px)

// Fixed timestep physics engine constants (deterministic 60Hz physics across 60Hz, 144Hz, 240Hz monitors)
export const FIXED_DELTA_TIME = 1 / 60; // 0.016666666666666666s per physics tick
export const MAX_ACCUMULATOR = 0.2; // 200ms spiral-of-death accumulator safeguard
export const PLAYER_FOOT_INSET = 8; // Inset (8px) for narrow foot sensor to prevent edge-clinging

// High-resolution generated panoramic background images
export const THEMES: Record<ThemeId, ThemeConfig> = {
  green_islands: {
    id: 'green_islands',
    name: 'Зелёные острова',
    subtitle: 'Солнечные холмы, водопады и луга',
    image: bgGreenIslands,
    skyColor: '#63b3ed',
    accentColor: '#48bb78',
    particleColor: '#68d391',
  },
  candy_land: {
    id: 'candy_land',
    name: 'Конфетная страна',
    subtitle: 'Зефирные горы, леденцы и шоколад',
    image: bgCandyLand,
    skyColor: '#fbb6ce',
    accentColor: '#ed64a6',
    particleColor: '#f687b3',
  },
  ice_world: {
    id: 'ice_world',
    name: 'Ледяной мир',
    subtitle: 'Снежные пики, ледники и сияние',
    image: bgIceWorld,
    skyColor: '#76e4f7',
    accentColor: '#319795',
    particleColor: '#90cdf4',
  },
  alien_jungle: {
    id: 'alien_jungle',
    name: 'Инопланетные джунгли',
    subtitle: 'Светящиеся грибы и кольца планет',
    image: bgAlienJungle,
    skyColor: '#553c9a',
    accentColor: '#9f7aea',
    particleColor: '#b794f4',
  },
};

export const HEROES: Record<HeroId, HeroConfig> = {
  leo: {
    id: 'leo',
    name: 'Алекс',
    title: 'Отважный исследователь',
    description: 'Классический пиксельный герой в жёлтой толстовке. Сбалансированная скорость и прыгучесть.',
    primaryColor: '#e53e3e',
    jumpPower: 12.8,
    speed: 5.6,
    perk: 'Сбалансированный герой',
  },
  bolt: {
    id: 'bolt',
    name: 'Алекс',
    title: 'Отважный исследователь',
    description: 'Классический пиксельный герой в жёлтой толстовке.',
    primaryColor: '#3182ce',
    jumpPower: 12.8,
    speed: 5.6,
    perk: 'Сбалансированный герой',
  },
  pippin: {
    id: 'pippin',
    name: 'Алекс',
    title: 'Отважный исследователь',
    description: 'Классический пиксельный герой в жёлтой толстовке.',
    primaryColor: '#dd6b20',
    jumpPower: 12.8,
    speed: 5.6,
    perk: 'Сбалансированный герой',
  },
  astro: {
    id: 'astro',
    name: 'Алекс',
    title: 'Отважный исследователь',
    description: 'Классический пиксельный герой в жёлтой толстовке.',
    primaryColor: '#805ad5',
    jumpPower: 12.8,
    speed: 5.6,
    perk: 'Сбалансированный герой',
  },
};

export interface PaletteItemDef {
  id: TileId;
  name: string;
  category: PaletteCategory;
  solid: boolean;
  desc: string;
  hint: string;
}

export const PALETTE_ITEMS: PaletteItemDef[] = [
  // --- Platforms ---
  {
    id: 'grass_dirt',
    name: 'Трава и земля',
    category: 'platforms',
    solid: true,
    desc: 'Основной блок с сочной зелёной травой',
    hint: 'Тяните курсор, чтобы нарисовать длинную платформу с аккуратными краями!',
  },
  {
    id: 'stone',
    name: 'Каменный блок',
    category: 'platforms',
    solid: true,
    desc: 'Прочные замковые каменные плиты',
    hint: 'Отлично подходит для ступеней, колонн и башен.',
  },
  {
    id: 'wood',
    name: 'Деревянный мост',
    category: 'platforms',
    solid: true,
    desc: 'Деревянные доски и подвесные мостики',
    hint: 'Удобно строить подвесные мосты над пропастями.',
  },
  {
    id: 'brick',
    name: 'Кирпичный блок',
    category: 'platforms',
    solid: true,
    desc: 'Классический кирпич. Разрушается при ударе снизу!',
    hint: 'Прыгните снизу головой, чтобы расколоть блок на осколки!',
  },
  {
    id: 'ice_block',
    name: 'Ледяной блок',
    category: 'platforms',
    solid: true,
    desc: 'Скользкий ледник. Игрок плавно скользит по инерции!',
    hint: 'Низкое трение: персонаж сохраняет импульс и скользит на несколько клеток.',
  },
  {
    id: 'cloud',
    name: 'Облачный блок',
    category: 'platforms',
    solid: true,
    desc: 'Воздушное пушистое облако',
    hint: 'Легкие парящие островки высоко в небе.',
  },
  {
    id: 'cloud_platform',
    name: 'Парящее облако',
    category: 'platforms',
    solid: false, // Handled dynamically as one-way moving rigid body platform
    desc: 'Летающая платформа. Соседние облака объединяются в единый парящий остров!',
    hint: 'Ставьте облака рядом — они соединятся в один большой летающий остров и будут двигаться вместе!',
  },
  {
    id: 'mushroom',
    name: 'Платформа-гриб',
    category: 'platforms',
    solid: true,
    desc: 'Яркая шляпка волшебного гриба',
    hint: 'Слегка подбрасывает персонажа вверх.',
  },
  {
    id: 'candy',
    name: 'Сладкий бисквит',
    category: 'platforms',
    solid: true,
    desc: 'Полосатый вафельный торт с глазурью',
    hint: 'Яркая аппетитная платформа из Конфетной страны.',
  },
  {
    id: 'crystal_block',
    name: 'Кристальный камень',
    category: 'platforms',
    solid: true,
    desc: 'Светящийся монолит с неоновыми жилами',
    hint: 'Атмосферный блок для пещер и инопланетных миров.',
  },
  {
    id: 'pipe_green',
    name: 'Зелёная труба (2x2)',
    category: 'platforms',
    solid: true,
    desc: 'Большая зелёная труба 2x2 клетки (80x80px)',
    hint: 'Двусторонний телепорт: мгновенно перемещает игрока между парными зелёными трубами!',
  },

  // --- Interactive Objects & Items ---
  {
    id: 'bonus_heart',
    name: 'Сердечко (+1 жизнь)',
    category: 'objects',
    solid: false,
    desc: 'Восстанавливает 1 потерянную жизнь',
    hint: 'Если жизней 3 из 3, сердечко подождёт на карте до ранения!',
  },
  {
    id: 'coin',
    name: 'Золотая монета',
    category: 'objects',
    solid: false,
    desc: 'Круглая сверкающая монета (+1)',
    hint: 'Размещайте дугами над прыжками и платформами.',
  },
  {
    id: 'star',
    name: 'Большая звезда',
    category: 'objects',
    solid: false,
    desc: 'Вращающаяся золотая звезда (+5)',
    hint: 'Прячьте в секретных местах уровня!',
  },
  {
    id: 'crystal',
    name: 'Магический кристалл',
    category: 'objects',
    solid: false,
    desc: 'Сияющий кристалл энергии (+10)',
    hint: 'Редкая драгоценность для самых внимательных игроков.',
  },
  {
    id: 'question_block',
    name: 'Блок с вопросом (?)',
    category: 'objects',
    solid: true,
    desc: 'Секретный блок с сокровищем внутри',
    hint: 'Ударьте снизу головой, чтобы выбить монету!',
  },
  {
    id: 'spring',
    name: 'Батут / Супер-пружина',
    category: 'objects',
    solid: false,
    desc: 'Мощный батут — подкидывает персонажа высоко в небо!',
    hint: 'Наступите или прыгните сверху на батут для взлёта на 8-10 блоков!',
  },
  {
    id: 'spikes',
    name: 'Опасные шипы',
    category: 'objects',
    solid: false,
    desc: 'Острые шипы ловушки',
    hint: 'Прикосновение наносит урон или возвращает к чекпоинту.',
  },
  {
    id: 'checkpoint',
    name: 'Флаг-чекпоинт',
    category: 'objects',
    solid: false,
    desc: 'Контрольная точка сохранения прогресса',
    hint: 'При касании флаг взвивается, запоминая место возрождения.',
  },
  {
    id: 'goal',
    name: 'Финишные ворота',
    category: 'objects',
    solid: false,
    desc: 'Золотой флагшток победы в конце уровня',
    hint: 'Коснитесь ворот, чтобы победить и завершить уровень!',
  },
  {
    id: 'player_spawn',
    name: 'Точка старта',
    category: 'objects',
    solid: false,
    desc: 'Место появления героя в начале игры',
    hint: 'На уровне может быть только одна точка старта.',
  },

  // --- Enemies (4 уникальных боевых типа врагов) ---
  {
    id: 'enemy_chaser',
    name: 'Зверь-охотник',
    category: 'enemies',
    solid: false,
    desc: 'Замечает героя и яростно бежит за ним на удвоенной скорости!',
    hint: 'Атака: Преследование! При приближении героя срывается в бег. Можно убить прыжком сверху.',
  },
  {
    id: 'enemy_patrol',
    name: 'Часовой дозора',
    category: 'enemies',
    solid: false,
    desc: 'Патрулирует строго свои 3–5 клеток вокруг места спавна.',
    hint: 'Атака: Зональный дозор! Держит позицию и не отходит от поста. Можно убить прыжком сверху.',
  },
  {
    id: 'enemy_jumper',
    name: 'Прыгун-засадник',
    category: 'enemies',
    solid: false,
    desc: 'Выжидает момент, приседает и совершает высокие прыжки в сторону героя!',
    hint: 'Атака: Прыжок сверху! Прыгает на игрока дугой. Можно убить прыжком сверху.',
  },
  {
    id: 'enemy_slime',
    name: 'Летучий пикировщик',
    category: 'enemies',
    solid: false,
    desc: 'Парит в воздухе над платформой и пикирует волной на героя.',
    hint: 'Атака: Воздушное пике! Атакует с воздуха. Можно сбить точным прыжком сверху.',
  },
];

export const GROUND_ENEMY_IDS: TileId[] = ['enemy_chaser', 'enemy_patrol', 'enemy_jumper'];
export const FLYING_ENEMY_IDS: TileId[] = ['enemy_slime'];

export const SOLID_TILE_IDS: Set<TileId> = new Set(
  PALETTE_ITEMS.filter((p) => p.solid).map((p) => p.id)
);

export function isGroundEnemy(tileId: string): boolean {
  return (
    tileId === 'enemy_chaser' ||
    tileId === 'enemy_patrol' ||
    tileId === 'enemy_jumper' ||
    tileId === 'enemy_hunter' ||
    tileId === 'enemy_guard'
  );
}

export function isFlyingEnemy(tileId: string): boolean {
  return tileId === 'enemy_slime' || tileId === 'enemy_flyer';
}

/**
 * Scans down from startRow in a column to find the first solid block.
 * Returns the row of the ground block, or null if no solid block is beneath.
 */
export function findGroundRowBelow(
  items: { x: number; y: number; tileId: TileId }[],
  col: number,
  startRow: number,
  maxRows: number = GRID_ROWS
): number | null {
  const solidRows = new Set<number>();
  items.forEach((it) => {
    if (it.x === col && SOLID_TILE_IDS.has(it.tileId)) {
      solidRows.add(it.y);
    }
  });

  for (let r = Math.max(0, startRow); r < maxRows; r++) {
    if (solidRows.has(r)) {
      return r;
    }
  }
  return null;
}
