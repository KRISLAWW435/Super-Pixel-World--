/**
 * Super Pixel World - Main Menu Screen (Game Launcher Dashboard)
 *
 * Fullscreen game launcher dashboard featuring:
 * - Direct Dashboard screen with creator avatar & username at the top
 * - Three clear, prominent launcher buttons:
 *   1. «СОЗДАТЬ НОВУЮ ИГРУ» (Large emerald 3D button)
 *   2. «МОИ ПРОЕКТЫ» (Large amber 3D button)
 *   3. «СМЕНИТЬ ПРОФИЛЬ» (Indigo 3D button)
 * - Global SoundControl (sound effects, music, master volume) + Fullscreen in top-right corner
 * - No intermediate popup modal — instant launcher UX like a real game console/engine
 */

import React, { useState, useEffect } from 'react';
import {
  Wrench,
  FolderOpen,
  Maximize2,
  Minimize2,
  Play,
  Info,
  Users,
  ChevronRight,
} from 'lucide-react';
import menuBgImg from '../assets/menu_bg.webp';
import { sound } from '../audio/soundEngine';
import { EditProfileModal } from './EditProfileModal';
import { ProfileSwitcherModal } from './ProfileSwitcherModal';
import { AboutModal } from './AboutModal';
import { SoundControl } from './SoundControl';
import { PRESET_AVATARS, UserProfile } from '../types/storage';

interface MainMenuScreenProps {
  profile: UserProfile;
  onOpenPlayGames: () => void;
  onOpenCreateEditor: () => void;
  onOpenCreateEditorWithTutorial: () => void;
  onOpenPresets?: () => void;
  onProfileUpdated: (profile: UserProfile) => void;
  onOpenCreateProfile: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const MainMenuScreen: React.FC<MainMenuScreenProps> = ({
  profile,
  onOpenPlayGames,
  onOpenCreateEditor,
  onOpenCreateEditorWithTutorial,
  onOpenPresets,
  onProfileUpdated,
  onOpenCreateProfile,
  isFullscreen,
  onToggleFullscreen,
}) => {
  // Profile Switcher Modal State
  const [isProfileSwitcherOpen, setIsProfileSwitcherOpen] = useState<boolean>(false);

  // Creator Profile and Studio Info Modals
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);

  const avatar =
    PRESET_AVATARS.find((a) => a.id === profile.avatarId) || PRESET_AVATARS[0];

