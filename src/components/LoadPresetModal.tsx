/**
 * Super Pixel World - Load & Presets Modal
 * Choose from ready-made adventure levels or import custom JSON files.
 */

import React, { useRef, useState } from 'react';
import { Download, FileJson, Sparkles, Upload, X, AlertCircle } from 'lucide-react';
import { PRESET_LEVELS } from '../game/presetLevels';
import { THEMES } from '../game/constants';
import { LevelData, ThemeId } from '../types/game';

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

  if (!isOpen) return null;

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
      title: 'Зелёное приключение (Уровень 1-1)',
      desc: 'Классический старт: холмы, блоки ?, монеты над ямами, замок и финишный флаг.',
    },
    {
      id: 'candy_land',
      title: 'Конфетный раш',
      desc: 'Зефирные прыжки, сладкие платформы и летающие слаймы.',
    },
    {
      id: 'ice_world',
      title: 'Ледяное восхождение',
      desc: 'Скользкие ледники, острые шипы и сбор редких кристаллов.',
    },
    {
      id: 'alien_jungle',
      title: 'Тайна космических джунглей',
      desc: 'Светящиеся грибы, платформы среди колец планет и ночная атмосфера.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800/90 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">
                Готовые уровни и импорт
              </h3>
              <p className="text-xs text-slate-400">
                Выберите стартовый шаблон или загрузите свой уровень
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
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
              <span>Фирменные готовые приключения:</span>
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
                    <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                      {preset.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Import / Export JSON Section */}
          <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
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
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4 text-purple-400" />
                <span>Загрузить JSON файл</span>
              </button>
            </div>
            <div>
              <button
                onClick={handleExportJson}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-blue-400" />
                <span>Экспортировать в JSON</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
