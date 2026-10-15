/**
 * Super Pixel World - Preset Levels Catalog
 * Rich, playable starter levels with ramps, pits, ? blocks, checkpoints, and goal flags.
 */

import { LevelData, LevelItem, ThemeId } from '../types/game';

let idCounter = 1;
function makeItem(tileId: LevelItem['tileId'], x: number, y: number): LevelItem {
  return {
    id: `item_${idCounter++}_${x}_${y}`,
    tileId,
    x,
    y,
  };
}

/**
 * Default rich starter level: "Зелёное приключение" (Green Adventure)
 * 160 columns wide, 16 rows high.
 */
export function createDefaultLevel(): LevelData {
  const items: LevelItem[] = [];

  // 1. Safe Starting Ground (x: 0 to 18, row: 13, 14, 15)
  for (let x = 0; x <= 18; x++) {
    items.push(makeItem('grass_dirt', x, 13));
    items.push(makeItem('grass_dirt', x, 14));
    items.push(makeItem('grass_dirt', x, 15));
  }

  // Player start marker
  items.push(makeItem('player_spawn', 3, 12));

  // Early Question Block with coins
  items.push(makeItem('question_block', 8, 9));
  items.push(makeItem('brick', 7, 9));
  items.push(makeItem('brick', 9, 9));
  items.push(makeItem('coin', 7, 6));
  items.push(makeItem('coin', 8, 6));
  items.push(makeItem('coin', 9, 6));

  // Decorative pipe
  items.push(makeItem('pipe_green', 14, 12));
  items.push(makeItem('pipe_green', 14, 11));

  // First enemy patrol
  items.push(makeItem('enemy_walker', 12, 12));

  // 2. First Chasm & Stepping Platforms (x: 21 to 32)
  // Island 1
  for (let x = 22; x <= 26; x++) {
    items.push(makeItem('grass_dirt', x, 12));
    items.push(makeItem('grass_dirt', x, 13));
  }
  items.push(makeItem('coin', 23, 10));
  items.push(makeItem('coin', 24, 9));
  items.push(makeItem('coin', 25, 10));

  // Cloud platform jump
  items.push(makeItem('cloud', 28, 9));
  items.push(makeItem('cloud', 29, 9));
  items.push(makeItem('crystal', 28, 7));

  // 3. Elevated Stone Castle Steps (x: 34 to 48)
  for (let x = 33; x <= 45; x++) {
    items.push(makeItem('stone', x, 13));
    items.push(makeItem('stone', x, 14));
  }
  // Step up
  for (let x = 36; x <= 44; x++) {
    items.push(makeItem('stone', x, 11));
  }
  for (let x = 39; x <= 43; x++) {
    items.push(makeItem('stone', x, 9));
  }

  items.push(makeItem('question_block', 41, 6));
  items.push(makeItem('star', 41, 4));
  items.push(makeItem('enemy_spiky', 38, 10));

  // 4. Wooden Bridge with Spikes Hazard Below (x: 48 to 65)
  for (let x = 48; x <= 62; x++) {
    items.push(makeItem('wood', x, 11));
  }
  // Spikes in the pit under the bridge
  for (let x = 52; x <= 58; x++) {
    items.push(makeItem('spikes', x, 15));
  }
  // Coins across the bridge
  for (let x = 50; x <= 60; x += 2) {
    items.push(makeItem('coin', x, 9));
  }
  // Flying slime above bridge
  items.push(makeItem('enemy_slime', 56, 7));

  // 5. MIDWAY CHECKPOINT PLATFORM (x: 66 to 78)
  for (let x = 65; x <= 78; x++) {
    items.push(makeItem('grass_dirt', x, 13));
    items.push(makeItem('grass_dirt', x, 14));
    items.push(makeItem('grass_dirt', x, 15));
  }
  // Checkpoint Flag!
  items.push(makeItem('checkpoint', 70, 12));
  items.push(makeItem('pipe_green', 75, 12));
  items.push(makeItem('pipe_green', 75, 11));

  // 6. Super Spring Launch & High Cloud Route (x: 80 to 105)
  // Low ground
  for (let x = 80; x <= 92; x++) {
    items.push(makeItem('grass_dirt', x, 14));
    items.push(makeItem('grass_dirt', x, 15));
  }
  // Spring to launch up!
  items.push(makeItem('spring', 82, 13));

  // High clouds with stars
  for (let x = 84; x <= 88; x++) {
    items.push(makeItem('cloud', x, 7));
  }
  items.push(makeItem('star', 86, 5));
  items.push(makeItem('coin', 84, 5));
  items.push(makeItem('coin', 88, 5));

  for (let x = 91; x <= 95; x++) {
    items.push(makeItem('cloud', x, 6));
  }
  items.push(makeItem('crystal', 93, 4));

  // Mushroom bouncing island
  items.push(makeItem('mushroom', 98, 9));
  items.push(makeItem('mushroom', 99, 9));
  items.push(makeItem('mushroom', 100, 9));

  // Enemy on low ground
  items.push(makeItem('enemy_walker', 88, 13));

  // 7. Brick Cavern & Precision Jumps (x: 105 to 128)
  for (let x = 104; x <= 126; x++) {
    items.push(makeItem('grass_dirt', x, 13));
    items.push(makeItem('grass_dirt', x, 14));
    items.push(makeItem('grass_dirt', x, 15));
  }
  // Question & brick overhead roof
  for (let x = 108; x <= 116; x++) {
    if (x === 110 || x === 114) {
      items.push(makeItem('question_block', x, 9));
    } else {
      items.push(makeItem('brick', x, 9));
    }
  }
  items.push(makeItem('enemy_walker', 111, 12));
  items.push(makeItem('enemy_spiky', 120, 12));

  // 8. Castle Approach Staircase (x: 130 to 148)
  for (let step = 0; step < 6; step++) {
    const startX = 132 + step * 2;
    const yLevel = 13 - step;
    for (let x = startX; x <= 148; x++) {
      items.push(makeItem('stone', x, yLevel));
    }
  }

  // Coin arc leading down to the grand finale
  for (let x = 134; x <= 144; x += 2) {
    items.push(makeItem('coin', x, 6));
  }

  // 9. GRAND FINISH PLATFORM & GOAL FLAG (x: 148 to 160)
  for (let x = 148; x < 160; x++) {
    items.push(makeItem('stone', x, 13));
    items.push(makeItem('stone', x, 14));
    items.push(makeItem('stone', x, 15));
  }
  // The Goal Gate
  items.push(makeItem('goal', 154, 12));

  return {
    version: 1,
    name: 'Зелёное приключение (Уровень 1-1)',
    author: 'Super Pixel World',
    width: 160,
    height: 16,
    bgTheme: 'green_islands',
    heroId: 'leo',
    items,
    timeLimit: 300,
  };
}

