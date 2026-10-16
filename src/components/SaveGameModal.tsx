/**
 * Super Pixel World - Save Level to LocalStorage Modal
 * Child-friendly level save dialog:
 * - Enter level title
 * - Shows creator avatar & author tag
 * - Saves to LocalStorage under child's profile via SaveManager
 * - Optional JSON export backup
 */

import React, { useState } from 'react';
import { Download, Sparkles, X, Check, Save } from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { SaveManager } from '../services/storageManager';
import { LevelData } from '../types/game';
import { PRESET_AVATARS, UserProfile } from '../types/storage';

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
      : 'Мой крутой уровень'
  );
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const avatar = PRESET_AVATARS.find((a) => a.id === profile?.avatarId) || PRESET_AVATARS[0];

  const handleSaveToLocalStorage = () => {
    const finalName = levelName.trim() || 'Мой супер уровень';
    sound.playCoin();

    SaveManager.saveGame(finalName, {
      ...currentLevel,
      name: finalName,
      author: profile?.name || 'Юный архитектор',
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onSaved(finalName);
      onClose();
    }, 1100);
  };

  const handleExportJson = () => {
    sound.playClick();
    const finalName = levelName.trim() || 'my_level';
    const exportData = {
      ...currentLevel,
      name: finalName,
      author: profile?.name || 'Юный архитектор',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-slate-900 border-4 border-emerald-400/80 rounded-3xl shadow-2xl shadow-emerald-950/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-b-2 border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/30 border-2 border-emerald-400/60 flex items-center justify-center text-emerald-300 text-xl font-bold">
              💾
            </div>
            <div>
              <h2 className="text-xl font-black text-white leading-tight">
                Сохранить уровень
              </h2>
              <p className="text-xs text-slate-300">
                В твою коллекцию «Мои Игры»
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Success Overlay state */}
          {isSuccess ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in-90 duration-300">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/40 animate-bounce">
                <Check className="w-9 h-9 stroke-[3]" />
              </div>
              <h3 className="text-2xl font-black text-emerald-400">
                Уровень сохранён!
              </h3>
              <p className="text-xs text-slate-300">
                Ты сможешь найти его в меню «Мои Игры»
              </p>
            </div>
          ) : (
            <>
              {/* Creator Card */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border-2 border-slate-800 flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl overflow-hidden border-2 border-emerald-400 shadow-md bg-slate-950 shrink-0"
                >
                  <img
                    src={avatar.imageUrl}
                    alt={avatar.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    Создатель уровня:
                  </div>
                  <div className="text-sm font-black text-white">
                    {profile?.name || 'Юный архитектор'}
                  </div>
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Название твоего уровня:</span>
                </label>
                <input
                  type="text"
                  value={levelName}
                  onChange={(e) => setLevelName(e.target.value.slice(0, 24))}
                  maxLength={24}
                  placeholder="Придумай крутое название..."
                  autoFocus
                  className="w-full px-4 py-3.5 text-base font-bold bg-slate-950 border-3 border-slate-700 focus:border-emerald-400 rounded-xl text-white outline-none shadow-inner"
                />
              </div>

              {/* Primary Save Button */}
              <button
                onClick={handleSaveToLocalStorage}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-base uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/25 active:scale-98 transition-all cursor-pointer"
              >
                <Save className="w-5 h-5 stroke-[2.5]" />
                <span>СОХРАНИТЬ В «МОИ ИГРЫ»</span>
              </button>

              {/* Export JSON Option */}
              <div className="pt-1">
                <button
                  onClick={handleExportJson}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-sky-400" />
                  <span>Также скачать резервный JSON-файл</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
