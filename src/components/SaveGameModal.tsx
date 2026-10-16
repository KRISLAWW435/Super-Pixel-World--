/**
 * Pixel Studio Pro - Save Project & Export Modal
 *
 * Implements strict separation:
 * 1. Primary CTA: Save to LocalStorage under creator's profile
 * 2. Secondary Utility: Export level data to a standalone JSON file
 * Uses unified StudioModal shell.
 */

import React, { useState } from 'react';
import { Download, Sparkles, Check, Save } from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { SaveManager } from '../services/storageManager';
import { LevelData } from '../types/game';
import { PRESET_AVATARS, UserProfile } from '../types/storage';
import { StudioModal } from './StudioModal';

interface SaveGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: LevelData;
  profile: UserProfile | null;
  onSaved: (levelName: string) => void;
}

export const SaveGameModal: React.FC<SaveGameModalProps> = ({
  isOpen,
  onClose,
  currentLevel,
  profile,
  onSaved,
}) => {
  const [levelName, setLevelName] = useState<string>(
    currentLevel.name && currentLevel.name !== 'Безымянный уровень'
      ? currentLevel.name
      : 'Мой авторский уровень'
  );
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const avatar = PRESET_AVATARS.find((a) => a.id === profile?.avatarId) || PRESET_AVATARS[0];

  const handleSaveToLocalStorage = () => {
    const finalName = levelName.trim() || 'Мой авторский уровень';
    sound.playCoin();

    SaveManager.saveGame(finalName, {
      ...currentLevel,
      name: finalName,
      author: profile?.name || 'Геймдизайнер',
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onSaved(finalName);
      onClose();
    }, 1000);
  };

  const handleExportJson = () => {
    sound.playClick();
    const finalName = levelName.trim() || 'pixel_studio_level';
    const exportData = {
      ...currentLevel,
      name: finalName,
      author: profile?.name || 'Геймдизайнер',
    };
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `super_pixel_${finalName.replace(/\s+/g, '_').toLowerCase()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <StudioModal
      isOpen={isOpen}
      onClose={onClose}
      title="Сохранение проекта"
      subtitle="Сохраните уровень в библиотеку студии или экспортируйте в файл"
      icon={<Save className="w-5 h-5 text-emerald-400" />}
      badge="Pixel Studio"
      badgeColor="emerald"
    >
      {isSuccess ? (
        <div className="py-6 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in-90 duration-300">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>
          <h3 className="text-xl font-bold text-emerald-400">
            Проект успешно сохранён!
          </h3>
          <p className="text-xs text-slate-300">
            Уровень добавлен в «Мои проекты» и готов к тестированию.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Creator Profile Chip */}
          <div className="p-3 rounded-xl bg-[#0F172A] border border-slate-700/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-emerald-400/60 shadow-sm shrink-0 bg-slate-950">
              <img
                src={avatar.imageUrl}
                alt={avatar.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Автор проекта:
              </div>
              <div className="text-sm font-semibold text-white truncate">
                {profile?.name || 'Геймдизайнер'}
              </div>
            </div>
          </div>

          {/* Level Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Название проекта:</span>
            </label>
            <input
              type="text"
              value={levelName}
              onChange={(e) => setLevelName(e.target.value.slice(0, 28))}
              placeholder="Введите название..."
              maxLength={28}
              className="w-full px-3.5 py-2.5 text-sm font-semibold bg-[#0B0F19] border border-slate-700 focus:border-amber-400 rounded-xl text-white outline-none transition-all shadow-inner"
            />
          </div>

          {/* Primary Action: Save to LocalStorage */}
          <button
            onClick={handleSaveToLocalStorage}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>Сохранить в студию</span>
          </button>

          {/* Secondary Action: Export JSON */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                Резервная копия на диск в формате JSON:
              </div>
              <button
                onClick={handleExportJson}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Экспорт JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </StudioModal>
  );
};