  // Trigger Fullscreen API on user gesture if not already fullscreen
  const triggerFullscreen = () => {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
          // Gracefully handle browser/iframe policies without crashing
        });
      }
    } catch {
      // Ignore security policy fallback
    }
  };

  // 1. «СОЗДАТЬ НОВУЮ ИГРУ»
  const handleCreateGame = () => {
    sound.playSelect();
    triggerFullscreen();
    if (!profile.tutorialCompleted) {
      onOpenCreateEditorWithTutorial();
    } else {
      onOpenCreateEditor();
    }
  };

  // 2. «МОИ ПРОЕКТЫ»
  const handleMyProjects = () => {
    sound.playCoin();
    triggerFullscreen();
    onOpenPlayGames();
  };

  // 3. «СМЕНИТЬ ПРОФИЛЬ»
  const handleOpenProfileSwitcher = () => {
    sound.playClick();
    setIsProfileSwitcherOpen(true);
  };

  return (
    <div
      className="w-full h-full min-h-screen select-none relative overflow-y-auto flex flex-col justify-between"
      style={{
        backgroundImage: `url(${menuBgImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Background image layer for maximum browser fidelity */}
      <img
        src={menuBgImg}
        alt="Super Pixel World Menu Background"
        className="fixed inset-0 w-full h-full object-cover object-center pointer-events-none select-none -z-10"
      />
      {/* Subtle vignette overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/80 pointer-events-none -z-10" />

      {/* ========================================================================= */}
      {/* TOP BAR: Creator Profile (Left) & Controls: Sound Settings + Fullscreen (Right) */}
      {/* ========================================================================= */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between p-3 sm:p-5 z-20">
        {/* Top-Left: Creator Profile Chip */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playClick();
              setIsEditProfileOpen(true);
            }}
            title="Настроить профиль автора игры"
            className="flex items-center gap-2.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-slate-900/85 hover:bg-slate-800 border-2 border-amber-400/80 hover:border-amber-300 shadow-xl backdrop-blur-md transition-all cursor-pointer group active:scale-95"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-amber-300/80 bg-slate-950 shrink-0">
              <img
                src={avatar.imageUrl}
                alt={avatar.name}
                className="w-full h-full object-cover"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="text-left hidden xs:block">
              <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                <span>{profile.name}</span>
                <span className="text-slate-400 group-hover:text-amber-300 text-[10px]">✏️</span>
              </div>
              <div className="text-[11px] font-semibold text-slate-200">
                Создатель миров
              </div>
            </div>
          </button>

          {/* Info Button */}
          <button
            onClick={() => {
              sound.playClick();
              setIsInfoModalOpen(true);
            }}
            title="О конструкторе Super Pixel World"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-900/85 hover:bg-slate-800 border-2 border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-300 shadow-xl backdrop-blur-md flex items-center justify-center transition-all cursor-pointer active:scale-95"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        {/* Top-Right: Global Sound Control & Fullscreen Trigger */}
        <div className="flex items-center gap-2 sm:gap-3 relative">
          <SoundControl align="right" />

          {/* Fullscreen Toggle */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleFullscreen();
            }}
            title={isFullscreen ? 'Выйти из полноэкранного режима' : 'Во весь экран'}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900/85 hover:bg-slate-800 border-2 border-slate-700 hover:border-amber-400 text-slate-300 hover:text-white shadow-xl backdrop-blur-md flex items-center justify-center transition-all cursor-pointer active:scale-90 hover:scale-105 hidden sm:flex"
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* DASHBOARD HERO: 3 Ultra-Compact Launcher Buttons Positioned Lower on Screen */}
      {/* ========================================================================= */}
      <main className="w-full flex-1 flex flex-col items-center justify-end pb-3 sm:pb-5 md:pb-6 px-4 z-20">
        <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center gap-2 sm:gap-2.5">
          {/* The 3 Main Launcher Buttons (Extra Compact & Shifted Lower to Reveal Character & Background Art) */}
          <div className="w-full flex flex-col items-stretch gap-2 sm:gap-2.5">
            {/* Button 1: «СОЗДАТЬ НОВУЮ ИГРУ» (Emerald 3D Button - Compact) */}
            <button
              onClick={handleCreateGame}
              className="group relative cursor-pointer w-full py-2 sm:py-2.5 px-4 sm:px-5 rounded-xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-400 border-2 border-[#064E3B] text-white font-pixel flex items-center justify-between transition-transform active:translate-y-1 select-none shadow-md"
              style={{
                boxShadow: '0 4px 0 #065F46, 0 8px 16px rgba(0, 0, 0, 0.55)',
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#064E3B]/70 border border-emerald-300/40 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  <Wrench className="w-4 h-4 text-emerald-100" />
                </div>
                <span className="text-sm sm:text-base font-black tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate">
                  СОЗДАТЬ НОВУЮ ИГРУ
                </span>
              </div>

              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-white drop-shadow group-hover:scale-110 transition-transform shrink-0 ml-2" />
            </button>

            {/* Button 2: «МОИ ПРОЕКТЫ» (Amber 3D Button - Compact) */}
            <button
              onClick={handleMyProjects}
              className="group relative cursor-pointer w-full py-2 sm:py-2.5 px-4 sm:px-5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 border-2 border-amber-800 text-slate-950 font-pixel flex items-center justify-between transition-transform active:translate-y-1 select-none shadow-md"
              style={{
                boxShadow: '0 4px 0 #92400E, 0 8px 14px rgba(0, 0, 0, 0.45)',
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-700/40 border border-amber-300/60 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  <FolderOpen className="w-4 h-4 text-amber-950" />
                </div>
                <span className="text-sm sm:text-base font-black tracking-wide truncate">
                  МОИ ПРОЕКТЫ
                </span>
              </div>

              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-amber-950 group-hover:translate-x-1 transition-transform shrink-0 stroke-[3] ml-2" />
            </button>

            {/* Button 3: «СМЕНИТЬ ПРОФИЛЬ» (Indigo 3D Button - Compact) */}
            <button
              onClick={handleOpenProfileSwitcher}
              className="group relative cursor-pointer w-full py-1.5 sm:py-2 px-4 sm:px-5 rounded-xl bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 hover:from-indigo-600 hover:to-slate-800 border-2 border-indigo-500/80 hover:border-amber-400/80 text-white font-pixel flex items-center justify-between transition-transform active:translate-y-1 select-none shadow-md"
              style={{
                boxShadow: '0 4px 0 #1E1B4B, 0 6px 12px rgba(0, 0, 0, 0.4)',
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-950/80 border border-indigo-400/40 flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
                </div>
                <span className="text-xs sm:text-sm font-black tracking-wide text-white truncate">
                  СМЕНИТЬ ПРОФИЛЬ
                </span>
              </div>

              <ChevronRight className="w-4 h-4 text-indigo-200 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
            </button>
          </div>
        </div>
      </main>

      {/* Profile Switcher & Multi-Profile Modal */}
      <ProfileSwitcherModal
        isOpen={isProfileSwitcherOpen}
        onClose={() => setIsProfileSwitcherOpen(false)}
        activeProfile={profile}
        onProfileSelected={(p) => {
          onProfileUpdated(p);
          setIsProfileSwitcherOpen(false);
        }}
        onOpenCreateProfile={onOpenCreateProfile}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentProfile={profile}
        onProfileUpdated={onProfileUpdated}
      />

      {/* Redesigned About Studio Modal */}
      <AboutModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />
    </div>
  );
};
