/**
 * Super Pixel World - Simplified Sound Settings Modal
 * Strictly focused on child-friendly sound controls:
 * - Sound Effects Toggle (Вкл/Выкл)
 * - Music Toggle (Вкл/Выкл)
 * - Master Volume Slider with dynamic speaker icon
 * Instantly applies changes and saves to LocalStorage via SettingsManager.
 */

import React, { useState } from 'react';
import { Volume2, VolumeX, Music, Bell, X, Check } from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { SettingsManager } from '../services/storageManager';
import { GameSettings } from '../types/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChanged?: (settings: GameSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsChanged,
}) => {
  const [settings, setSettings] = useState<GameSettings>(() =>
    SettingsManager.getSettings()
  );

  if (!isOpen) return null;

  const handleToggleSound = () => {
    const next = !settings.sound;
    const updated = SettingsManager.setSound(next);
    setSettings(updated);
    sound.applySettings(updated);
    if (next) {
      sound.playClick();
    }
    onSettingsChanged?.(updated);
  };

  const handleToggleMusic = () => {
    const next = !settings.music;
    const updated = SettingsManager.setMusic(next);
    setSettings(updated);
    sound.applySettings(updated);
    sound.playClick();
    onSettingsChanged?.(updated);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const updated = SettingsManager.setVolume(val);
    setSettings(updated);
    sound.applySettings(updated);
    onSettingsChanged?.(updated);
  };

  const handleClose = () => {
    sound.playClick();
    onClose();
  };

  const volumePercent = Math.round(settings.volume * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-slate-900 border-4 border-amber-400/80 rounded-3xl shadow-2xl shadow-indigo-950/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b-2 border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/30 border-2 border-amber-400/60 flex items-center justify-center text-amber-300 text-xl font-bold">
              ⚙️
            </div>
            <div>
              <h2 className="text-xl font-black text-white leading-tight">
                Настройки звука
              </h2>
              <p className="text-xs text-slate-300">
                Управление звуковыми эффектами и музыкой
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Sound Effects Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/70 border-2 border-slate-800">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all ${
                  settings.sound
                    ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300'
                    : 'bg-slate-800 border border-slate-700 text-slate-500'
                }`}
              >
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-black text-white">
                  Звуковые эффекты
                </div>
                <div className="text-xs text-slate-400">
                  Прыжки, монетки, победа над врагами
                </div>
              </div>
            </div>

            {/* Big Toggle Switch */}
            <button
              type="button"
              onClick={handleToggleSound}
              className={`w-16 h-9 rounded-full p-1 transition-colors cursor-pointer flex items-center ${
                settings.sound ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-slate-900 font-bold text-xs">
                {settings.sound ? <Check className="w-4 h-4 stroke-[3]" /> : '×'}
              </div>
            </button>
          </div>

          {/* Music Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/70 border-2 border-slate-800">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all ${
                  settings.music
                    ? 'bg-indigo-500/20 border border-indigo-400 text-indigo-300'
                    : 'bg-slate-800 border border-slate-700 text-slate-500'
                }`}
              >
                <Music className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-black text-white">
                  Весёлая музыка
                </div>
                <div className="text-xs text-slate-400">
                  Фоновые мелодии уровней
                </div>
              </div>
            </div>

            {/* Big Toggle Switch */}
            <button
              type="button"
              onClick={handleToggleMusic}
              className={`w-16 h-9 rounded-full p-1 transition-colors cursor-pointer flex items-center ${
                settings.music ? 'bg-indigo-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-slate-900 font-bold text-xs">
                {settings.music ? <Check className="w-4 h-4 stroke-[3]" /> : '×'}
              </div>
            </button>
          </div>

          {/* Master Volume Slider */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border-2 border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-black text-amber-300">
                {settings.volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-rose-400" />
                ) : (
                  <Volume2 className="w-5 h-5 text-amber-400" />
                )}
                <span>Громкость звука</span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
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
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Instant Save notification */}
          <div className="text-center text-xs text-emerald-400 font-bold flex items-center justify-center gap-1.5 pt-1">
            <Check className="w-4 h-4" />
            <span>Настройки сохраняются автоматически</span>
          </div>

          {/* Big Close Button */}
          <button
            onClick={handleClose}
            className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-400/20 active:scale-98 transition-all cursor-pointer"
          >
            ГОТОВО
          </button>
        </div>
      </div>
    </div>
  );
};
