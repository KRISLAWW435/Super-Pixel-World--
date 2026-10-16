/**
 * Pixel Studio Pro - Studio Settings Modal
 * Uses unified StudioModal shell.
 */

import React, { useState } from 'react';
import { Volume2, VolumeX, Music, Bell, Check, Settings, RotateCcw, GraduationCap } from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { SettingsManager } from '../services/storageManager';
import { TutorialManager } from '../services/TutorialManager';
import { GameSettings } from '../types/storage';
import { StudioModal } from './StudioModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChanged?: (settings: GameSettings) => void;
  onResetTutorial?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsChanged,
  onResetTutorial,
}) => {
  const [settings, setSettings] = useState<GameSettings>(() =>
    SettingsManager.getSettings()
  );

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

  const volumePercent = Math.round(settings.volume * 100);

  return (
    <StudioModal
      isOpen={isOpen}
      onClose={onClose}
      title="Параметры звука"
      subtitle="Управление звуковыми эффектами, музыкой и общей громкостью"
      icon={<Settings className="w-5 h-5 text-amber-400" />}
      badge="Студия"
      badgeColor="amber"
    >
      <div className="space-y-4">
        {/* Sound Effects Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0F172A] border border-slate-700/80">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                settings.sound
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}
            >
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                Звуковые эффекты
              </div>
              <div className="text-xs text-slate-400">
                Прыжки, сбор монет, удары и победы
              </div>
            </div>
          </div>

          <button
            onClick={handleToggleSound}
            className={`w-14 h-8 rounded-full transition-colors relative cursor-pointer p-1 shrink-0 ${
              settings.sound ? 'bg-amber-400' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-slate-950 shadow-md transition-transform flex items-center justify-center ${
                settings.sound ? 'translate-x-6' : 'translate-x-0'
              }`}
            >
              {settings.sound && <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />}
            </div>
          </button>
        </div>

        {/* Music Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0F172A] border border-slate-700/80">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                settings.music
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                  : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}
            >
              <Music className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                Фоновая музыка
              </div>
              <div className="text-xs text-slate-400">
                Чиптюн-мелодия для выбранного биома
              </div>
            </div>
          </div>

          <button
            onClick={handleToggleMusic}
            className={`w-14 h-8 rounded-full transition-colors relative cursor-pointer p-1 shrink-0 ${
              settings.music ? 'bg-indigo-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-slate-950 shadow-md transition-transform flex items-center justify-center ${
                settings.music ? 'translate-x-6' : 'translate-x-0'
              }`}
            >
              {settings.music && <Check className="w-3.5 h-3.5 text-indigo-400 stroke-[3]" />}
            </div>
          </button>
        </div>

        {/* Volume Slider */}
        <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-700/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              {volumePercent === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
              <span>Общая громкость</span>
            </span>
            <span className="text-xs font-mono font-bold text-amber-400">
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
        </div>

        {/* Interactive Guided Tour Reset */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between p-3.5 rounded-xl bg-[#0F172A] border border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                Обучение геймдизайну
              </div>
              <div className="text-xs text-slate-400">
                Интерактивный пошаговый тур по редактору
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
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Пройти заново</span>
          </button>
        </div>
      </div>
    </StudioModal>
  );
};
