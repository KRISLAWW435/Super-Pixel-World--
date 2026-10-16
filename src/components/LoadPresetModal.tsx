/**
 * Pixel Studio Pro - Load Presets & Import Modal
 * Uses unified StudioModal shell.
 */

import React, { useRef, useState } from 'react';
import { AlertCircle, FileJson, Sparkles, Upload, Download } from 'lucide-react';
import { PRESET_LEVELS } from '../game/presetLevels';
import { THEMES } from '../game/constants';
import { LevelData, ThemeId } from '../types/game';
import { StudioModal } from './StudioModal';

interface LoadPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLevel: (level: LevelData) => void;
  currentLevel: LevelData;
}

export const LoadPresetModal: React.FC<LoadPresetModalProps> = ({
  isOpen,
  onClose,
  onSelectLevel,
  currentLevel,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.items)) {
          onSelectLevel(parsed);
          onClose();
        } else {
          setError('Некорректный формат файла уровня! Проверьте структуру JSON.');
        }
      } catch {
        setError('Ошибка при чтении файла JSON! Убедитесь, что файл содержит валидный JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleExportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentLevel, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `super_pixel_world_${currentLevel.name.replace(/\s+/g, '_').toLowerCase()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const presetThemes: { id: ThemeId; title: string; desc: string }[] = [
    {
      id: 'green_islands',
      title: 'Зелёное приключение (1-1)',
      desc: 'Классический старт: холмы, блоки ?, монеты над ямами и финишный стяг.',
    },
    {
      id: 'candy_land',
      title: 'Конфетный раш',
      desc: 'Зефирные прыжки, сладкие платформы и летающие слаймы.',
    },
    {
      id: 'ice_world',
      title: 'Ледяное восхождение',
      desc: 'Скользкие ледники, острые шипы и сбор кристаллов.',
    },
    {
      id: 'alien_jungle',
      title: 'Тайна космо-джунглей',
      desc: 'Светящиеся платформы среди колец планет и ночная атмосфера.',
    },
  ];

  return (
    <StudioModal
      isOpen={isOpen}
      onClose={onClose}
      title="Готовые миры и импорт"
      subtitle="Выберите стартовый шаблон студии или загрузите файл с диска"
      icon={<FileJson className="w-5 h-5 text-purple-400" />}
      badge="Библиотека"
      badgeColor="purple"
      maxWidth="lg"
    >
      {error && (
        <div className="p-3 bg-red-950/70 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Preset Levels Grid */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Фирменные готовые уровни студии:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {presetThemes.map((preset) => {
            const theme = THEMES[preset.id];
            return (
              <button
                key={preset.id}
                onClick={() => {
                  const levelGen = PRESET_LEVELS[preset.id];
                  if (levelGen) {
                    onSelectLevel(levelGen());
                    onClose();
                  }
                }}
                className="flex flex-col text-left p-3 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/60 transition-all group cursor-pointer"
              >
                <div className="w-full h-16 rounded-lg overflow-hidden mb-2 bg-slate-950 relative">
                  <img
                    src={theme.image}
                    alt={theme.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-bottom transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="text-xs font-bold text-white leading-tight group-hover:text-amber-400 transition-colors">
                  {preset.title}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {preset.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Import / Export JSON Section */}
      <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-purple-400" />
            <span>Загрузить уровень из JSON</span>
          </button>
        </div>

        <button
          onClick={handleExportJson}
          className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 text-sky-400" />
          <span>Скачать текущий уровень (.json)</span>
        </button>
      </div>
    </StudioModal>
  );
};
