/**
 * Super Pixel World - Storage & Profile Types
 * Data structures for User Profile, Sound Settings, and Saved Games in LocalStorage.
 */

import { LevelData } from './game';

export interface UserProfile {
  id: string;
  name: string;
  avatarId: string;
  tutorialCompleted: boolean;
  createdAt?: string;
  lastLogin?: string;
}

export interface GameSettings {
  sound: boolean; // Sound effects enabled
  music: boolean; // BGM enabled
  volume: number; // Master volume 0.0 .. 1.0 (default 0.4)
  isMuted?: boolean; // Global mute state
}

export interface SavedGame {
  id: string; // e.g. "game_1698421800000"
  name: string;
  date: string; // ISO or human-readable format e.g. "2023-10-27"
  levelData: LevelData;
  authorName?: string;
  authorAvatarId?: string;
  profileId?: string;
  thumbnailTheme?: string;
  isFavorite?: boolean;
}

export interface StorageData {
  profiles: UserProfile[];
  activeProfileId: string | null;
  userProfile?: UserProfile | null;
  settings: GameSettings;
  savedGames: SavedGame[];
}

export const MENU_BG_IMAGE = '/src/assets/menu_bg.webp';

import avatar1 from '../assets/avatars/avatar_1.png';
import avatar2 from '../assets/avatars/avatar_2.png';
import avatar3 from '../assets/avatars/avatar_3.png';
import avatar4 from '../assets/avatars/avatar_4.png';
import avatar5 from '../assets/avatars/avatar_5.png';
import avatar6 from '../assets/avatars/avatar_6.png';
import avatar7 from '../assets/avatars/avatar_7.png';
import avatar8 from '../assets/avatars/avatar_8.png';
import avatar9 from '../assets/avatars/avatar_9.png';
import avatar10 from '../assets/avatars/avatar_10.png';

export interface AvatarOption {
  id: string;
  imageUrl: string;
  name?: string;
  emoji?: string;
  subtitle?: string;
  gradient?: string;
  borderColor?: string;
}

export const PRESET_AVATARS: AvatarOption[] = [
  { id: 'avatar_1', imageUrl: avatar1, name: 'Герой 1' },
  { id: 'avatar_2', imageUrl: avatar2, name: 'Герой 2' },
  { id: 'avatar_3', imageUrl: avatar3, name: 'Герой 3' },
  { id: 'avatar_4', imageUrl: avatar4, name: 'Герой 4' },
  { id: 'avatar_5', imageUrl: avatar5, name: 'Герой 5' },
  { id: 'avatar_6', imageUrl: avatar6, name: 'Герой 6' },
  { id: 'avatar_7', imageUrl: avatar7, name: 'Герой 7' },
  { id: 'avatar_8', imageUrl: avatar8, name: 'Герой 8' },
  { id: 'avatar_9', imageUrl: avatar9, name: 'Герой 9' },
  { id: 'avatar_10', imageUrl: avatar10, name: 'Герой 10' },
];
