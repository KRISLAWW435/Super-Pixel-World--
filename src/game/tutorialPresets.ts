/**
 * Pixel Studio Pro - Educational Missions & Tutorial Presets
 *
 * Declarative mission definitions and sample generation logic
 * extracted out of LevelEditor.tsx to keep components modular and maintainable.
 */

import { LevelItem, TileId } from '../types/game';

export interface TutorialMission {
  id: number;
  title: string;
  badge: string;
  objective: string;
  recommendedTile?: TileId;
  tip: string;
  buttonLabel?: string;
}

export const TUTORIAL_MISSIONS: TutorialMission[] = [
  {
    id: 0,
    title: 'Миссия 1. Создай путь',
    badge: 'Основы',
    objective: 'Построй прочную дорогу для героя, соединив островки земли.',
    recommendedTile: 'grass_dirt',
    tip: 'Зажми ЛКМ и проведи линию блоков, чтобы герой не упал в пропасть.',
    buttonLabel: 'Вставить дорожку',
  },
  {
    id: 1,
    title: 'Миссия 2. Пропасть и шипы',
    badge: 'Опасность',
    objective: 'Сделай прыжок интересным — размести яму с шипами.',
    recommendedTile: 'spikes',
    tip: 'Шипы на дне ямы требуют точного расчёта дистанции прыжка.',
    buttonLabel: 'Вставить яму с шипами',
  },
  {
    id: 2,
    title: 'Миссия 3. Награды и секреты',
    badge: 'Бонусы',
    objective: 'Размести блок (?) с монетой над платформами.',
    recommendedTile: 'question_block',
    tip: 'Игрок ударит блок головой снизу и получит звонкую награду!',
    buttonLabel: 'Вставить блок (?) и монеты',
  },
  {
    id: 3,
    title: 'Миссия 4. Высокая стена и батут',
    badge: 'Механика',
    objective: 'Поставь непреодолимую стену и дай игроку пружину для взлёта.',
    recommendedTile: 'spring',
    tip: 'Пружина катапультирует героя на высоту 8–10 клеток.',
    buttonLabel: 'Вставить стену и батут',
  },
  {
    id: 4,
    title: 'Миссия 5. Патруль противников',
    badge: 'Битва',
    objective: 'Поставь патрульного краба или слайма на платформу.',
    recommendedTile: 'enemy_patrol',
    tip: 'Прыжок сверху побеждает врага и даёт дополнительный импульс!',
    buttonLabel: 'Вставить зону патруля',
  },
  {
    id: 5,
    title: 'Миссия 6. Финишные ворота',
    badge: 'Цель',
    objective: 'Поставь золотую арку финиша в конце построенного маршрута.',
    recommendedTile: 'goal',
    tip: 'Достижение ворот завершает уровень с праздничным салютом!',
    buttonLabel: 'Вставить финиш',
  },
  {
    id: 6,
    title: 'Миссия 7. Проверь сложность',
    badge: 'Плейтест',
    objective: 'Запусти игру, пройди уровень и убедись, что он проходим.',
    recommendedTile: undefined,
    tip: 'Настоящие геймдизайнеры всегда тестируют игру перед релизом!',
    buttonLabel: '▶ Запустить тест!',
  },
];

/**
 * Procedurally generates sample obstacles/structures around the current camera center
 */
