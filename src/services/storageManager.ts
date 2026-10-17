/**
 * Super Pixel World - Storage & Save Management Architecture
 *
 * Implements modular classes:
 * - StorageManager: Core persistent JSON bridge for LocalStorage
 * - ProfileManager: Player profile operations (name, avatar, creation)
 * - SaveManager: Level serialization, saving, loading, listing, deleting
 * - SettingsManager: Audio and game settings
 */

import { LevelData } from '../types/game';
import { GameSettings, SavedGame, StorageData, UserProfile } from '../types/storage';

const ROOT_STORAGE_KEY = 'super_pixel_world_data';
const LEGACY_STORAGE_KEY = 'super_pixel_world_level_v5';

const DEFAULT_SETTINGS: GameSettings = {
  sound: true,
  music: true,
  volume: 0.8,
};

/**
 * Low-level root storage manager that guarantees data integrity and schema migrations
 */
class StorageService {
  private cache: StorageData | null = null;

  public getRawData(): StorageData {
    if (this.cache) return this.cache;

    try {
      const raw = localStorage.getItem(ROOT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.cache = {
            userProfile: parsed.userProfile || null,
            settings: {
              sound: parsed.settings?.sound ?? DEFAULT_SETTINGS.sound,
              music: parsed.settings?.music ?? DEFAULT_SETTINGS.music,
              volume: typeof parsed.settings?.volume === 'number' ? parsed.settings.volume : DEFAULT_SETTINGS.volume,
            },
            savedGames: Array.isArray(parsed.savedGames) ? parsed.savedGames : [],
          };
          return this.cache;
        }
      }
    } catch (e) {
      console.warn('Storage parse warning:', e);
    }

