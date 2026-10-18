/**
 * Super Pixel World - Comprehensive Retro Settings Modal
 *
 * Implements 3 full tabs:
 * 1. Sound: Volume slider, BGM toggle, SFX toggle, Mute button, current track
 * 2. Theme: Dark (Retro Arcade) vs Light (Classic Famicom / Game Boy) with live preview
 * 3. Display: Interface scaling (80% - 140%), resolution detect, Fullscreen, Tutorial reset
 */

import React, { useEffect, useState } from 'react';
import {
  Volume2,
  VolumeX,
  Volume1,
  Music,
  Bell,
  Check,
  Settings,
  RotateCcw,
  GraduationCap,
  Sun,
  Moon,
  Monitor,
  Maximize2,
  Minimize2,
  Palette,
  Sparkles,
} from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { SettingsManager } from '../services/storageManager';
import { TutorialManager } from '../services/TutorialManager';
import { GameSettings, ThemeMode } from '../types/storage';
import { StudioModal } from './StudioModal';

export type SettingsTabId = 'sound' | 'theme' | 'display';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChanged?: (settings: GameSettings) => void;
  onResetTutorial?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsChanged,
  onResetTutorial,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('sound');
  const [settings, setSettings] = useState<GameSettings>(() => SettingsManager.getSettings());
  const [screenRes, setScreenRes] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  // Track window resize to display accurate resolution info
  useEffect(() => {
    const handleResize = () => {
      setScreenRes({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync internal state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSettings(SettingsManager.getSettings());
    }
  }, [isOpen]);

  // Handle Sound Effects Toggle
  const handleToggleSound = () => {
    const next = !settings.sound;
    const updated = SettingsManager.setSound(next);
    setSettings(updated);
    sound.applySettings(updated);
    if (next) sound.playClick();
    onSettingsChanged?.(updated);
  };

  // Handle Background Music Toggle
  const handleToggleMusic = () => {
    const next = !settings.music;
    const updated = SettingsManager.setMusic(next);
    setSettings(updated);
    sound.applySettings(updated);
    sound.playClick();
    onSettingsChanged?.(updated);
  };

  // Handle Volume Change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const updated = SettingsManager.setVolume(val);
    setSettings(updated);
    sound.applySettings(updated);
    onSettingsChanged?.(updated);
  };

  // Handle Quick Mute Toggle
  const handleToggleMute = () => {
    const nextMuted = !settings.isMuted;
    const updated = SettingsManager.setMuted(nextMuted);
    setSettings(updated);
    sound.applySettings(updated);
    sound.playClick();
    onSettingsChanged?.(updated);
  };

  // Handle Theme Mode Selection
  const handleSelectTheme = (mode: ThemeMode) => {
    sound.playSelect();
    const updated = SettingsManager.setThemeMode(mode);
    setSettings(updated);
    if (mode === 'light') {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
    }
    onSettingsChanged?.(updated);
  };

  // Handle Interface Scale Change
  const handleScaleChange = (scale: number) => {
    sound.playSelect();
    const clamped = Math.max(0.75, Math.min(1.4, Number(scale.toFixed(2))));
    const updated = SettingsManager.setUiScale(clamped);
    setSettings(updated);
    document.documentElement.style.setProperty('--ui-scale', String(clamped));
    onSettingsChanged?.(updated);
  };

  const volumePercent = Math.round((settings.volume ?? 0.4) * 100);
  const isMutedEffective = settings.isMuted || settings.volume === 0 || (!settings.sound && !settings.music);
  const currentTrack = sound.getCurrentTrack();
  const trackName =
    currentTrack === 'gameplay'
      ? 'Pixel Bounce'
      : currentTrack === 'menu_editor'
      ? 'Save State'
      : 'Остановлен';

  const uiScalePercent = Math.round((settings.uiScale ?? 1.0) * 100);

  // Resolution Category string
  const getResCategory = (w: number, h: number) => {
    if (w >= 3400) return '4K Ultra HD';
    if (w >= 2400) return '2K QHD';
    if (w >= 1800) return 'Full HD (1080p)';
    if (w <= 1366 || h <= 768) return 'Ноутбук / HD';
    return 'Стандартный';
  };

  return (
    <StudioModal
      isOpen={isOpen}
      onClose={onClose}
      title="НАСТРОЙКИ СИСТЕМЫ"
      subtitle="Звук, тема ретро-консоли и масштаб интерфейса"
      icon={<Settings className="w-5 h-5 text-amber-400" />}
      badge="SPW-OS"
      badgeColor="amber"
      maxWidth="lg"
    >
      {/* 3 Chunky Retro Tabs Switcher */}
      <div className="grid grid-cols-3 gap-2 pb-1 border-b-2 border-black/40">
        {/* Tab 1: Sound */}
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('sound');
          }}
          className={`retro-btn-sm py-2 px-2 flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'sound'
              ? 'bg-amber-400 text-slate-950 font-bold translate-y-[-1px]'
              : 'bg-[var(--card-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span className="truncate">ЗВУК</span>
        </button>

        {/* Tab 2: Theme */}
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('theme');
          }}
          className={`retro-btn-sm py-2 px-2 flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'theme'
              ? 'bg-amber-400 text-slate-950 font-bold translate-y-[-1px]'
              : 'bg-[var(--card-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span className="truncate">ТЕМА</span>
        </button>

        {/* Tab 3: Display */}
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('display');
          }}
          className={`retro-btn-sm py-2 px-2 flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'display'
              ? 'bg-amber-400 text-slate-950 font-bold translate-y-[-1px]'
              : 'bg-[var(--card-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="truncate">ЭКРАН</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SOUND SETTINGS                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'sound' && (
        <div className="space-y-3.5 animate-in fade-in duration-100">
          {/* Master Volume Slider Card */}
          <div className="retro-panel p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-2">
                {isMutedEffective ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : volumePercent < 40 ? (
                  <Volume1 className="w-4 h-4 text-amber-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                )}
                <span>ОБЩАЯ ГРОМКОСТЬ</span>
              </span>
              <span className="text-xs font-pixel font-bold text-amber-400 bg-black/40 px-2 py-0.5 rounded border border-black">
                {volumePercent}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.volume}
              onChange={handleVolumeChange}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />

            {/* Quick Mute Action Button */}
            <button
              onClick={handleToggleMute}
              className={`retro-btn-sm w-full py-2 flex items-center justify-center gap-2 transition-all ${
                isMutedEffective
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-[var(--card-subtle)] hover:bg-slate-700 text-[var(--text-main)]'
              }`}
            >
              {isMutedEffective ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>ВКЛЮЧИТЬ ЗВУК</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ЗАГЛУШИТЬ ЗВУК (MUTE)</span>
                </>
              )}
            </button>
          </div>

          {/* Sound FX Toggle */}
          <div className="retro-panel p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-md border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center ${
                  settings.sound
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold font-pixel text-[var(--text-main)]">
                  ЗВУКОВЫЕ ЭФФЕКТЫ
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Прыжки, сбор монет, разрушение блоков
                </div>
              </div>
            </div>

            <button
              onClick={handleToggleSound}
              className={`retro-btn-sm px-3 py-1.5 flex items-center gap-1.5 ${
                settings.sound
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {settings.sound && <Check className="w-3 h-3 stroke-[3]" />}
              <span>{settings.sound ? 'ВКЛ' : 'ВЫКЛ'}</span>
            </button>
          </div>

          {/* Background Music (BGM) Toggle */}
          <div className="retro-panel p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-md border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center ${
                  settings.music
                    ? 'bg-indigo-500 text-white font-bold'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                <Music className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold font-pixel text-[var(--text-main)]">
                  ФОНОВАЯ МУЗЫКА
                </div>
                <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
                  <span>Трек:</span>
                  <span className="font-pixel text-[9px] text-amber-400 font-bold">
                    {trackName}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleToggleMusic}
              className={`retro-btn-sm px-3 py-1.5 flex items-center gap-1.5 ${
                settings.music
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {settings.music && <Check className="w-3 h-3 stroke-[3]" />}
              <span>{settings.music ? 'ВКЛ' : 'ВЫКЛ'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: THEME SWITCHER (DARK / LIGHT RETRO CONSOLE)                        */}
      {/* ========================================================================= */}
      {activeTab === 'theme' && (
        <div className="space-y-3.5 animate-in fade-in duration-100">
          <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Выберите стиль отображения интерфейса и консоли:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Theme 1: Dark Mode */}
            <div
              onClick={() => handleSelectTheme('dark')}
              className={`retro-panel p-3.5 cursor-pointer transition-all relative ${
                settings.themeMode !== 'light'
                  ? 'border-amber-400 shadow-[4px_4px_0px_#f59e0b]'
                  : 'hover:border-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-slate-950 border border-slate-700 flex items-center justify-center text-amber-400">
                    <Moon className="w-4 h-4" />
                  </div>
                  <span className="font-pixel text-xs text-[var(--text-main)] font-bold">
                    ТЁМНАЯ ТЕМА
                  </span>
                </div>
                {settings.themeMode !== 'light' && (
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs">
                    ✓
                  </span>
                )}
              </div>

              {/* Theme mini color palette preview */}
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="w-5 h-5 rounded-sm bg-[#0b0f19] border border-black" title="Фон #0b0f19" />
                <div className="w-5 h-5 rounded-sm bg-[#131b2e] border border-black" title="Панель #131b2e" />
                <div className="w-5 h-5 rounded-sm bg-[#f59e0b] border border-black" title="Акцент #f59e0b" />
                <div className="w-5 h-5 rounded-sm bg-[#10b981] border border-black" title="Успех #10b981" />
              </div>

              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Классическая атмосфера ретро-аркады и 16-битной консоли с глубоким контрастом.
              </p>
            </div>

            {/* Theme 2: Light Mode */}
            <div
              onClick={() => handleSelectTheme('light')}
              className={`retro-panel p-3.5 cursor-pointer transition-all relative ${
                settings.themeMode === 'light'
                  ? 'border-amber-500 shadow-[4px_4px_0px_#d97706]'
                  : 'hover:border-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-600">
                    <Sun className="w-4 h-4" />
                  </div>
                  <span className="font-pixel text-xs text-[var(--text-main)] font-bold">
                    СВЕТЛАЯ ТЕМА
                  </span>
                </div>
                {settings.themeMode === 'light' && (
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs">
                    ✓
                  </span>
                )}
              </div>

              {/* Theme mini color palette preview */}
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="w-5 h-5 rounded-sm bg-[#e2e8f0] border border-black" title="Фон #e2e8f0" />
                <div className="w-5 h-5 rounded-sm bg-[#ffffff] border border-black" title="Панель #ffffff" />
                <div className="w-5 h-5 rounded-sm bg-[#d97706] border border-black" title="Акцент #d97706" />
                <div className="w-5 h-5 rounded-sm bg-[#059669] border border-black" title="Успех #059669" />
              </div>

              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Светлый дизайн в стиле карманных консолей Game Boy Pocket и классического Famicom.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DISPLAY & SCALING (RESPONSIVE RESOLUTION & UI SCALE)               */}
      {/* ========================================================================= */}
      {activeTab === 'display' && (
        <div className="space-y-3.5 animate-in fade-in duration-100">
          {/* Interface Scale Slider */}
          <div className="retro-panel p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-2">
                <Monitor className="w-4 h-4 text-sky-400" />
                <span>МАСШТАБ ИНТЕРФЕЙСА (UI SCALE)</span>
              </span>
              <span className="text-xs font-pixel font-bold text-amber-400 bg-black/40 px-2 py-0.5 rounded border border-black">
                {uiScalePercent}%
              </span>
            </div>

            <input
              type="range"
              min="0.8"
              max="1.3"
              step="0.05"
              value={settings.uiScale ?? 1.0}
              onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />

            {/* Scale Presets (80%, 100%, 120%) */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => handleScaleChange(0.85)}
                className={`retro-btn-sm flex-1 py-1.5 text-[9px] ${
                  uiScalePercent <= 88
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-[var(--card-subtle)] text-[var(--text-main)]'
                }`}
              >
                НОУТБУК (85%)
              </button>
              <button
                onClick={() => handleScaleChange(1.0)}
                className={`retro-btn-sm flex-1 py-1.5 text-[9px] ${
                  uiScalePercent >= 95 && uiScalePercent <= 105
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-[var(--card-subtle)] text-[var(--text-main)]'
                }`}
              >
                СТАНДАРТ (100%)
              </button>
              <button
                onClick={() => handleScaleChange(1.2)}
                className={`retro-btn-sm flex-1 py-1.5 text-[9px] ${
                  uiScalePercent >= 115
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-[var(--card-subtle)] text-[var(--text-main)]'
                }`}
              >
                БОЛЬШОЙ / 4K (120%)
              </button>
            </div>
          </div>

          {/* Current Display & Resolution Status */}
          <div className="retro-panel p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-[var(--card-subtle)] border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center text-cyan-400 font-bold">
                HD
              </div>
              <div>
                <div className="font-bold text-[var(--text-main)]">
                  {screenRes.width} × {screenRes.height}
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Режим экрана: {getResCategory(screenRes.width, screenRes.height)}
                </div>
              </div>
            </div>

            {onToggleFullscreen && (
              <button
                onClick={() => {
                  sound.playClick();
                  onToggleFullscreen();
                }}
                className="retro-btn-sm px-3 py-1.5 flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{isFullscreen ? 'В ОКНЕ' : 'ВО ВЕСЬ ЭКРАН'}</span>
              </button>
            )}
          </div>

          {/* Interactive Guided Tour Reset */}
          <div className="retro-panel p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-amber-500/20 border-2 border-black shadow-[2px_2px_0px_#000] text-amber-400 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--text-main)] font-pixel">
                  ОБУЧЕНИЕ ГЕЙМДИЗАЙНУ
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Пройти интерактивный тур по созданию уровней заново
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                TutorialManager.resetGuidedTour();
                sound.playClick();
                onResetTutorial?.();
                onClose();
              }}
              className="retro-btn-sm px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center gap-1.5 shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ЗАНОВО</span>
            </button>
          </div>
        </div>
      )}
    </StudioModal>
  );
};
