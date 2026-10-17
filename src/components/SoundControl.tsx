/**
 * Super Pixel World - Global Sound Control Component (SoundControl)
 *
 * Speaker button with popover containing:
 * - Volume Slider (0% - 100%)
 * - Mute / Unmute toggle button
 * - Sound FX & BGM Music toggles
 * - Currently playing BGM track indicator (Save State or Pixel Bounce)
 *
 * Designed for use in:
 * - Main Menu
 * - Level Editor (Studio Header & Sidebar)
 * - GamePlayer
 */

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Volume1, X, Music, Check } from 'lucide-react';
import { sound, SoundEngineSettings } from '../audio/soundEngine';

interface SoundControlProps {
  compact?: boolean;
  align?: 'left' | 'right';
  direction?: 'down' | 'up';
  className?: string;
  buttonClassName?: string;
}

export const SoundControl: React.FC<SoundControlProps> = ({
  compact = false,
  align = 'right',
  direction = 'down',
  className = '',
  buttonClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<SoundEngineSettings>(() => sound.getSettingsState());
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Subscribe to real-time sound settings changes across all screens
  useEffect(() => {
    const unsubscribe = sound.onSettingsChange((newSettings) => {
      setSettings(newSettings);
    });
    return () => unsubscribe();
  }, []);

  // Close on click outside or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggleOpen = () => {
    sound.playClick();
    setIsOpen((prev) => !prev);
  };

  const handleVolumeChange = (newVol: number) => {
    sound.setMasterVolume(newVol);
  };

  const handleToggleMute = () => {
    sound.playClick();
    sound.toggleMute();
  };

  const handleToggleSound = () => {
    sound.playClick();
    sound.setSoundEnabled(!settings.sound);
  };

  const handleToggleMusic = () => {
    sound.playClick();
    sound.setMusicEnabled(!settings.music);
  };

  const isMutedEffective = settings.isMuted || settings.volume === 0 || (!settings.sound && !settings.music);
  const currentTrack = sound.getCurrentTrack();
  const trackName =
    currentTrack === 'gameplay'
      ? 'Pixel Bounce'
      : currentTrack === 'menu_editor'
      ? 'Save State'
      : 'Остановлен';

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {/* Speaker Button */}
      <button
        ref={buttonRef}
        onClick={handleToggleOpen}
        title="Настройки звука и громкости"
        aria-label="Настройки звука"
        aria-expanded={isOpen}
        className={
          buttonClassName ||
          (compact
            ? `h-8.5 w-8.5 rounded-xl border flex items-center justify-center transition-colors cursor-pointer select-none ${
                isOpen
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/80'
              }`
            : `w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 shadow-xl backdrop-blur-md flex items-center justify-center cursor-pointer transition-all active:scale-90 hover:scale-105 select-none ${
                isOpen
                  ? 'bg-amber-400 border-amber-300 text-slate-950 shadow-amber-400/40'
                  : 'bg-slate-900/85 hover:bg-slate-800 border-amber-400/90 text-amber-300 hover:text-white'
              }`)
        }
      >
        {isMutedEffective ? (
          <VolumeX className={compact ? 'w-4 h-4 text-rose-400' : 'w-5 h-5 text-rose-400'} />
        ) : settings.volume < 0.4 ? (
          <Volume1 className={compact ? 'w-4 h-4 text-amber-400' : 'w-5 h-5 text-amber-300'} />
        ) : (
          <Volume2 className={compact ? 'w-4 h-4 text-emerald-400' : 'w-5 h-5 text-emerald-300'} />
        )}
      </button>

      {/* Sound Settings Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className={`absolute ${
            direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
          } ${
            align === 'left' ? 'left-0' : 'right-0'
          } w-72 sm:w-80 bg-[#1E293B]/95 border-2 border-amber-400/80 rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl animate-modal-pop-in z-50 text-white select-none`}
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700/80">
            <div className="flex items-center gap-2">
              <span className="text-base">🔊</span>
              <span className="font-pixel text-xs text-amber-300 tracking-wider font-bold">
                ЗВУК И МУЗЫКА
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Current BGM Track Badge */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 mb-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Music className="w-3.5 h-3.5 text-amber-400" />
              <span>Музыкальный трек:</span>
            </div>
            <span className="font-bold text-amber-300 font-pixel text-[11px] truncate max-w-[120px]">
              {trackName}
            </span>
          </div>

          {/* Master Volume Slider */}
          <div className="space-y-2 mb-3.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300">Громкость звука:</span>
              <span className="text-amber-300 font-pixel text-[11px]">
                {Math.round(settings.volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-amber-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
            />
          </div>

          {/* Quick Mute Toggle Button */}
          <button
            onClick={handleToggleMute}
            className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 mb-3 transition-all cursor-pointer ${
              isMutedEffective
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600/80'
            }`}
          >
            {isMutedEffective ? (
              <>
                <VolumeX className="w-4 h-4" />
                <span>Включить звук</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Отключить звук (Mute)</span>
              </>
            )}
          </button>

          {/* Sound Effects & Music Toggles */}
          <div className="space-y-1.5 pt-2.5 border-t border-slate-700/80 text-xs font-medium">
            <button
              type="button"
              onClick={handleToggleMusic}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 cursor-pointer transition-colors text-left"
            >
              <span className="text-slate-200">Фоновая музыка (BGM)</span>
              <div
                className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                  settings.music ? 'bg-amber-400 border-amber-300 text-slate-950' : 'border-slate-600 bg-slate-800'
                }`}
              >
                {settings.music && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>

            <button
              type="button"
              onClick={handleToggleSound}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 cursor-pointer transition-colors text-left"
            >
              <span className="text-slate-200">Эффекты (прыжки, монеты)</span>
              <div
                className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                  settings.sound ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-600 bg-slate-800'
                }`}
              >
                {settings.sound && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
