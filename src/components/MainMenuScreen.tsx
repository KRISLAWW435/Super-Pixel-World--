/**
 * Super Pixel World - Main Menu Screen
 *
 * Fullscreen panoramic start screen featuring:
 * - TASK 1: Full-screen menu_bg.webp background & chunky 3D emerald green "ИГРАТЬ" breathing button at bottom-center
 * - TASK 2: Fullscreen API auto-trigger on user interaction
 * - TASK 3: Navigation Modal Window with dark blur overlay, golden border, and 3D buttons ("СОЗДАТЬ ИГРУ" & "МОИ ПРОЕКТЫ")
 * - TASK 4: Sound Settings popover with volume slider and persistence to localStorage
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Wrench,
  FolderOpen,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Play,
  Sparkles,
  X,
  Info,
  Sliders,
  Check,
} from 'lucide-react';
import menuBgImg from '../assets/menu_bg.webp';
import { sound } from '../audio/soundEngine';
import { EditProfileModal } from './EditProfileModal';
import { StudioModal } from './StudioModal';
import { AboutModal } from './AboutModal';
import { SoundControl } from './SoundControl';
import { PRESET_AVATARS, UserProfile, GameSettings } from '../types/storage';
import { SaveManager, SettingsManager } from '../services/storageManager';

interface MainMenuScreenProps {
  profile: UserProfile;
  onOpenPlayGames: () => void;
  onOpenCreateEditor: () => void;
  onOpenPresets?: () => void;
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
  onOpenPresets,
  onProfileUpdated,
  isFullscreen,
  onToggleFullscreen,
  isMuted,
  onToggleMute,
}) => {
  // Navigation Modal State
  const [isNavModalOpen, setIsNavModalOpen] = useState<boolean>(false);

  // Sound Settings Popover State
  const [isSoundPopoverOpen, setIsSoundPopoverOpen] = useState<boolean>(false);
  const soundPopoverRef = useRef<HTMLDivElement | null>(null);

  // Active Sound Settings (persisted in LocalStorage)
  const [soundSettings, setSoundSettings] = useState<GameSettings>(() => {
    return SettingsManager.getSettings();
  });

  // Creator Profile and Studio Info Modals
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);

  // Projects count
  const [projectsCount, setProjectsCount] = useState<number>(0);

  useEffect(() => {
    try {
      const saved = SaveManager.getSavedGames();
      setProjectsCount(saved.length);
    } catch {
      setProjectsCount(0);
    }
  }, []);

  // Synchronize sound settings with SoundEngine
  useEffect(() => {
    sound.applySettings(soundSettings);
  }, [soundSettings]);

  // Close sound popover when clicking outside
  useEffect(() => {
    if (!isSoundPopoverOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        soundPopoverRef.current &&
        !soundPopoverRef.current.contains(e.target as Node)
      ) {
        setIsSoundPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isSoundPopoverOpen]);

  const avatar =
    PRESET_AVATARS.find((a) => a.id === profile.avatarId) || PRESET_AVATARS[0];

  // TASK 2: Trigger Fullscreen API on user gesture
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

  // Click on "ИГРАТЬ" (Play)
  const handlePlayClick = () => {
    sound.playClick();
    triggerFullscreen();
    setIsNavModalOpen(true);
  };

  // Sound Settings Controls
  const handleVolumeChange = (newVolume: number) => {
    const updated = SettingsManager.setVolume(newVolume);
    setSoundSettings(updated);
    sound.applySettings(updated);
    sound.playClick();
  };

  const handleToggleSoundFx = () => {
    const updated = SettingsManager.setSound(!soundSettings.sound);
    setSoundSettings(updated);
    sound.applySettings(updated);
    sound.playClick();
  };

  const handleToggleMusic = () => {
    const updated = SettingsManager.setMusic(!soundSettings.music);
    setSoundSettings(updated);
    sound.applySettings(updated);
    sound.playClick();
  };

  const handleToggleMasterMute = () => {
    const nextMute = sound.toggleMute();
    const updated = SettingsManager.updateSettings({
      sound: !nextMute,
      music: !nextMute,
    });
    setSoundSettings(updated);
    sound.applySettings(updated);
    onToggleMute();
  };

  return (
    <div
      className="w-full h-full min-h-screen select-none relative overflow-hidden flex flex-col justify-between"
      style={{
        backgroundImage: `url(${menuBgImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Fallback image layer for maximum browser fidelity */}
      <img
        src={menuBgImg}
        alt="Super Pixel World Menu Background"
        className="fixed inset-0 w-full h-full object-cover object-center pointer-events-none select-none -z-10"
      />


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
            className="flex items-center gap-2.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border-2 border-amber-400/80 hover:border-amber-300 shadow-xl backdrop-blur-md transition-all cursor-pointer group active:scale-95"
          >
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-amber-300/80 bg-slate-950 shrink-0">
              <img
                src={avatar.imageUrl}
                alt={avatar.name}
                className="w-full h-full object-cover"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="text-left hidden xs:block">
              <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
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
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border-2 border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-300 shadow-xl backdrop-blur-md flex items-center justify-center transition-all cursor-pointer active:scale-95"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        {/* Top-Right: Sound Settings & Fullscreen Trigger */}
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
      {/* TASK 1: MAIN ENTRY 3D BUTTON "СОЗДАВАТЬ" (BOTTOM-CENTER, RAISED) */}
      {/* ========================================================================= */}
      <footer className="w-full flex flex-col items-center justify-center pb-16 sm:pb-22 md:pb-28 z-30 pointer-events-auto px-4">
        <div className="flex flex-col items-center gap-2 sm:gap-3">
          <button
            onClick={handlePlayClick}
            className="animate-button-breathe group relative cursor-pointer px-10 sm:px-16 py-4 sm:py-5 rounded-2xl sm:rounded-3xl bg-emerald-500 hover:bg-emerald-400 border-4 border-[#064E3B] text-white font-pixel text-xl sm:text-3xl tracking-widest flex items-center justify-center gap-3.5 transition-transform active:translate-y-2 select-none"
            style={{
              boxShadow: '0 10px 0 #065F46, 0 16px 25px rgba(0, 0, 0, 0.65)',
            }}
          >
            <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-current text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)] group-hover:scale-110 transition-transform" />
            <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              СОЗДАВАТЬ
            </span>
          </button>

          <div className="text-[11px] sm:text-xs font-bold text-emerald-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] tracking-wider uppercase bg-slate-950/60 px-3.5 py-1 rounded-full border border-emerald-500/30 backdrop-blur-sm">
            Нажмите, чтобы создать игру или открыть проекты
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* TASK 3: NAVIGATION MODAL WINDOW */}
      {/* ========================================================================= */}
      {isNavModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-[4px] animate-in fade-in duration-200"
          onClick={() => {
            sound.playClick();
            setIsNavModalOpen(false);
          }}
        >
          <div
            className="relative w-full max-w-xl bg-[#1E293B] border-4 border-amber-400 rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_rgba(251,191,36,0.35)] animate-modal-pop-in text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              onClick={() => {
                sound.playClick();
                setIsNavModalOpen(false);
              }}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800/90 hover:bg-rose-600 border-2 border-slate-600 hover:border-rose-400 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
              title="Закрыть меню"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="text-center mb-6 sm:mb-8 space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-pixel text-[10px] sm:text-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Pixel world</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-pixel text-white tracking-wide drop-shadow-sm pt-1">
                Pixel world
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                Создавайте авторские платформеры или проходите сохранённые миры
              </p>
            </div>

            {/* Modal Contents: Two large, beautiful 3D buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Button 1: СОЗДАТЬ ИГРУ (Green 3D Button) */}
              <button
                onClick={() => {
                  sound.playSelect();
                  triggerFullscreen();
                  setIsNavModalOpen(false);
                  onOpenCreateEditor();
                }}
                className="group flex flex-col items-center text-center p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 border-4 border-emerald-800 text-white transition-all cursor-pointer active:translate-y-1.5"
                style={{
                  boxShadow: '0 8px 0 #065F46, 0 12px 20px rgba(0,0,0,0.5)',
                }}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#064E3B]/60 border-2 border-emerald-300/40 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-inner">
                  <Wrench className="w-8 h-8 text-emerald-200" />
                </div>
                <span className="font-pixel text-base sm:text-lg font-bold tracking-wider mb-1.5 drop-shadow">
                  СОЗДАТЬ ИГРУ
                </span>
                <span className="text-xs text-emerald-100/90 font-medium leading-snug">
                  Конструктор уровней с чистого холста
                </span>
              </button>

              {/* Button 2: МОИ ПРОЕКТЫ (Yellow / Amber 3D Button) */}
              <button
                onClick={() => {
                  sound.playCoin();
                  triggerFullscreen();
                  setIsNavModalOpen(false);
                  onOpenPlayGames();
                }}
                className="group flex flex-col items-center text-center p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 border-4 border-amber-700 text-slate-950 transition-all cursor-pointer active:translate-y-1.5"
                style={{
                  boxShadow: '0 8px 0 #92400E, 0 12px 20px rgba(0,0,0,0.5)',
                }}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-600/40 border-2 border-amber-300/60 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-inner">
                  <FolderOpen className="w-8 h-8 text-amber-950" />
                </div>
                <span className="font-pixel text-base sm:text-lg font-bold tracking-wider mb-1.5 text-slate-950 drop-shadow-sm">
                  МОИ ПРОЕКТЫ
                </span>
                <span className="text-xs text-slate-900/80 font-bold leading-snug">
                  {projectsCount > 0
                    ? `${projectsCount} ${
                        projectsCount === 1
                          ? 'сохранённый проект'
                          : projectsCount > 1 && projectsCount < 5
                          ? 'сохранённых проекта'
                          : 'сохранённых проектов'
                      }`
                    : 'Архив авторских уровней'}
                </span>
              </button>
            </div>

            {/* Optional Preset Levels Footer Link */}
            {onOpenPresets && (
              <div className="mt-5 pt-4 border-t border-slate-700/80 text-center">
                <button
                  onClick={() => {
                    sound.playCheckpoint();
                    triggerFullscreen();
                    setIsNavModalOpen(false);
                    onOpenPresets();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 font-bold hover:underline cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Посмотреть готовые примеры уровней</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
