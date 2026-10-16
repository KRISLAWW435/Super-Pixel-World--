/**
 * Pixel Studio Pro - Main Menu & Studio Hub (MainMenuScreen)
 *
 * Implements Stage 4 Branding & Action Hub:
 * - Unified branding: SUPER PIXEL WORLD STUDIO
 * - 3 Action Pillars:
 *   1. 🛠️ «Создать новую игру» (Мастерская уровней)
 *   2. 🎮 «Продолжить проект» (Архив авторских уровней)
 *   3. 🌟 «Галерея готовых примеров» (Готовые приключения для вдохновения)
 * - Uses Pixel Studio Pro tokens: #0B0F19 background, #131B2E surface, #F59E0B amber, #10B981 emerald
 * - Unified StudioModal for "О студии"
 */

import React, { useState, useEffect } from 'react';
import {
  Hammer,
  Gamepad2,
  Settings,
  Sparkles,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  ChevronRight,
  Layers,
  Wand2,
  FolderOpen,
  Cpu,
  Palette,
  Play,
  Info,
  Compass,
} from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { EditProfileModal } from './EditProfileModal';
import { SettingsModal } from './SettingsModal';
import { StudioModal } from './StudioModal';
import { MENU_BG_IMAGE, PRESET_AVATARS, UserProfile } from '../types/storage';
import { SaveManager } from '../services/storageManager';

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
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [projectsCount, setProjectsCount] = useState<number>(0);

  useEffect(() => {
    try {
      const saved = SaveManager.getSavedGames();
      setProjectsCount(saved.length);
    } catch {
      setProjectsCount(0);
    }
  }, []);

  const avatar =
    PRESET_AVATARS.find((a) => a.id === profile.avatarId) || PRESET_AVATARS[0];

  const handleOpenEditor = () => {
    sound.playSelect();
    onOpenCreateEditor();
  };

  const handleOpenProjects = () => {
    sound.playCoin();
    onOpenPlayGames();
  };

  const handleOpenPresets = () => {
    sound.playCheckpoint();
    if (onOpenPresets) {
      onOpenPresets();
    } else {
      onOpenPlayGames();
    }
  };

  return (
    <div className="w-full h-full min-h-screen bg-[#0B0F19] flex flex-col justify-between p-3 sm:p-6 lg:p-8 select-none relative overflow-x-hidden overflow-y-auto">
      {/* Background with Ambient Pixel Art & Cinematic Vignette */}
      <img
        src={MENU_BG_IMAGE}
        alt="Super Pixel World Studio Background"
        referrerPolicy="no-referrer"
        className="fixed inset-0 w-full h-full object-cover object-center opacity-25 scale-105 pointer-events-none transition-transform duration-1000"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-[#0B0F19]/90 via-[#0B0F19]/75 to-[#0B0F19]/95 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.2),transparent_100%)] pointer-events-none" />

      {/* Subtle Studio Ambient Particles */}
      <div className="absolute top-10 left-12 text-3xl opacity-20 animate-pulse pointer-events-none hidden md:block z-10">
        ✨
      </div>
      <div className="absolute top-28 right-16 text-4xl opacity-25 animate-bounce pointer-events-none hidden md:block z-10">
        🎮
      </div>
      <div className="absolute bottom-24 left-20 text-3xl opacity-15 pointer-events-none hidden md:block z-10">
        📐
      </div>

      {/* TOP BAR: Studio Brandmark, Creator Badge & Utilities */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between z-20 gap-3">
        {/* Unified Studio Brand Crest */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-emerald-400 p-[2px] shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-pixel text-[10px] sm:text-xs text-amber-300 tracking-wider font-bold">
                SUPER PIXEL WORLD
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/40 text-amber-300">
                STUDIO
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Студия создания и проектирования 2D-игр
            </div>
          </div>
        </div>

        {/* Right Controls: Creator Profile & Utilities */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Creator Profile Chip */}
          <button
            onClick={() => {
              sound.playClick();
              setIsEditProfileOpen(true);
            }}
            title="Нажмите, чтобы настроить профиль автора игры"
            className="flex items-center gap-2.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#131B2E]/90 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400/70 shadow-lg backdrop-blur-md transition-all cursor-pointer group active:scale-95"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden border border-amber-400/60 shadow-sm shrink-0 bg-slate-950">
              <img
                src={avatar.imageUrl}
                alt={avatar.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="text-left hidden xs:block">
              <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                <span>Автор: {profile.name}</span>
                <span className="text-slate-400 group-hover:text-amber-300 text-[10px]">✏️</span>
              </div>
              <div className="text-xs font-semibold text-slate-200">
                Геймдизайнер
              </div>
            </div>
          </button>

          {/* About Studio Info Button */}
          <button
            onClick={() => {
              sound.playClick();
              setIsInfoModalOpen(true);
            }}
            title="О студии Super Pixel World"
            className="p-2.5 sm:p-3 rounded-xl bg-[#131B2E]/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-amber-300 shadow-lg backdrop-blur-md transition-all cursor-pointer active:scale-95"
          >
            <Info className="w-5 h-5" />
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Включить звук' : 'Выключить звук'}
            className="p-2.5 sm:p-3 rounded-xl bg-[#131B2E]/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white shadow-lg backdrop-blur-md transition-all cursor-pointer active:scale-95"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-rose-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-emerald-400" />
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Обычный режим' : 'Во весь экран'}
            className="p-2.5 sm:p-3 rounded-xl bg-[#131B2E]/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white shadow-lg backdrop-blur-md transition-all cursor-pointer active:scale-95 hidden sm:flex"
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* CENTER: Studio Hero & 3 Core Action Workbenches */}
      <main className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center my-auto py-6 sm:py-8 z-20 space-y-6 sm:space-y-8 animate-in fade-in zoom-in-95 duration-300">
        {/* Core Studio Announcement Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-emerald-500/20 border border-amber-300/40 text-amber-200 text-xs sm:text-sm font-bold shadow-lg shadow-black/40 backdrop-blur-md text-center">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Это не просто игра, а Студия Super Pixel World — пространство создания 2D-миров</span>
        </div>

        {/* Studio Hero Title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-400 drop-shadow-[0_4px_24px_rgba(245,158,11,0.25)] tracking-tight">
            SUPER PIXEL WORLD
          </h1>
          <p className="text-sm sm:text-lg font-bold text-amber-300/90 tracking-wide uppercase">
            Творческая студия разработки и конструирования 2D-игр
          </p>
        </div>

        {/* Concise Studio Description Card */}
        <div className="w-full max-w-2xl bg-[#131B2E]/90 backdrop-blur-md border border-slate-700/90 rounded-2xl p-4 sm:p-6 text-center shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80" />
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed font-medium">
            <strong className="text-amber-300 font-bold">Super Pixel World</strong> — это ваша авторская мастерская. Здесь вы не просто проходите препятствия, а становитесь настоящим геймдизайнером: возводите уровни блок за блоком, настраиваете физику платформ, оживляете пиксельных героев и создаёте увлекательные миры без строчки кода.
          </p>
        </div>

        {/* 3 Core Action Workbenches (Создать / Мои проекты / Галерея примеров) */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 pt-2">
          {/* 1. CREATE LEVEL WORKSHOP */}
          <button
            onClick={handleOpenEditor}
            className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-600/25 to-[#131B2E] hover:from-amber-500/30 hover:via-orange-500/35 border-2 border-amber-400/70 hover:border-amber-300 text-left shadow-xl shadow-amber-500/10 transition-all cursor-pointer group active:scale-98 hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center text-2xl shadow-lg shadow-amber-400/40 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  <Hammer className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300">
                  Конструктор
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white group-hover:text-amber-200 transition-colors">
                СОЗДАТЬ ИГРУ
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-snug">
                Открыть чистый холст: палитра блоков, монеты, батуты и враги.
              </p>
            </div>
            <div className="pt-3 flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Открыть редактор</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* 2. MY PROJECTS & ARCHIVE */}
          <button
            onClick={handleOpenProjects}
            className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-teal-500/20 via-emerald-600/25 to-[#131B2E] hover:from-teal-500/30 hover:via-emerald-500/35 border-2 border-teal-400/70 hover:border-teal-300 text-left shadow-xl shadow-teal-500/10 transition-all cursor-pointer group active:scale-98 hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-teal-400 text-slate-950 flex items-center justify-center text-2xl shadow-lg shadow-teal-400/40 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
                  <Gamepad2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-400/20 border border-teal-400/50 text-teal-300">
                  {projectsCount > 0 ? `${projectsCount} проектов` : 'Библиотека'}
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white group-hover:text-teal-200 transition-colors">
                МОИ ПРОЕКТЫ
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-snug">
                Запускать, тестировать и дорабатывать сохранённые авторские миры.
              </p>
            </div>
            <div className="pt-3 flex items-center gap-1 text-xs font-bold text-teal-300 group-hover:translate-x-1 transition-transform">
              <span>Продолжить проект</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* 3. READY-MADE PRESETS GALLERY */}
          <button
            onClick={handleOpenPresets}
            className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 via-indigo-600/25 to-[#131B2E] hover:from-purple-500/30 hover:via-indigo-500/35 border-2 border-purple-400/70 hover:border-purple-300 text-left shadow-xl shadow-purple-500/10 transition-all cursor-pointer group active:scale-98 hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-purple-400 text-slate-950 flex items-center justify-center text-2xl shadow-lg shadow-purple-400/40 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  <Compass className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-400/20 border border-purple-400/50 text-purple-300">
                  4 биома
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white group-hover:text-purple-200 transition-colors">
                ГАЛЕРЕЯ МИРОВ
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-snug">
                Фирменные готовые платформеры студии для вдохновения и старта.
              </p>
            </div>
            <div className="pt-3 flex items-center gap-1 text-xs font-bold text-purple-300 group-hover:translate-x-1 transition-transform">
              <span>Смотреть шаблоны</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Studio Core Capabilities Pills */}
        <div className="w-full max-w-3xl grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-center">
          <div className="p-3 rounded-xl bg-[#131B2E]/70 border border-slate-800 flex flex-col items-center gap-1">
            <Palette className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-200">4 биома</span>
            <span className="text-[10px] text-slate-400">Острова, Лёд, Джунгли, Конфеты</span>
          </div>

          <div className="p-3 rounded-xl bg-[#131B2E]/70 border border-slate-800 flex flex-col items-center gap-1">
            <Wand2 className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-slate-200">Без строчки кода</span>
            <span className="text-[10px] text-slate-400">Визуальный холст и кисть</span>
          </div>

          <div className="p-3 rounded-xl bg-[#131B2E]/70 border border-slate-800 flex flex-col items-center gap-1">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200">Физика 60 FPS</span>
            <span className="text-[10px] text-slate-400">Плавные прыжки и коллизии</span>
          </div>

          <div className="p-3 rounded-xl bg-[#131B2E]/70 border border-slate-800 flex flex-col items-center gap-1">
            <FolderOpen className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200">Автосохранение</span>
            <span className="text-[10px] text-slate-400">Надёжный архив уровней</span>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 z-20 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium">Super Pixel World Studio • Версия Pro 2.5</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              setIsSettingsOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#131B2E] hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Параметры звука</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setIsEditProfileOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#131B2E] hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <span>Сменить автора</span>
          </button>
        </div>
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

      {/* About Studio Modal using StudioModal */}
      <StudioModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title="О студии Super Pixel World"
        subtitle="Инструмент создания платформеров для детей и подростков"
        icon={<Sparkles className="w-5 h-5 text-amber-400" />}
        badge="Pixel Studio Pro"
        badgeColor="amber"
      >
        <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <p>
            <strong className="text-white">Super Pixel World</strong> — это творческая среда разработки, объединяющая свободу рисования и точную физику платформера.
          </p>
          <div className="p-3 rounded-xl bg-[#0F172A] border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Возможности конструктора:
            </div>
            <ul className="text-xs space-y-1.5 list-disc list-inside text-slate-300">
              <li><strong>Свободное рисование:</strong> Платформы, стены и ловушки ставятся непрерывной кистью или прямоугольной областью.</li>
              <li><strong>Мгновенный тест:</strong> Проверка физики, дистанций прыжков и поведения врагов в один клик.</li>
              <li><strong>4 биома с панорамами:</strong> Зелёные острова, Ледяной пик, Космо-джунгли и Конфетлэнд.</li>
              <li><strong>Библиотека проектов:</strong> Сохранение уровней в браузер и экспорт в JSON-файлы для обмена с друзьями.</li>
            </ul>
          </div>
          <button
            onClick={() => setIsInfoModalOpen(false)}
            className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md"
          >
            Понятно, к созданию!
          </button>
        </div>
      </StudioModal>
    </div>
  );
};
