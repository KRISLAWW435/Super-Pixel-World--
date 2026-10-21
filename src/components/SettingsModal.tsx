/**
 * Super Pixel World - Interactive Retro Settings Modal
 *
 * Implements 4 focused tabs:
 * 1. Sound: Volume slider, Quick Mute, Sound FX toggle, BGM toggle
 * 2. Theme: Dark (Retro Arcade) vs Light (Classic Famicom)
 * 3. Screen: Fullscreen toggle, Resolution detection, Tutorial reset
 * 4. Controls: Authentic Console Gamepad (D-Pad Top-Left, Stick Bottom-Left, Face Buttons Top-Right) & 3D Mechanical Gaming Keyboard
 */

import React, { useEffect, useState, useRef } from 'react';
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
  Gamepad2,
  Keyboard,
  Info,
} from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { SettingsManager } from '../services/storageManager';
import { TutorialManager } from '../services/TutorialManager';
import { GameSettings, ThemeMode } from '../types/storage';
import { StudioModal } from './StudioModal';

export type SettingsTabId = 'sound' | 'theme' | 'display' | 'controls';
export type ControlDevice = 'keyboard' | 'gamepad';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChanged?: (settings: GameSettings) => void;
  onResetTutorial?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  initialTab?: SettingsTabId;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsChanged,
  onResetTutorial,
  isFullscreen = false,
  onToggleFullscreen,
  initialTab = 'sound',
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialTab);
  const [controlDevice, setControlDevice] = useState<ControlDevice>('keyboard');
  const [settings, setSettings] = useState<GameSettings>(() => SettingsManager.getSettings());

  // Screen resolution state
  const [screenRes, setScreenRes] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  // Real-time keyboard state (active ONLY when modal is open and on keyboard controls tab)
  const [pressedKeys, setPressedKeys] = useState<Record<string, boolean>>({});

  // Real-time gamepad state (active ONLY when modal is open and on gamepad controls tab)
  const [gamepadState, setGamepadState] = useState<{
    isConnected: boolean;
    name: string;
    stickX: number;
    stickY: number;
    dpadLeft: boolean;
    dpadRight: boolean;
    btnA: boolean;
  }>({
    isConnected: false,
    name: '',
    stickX: 0,
    stickY: 0,
    dpadLeft: false,
    dpadRight: false,
    btnA: false,
  });

  // Track window resize for display resolution info
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
      setPressedKeys({});
    }
  }, [isOpen]);

  // ---------------------------------------------------------------------------
  // INTERACTIVE KEYBOARD EVENT LISTENERS (Performance guarded: active only in modal)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen || activeTab !== 'controls' || controlDevice !== 'keyboard') {
      setPressedKeys({});
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid scrolling on space/arrows inside controls tester
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      setPressedKeys((prev) => {
        if (prev[e.code]) return prev;
        return { ...prev, [e.code]: true };
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setPressedKeys((prev) => {
        if (!prev[e.code]) return prev;
        const copy = { ...prev };
        delete copy[e.code];
        return copy;
      });
    };

    const handleBlur = () => {
      setPressedKeys({});
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isOpen, activeTab, controlDevice]);

  // ---------------------------------------------------------------------------
  // INTERACTIVE GAMEPAD POLLING (Performance guarded: runs only when tab is active)
  // ---------------------------------------------------------------------------
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen || activeTab !== 'controls' || controlDevice !== 'gamepad') {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    const pollGamepad = () => {
      if (typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function') {
        const gamepads = navigator.getGamepads();
        let found = false;

        for (let i = 0; i < gamepads.length; i++) {
          const gp = gamepads[i];
          if (!gp || !gp.connected) continue;

          found = true;
          const cleanName = gp.id ? gp.id.replace(/\([^)]*\)/g, '').trim() || 'USB / BT Gamepad' : 'Gamepad';
          const axisX = gp.axes[0] ?? 0;
          const axisY = gp.axes[1] ?? 0;

          // Deadzone calculation (0.15)
          const stickX = Math.abs(axisX) > 0.15 ? axisX : 0;
          const stickY = Math.abs(axisY) > 0.15 ? axisY : 0;

          const dpadLeft = !!(gp.buttons[14]?.pressed || stickX < -0.3);
          const dpadRight = !!(gp.buttons[15]?.pressed || stickX > 0.3);
          const btnA = !!gp.buttons[0]?.pressed;

          setGamepadState({
            isConnected: true,
            name: cleanName,
            stickX,
            stickY,
            dpadLeft,
            dpadRight,
            btnA,
          });
          break;
        }

        if (!found) {
          setGamepadState((prev) =>
            prev.isConnected
              ? {
                  isConnected: false,
                  name: '',
                  stickX: 0,
                  stickY: 0,
                  dpadLeft: false,
                  dpadRight: false,
                  btnA: false,
                }
              : prev
          );
        }
      }

      animFrameRef.current = requestAnimationFrame(pollGamepad);
    };

    animFrameRef.current = requestAnimationFrame(pollGamepad);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isOpen, activeTab, controlDevice]);

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

  const volumePercent = Math.round((settings.volume ?? 0.4) * 100);
  const isMutedEffective = settings.isMuted || settings.volume === 0 || (!settings.sound && !settings.music);
  const currentTrack = sound.getCurrentTrack();
  const trackName =
    currentTrack === 'gameplay'
      ? 'Pixel Bounce'
      : currentTrack === 'menu_editor'
      ? 'Save State'
      : 'Остановлен';

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
      subtitle="Звук, тема ретро-консоли, экран и интерактивное управление"
      icon={<Settings className="w-5 h-5 text-amber-400" />}
      maxWidth="lg"
    >
      {/* 4 Chunky Retro Tabs Switcher */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pb-1 border-b-2 border-black/40">
        {/* Tab 1: Sound */}
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('sound');
          }}
          className={`retro-btn-sm py-2 px-1 sm:px-2 flex items-center justify-center gap-1 sm:gap-1.5 transition-all text-xs ${
            activeTab === 'sound'
              ? 'bg-amber-400 text-slate-950 font-bold translate-y-[-1px]'
              : 'bg-[var(--card-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">ЗВУК</span>
        </button>

        {/* Tab 2: Theme */}
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('theme');
          }}
          className={`retro-btn-sm py-2 px-1 sm:px-2 flex items-center justify-center gap-1 sm:gap-1.5 transition-all text-xs ${
            activeTab === 'theme'
              ? 'bg-amber-400 text-slate-950 font-bold translate-y-[-1px]'
              : 'bg-[var(--card-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Palette className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">ТЕМА</span>
        </button>

        {/* Tab 3: Screen / Display */}
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('display');
          }}
          className={`retro-btn-sm py-2 px-1 sm:px-2 flex items-center justify-center gap-1 sm:gap-1.5 transition-all text-xs ${
            activeTab === 'display'
              ? 'bg-amber-400 text-slate-950 font-bold translate-y-[-1px]'
              : 'bg-[var(--card-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Monitor className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">ЭКРАН</span>
        </button>

        {/* Tab 4: Controls */}
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('controls');
          }}
          className={`retro-btn-sm py-2 px-1 sm:px-2 flex items-center justify-center gap-1 sm:gap-1.5 transition-all text-xs ${
            activeTab === 'controls'
              ? 'bg-amber-400 text-slate-950 font-bold translate-y-[-1px]'
              : 'bg-[var(--card-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">УПРАВЛЕНИЕ</span>
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
                    : 'bg-[var(--card-subtle)] text-[var(--text-muted)]'
                }`}
              >
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold font-pixel text-[var(--text-main)]">
                  ЗВУКОВЫЕ ЭФФЕКТЫ
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Прыжки, сбор монет, удары по блокам
                </div>
              </div>
            </div>

            <button
              onClick={handleToggleSound}
              className={`retro-btn-sm px-3.5 py-1.5 flex items-center gap-1.5 ${
                settings.sound
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold'
                  : 'bg-[var(--card-subtle)] text-[var(--text-muted)] border border-[var(--border-color)]'
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
                    : 'bg-[var(--card-subtle)] text-[var(--text-muted)]'
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
              className={`retro-btn-sm px-3.5 py-1.5 flex items-center gap-1.5 ${
                settings.music
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold'
                  : 'bg-[var(--card-subtle)] text-[var(--text-muted)] border border-[var(--border-color)]'
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
          <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 font-body">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Выберите стиль ретро-консоли:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Theme 1: Dark Mode */}
            <div
              onClick={() => handleSelectTheme('dark')}
              className={`retro-panel p-4 cursor-pointer transition-all rounded-[4px] border-4 flex items-center justify-between ${
                settings.themeMode !== 'light'
                  ? 'border-[var(--accent-amber)] shadow-[4px_4px_0px_var(--shadow-color)] bg-[var(--card-subtle)]'
                  : 'border-[var(--border-color)] bg-[var(--card-bg)] hover:border-[var(--accent-amber)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[4px] bg-[var(--slot-bg)] border-2 border-[var(--border-color)] flex items-center justify-center text-[var(--accent-amber)]">
                  <Moon className="w-4 h-4" />
                </div>
                <span className="font-pixel text-xs text-[var(--text-main)] font-bold tracking-wider">
                  ТЁМНАЯ ТЕМА
                </span>
              </div>
              {settings.themeMode !== 'light' && (
                <div className="w-6 h-6 rounded-[2px] bg-[var(--accent-amber)] text-slate-950 flex items-center justify-center font-bold text-xs border border-[var(--border-color)] shadow-xs">
                  ✓
                </div>
              )}
            </div>

            {/* Theme 2: Light Mode */}
            <div
              onClick={() => handleSelectTheme('light')}
              className={`retro-panel p-4 cursor-pointer transition-all rounded-[4px] border-4 flex items-center justify-between ${
                settings.themeMode === 'light'
                  ? 'border-[var(--accent-amber)] shadow-[4px_4px_0px_var(--shadow-color)] bg-[var(--card-subtle)]'
                  : 'border-[var(--border-color)] bg-[var(--card-bg)] hover:border-[var(--accent-amber)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[4px] bg-[var(--slot-bg)] border-2 border-[var(--border-color)] flex items-center justify-center text-[var(--accent-amber)]">
                  <Sun className="w-4 h-4" />
                </div>
                <span className="font-pixel text-xs text-[var(--text-main)] font-bold tracking-wider">
                  СВЕТЛАЯ ТЕМА
                </span>
              </div>
              {settings.themeMode === 'light' && (
                <div className="w-6 h-6 rounded-[2px] bg-[var(--accent-amber)] text-slate-950 flex items-center justify-center font-bold text-xs border border-[var(--border-color)] shadow-xs">
                  ✓
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SCREEN & FULLSCREEN                                                */}
      {/* ========================================================================= */}
      {activeTab === 'display' && (
        <div className="space-y-3.5 animate-in fade-in duration-100">
          {/* Prominent Fullscreen Toggle Card */}
          <div className="retro-panel p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-md border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center ${
                  isFullscreen
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-[var(--card-subtle)] text-[var(--text-muted)]'
                }`}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-xs font-bold font-pixel text-[var(--text-main)]">
                  ПОЛНОЭКРАННЫЙ РЕЖИМ
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {isFullscreen ? 'Игра открыта во весь экран' : 'Оконный режим отображения'}
                </div>
              </div>
            </div>

            {onToggleFullscreen && (
              <button
                onClick={() => {
                  sound.playClick();
                  onToggleFullscreen();
                }}
                className={`retro-btn-sm px-4 py-2 flex items-center gap-2 ${
                  isFullscreen
                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold'
                }`}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{isFullscreen ? 'В ОКНЕ' : 'ВО ВЕСЬ ЭКРАН'}</span>
              </button>
            )}
          </div>

          {/* Current Display & Resolution Status */}
          <div className="retro-panel p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-[var(--card-subtle)] border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center text-cyan-400 font-bold font-pixel text-[10px]">
                HD
              </div>
              <div>
                <div className="font-bold text-[var(--text-main)]">
                  {screenRes.width} × {screenRes.height}
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Разрешение экрана: {getResCategory(screenRes.width, screenRes.height)}
                </div>
              </div>
            </div>
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
              className="retro-btn-sm px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center gap-1.5 shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ЗАНОВО</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CONTROLS & INTERACTIVE DEVICE TESTER                               */}
      {/* ========================================================================= */}
      {activeTab === 'controls' && (
        <div className="space-y-3.5 animate-in fade-in duration-100">
          {/* Top Segmented Device Selector (Requirement 1: Clean Layout Toggle) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-lg border-2 border-black">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setControlDevice('keyboard');
              }}
              className={`py-2 px-3 rounded text-xs font-pixel font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                controlDevice === 'keyboard'
                  ? 'bg-amber-400 text-slate-950 shadow-[2px_2px_0px_#000] translate-y-[-1px]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Keyboard className="w-4 h-4 shrink-0" />
              <span>КЛАВИАТУРА (ПК)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setControlDevice('gamepad');
              }}
              className={`py-2 px-3 rounded text-xs font-pixel font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                controlDevice === 'gamepad'
                  ? 'bg-amber-400 text-slate-950 shadow-[2px_2px_0px_#000] translate-y-[-1px]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Gamepad2 className="w-4 h-4 shrink-0" />
              <span>ГЕЙМПАД (ДЖОЙСТИК)</span>
            </button>
          </div>

          {/* Child-Friendly Text Instruction Banner */}
          <div className="px-3 py-2 rounded-lg bg-amber-400/10 border border-amber-400/40 text-amber-300 flex items-center gap-2 text-xs font-bold">
            <Info className="w-4 h-4 shrink-0 text-amber-400 animate-pulse" />
            <span>Нажми кнопку на устройстве, чтобы проверить, как она работает</span>
          </div>

          {/* =================================================================== */}
          {/* VIEW A: INTERACTIVE 3D MECHANICAL KEYBOARD VIEW                     */}
          {/* =================================================================== */}
          {controlDevice === 'keyboard' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Section 1: Horizontal Movement Keys (Влево / Вправо) */}
              <div className="retro-panel p-4 space-y-3 border-2 border-black bg-gradient-to-b from-[#162032] to-[#0c1322]">
                <div className="flex items-center justify-between border-b border-black/30 pb-2">
                  <div className="font-pixel text-xs text-amber-400 font-bold flex items-center gap-1.5 uppercase">
                    <span>🏃</span> ДВИЖЕНИЕ
                  </div>
                  <div className="text-[11px] text-slate-400">Нажимай A / D или стрелки</div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Left Keycap Cluster */}
                  <div className="p-3 rounded-xl bg-black/40 border-2 border-black flex flex-col items-center gap-2">
                    <span className="font-pixel text-xs text-amber-300 font-bold uppercase tracking-wider">
                      Влево
                    </span>
                    <div className="flex items-center gap-2">
                      {/* Key A */}
                      <div
                        className={`w-12 h-12 rounded-lg border-2 border-black font-pixel text-sm font-black flex items-center justify-center transition-all select-none ${
                          pressedKeys['KeyA']
                            ? 'translate-y-1 bg-amber-400 text-slate-950 border-b-2 shadow-[0_0_12px_#fbbf24]'
                            : 'bg-gradient-to-b from-slate-700 to-slate-800 text-amber-300 border-b-5 border-b-slate-950 shadow-[0_4px_0_#000]'
                        }`}
                      >
                        A
                      </div>
                      <span className="text-xs text-slate-500 font-bold">/</span>
                      {/* Key Left Arrow */}
                      <div
                        className={`w-12 h-12 rounded-lg border-2 border-black font-pixel text-sm font-black flex items-center justify-center transition-all select-none ${
                          pressedKeys['ArrowLeft']
                            ? 'translate-y-1 bg-amber-400 text-slate-950 border-b-2 shadow-[0_0_12px_#fbbf24]'
                            : 'bg-gradient-to-b from-slate-700 to-slate-800 text-amber-300 border-b-5 border-b-slate-950 shadow-[0_4px_0_#000]'
                        }`}
                      >
                        ⬅
                      </div>
                    </div>
                  </div>

                  {/* Right Keycap Cluster */}
                  <div className="p-3 rounded-xl bg-black/40 border-2 border-black flex flex-col items-center gap-2">
                    <span className="font-pixel text-xs text-amber-300 font-bold uppercase tracking-wider">
                      Вправо
                    </span>
                    <div className="flex items-center gap-2">
                      {/* Key D */}
                      <div
                        className={`w-12 h-12 rounded-lg border-2 border-black font-pixel text-sm font-black flex items-center justify-center transition-all select-none ${
                          pressedKeys['KeyD']
                            ? 'translate-y-1 bg-amber-400 text-slate-950 border-b-2 shadow-[0_0_12px_#fbbf24]'
                            : 'bg-gradient-to-b from-slate-700 to-slate-800 text-amber-300 border-b-5 border-b-slate-950 shadow-[0_4px_0_#000]'
                        }`}
                      >
                        D
                      </div>
                      <span className="text-xs text-slate-500 font-bold">/</span>
                      {/* Key Right Arrow */}
                      <div
                        className={`w-12 h-12 rounded-lg border-2 border-black font-pixel text-sm font-black flex items-center justify-center transition-all select-none ${
                          pressedKeys['ArrowRight']
                            ? 'translate-y-1 bg-amber-400 text-slate-950 border-b-2 shadow-[0_0_12px_#fbbf24]'
                            : 'bg-gradient-to-b from-slate-700 to-slate-800 text-amber-300 border-b-5 border-b-slate-950 shadow-[0_4px_0_#000]'
                        }`}
                      >
                        ➡
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Jump Key (Прыжок - удерживай для высоты) */}
              <div className="retro-panel p-4 space-y-3 border-2 border-black bg-gradient-to-b from-[#162032] to-[#0c1322]">
                <div className="flex items-center justify-between border-b border-black/30 pb-2">
                  <div className="font-pixel text-xs text-emerald-400 font-bold flex items-center gap-1.5 uppercase">
                    <span>⬆️</span> ПРЫЖОК
                  </div>
                  <div className="text-[11px] text-emerald-300 font-semibold">
                    Прыжок (удерживай для высоты)
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                  {/* Chunky Mechanical Spacebar */}
                  <div
                    className={`flex-1 w-full h-14 rounded-xl border-2 border-black font-pixel text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-default select-none ${
                      pressedKeys['Space']
                        ? 'translate-y-1 bg-emerald-400 text-slate-950 border-b-2 shadow-[0_0_16px_#10b981]'
                        : 'bg-gradient-to-b from-emerald-900 to-emerald-950 text-emerald-200 border-b-6 border-b-black shadow-[0_4px_0_#000]'
                    }`}
                  >
                    <span>ПРОБЕЛ (SPACEBAR)</span>
                    {pressedKeys['Space'] && <span className="animate-ping text-sm">✨</span>}
                  </div>

                  <span className="text-xs text-slate-500 font-bold px-0.5">ИЛИ</span>

                  {/* Mechanical W and Up Arrow keys */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-12 h-14 rounded-lg border-2 border-black font-pixel text-sm font-black flex items-center justify-center transition-all select-none ${
                        pressedKeys['KeyW']
                          ? 'translate-y-1 bg-emerald-400 text-slate-950 border-b-2 shadow-[0_0_12px_#10b981]'
                          : 'bg-gradient-to-b from-slate-700 to-slate-800 text-emerald-300 border-b-6 border-b-slate-950 shadow-[0_4px_0_#000]'
                      }`}
                    >
                      W
                    </div>
                    <div
                      className={`w-12 h-14 rounded-lg border-2 border-black font-pixel text-sm font-black flex items-center justify-center transition-all select-none ${
                        pressedKeys['ArrowUp']
                          ? 'translate-y-1 bg-emerald-400 text-slate-950 border-b-2 shadow-[0_0_12px_#10b981]'
                          : 'bg-gradient-to-b from-slate-700 to-slate-800 text-emerald-300 border-b-6 border-b-slate-950 shadow-[0_4px_0_#000]'
                      }`}
                    >
                      ⬆
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* VIEW B: REFINED AUTHENTIC CONSOLE GAMEPAD VIEW                      */}
          {/* Top-Left: D-Pad | Bottom-Left: Left Stick (Movement)               */}
          {/* Top-Right: Face Buttons (A Jump) | Bottom-Right: Right Stick        */}
          {/* =================================================================== */}
          {controlDevice === 'gamepad' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* Gamepad Status Indicator */}
              <div
                className={`p-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] flex items-center justify-between ${
                  gamepadState.isConnected
                    ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-200'
                    : 'bg-slate-900/80 border-slate-700/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg border-2 border-black flex items-center justify-center text-lg shrink-0 ${
                      gamepadState.isConnected
                        ? 'bg-emerald-500 text-slate-950 shadow-[2px_2px_0px_#000]'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {gamepadState.isConnected ? '🎮' : '🔌'}
                  </div>
                  <div>
                    <div className="text-[10px] font-pixel text-[var(--text-muted)] uppercase tracking-wider">
                      СТАТУС КОНТРОЛЛЕРА
                    </div>
                    <div className="text-xs sm:text-sm font-bold font-pixel text-[var(--text-main)] flex items-center gap-2 mt-0.5">
                      {gamepadState.isConnected ? (
                        <>
                          <span className="text-emerald-400">🎮 Геймпад подключен:</span>
                          <span className="text-white truncate max-w-[200px] sm:max-w-[280px]">
                            {gamepadState.name}
                          </span>
                        </>
                      ) : (
                        <span className="text-amber-400">Геймпад не найден</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <span
                    className={`px-2.5 py-1 rounded text-[10px] font-pixel font-bold border-2 border-black shadow-[2px_2px_0px_#000] ${
                      gamepadState.isConnected
                        ? 'bg-emerald-400 text-slate-950 animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {gamepadState.isConnected ? 'АКТИВЕН' : 'ОЖИДАНИЕ'}
                  </span>
                </div>
              </div>

              {!gamepadState.isConnected && (
                <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 text-xs text-slate-400 leading-relaxed">
                  💬 <span className="text-slate-200 font-bold">Подсказка:</span> Подключи джойстик по USB или Bluetooth и <span className="text-amber-300 font-bold">нажми любую кнопку на геймпаде</span>.
                </div>
              )}

              {/* Large, Non-Clipping Authentic Gamepad Diagram */}
              <div className="retro-panel p-3 border-2 border-black bg-gradient-to-b from-[#111827] to-[#080d1a] flex flex-col items-center">
                <svg
                  viewBox="0 0 600 360"
                  className="w-full max-w-[520px] h-auto select-none drop-shadow-2xl overflow-visible"
                >
                  <defs>
                    {/* Controller Body Gradient */}
                    <linearGradient id="gpBody" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#253248" />
                      <stop offset="45%" stopColor="#141d2e" />
                      <stop offset="100%" stopColor="#070b14" />
                    </linearGradient>

                    {/* Rubberized Stick Gradient */}
                    <radialGradient id="stickGrip" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#475569" />
                      <stop offset="70%" stopColor="#1e293b" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </radialGradient>

                    {/* Glowing Filters */}
                    <filter id="emeraldGlow" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <filter id="amberGlow" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Left & Right Top Shoulder Bumpers (L1/R1) */}
                  <path
                    d="M 130 52 C 135 28, 190 28, 220 44 L 215 54 L 135 54 Z"
                    fill="#334155"
                    stroke="#000000"
                    strokeWidth="3"
                  />
                  <path
                    d="M 470 52 C 465 28, 410 28, 380 44 L 385 54 L 465 54 Z"
                    fill="#334155"
                    stroke="#000000"
                    strokeWidth="3"
                  />

                  {/* Controller Main Body (Spacious ergonomic contours, no clipping) */}
                  <path
                    d="M 220 50 C 160 50, 110 60, 70 90 C 35 125, 25 185, 35 240 C 45 285, 80 325, 125 335 C 165 345, 195 300, 225 265 C 245 240, 275 235, 300 235 C 325 235, 355 240, 375 265 C 405 300, 435 345, 475 335 C 520 325, 555 285, 565 240 C 575 185, 565 125, 530 90 C 490 60, 440 50, 380 50 Z"
                    fill="url(#gpBody)"
                    stroke="#000000"
                    strokeWidth="4"
                  />

                  {/* Inner Grip Ergonomic Inset Lines */}
                  <path
                    d="M 65 170 C 50 215, 68 275, 105 295 C 122 305, 142 270, 158 230"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 535 170 C 550 215, 532 275, 495 295 C 478 305, 458 270, 442 230"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Center Small Select & Start Buttons (Pill shaped, clean) */}
                  <rect x="260" y="115" width="16" height="8" rx="4" fill="#1e293b" stroke="#000000" strokeWidth="1.5" />
                  <rect x="324" y="115" width="16" height="8" rx="4" fill="#1e293b" stroke="#000000" strokeWidth="1.5" />

                  {/* Center Power/Status LED dot */}
                  <circle cx="300" cy="95" r="9" fill="#0b0f19" stroke="#000000" strokeWidth="2" />
                  <circle
                    cx="300"
                    cy="95"
                    r="4.5"
                    fill={gamepadState.isConnected ? '#10b981' : '#64748b'}
                    filter={gamepadState.isConnected ? 'url(#emeraldGlow)' : undefined}
                  />

                  {/* ========================================================= */}
                  {/* TOP-LEFT: D-PAD (Directional Arrows Cross)                */}
                  {/* ========================================================= */}
                  <g transform="translate(170, 115)">
                    {/* D-Pad Circular Socket Inset */}
                    <circle cx="0" cy="0" r="42" fill="#0b0f19" stroke="#000000" strokeWidth="2" />

                    {/* D-Pad Cross Body */}
                    <path
                      d="M -12 -34 L 12 -34 L 12 -12 L 34 -12 L 34 12 L 12 12 L 12 34 L -12 34 L -12 12 L -34 12 L -34 -12 L -12 -12 Z"
                      fill="#141d2e"
                      stroke="#000000"
                      strokeWidth="2.5"
                    />

                    {/* Up Wing (Dimmed) */}
                    <rect x="-10" y="-32" width="20" height="20" rx="3" fill="#1e293b" />
                    <text x="0" y="-18" textAnchor="middle" fill="#64748b" fontSize="9">▲</text>

                    {/* Down Wing (Dimmed) */}
                    <rect x="-10" y="12" width="20" height="20" rx="3" fill="#1e293b" />
                    <text x="0" y="26" textAnchor="middle" fill="#64748b" fontSize="9">▼</text>

                    {/* Left Wing (ACTIVE HIGHLIGHT) */}
                    <rect
                      x="-32"
                      y="-10"
                      width="20"
                      height="20"
                      rx="3"
                      fill={gamepadState.dpadLeft ? '#f59e0b' : '#1e293b'}
                      stroke={gamepadState.dpadLeft ? '#000000' : 'none'}
                      strokeWidth="1.5"
                      filter={gamepadState.dpadLeft ? 'url(#amberGlow)' : undefined}
                    />
                    <text
                      x="-22"
                      y="4"
                      textAnchor="middle"
                      fill={gamepadState.dpadLeft ? '#020617' : '#38bdf8'}
                      fontSize="12"
                      fontWeight="bold"
                    >
                      ◀
                    </text>

                    {/* Right Wing (ACTIVE HIGHLIGHT) */}
                    <rect
                      x="12"
                      y="-10"
                      width="20"
                      height="20"
                      rx="3"
                      fill={gamepadState.dpadRight ? '#f59e0b' : '#1e293b'}
                      stroke={gamepadState.dpadRight ? '#000000' : 'none'}
                      strokeWidth="1.5"
                      filter={gamepadState.dpadRight ? 'url(#amberGlow)' : undefined}
                    />
                    <text
                      x="22"
                      y="4"
                      textAnchor="middle"
                      fill={gamepadState.dpadRight ? '#020617' : '#38bdf8'}
                      fontSize="12"
                      fontWeight="bold"
                    >
                      ▶
                    </text>

                    {/* Center Indent */}
                    <circle cx="0" cy="0" r="5" fill="#0b0f19" />
                  </g>

                  {/* ========================================================= */}
                  {/* BOTTOM-LEFT: LEFT ANALOG STICK (Movement Rolik / Wheel)   */}
                  {/* ========================================================= */}
                  <g transform="translate(210, 215)">
                    {/* Analog Well / Socket */}
                    <circle cx="0" cy="0" r="38" fill="#0b0f19" stroke="#000000" strokeWidth="2.5" />
                    <circle cx="0" cy="0" r="30" fill="#151f30" />

                    {/* Dynamic Moving Thumb Stick Cap */}
                    <g
                      transform={`translate(${gamepadState.stickX * 10}, ${gamepadState.stickY * 10})`}
                    >
                      {/* Stick Head */}
                      <circle
                        cx="0"
                        cy="0"
                        r="25"
                        fill="url(#stickGrip)"
                        stroke={
                          Math.abs(gamepadState.stickX) > 0.15 || Math.abs(gamepadState.stickY) > 0.15
                            ? '#f59e0b'
                            : '#000000'
                        }
                        strokeWidth="2.5"
                        filter={
                          Math.abs(gamepadState.stickX) > 0.15 || Math.abs(gamepadState.stickY) > 0.15
                            ? 'url(#amberGlow)'
                            : undefined
                        }
                      />
                      {/* Textured Rubber Grip Rings (Rolik Wheel Effect) */}
                      <circle cx="0" cy="0" r="18" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
                      <circle cx="0" cy="0" r="12" fill="#141d2e" stroke="#000000" strokeWidth="1.5" />
                      <text
                        x="0"
                        y="4"
                        textAnchor="middle"
                        fill={
                          Math.abs(gamepadState.stickX) > 0.15 || Math.abs(gamepadState.stickY) > 0.15
                            ? '#f59e0b'
                            : '#64748b'
                        }
                        fontSize="10"
                        fontWeight="bold"
                      >
                        🕹️
                      </text>
                    </g>
                  </g>

                  {/* ========================================================= */}
                  {/* TOP-RIGHT: ACTION FACE BUTTONS (A, B, X, Y Diamond)       */}
                  {/* ========================================================= */}
                  <g transform="translate(430, 115)">
                    {/* Button Cluster Socket */}
                    <circle cx="0" cy="0" r="44" fill="#0b0f19" stroke="#000000" strokeWidth="2" />

                    {/* Top Button: Y (Dimmed) */}
                    <circle cx="0" cy="-26" r="12" fill="#1e293b" stroke="#000000" strokeWidth="1.5" opacity="0.4" />
                    <text x="0" y="-22" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">Y</text>

                    {/* Left Button: X (Dimmed) */}
                    <circle cx="-26" cy="0" r="12" fill="#1e293b" stroke="#000000" strokeWidth="1.5" opacity="0.4" />
                    <text x="-26" y="4" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">X</text>

                    {/* Right Button: B (Dimmed) */}
                    <circle cx="26" cy="0" r="12" fill="#1e293b" stroke="#000000" strokeWidth="1.5" opacity="0.4" />
                    <text x="26" y="4" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">B</text>

                    {/* Bottom Button: A (PROMINENT JUMP BUTTON!) */}
                    <g
                      transform={gamepadState.btnA ? 'translate(0, 27) scale(0.92)' : 'translate(0, 26)'}
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r="16"
                        fill={gamepadState.btnA ? '#34d399' : '#10b981'}
                        stroke="#000000"
                        strokeWidth="2.5"
                        filter={gamepadState.btnA ? 'url(#emeraldGlow)' : undefined}
                      />
                      <text
                        x="0"
                        y="5"
                        textAnchor="middle"
                        fill={gamepadState.btnA ? '#020617' : '#ffffff'}
                        fontFamily="'Press Start 2P', monospace"
                        fontSize="12"
                        fontWeight="black"
                      >
                        A
                      </text>
                    </g>
                  </g>

                  {/* ========================================================= */}
                  {/* BOTTOM-RIGHT: RIGHT ANALOG STICK (Static for Symmetry)    */}
                  {/* ========================================================= */}
                  <g transform="translate(390, 215)" opacity="0.55">
                    {/* Socket */}
                    <circle cx="0" cy="0" r="38" fill="#0b0f19" stroke="#000000" strokeWidth="2" />
                    <circle cx="0" cy="0" r="30" fill="#151f30" />
                    {/* Static Stick Head */}
                    <circle cx="0" cy="0" r="25" fill="url(#stickGrip)" stroke="#000000" strokeWidth="2" />
                    <circle cx="0" cy="0" r="18" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx="0" cy="0" r="12" fill="#141d2e" stroke="#000000" strokeWidth="1.5" />
                  </g>
                </svg>

                {/* Clear, Streamlined Action Cards Under the Controller */}
                <div className="w-full grid grid-cols-2 gap-3 mt-2">
                  {/* Left Control Card: Влево / Вправо */}
                  <div className="p-2.5 rounded-xl bg-black/40 border-2 border-black flex flex-col items-center gap-1.5">
                    <div className="text-[10px] font-pixel text-amber-400 font-bold uppercase">
                      ДВИЖЕНИЕ (СТИК / D-PAD)
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-md text-[11px] font-pixel font-bold border-2 border-black transition-all ${
                          gamepadState.dpadLeft
                            ? 'bg-amber-400 text-slate-950 scale-105 shadow-none'
                            : 'bg-slate-800 text-slate-300 shadow-[2px_2px_0px_#000]'
                        }`}
                      >
                        Влево
                      </span>
                      <span
                        className={`px-3 py-1 rounded-md text-[11px] font-pixel font-bold border-2 border-black transition-all ${
                          gamepadState.dpadRight
                            ? 'bg-amber-400 text-slate-950 scale-105 shadow-none'
                            : 'bg-slate-800 text-slate-300 shadow-[2px_2px_0px_#000]'
                        }`}
                      >
                        Вправо
                      </span>
                    </div>
                  </div>

                  {/* Right Control Card: Прыжок (удерживай для высоты) */}
                  <div className="p-2.5 rounded-xl bg-black/40 border-2 border-black flex flex-col items-center gap-1.5">
                    <div className="text-[10px] font-pixel text-emerald-400 font-bold uppercase">
                      ПРЫЖОК (КНОПКА A)
                    </div>
                    <span
                      className={`px-4 py-1 rounded-md text-[11px] font-pixel font-bold border-2 border-black transition-all ${
                        gamepadState.btnA
                          ? 'bg-emerald-400 text-slate-950 scale-105 shadow-none ring-2 ring-emerald-300'
                          : 'bg-emerald-900/60 text-emerald-300 shadow-[2px_2px_0px_#000]'
                      }`}
                    >
                      Прыжок (удерживай для высоты)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </StudioModal>
  );
};