    // Check if legacy level exists and migrate it into a saved game if so
    let initialSavedGames: SavedGame[] = [];
    try {
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        const legacyLevel = JSON.parse(legacyRaw);
        if (legacyLevel && Array.isArray(legacyLevel.items) && legacyLevel.items.length > 0) {
          initialSavedGames.push({
            id: `game_${Date.now()}`,
            name: legacyLevel.name || 'Мой первый уровень',
            date: new Date().toISOString().split('T')[0],
            levelData: legacyLevel,
            thumbnailTheme: legacyLevel.bgTheme || 'green_islands',
          });
        }
      }
    } catch {
      // ignore legacy migration error
    }

    this.cache = {
      userProfile: null,
      settings: { ...DEFAULT_SETTINGS },
      savedGames: initialSavedGames,
    };

    return this.cache;
  }

  public saveRawData(data: StorageData): void {
    this.cache = data;
    try {
      localStorage.setItem(ROOT_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }

  public clearAll(): void {
    this.cache = null;
    try {
      localStorage.removeItem(ROOT_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

const storageService = new StorageService();

/**
 * ProfileManager: Manages player creation, avatar selection, and profile updates
 */
export class ProfileManager {
  public static getProfile(): UserProfile | null {
    const data = storageService.getRawData();
    return data.userProfile;
  }

  public static hasProfile(): boolean {
    const profile = this.getProfile();
    return Boolean(profile && profile.name.trim().length > 0 && profile.avatarId);
  }

  public static createProfile(name: string, avatarId: string): UserProfile {
    const cleanName = name.trim().slice(0, 12);
    const now = new Date().toISOString();
    const profile: UserProfile = {
      name: cleanName,
      avatarId: avatarId || 'fox',
      createdAt: now,
      lastLogin: now,
    };

    const data = storageService.getRawData();
    data.userProfile = profile;
    storageService.saveRawData(data);

    return profile;
  }

  public static updateName(name: string): UserProfile | null {
    const data = storageService.getRawData();
    if (!data.userProfile) return null;
    data.userProfile.name = name.trim().slice(0, 12);
    data.userProfile.lastLogin = new Date().toISOString();
    storageService.saveRawData(data);
    return data.userProfile;
  }

  public static updateAvatar(avatarId: string): UserProfile | null {
    const data = storageService.getRawData();
    if (!data.userProfile) return null;
    data.userProfile.avatarId = avatarId;
    data.userProfile.lastLogin = new Date().toISOString();
    storageService.saveRawData(data);
    return data.userProfile;
  }

  public static deleteProfile(): void {
    const data = storageService.getRawData();
    data.userProfile = null;
    storageService.saveRawData(data);
  }
}

/**
 * SaveManager: Handles level serialization, saving to LocalStorage, listing, and deletion
 */
export class SaveManager {
  public static getSavedGames(): SavedGame[] {
    const data = storageService.getRawData();
    const games = data.savedGames || [];
    // Ensure backward compatibility: normalize older 16-row saves to 24 rows
    return games.map((g) => {
      if (g.levelData && (!g.levelData.height || g.levelData.height < 24)) {
        return {
          ...g,
          levelData: {
            ...g.levelData,
            height: 24,
          },
        };
      }
      return g;
    });
  }

  public static getGameById(id: string): SavedGame | null {
    const games = this.getSavedGames();
    return games.find((g) => g.id === id) || null;
  }

  public static saveGame(
    name: string,
    levelData: LevelData,
    existingId?: string
  ): SavedGame {
    const data = storageService.getRawData();
    const cleanName = (name || levelData.name || 'Мой крутой уровень').trim();
    const author = data.userProfile?.name || 'Юный архитектор';
    const dateStr = new Date().toISOString().split('T')[0];

    const targetLevel: LevelData = {
      ...levelData,
      name: cleanName,
      author,
    };

    let savedGame: SavedGame;

    if (existingId) {
      const idx = data.savedGames.findIndex((g) => g.id === existingId);
      if (idx >= 0) {
        data.savedGames[idx] = {
          ...data.savedGames[idx],
          name: cleanName,
          date: dateStr,
          levelData: targetLevel,
          authorName: author,
          thumbnailTheme: targetLevel.bgTheme,
        };
        savedGame = data.savedGames[idx];
      } else {
        savedGame = {
          id: existingId,
          name: cleanName,
          date: dateStr,
          levelData: targetLevel,
          authorName: author,
          thumbnailTheme: targetLevel.bgTheme,
        };
        data.savedGames.unshift(savedGame);
      }
    } else {
      savedGame = {
        id: `game_${Date.now()}`,
        name: cleanName,
        date: dateStr,
        levelData: targetLevel,
        authorName: author,
        thumbnailTheme: targetLevel.bgTheme,
      };
      data.savedGames.unshift(savedGame);
    }

    storageService.saveRawData(data);
    return savedGame;
  }

  public static deleteGame(id: string): boolean {
    const data = storageService.getRawData();
    const initialLen = data.savedGames.length;
    data.savedGames = data.savedGames.filter((g) => g.id !== id);
    if (data.savedGames.length !== initialLen) {
      storageService.saveRawData(data);
      return true;
    }
    return false;
  }

  public static duplicateGame(id: string): SavedGame | null {
    const existing = this.getGameById(id);
    if (!existing) return null;

    return this.saveGame(
      `${existing.name} (Копия)`,
      { ...existing.levelData, name: `${existing.name} (Копия)` }
    );
  }
}

/**
 * SettingsManager: Controls sound, music, and volume persistence
 */
export class SettingsManager {
  public static getSettings(): GameSettings {
    const data = storageService.getRawData();
    return data.settings || { ...DEFAULT_SETTINGS };
  }

  public static updateSettings(partial: Partial<GameSettings>): GameSettings {
    const data = storageService.getRawData();
    data.settings = {
      ...data.settings,
      ...partial,
    };
    storageService.saveRawData(data);
    return data.settings;
  }

  public static setSound(enabled: boolean): GameSettings {
    return this.updateSettings({ sound: enabled });
  }

  public static setMusic(enabled: boolean): GameSettings {
    return this.updateSettings({ music: enabled });
  }

  public static setVolume(volume: number): GameSettings {
    const clamped = Math.max(0, Math.min(1, volume));
    return this.updateSettings({ volume: clamped });
  }
}