export function generateTutorialSample(
  missionId: number,
  currentItems: LevelItem[],
  centerCol: number,
  worldWidth: number
): LevelItem[] {
  let newItems = [...currentItems];
  const timestamp = Date.now();
  const safeCol = Math.max(4, Math.min(worldWidth - 10, centerCol));

  if (missionId === 0) {
    // Mission 1: Road & Ground (10 blocks at rows 14-15)
    for (let c = safeCol - 4; c <= safeCol + 5; c++) {
      newItems = newItems.filter((it) => !(it.x === c && (it.y === 14 || it.y === 15)));
      newItems.push({ id: `road_${c}_14_${timestamp}`, tileId: 'grass_dirt', x: c, y: 14 });
      newItems.push({ id: `road_${c}_15_${timestamp}`, tileId: 'grass_dirt', x: c, y: 15 });
    }
  } else if (missionId === 1) {
    // Mission 2: Gap with Spikes
    for (let c = safeCol - 3; c <= safeCol - 1; c++) {
      newItems = newItems.filter((it) => !(it.x === c && it.y === 14));
      newItems.push({ id: `plat_${c}_14_${timestamp}`, tileId: 'grass_dirt', x: c, y: 14 });
    }
    for (let c = safeCol + 1; c <= safeCol + 3; c++) {
      newItems = newItems.filter((it) => !(it.x === c && it.y === 14));
      newItems.push({ id: `plat_${c}_14_${timestamp}`, tileId: 'grass_dirt', x: c, y: 14 });
    }
    newItems = newItems.filter((it) => !(it.x === safeCol && it.y === 14));
    newItems.push({ id: `spike_${safeCol}_14_${timestamp}`, tileId: 'spikes', x: safeCol, y: 14 });
  } else if (missionId === 2) {
    // Mission 3: Question block & Coins
    for (let c = safeCol - 2; c <= safeCol + 2; c++) {
      newItems = newItems.filter((it) => !(it.x === c && it.y === 14));
      newItems.push({ id: `ground_${c}_14_${timestamp}`, tileId: 'grass_dirt', x: c, y: 14 });
    }
    newItems = newItems.filter((it) => !(it.x === safeCol && it.y === 10));
    newItems.push({ id: `qblock_${safeCol}_10_${timestamp}`, tileId: 'question_block', x: safeCol, y: 10 });
    newItems = newItems.filter((it) => !(it.x === safeCol - 1 && it.y === 9));
    newItems.push({ id: `coin_${safeCol - 1}_9_${timestamp}`, tileId: 'coin', x: safeCol - 1, y: 9 });
    newItems = newItems.filter((it) => !(it.x === safeCol + 1 && it.y === 9));
    newItems.push({ id: `coin_${safeCol + 1}_9_${timestamp}`, tileId: 'coin', x: safeCol + 1, y: 9 });
  } else if (missionId === 3) {
    // Mission 4: Spring & High Wall
    for (let c = safeCol - 2; c <= safeCol + 4; c++) {
      newItems = newItems.filter((it) => !(it.x === c && it.y === 14));
      newItems.push({ id: `ground_${c}_14_${timestamp}`, tileId: 'grass_dirt', x: c, y: 14 });
    }
    for (let r = 10; r <= 13; r++) {
      newItems = newItems.filter((it) => !(it.x === safeCol + 3 && it.y === r));
      newItems.push({ id: `wall_${safeCol + 3}_${r}_${timestamp}`, tileId: 'stone', x: safeCol + 3, y: r });
    }
    newItems = newItems.filter((it) => !(it.x === safeCol && it.y === 13));
    newItems.push({ id: `spring_${safeCol}_13_${timestamp}`, tileId: 'spring', x: safeCol, y: 13 });
  } else if (missionId === 4) {
    // Mission 5: Enemies
    for (let c = safeCol - 4; c <= safeCol + 4; c++) {
      newItems = newItems.filter((it) => !(it.x === c && it.y === 14));
      newItems.push({ id: `ground_${c}_14_${timestamp}`, tileId: 'grass_dirt', x: c, y: 14 });
    }
    newItems = newItems.filter((it) => !(it.x === safeCol - 2 && it.y === 13));
    newItems.push({ id: `enemy_chaser_${safeCol - 2}_13_${timestamp}`, tileId: 'enemy_chaser', x: safeCol - 2, y: 13 });
    newItems = newItems.filter((it) => !(it.x === safeCol + 2 && it.y === 13));
    newItems.push({ id: `enemy_patrol_${safeCol + 2}_13_${timestamp}`, tileId: 'enemy_patrol', x: safeCol + 2, y: 13 });
  } else if (missionId === 5) {
    // Mission 6: Goal Gate
    for (let c = safeCol - 1; c <= safeCol + 3; c++) {
      newItems = newItems.filter((it) => !(it.x === c && it.y === 14));
      newItems.push({ id: `ground_${c}_14_${timestamp}`, tileId: 'grass_dirt', x: c, y: 14 });
    }
    newItems = newItems.filter((it) => !(it.x === safeCol + 1 && it.y === 13));
    newItems.push({ id: `goal_${safeCol + 1}_13_${timestamp}`, tileId: 'goal', x: safeCol + 1, y: 13 });
  }

  return newItems;
}