/**
 * Preset for Candy Land
 */
export function createCandyLevel(): LevelData {
  const items: LevelItem[] = [];

  // Ground with candy blocks
  for (let x = 0; x <= 25; x++) {
    items.push(makeItem('candy', x, 13));
    items.push(makeItem('candy', x, 14));
  }
  items.push(makeItem('player_spawn', 3, 12));
  items.push(makeItem('question_block', 9, 9));
  items.push(makeItem('coin', 9, 6));
  items.push(makeItem('enemy_slime', 15, 10));

  // Lollipop floating wafers
  for (let i = 0; i < 6; i++) {
    const x = 30 + i * 6;
    const y = 12 - (i % 3) * 2;
    items.push(makeItem('candy', x, y));
    items.push(makeItem('candy', x + 1, y));
    items.push(makeItem('candy', x + 2, y));
    items.push(makeItem('coin', x + 1, y - 2));
    if (i === 3) {
      items.push(makeItem('crystal', x + 1, y - 3));
    }
  }

  // Checkpoint island
  for (let x = 70; x <= 85; x++) {
    items.push(makeItem('candy', x, 13));
  }
  items.push(makeItem('checkpoint', 74, 12));
  items.push(makeItem('spring', 80, 12));

  // High marshmallow road
  for (let x = 86; x <= 108; x++) {
    items.push(makeItem('cloud', x, 7));
    if (x % 3 === 0) items.push(makeItem('coin', x, 5));
  }
  items.push(makeItem('star', 96, 4));

  // Finish cake
  for (let x = 115; x <= 135; x++) {
    items.push(makeItem('candy', x, 12));
    items.push(makeItem('candy', x, 13));
  }
  items.push(makeItem('goal', 128, 11));

  return {
    version: 1,
    name: 'Конфетный раш',
    author: 'Super Pixel World',
    width: 140,
    height: 16,
    bgTheme: 'candy_land',
    heroId: 'pippin',
    items,
    timeLimit: 250,
  };
}

