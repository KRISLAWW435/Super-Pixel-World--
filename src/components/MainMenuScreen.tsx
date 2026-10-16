/**
 * Super Pixel World - Main Menu Screen (Главное меню)
 *
 * Child-friendly, cartoon styling:
 * - Top Bar: Avatar & name greeting ("Привет, Максим!"), click opens EditProfileModal
 * - Center Section: Three huge, juicy cartoon buttons:
 *   1. 🎮 "ИГРАТЬ" (Opens My Games saved levels list)
 *   2. 🛠️ "СОЗДАТЬ" (Opens builder editor)
 *   3. ⚙️ "НАСТРОЙКИ" (Opens sound settings)
 * - Sound on every button click
 * - Responsive layout for both tablets and desktop
 */

import React, { useState } from 'react';
import {
  Gamepad2,
  Hammer,
  Settings,
  Sparkles,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  ChevronRight,
  User,
} from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { EditProfileModal } from './EditProfileModal';
import { SettingsModal } from './SettingsModal';
import { MENU_BG_IMAGE, PRESET_AVATARS, UserProfile } from '../types/storage';

interface MainMenuScreenProps {
  profile: UserProfile;
  onOpenPlayGames: () => void;
  onOpenCreateEditor: () => void;
  onProfileUpdated: (profile: UserProfile) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const MainMenuScreen: React.FC<MainMenuScreenProps> = ({
  profile,
  onOpenPlayGames,
  onOpenCreateEditor,
  onProfileUpdated,
  isFullscreen,
  onToggleFullscreen,
  isMuted,
  onToggleMute,
}) => {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const avatar =
    PRESET_AVATARS.find((a) => a.id === profile.avatarId) || PRESET_AVATARS[0];

  const handlePlayClick = () => {
    sound.playCoin();
    onOpenPlayGames();
  };

  const handleCreateClick = () => {
    sound.playSelect();
    onOpenCreateEditor();
  };

  const handleSettingsClick = () => {
    sound.playClick();
    setIsSettingsOpen(true);
  };

  const handleAvatarClick = () => {
    sound.playClick();
    setIsEditProfileOpen(true);
  };

  return (
    <div className="w-full h-full min-h-screen bg-slate-950 flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none relative overflow-hidden">
      {/* Pixel Art Panoramic Menu Background */}
      <img
        src={MENU_BG_IMAGE}
        alt="Pixel art main menu background"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-45 scale-102 pointer-events-none"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/60 via-slate-950/75 to-slate-950/95 pointer-events-none" />

      {/* Decorative cartoon floating objects */}
      <div className="absolute top-12 left-10 text-5xl opacity-40 animate-pulse pointer-events-none hidden md:block z-10">
        ☁️
      </div>
      <div className="absolute top-20 right-16 text-6xl opacity-50 animate-bounce pointer-events-none hidden md:block z-10">
        ⭐
      </div>
      <div className="absolute bottom-20 left-16 text-5xl opacity-40 pointer-events-none hidden md:block z-10">
        🏰
      </div>
      <div className="absolute bottom-24 right-20 text-5xl opacity-40 pointer-events-none hidden md:block z-10">
        🍄
      </div>

      {/* TOP BAR: Player Greeting & Quick Utility Controls */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-20">
        {/* Clickable Profile Card */}
        <button
          onClick={handleAvatarClick}
          title="Нажми, чтобы сменить имя или аватарку"
          className="flex items-center gap-3 p-2 sm:pr-5 rounded-2xl bg-slate-950/80 hover:bg-slate-900 border-3 border-amber-400/90 shadow-xl backdrop-blur-md transition-all cursor-pointer group active:scale-95"
        >
          <div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 border-white/60 shadow-md group-hover:scale-105 transition-transform shrink-0 bg-slate-950"
          >
            <img
              src={avatar.imageUrl}
              alt={avatar.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <div className="text-left">
            <div className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <span>Привет, {profile.name}!</span>
              <span className="text-slate-400 group-hover:text-amber-300">✏️</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-200">
              {avatar.name}
            </div>
          </div>
        </button>

        {/* Top Right Quick Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Включить звук' : 'Выключить звук'}
            className="p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-900 border-2 border-slate-700 text-slate-300 hover:text-white shadow-xl backdrop-blur-md transition-all cursor-pointer active:scale-95"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-rose-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-emerald-400" />
            )}
          </button>

          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Обычный режим' : 'Во весь экран'}
            className="p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-900 border-2 border-slate-700 text-slate-300 hover:text-white shadow-xl backdrop-blur-md transition-all cursor-pointer active:scale-95 hidden sm:flex"
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* CENTER: Game Logo & 3 Huge Cartoon Action Buttons */}
      <main className="w-full max-w-xl mx-auto flex flex-col items-center justify-center py-6 sm:py-10 z-20 space-y-6 sm:space-y-8 animate-in fade-in zoom-in-95 duration-300">
        {/* Game Title Badge */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-400/20 border-2 border-amber-300/60 text-amber-300 font-black text-xs uppercase tracking-widest backdrop-blur-xs">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Конструктор миров</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-400 drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)] tracking-wide">
            SUPER PIXEL WORLD
          </h1>
        </div>

        {/* 3 Large, Bright Cartoon Buttons */}
        <div className="w-full space-y-4">
          {/* 1. PLAY BUTTON (ИГРАТЬ) */}
          <button
            onClick={handlePlayClick}
            className="w-full py-5 sm:py-6 px-6 sm:px-8 rounded-3xl bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black border-4 border-emerald-300 shadow-2xl shadow-emerald-500/40 flex items-center justify-between gap-4 transition-all cursor-pointer active:scale-98 group hover:-translate-y-1"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/25 flex items-center justify-center text-3xl sm:text-4xl shadow-inner group-hover:scale-110 transition-transform">
                🎮
              </div>
              <div className="text-left">
                <div className="text-2xl sm:text-3xl font-black tracking-wider leading-tight">
                  ИГРАТЬ
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900/80">
                  Мои сохранённые уровни
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ChevronRight className="w-6 h-6 stroke-[3]" />
            </div>
          </button>

          {/* 2. CREATE BUTTON (СОЗДАТЬ) */}
          <button
            onClick={handleCreateClick}
            className="w-full py-5 sm:py-6 px-6 sm:px-8 rounded-3xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black border-4 border-amber-300 shadow-2xl shadow-orange-500/40 flex items-center justify-between gap-4 transition-all cursor-pointer active:scale-98 group hover:-translate-y-1"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/25 flex items-center justify-center text-3xl sm:text-4xl shadow-inner group-hover:scale-110 transition-transform">
                🛠️
              </div>
              <div className="text-left">
                <div className="text-2xl sm:text-3xl font-black tracking-wider leading-tight">
                  СОЗДАТЬ
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900/80">
                  Редактор-конструктор
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ChevronRight className="w-6 h-6 stroke-[3]" />
            </div>
          </button>

          {/* 3. SETTINGS BUTTON (НАСТРОЙКИ) */}
          <button
            onClick={handleSettingsClick}
            className="w-full py-4 sm:py-5 px-6 sm:px-8 rounded-3xl bg-gradient-to-r from-slate-800 via-slate-850 to-indigo-950 hover:bg-slate-800 text-white font-black border-4 border-slate-700 hover:border-indigo-400 shadow-xl flex items-center justify-between gap-4 transition-all cursor-pointer active:scale-98 group hover:-translate-y-1"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-2xl sm:text-3xl group-hover:rotate-45 transition-transform duration-300">
                ⚙️
              </div>
              <div className="text-left">
                <div className="text-xl sm:text-2xl font-black tracking-wider leading-tight">
                  НАСТРОЙКИ
                </div>
                <div className="text-xs sm:text-sm font-medium text-slate-400">
                  Звук и музыка
                </div>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </div>
          </button>
        </div>
      </main>

      {/* FOOTER: Friendly child tip */}
      <footer className="w-full max-w-md mx-auto text-center z-20">
        <p className="text-xs font-bold text-slate-300/80 drop-shadow">
          ✨ Строй, прыгай и делись уровнями с друзьями!
        </p>
      </footer>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentProfile={profile}
        onProfileUpdated={onProfileUpdated}
      />

      {/* Sound Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
