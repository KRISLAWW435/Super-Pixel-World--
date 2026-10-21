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
import { GameSettings, SavedGame, StorageData, ThemeMode, UserProfile } from '../types/storage';

const ROOT_STORAGE_KEY = 'super_pixel_world_data';
const LEGACY_STORAGE_KEY = 'super_pixel_world_level_v5';

const DEFAULT_SETTINGS: GameSettings = {
  sound: true,
  music: true,
  volume: 0.4,
  isMuted: false,
  themeMode: 'dark',
  uiScale: 1.0,
  showTimer: true,
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
          let profiles: UserProfile[] = [];
          let activeProfileId: string | null = null;

          if (Array.isArray(parsed.profiles) && parsed.profiles.length > 0) {
            profiles = parsed.profiles.map((p: any) => ({
              id: p.id || `prof_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              name: (p.name || 'Создатель').trim().slice(0, 20),
              avatarId: p.avatarId || 'avatar_1',
              tutorialCompleted: Boolean(p.tutorialCompleted),
              createdAt: p.createdAt || new Date().toISOString(),
              lastLogin: p.lastLogin || new Date().toISOString(),
            }));
            activeProfileId = parsed.activeProfileId && profiles.some((p) => p.id === parsed.activeProfileId)
              ? parsed.activeProfileId
              : profiles[0].id;
          } else if (parsed.userProfile && parsed.userProfile.name) {
            // Migrate legacy single userProfile to multi-profile array
            const legacyId = 'prof_default';
            const legacyProfile: UserProfile = {
              id: legacyId,
              name: (parsed.userProfile.name || 'Создатель').trim().slice(0, 20),
              avatarId: parsed.userProfile.avatarId || 'avatar_1',
              tutorialCompleted: Boolean(parsed.userProfile.tutorialCompleted),
              createdAt: parsed.userProfile.createdAt || new Date().toISOString(),
              lastLogin: parsed.userProfile.lastLogin || new Date().toISOString(),
            };
            profiles = [legacyProfile];
            activeProfileId = legacyId;
          }

          const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0] || null;

          // Migrate saved games: ensure profileId and authorAvatarId are populated
          const savedGames: SavedGame[] = Array.isArray(parsed.savedGames)
            ? parsed.savedGames.map((g: any) => ({
                ...g,
                profileId: g.profileId || activeProfile?.id || undefined,
                authorName: g.authorName || activeProfile?.name || 'Юный архитектор',
                authorAvatarId: g.authorAvatarId || activeProfile?.avatarId || 'avatar_1',
                isFavorite: Boolean(g.isFavorite),
              }))
            : [];

          this.cache = {
            profiles,
            activeProfileId: activeProfile ? activeProfile.id : null,
            userProfile: activeProfile,
            settings: {
              sound: parsed.settings?.sound ?? DEFAULT_SETTINGS.sound,
              music: parsed.settings?.music ?? DEFAULT_SETTINGS.music,
              volume:
                typeof parsed.settings?.volume === 'number'
                  ? parsed.settings.volume === 0.8
                    ? 0.4
                    : parsed.settings.volume
                  : DEFAULT_SETTINGS.volume,
              isMuted: parsed.settings?.isMuted ?? false,
              themeMode:
                parsed.settings?.themeMode === 'light' || parsed.settings?.themeMode === 'dark'
                  ? parsed.settings.themeMode
                  : DEFAULT_SETTINGS.themeMode,
              uiScale:
                typeof parsed.settings?.uiScale === 'number'
                  ? parsed.settings.uiScale
                  : DEFAULT_SETTINGS.uiScale,
            },
            savedGames,
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
      profiles: [],
      activeProfileId: null,
      userProfile: null,
      settings: { ...DEFAULT_SETTINGS },
      savedGames: initialSavedGames,
    };

    return this.cache;
  }

  public saveRawData(data: StorageData): void {
    // Keep userProfile in sync with active profile for backward compatibility
    if (data.activeProfileId) {
      data.userProfile = data.profiles.find((p) => p.id === data.activeProfileId) || null;
    } else {
      data.userProfile = data.profiles[0] || null;
    }

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
 * ProfileManager: Manages multi-player profiles, active profile selection, and updates
 */
export class ProfileManager {
  public static getProfiles(): UserProfile[] {
    const data = storageService.getRawData();
    return data.profiles || [];
  }

  public static getActiveProfileId(): string | null {
    const data = storageService.getRawData();
    return data.activeProfileId;
  }

  public static getActiveProfile(): UserProfile | null {
    const data = storageService.getRawData();
    if (!data.profiles || data.profiles.length === 0) return null;
    if (data.activeProfileId) {
      const found = data.profiles.find((p) => p.id === data.activeProfileId);
      if (found) return found;
    }
    return data.profiles[0] || null;
  }

  /**
   * Backward-compatible alias for getActiveProfile()
   */
  public static getProfile(): UserProfile | null {
    return this.getActiveProfile();
  }

  public static hasProfile(): boolean {
    const profile = this.getActiveProfile();
    return Boolean(profile && profile.name.trim().length > 0 && profile.avatarId);
  }

  public static setActiveProfileId(id: string): UserProfile | null {
    const data = storageService.getRawData();
    const target = data.profiles.find((p) => p.id === id);
    if (!target) return null;

    target.lastLogin = new Date().toISOString();
    data.activeProfileId = id;
    data.userProfile = target;
    storageService.saveRawData(data);
    return target;
  }

  public static createProfile(name: string, avatarId: string): UserProfile {
    const cleanName = name.trim().slice(0, 20);
    const now = new Date().toISOString();
    const id = `prof_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const profile: UserProfile = {
      id,
      name: cleanName,
      avatarId: avatarId || 'avatar_1',
      tutorialCompleted: false,
      createdAt: now,
      lastLogin: now,
    };

    const data = storageService.getRawData();
    data.profiles = [...data.profiles, profile];
    data.activeProfileId = id;
    data.userProfile = profile;
    storageService.saveRawData(data);

    return profile;
  }

  public static updateProfile(id: string, partial: Partial<UserProfile>): UserProfile | null {
    const data = storageService.getRawData();
    const idx = data.profiles.findIndex((p) => p.id === id);
    if (idx < 0) return null;

    data.profiles[idx] = {
      ...data.profiles[idx],
      ...partial,
      lastLogin: new Date().toISOString(),
    };

    if (data.activeProfileId === id) {
      data.userProfile = data.profiles[idx];
    }

    storageService.saveRawData(data);
    return data.profiles[idx];
  }

  public static setTutorialCompleted(profileId?: string, completed: boolean = true): UserProfile | null {
    const data = storageService.getRawData();
    const targetId = profileId || data.activeProfileId;
    if (!targetId) return null;

    return this.updateProfile(targetId, { tutorialCompleted: completed });
  }

  public static updateName(name: string): UserProfile | null {
    const active = this.getActiveProfile();
    if (!active) return null;
    return this.updateProfile(active.id, { name: name.trim().slice(0, 20) });
  }

  public static updateAvatar(avatarId: string): UserProfile | null {
    const active = this.getActiveProfile();
    if (!active) return null;
    return this.updateProfile(active.id, { avatarId });
  }

  public static deleteProfile(id: string): void {
    const data = storageService.getRawData();
    data.profiles = data.profiles.filter((p) => p.id !== id);

    if (data.activeProfileId === id) {
      data.activeProfileId = data.profiles.length > 0 ? data.profiles[0].id : null;
      data.userProfile = data.profiles[0] || null;
    }

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

  public static getSavedGamesForProfile(profileId?: string | null): SavedGame[] {
    const all = this.getSavedGames();
    if (!profileId) return all;
    // Filter games by active profile; if game has no profileId, include for first/legacy profile
    const profiles = ProfileManager.getProfiles();
    const isFirstProfile = profiles.length > 0 && profiles[0].id === profileId;
    return all.filter((g) => g.profileId === profileId || (!g.profileId && isFirstProfile));
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
    const activeProfile = ProfileManager.getActiveProfile();
    const cleanName = (name || levelData.name || 'Мой крутой уровень').trim();
    const author = activeProfile?.name || data.userProfile?.name || 'Юный архитектор';
    const authorAvatarId = activeProfile?.avatarId || 'avatar_1';
    const profileId = activeProfile?.id || undefined;
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
          authorAvatarId,
          profileId: data.savedGames[idx].profileId || profileId,
          thumbnailTheme: targetLevel.bgTheme,
          isFavorite: data.savedGames[idx].isFavorite,
        };
        savedGame = data.savedGames[idx];
      } else {
        savedGame = {
          id: existingId,
          name: cleanName,
          date: dateStr,
          levelData: targetLevel,
          authorName: author,
          authorAvatarId,
          profileId,
          thumbnailTheme: targetLevel.bgTheme,
          isFavorite: false,
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
        authorAvatarId,
        profileId,
        thumbnailTheme: targetLevel.bgTheme,
        isFavorite: false,
      };
      data.savedGames.unshift(savedGame);
    }

    storageService.saveRawData(data);
    return savedGame;
  }

  public static toggleFavorite(id: string): boolean {
    const data = storageService.getRawData();
    const game = data.savedGames.find((g) => g.id === id);
    if (!game) return false;
    game.isFavorite = !game.isFavorite;
    storageService.saveRawData(data);
    return game.isFavorite;
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

  /**
   * Validates imported JSON data to ensure it is a valid LevelData object
   */
  public static validateLevelData(data: unknown): { valid: boolean; error?: string; levelData?: LevelData } {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Файл не содержит корректный объект JSON' };
    }
    const obj = data as Partial<LevelData>;
    if (!Array.isArray(obj.items)) {
      return { valid: false, error: 'В файле отсутствует список блоков (поле items)' };
    }
    if (typeof obj.width !== 'number' || obj.width <= 0) {
      return { valid: false, error: 'В файле некорректная ширина уровня (поле width)' };
    }
    if (typeof obj.height !== 'number' || obj.height <= 0) {
      return { valid: false, error: 'В файле некорректная высота уровня (поле height)' };
    }

    const normalizedLevel: LevelData = {
      version: typeof obj.version === 'number' ? obj.version : 1,
      name: (obj.name || 'Импортированный уровень').trim().slice(0, 40),
      author: (obj.author || 'Неизвестный автор').trim().slice(0, 20),
      width: Math.min(Math.max(obj.width, 20), 500),
      height: Math.max(obj.height, 24),
      bgTheme: obj.bgTheme || 'green_islands',
      heroId: obj.heroId || 'leo',
      customHeroData: typeof obj.customHeroData === 'string' && obj.customHeroData.startsWith('data:image/') ? obj.customHeroData : undefined,
      items: obj.items.filter((it: any) => it && typeof it.x === 'number' && typeof it.y === 'number' && it.tileId),
      timeLimit: typeof obj.timeLimit === 'number' && obj.timeLimit > 0 ? obj.timeLimit : 300,
      goalType: obj.goalType || 'none',
      targetTime: obj.targetTime,
    };

    return { valid: true, levelData: normalizedLevel };
  }

  /**
   * Saves an imported level with a new unique ID and active profile metadata
   */
  public static importGame(levelData: LevelData): SavedGame {
    const data = storageService.getRawData();
    const activeProfile = ProfileManager.getActiveProfile();
    const cleanName = (levelData.name || 'Импортированный уровень').trim();
    const author = activeProfile?.name || 'Юный архитектор';
    const authorAvatarId = activeProfile?.avatarId || 'avatar_1';
    const profileId = activeProfile?.id || undefined;
    const dateStr = new Date().toISOString().split('T')[0];

    const targetLevel: LevelData = {
      ...levelData,
      name: cleanName,
      author,
    };

    const newGame: SavedGame = {
      id: `game_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: cleanName,
      date: dateStr,
      levelData: targetLevel,
      authorName: author,
      authorAvatarId,
      profileId,
      thumbnailTheme: targetLevel.bgTheme,
      isFavorite: false,
    };

    data.savedGames.unshift(newGame);
    storageService.saveRawData(data);
    return newGame;
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

  public static setMuted(muted: boolean): GameSettings {
    return this.updateSettings({ isMuted: muted });
  }

  public static setThemeMode(theme: ThemeMode): GameSettings {
    return this.updateSettings({ themeMode: theme });
  }

  public static setUiScale(scale: number): GameSettings {
    const clamped = Math.max(0.7, Math.min(1.5, scale));
    return this.updateSettings({ uiScale: clamped });
  }

  public static setShowTimer(enabled: boolean): GameSettings {
    return this.updateSettings({ showTimer: enabled });
  }
}
