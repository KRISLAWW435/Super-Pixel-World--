/**
 * Pixel Studio Pro - Educational Mission & Tutorial Manager
 *
 * Implements Stage 3 Gamification:
 * - Real-time automated validation for building missions in the editor
 * - In-game trigger zone & chasm leap detection for playtest missions
 * - Persistent progress tracking with zero-dependency storage
 * - Audio & visual feedback on success
 */

import { SOLID_TILE_IDS, findGroundRowBelow, isGroundEnemy } from '../game/constants';
import { LevelData, LevelItem } from '../types/game';

export interface ChasmInfo {
  startCol: number;    // Last platform block before the pit
  endCol: number;      // First column of the pit gap
  gapWidth: number;    // Width in blocks (>= 2)
  landingCol: number;  // Landing platform column
  chasmStartX: number; // Pixels
  chasmEndX: number;   // Pixels
  landingX: number;    // Pixels
}

const STORAGE_KEY = 'super_pixel_world_tutorial_completed_v3';
const SKIPPED_KEY = 'super_pixel_world_tutorial_skipped_v3';

export class TutorialManager {
  /**
   * Retrieves array of completed mission indices (0..6)
   */
  public static getCompletedMissions(): number[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Checks if specific mission is already marked complete
   */
  public static isMissionCompleted(missionId: number): boolean {
    return this.getCompletedMissions().includes(missionId);
  }

  /**
   * Marks a mission as completed and saves to storage
   */
  public static completeMission(missionId: number): number[] {
    const current = this.getCompletedMissions();
    if (!current.includes(missionId)) {
      const updated = [...current, missionId];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    }
    return current;
  }

  /**
   * Checks if player chose to skip tutorial
   */
  public static isSkipped(): boolean {
    try {
      return localStorage.getItem(SKIPPED_KEY) === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Toggles skip status
   */
  public static setSkipped(skipped: boolean): void {
    try {
      localStorage.setItem(SKIPPED_KEY, skipped ? 'true' : 'false');
    } catch {}
  }

  /**
   * Resets tutorial progress
   */
  public static resetProgress(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SKIPPED_KEY);
    } catch {}
  }

  /**
   * Scans level items to find an existing chasm (pit of >= 2 blocks between platforms)
   */
  public static detectChasm(items: LevelItem[], cellSize: number = 40): ChasmInfo | null {
    // Collect columns that have solid ground in lower platform rows (rows 12..15)
    const solidCols = new Set<number>();
    items.forEach((it) => {
      if (it.y >= 11 && it.y <= 15 && SOLID_TILE_IDS.has(it.tileId)) {
        solidCols.add(it.x);
      }
    });

    if (solidCols.size === 0) return null;
    const sorted = Array.from(solidCols).sort((a, b) => a - b);

    // Look for gap >= 2 blocks
    for (let i = 0; i < sorted.length - 1; i++) {
      const leftCol = sorted[i];
      const rightCol = sorted[i + 1];
      const gap = rightCol - leftCol - 1;

      if (gap >= 2 && gap <= 10) {
        return {
          startCol: leftCol,
          endCol: rightCol - 1,
          gapWidth: gap,
          landingCol: rightCol,
          chasmStartX: (leftCol + 1) * cellSize,
          chasmEndX: rightCol * cellSize,
          landingX: rightCol * cellSize,
        };
      }
    }
    return null;
  }

  /**
   * Validates whether current level state or game event fulfills the given mission requirements
   */
  public static validateMission(
    missionId: number,
    levelData: LevelData,
    context?: { jumpedOverChasm?: boolean }
  ): boolean {
    switch (missionId) {
      case 0: {
        // Миссия 1: «Создай путь»
        // Задача: поставить минимум 3 блока земли (grass_dirt)
        const grassDirtCount = levelData.items.filter((it) => it.tileId === 'grass_dirt').length;
        return grassDirtCount >= 3;
      }

      case 1: {
        // Миссия 2: «Перепрыгни пропасть»
        // Задача: создать разрыв от 2 клеток и успешно перепрыгнуть его в режиме теста
        if (context?.jumpedOverChasm) {
          return true;
        }
        return false;
      }

      case 2: {
        // Миссия 3: «Опасный враг»
        // Задача: поставить наземного врага на твердую поверхность
        const groundEnemies = levelData.items.filter((it) => isGroundEnemy(it.tileId));
        if (groundEnemies.length === 0) return false;

        return groundEnemies.some((enemy) => {
          const groundY = findGroundRowBelow(levelData.items, enemy.x, enemy.y);
          return groundY !== null && enemy.y === groundY - 1;
        });
      }

      case 3: {
        // Миссия 4: «Награды и секреты»
        // Задача: разместить секретный блок (?) или монеты
        return levelData.items.some(
          (it) => it.tileId === 'question_block' || it.tileId === 'coin' || it.tileId === 'star'
        );
      }

      case 4: {
        // Миссия 5: «Высокая стена и батут»
        // Задача: разместить пружину или батут
        return levelData.items.some((it) => it.tileId === 'spring');
      }

      case 5: {
        // Миссия 6: «Финишные ворота»
        // Задача: установить финишную арку (goal)
        return levelData.items.some((it) => it.tileId === 'goal');
      }

      case 6: {
        // Миссия 7: «Проверь сложность»
        return false;
      }

      default:
        return false;
    }
  }
}
