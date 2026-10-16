/**
 * Super Pixel World - Storage & Profile Types
 * Data structures for User Profile, Sound Settings, and Saved Games in LocalStorage.
 */

import { LevelData } from './game';

export interface UserProfile {
  name: string;
  avatarId: string;
  createdAt?: string;
  lastLogin?: string;
}

export interface GameSettings {
  sound: boolean; // Sound effects enabled
  music: boolean; // BGM enabled
  volume: number; // Master volume 0.0 .. 1.0 (default 0.8)
}

export interface SavedGame {
  id: string; // e.g. "game_1698421800000"
  name: string;
  date: string; // ISO or human-readable format e.g. "2023-10-27"
  levelData: LevelData;
  authorName?: string;
  thumbnailTheme?: string;
}

export interface StorageData {
  userProfile: UserProfile | null;
  settings: GameSettings;
  savedGames: SavedGame[];
}

export const MENU_BG_IMAGE = '/src/assets/images/pixel_menu_bg_1792139874651.jpg';

export interface AvatarOption {
  id: string;
  name: string;
  emoji: string;
  imageUrl: string;
  subtitle: string;
  gradient: string;
  borderColor: string;
}

export const PRESET_AVATARS: AvatarOption[] = [
  {
    id: 'fox',
    name: 'Лисёнок Фокси',
    emoji: '🦊',
    imageUrl: '/src/assets/images/pixel_fox_avatar_1792139874796.jpg',
    subtitle: 'Ловкий и шустрый',
    gradient: 'from-amber-400 via-orange-500 to-rose-500',
    borderColor: 'border-amber-400',
  },
  {
    id: 'robot',
    name: 'Робот Бип',
    emoji: '🤖',
    imageUrl: '/src/assets/images/pixel_robot_avatar_1792139874981.jpg',
    subtitle: 'Умный изобретатель',
    gradient: 'from-cyan-400 via-blue-500 to-indigo-600',
    borderColor: 'border-cyan-400',
  },
  {
    id: 'kitten',
    name: 'Котёнок Мурка',
    emoji: '🐱',
    imageUrl: '/src/assets/images/pixel_cat_avatar_1792139875859.jpg',
    subtitle: 'Любопытный прыгун',
    gradient: 'from-pink-400 via-rose-500 to-purple-600',
    borderColor: 'border-pink-400',
  },
  {
    id: 'astronaut',
    name: 'Космонавт Стар',
    emoji: '🧑‍🚀',
    imageUrl: '/src/assets/images/pixel_astro_avatar_1792139875646.jpg',
    subtitle: 'Покоритель планет',
    gradient: 'from-violet-400 via-purple-600 to-slate-900',
    borderColor: 'border-violet-400',
  },
  {
    id: 'puppy',
    name: 'Щенок Дружок',
    emoji: '🐶',
    imageUrl: '/src/assets/images/pixel_puppy_avatar_1792139894653.jpg',
    subtitle: 'Верный и отважный',
    gradient: 'from-yellow-400 via-amber-500 to-amber-700',
    borderColor: 'border-yellow-400',
  },
  {
    id: 'panda',
    name: 'Панда Бамбу',
    emoji: '🐼',
    imageUrl: '/src/assets/images/pixel_panda_avatar_1792139894187.jpg',
    subtitle: 'Добрый мастер дзена',
    gradient: 'from-emerald-400 via-teal-500 to-emerald-700',
    borderColor: 'border-emerald-400',
  },
  {
    id: 'dragon',
    name: 'Дракончик Спарк',
    emoji: '🐲',
    imageUrl: '/src/assets/images/pixel_dragon_avatar_1792139876344.jpg',
    subtitle: 'Огненный защитник',
    gradient: 'from-rose-500 via-red-600 to-amber-600',
    borderColor: 'border-rose-400',
  },
  {
    id: 'penguin',
    name: 'Пингвин Пико',
    emoji: '🐧',
    imageUrl: '/src/assets/images/pixel_penguin_avatar_1792139895130.jpg',
    subtitle: 'Весёлый сноубордист',
    gradient: 'from-sky-300 via-blue-500 to-indigo-700',
    borderColor: 'border-sky-300',
  },
];