/**
 * Preset for Ice World
 */
export function createIceLevel(): LevelData {
  const items: LevelItem[] = [];

  // Slick ice platform
  for (let x = 0; x <= 30; x++) {
    items.push(makeItem('ice', x, 13));
    items.push(makeItem('stone', x, 14));
  }
  items.push(makeItem('player_spawn', 3, 12));
  items.push(makeItem('crystal', 10, 10));
  items.push(makeItem('crystal', 18, 10));
  items.push(makeItem('enemy_walker', 22, 12));

  // Ice pillars over spikes
  for (let x = 35; x <= 65; x += 5) {
    items.push(makeItem('ice', x, 11));
    items.push(makeItem('ice', x + 1, 11));
    items.push(makeItem('coin', x, 9));
  }
  for (let x = 32; x <= 68; x++) {
    items.push(makeItem('spikes', x, 15));
  }

  // Midpoint
  for (let x = 70; x <= 85; x++) {
    items.push(makeItem('stone', x, 13));
  }
  items.push(makeItem('checkpoint', 75, 12));

  // Final glacier
  for (let x = 90; x <= 120; x++) {
    items.push(makeItem('ice', x, 12));
  }
  items.push(makeItem('star', 100, 8));
  items.push(makeItem('goal', 115, 11));

  return {
    version: 1,
    name: 'Ледяное восхождение',
    author: 'Super Pixel World',
    width: 130,
    height: 16,
    bgTheme: 'ice_world',
    heroId: 'bolt',
    items,
    timeLimit: 240,
  };
}

/**
 * Preset for Alien Jungle
 */
export function createAlienLevel(): LevelData {
  const items: LevelItem[] = [];

  for (let x = 0; x <= 25; x++) {
    items.push(makeItem('crystal_block', x, 13));
  }
  items.push(makeItem('player_spawn', 3, 12));
  items.push(makeItem('crystal', 12, 10));

  // Giant glowing mushrooms
  for (let i = 0; i < 5; i++) {
    const x = 30 + i * 8;
    const y = 11 - (i % 2) * 3;
    items.push(makeItem('mushroom', x, y));
    items.push(makeItem('mushroom', x + 1, y));
    items.push(makeItem('mushroom', x + 2, y));
    items.push(makeItem('star', x + 1, y - 2));
    items.push(makeItem('enemy_slime', x + 1, y + 2));
  }

  // Checkpoint & Finish
  for (let x = 75; x <= 90; x++) {
    items.push(makeItem('crystal_block', x, 13));
  }
  items.push(makeItem('checkpoint', 80, 12));

  for (let x = 95; x <= 120; x++) {
    items.push(makeItem('crystal_block', x, 12));
  }
  items.push(makeItem('goal', 114, 11));

  return {
    version: 1,
    name: 'Тайна космических джунглей',
    author: 'Super Pixel World',
    width: 130,
    height: 16,
    bgTheme: 'alien_jungle',
    heroId: 'astro',
    items,
    timeLimit: 300,
  };
}

export const PRESET_LEVELS: Record<ThemeId, () => LevelData> = {
  green_islands: createDefaultLevel,
  candy_land: createCandyLevel,
  ice_world: createIceLevel,
  alien_jungle: createAlienLevel,
};
