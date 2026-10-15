/**
 * Super Pixel World - Compact Level Builder Sidebar (Right Panel 18-22% width)
 */

import React, { useState } from 'react';
import {
  Download,
  Eraser,
  HelpCircle,
  Maximize2,
  Minimize2,
  Play,
  Redo2,
  Trash2,
  Undo2,
  Upload,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { HEROES, PALETTE_ITEMS, THEMES } from '../game/constants';
import { HeroId, PaletteCategory, ThemeId, TileId, ToolMode } from '../types/game';
import { PaletteTilePreview } from './PaletteTilePreview';

interface BuilderSidebarProps {
  activeTool: ToolMode;
  selectedTile: TileId;
  selectedTheme: ThemeId;
  selectedHero: HeroId;
  canUndo: boolean;
  canRedo: boolean;
  isFullscreen: boolean;
  isMuted: boolean;
  onSelectTool: (tool: ToolMode) => void;
  onSelectTile: (tile: TileId) => void;
  onSelectTheme: (theme: ThemeId) => void;
  onSelectHero: (hero: HeroId) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onPlay: () => void;
  onSave: () => void;
  onLoad: () => void;
  onToggleFullscreen: () => void;
  onToggleMute: () => void;
  onOpenTutorial: () => void;
}

export const BuilderSidebar: React.FC<BuilderSidebarProps> = ({
  activeTool,
  selectedTile,
  selectedTheme,
  selectedHero,
  canUndo,
  canRedo,
  isFullscreen,
  isMuted,
  onSelectTool,
  onSelectTile,
  onSelectTheme,
  onSelectHero,
  onUndo,
  onRedo,
  onClear,
  onPlay,
  onSave,
  onLoad,
  onToggleFullscreen,
  onToggleMute,
  onOpenTutorial,
}) => {
  const [activeTab, setActiveTab] = useState<PaletteCategory>('platforms');
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const platformItems = PALETTE_ITEMS.filter((i) => i.category === 'platforms');
  const objectItems = PALETTE_ITEMS.filter((i) => i.category === 'objects');
  const enemyItems = PALETTE_ITEMS.filter((i) => i.category === 'enemies');

  return (
    <aside className="w-full md:w-80 lg:w-[22%] h-full bg-slate-900 border-l border-slate-800 flex flex-col justify-between shrink-0 select-none shadow-xl z-20 overflow-hidden">
      {/* Top Header / Mode Title */}
      <div className="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Панель конструктора
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Включить звук' : 'Выключить звук'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onOpenTutorial}
            title="Как играть и строить (Инструкция)"
            className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-5 bg-slate-950 border-b border-slate-800 p-1 gap-1">
        <button
          onClick={() => {
            setActiveTab('platforms');
            if (activeTool === 'erase') onSelectTool('brush');
          }}
          className={`py-2 px-0.5 text-[11px] font-bold rounded-lg transition-all text-center cursor-pointer ${
            activeTab === 'platforms'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          Блоки
        </button>
        <button
          onClick={() => {
            setActiveTab('objects');
            if (activeTool === 'erase') onSelectTool('brush');
          }}
          className={`py-2 px-0.5 text-[11px] font-bold rounded-lg transition-all text-center cursor-pointer ${
            activeTab === 'objects'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          Бонусы
        </button>
        <button
          onClick={() => {
            setActiveTab('enemies');
            if (activeTool === 'erase') onSelectTool('brush');
          }}
          className={`py-2 px-0.5 text-[11px] font-bold rounded-lg transition-all text-center cursor-pointer ${
            activeTab === 'enemies'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-rose-400 hover:text-rose-200 hover:bg-slate-800/60'
          }`}
        >
          Враги
        </button>
        <button
          onClick={() => setActiveTab('backgrounds')}
          className={`py-2 px-0.5 text-[11px] font-bold rounded-lg transition-all text-center cursor-pointer ${
            activeTab === 'backgrounds'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          Фоны
        </button>
        <button
          onClick={() => setActiveTab('heroes')}
          className={`py-2 px-0.5 text-[11px] font-bold rounded-lg transition-all text-center cursor-pointer ${
            activeTab === 'heroes'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          Герои
        </button>
      </div>

      {/* Gallery Content Area */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        {/* TAB 1: PLATFORMS */}
        {activeTab === 'platforms' && (
          <div>
            <div className="text-[11px] font-medium text-slate-400 mb-2 flex items-center justify-between">
              <span>Кликните или тяните для создания мостов:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {platformItems.map((item) => {
                const isSelected = activeTool !== 'erase' && selectedTile === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTile(item.id);
                      onSelectTool('brush');
                      sound.playPlaceTile();
                    }}
                    title={item.hint}
                    className={`flex items-center gap-2.5 p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/30 text-white'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-slate-950/60 flex items-center justify-center border border-slate-700/50">
                      <PaletteTilePreview tileId={item.id} size={32} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-tight truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight truncate">
                        {item.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: OBJECTS & ENEMIES */}
        {activeTab === 'objects' && (
          <div>
            <div className="text-[11px] font-medium text-slate-400 mb-2">
              <span>Монеты, бонусы, ловушки и монстры:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {objectItems.map((item) => {
                const isSelected = activeTool !== 'erase' && selectedTile === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTile(item.id);
                      onSelectTool('brush');
                      sound.playPlaceTile();
                    }}
                    title={item.hint}
                    className={`flex items-center gap-2.5 p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/30 text-white'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-slate-950/60 flex items-center justify-center border border-slate-700/50">
                      <PaletteTilePreview tileId={item.id} size={32} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-tight truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight truncate">
                        {item.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: ENEMIES */}
        {activeTab === 'enemies' && (
          <div className="space-y-3">
            <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-2.5 text-[11px] text-rose-200 leading-snug">
              <span className="font-bold text-rose-300">💡 Боевая система:</span>
              <p className="mt-0.5 text-slate-300">
                Всех врагов можно победить <b>прыжком сверху</b>! Если враг заденет персонажа сбоку, отнимается 1 жизнь, но герой продолжает движение.
              </p>
            </div>

            <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
              <span>Кликните для выбора врага:</span>
              <span className="text-[10px] text-rose-400 font-bold">4 разных типа атаки</span>
            </div>

            <div className="space-y-2">
              {enemyItems.map((item) => {
                const isSelected = activeTool !== 'erase' && selectedTile === item.id;
                const attackBadge =
                  item.id === 'enemy_chaser'
                    ? { label: 'Погоня', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' }
                    : item.id === 'enemy_patrol'
                    ? { label: 'Зона 3–5 клеток', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' }
                    : item.id === 'enemy_jumper'
                    ? { label: 'Атака прыжком', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' }
                    : item.id === 'enemy_slime'
                    ? { label: 'Воздушное пике', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' }
                    : { label: 'Патруль', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTile(item.id);
                      onSelectTool('brush');
                      sound.playPlaceTile();
                    }}
                    title={item.hint}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left border transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-rose-500/20 border-rose-400 ring-2 ring-rose-400/40 text-white'
                        : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/70 text-slate-200 hover:border-rose-400/50'
                    }`}
                  >
                    <div className="shrink-0 w-11 h-11 rounded-xl bg-slate-950/80 flex items-center justify-center border border-slate-700/80 shadow-inner group-hover:scale-105 transition-transform">
                      <PaletteTilePreview tileId={item.id} size={36} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold leading-tight truncate text-white">
                          {item.name}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${attackBadge.color} shrink-0`}>
                          {attackBadge.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-300 mt-0.5 leading-snug line-clamp-2">
                        {item.desc}
                      </p>
                      <div className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
                        <span className="text-emerald-400">⚔️ Удар сверху:</span>
                        <span>уничтожение</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: BACKGROUNDS */}
        {activeTab === 'backgrounds' && (
          <div className="space-y-2.5">
            <div className="text-[11px] font-medium text-slate-400">
              <span>Выберите тему и атмосферу мира:</span>
            </div>
            {(Object.keys(THEMES) as ThemeId[]).map((tId) => {
              const th = THEMES[tId];
              const isSelected = selectedTheme === tId;
              return (
                <button
                  key={tId}
                  onClick={() => {
                    onSelectTheme(tId);
                    sound.playCheckpoint();
                  }}
                  className={`w-full text-left rounded-xl overflow-hidden border transition-all group cursor-pointer ${
                    isSelected
                      ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                      : 'border-slate-700/70 hover:border-slate-500'
                  }`}
                >
                  <div className="relative h-20 w-full overflow-hidden bg-slate-950">
                    <img
                      src={th.image}
                      alt={th.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-bottom transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                    <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white leading-tight">
                          {th.name}
                        </div>
                        <div className="text-[10px] text-slate-300 leading-tight">
                          {th.subtitle}
                        </div>
                      </div>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                          Выбрано
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* TAB 4: HEROES */}
        {activeTab === 'heroes' && (
          <div className="space-y-2.5">
            <div className="text-[11px] font-medium text-slate-400">
              <span>Выберите главного героя для игры:</span>
            </div>
            {(Object.keys(HEROES) as HeroId[]).map((hId) => {
              const hero = HEROES[hId];
              const isSelected = selectedHero === hId;
              return (
                <button
                  key={hId}
                  onClick={() => {
                    onSelectHero(hId);
                    sound.playJump();
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/30'
                      : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center shrink-0">
                      <PaletteTilePreview heroId={hId} size={44} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-white truncate">
                          {hero.name} · {hero.title}
                        </div>
                        {isSelected && (
                          <span className="text-[10px] text-amber-400 font-bold">★ Активен</span>
                        )}
                      </div>
                      <div className="text-[11px] text-emerald-400 font-medium">
                        {hero.perk}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        {hero.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Tool & Control Buttons */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
        {/* Tool shortcuts row: Eraser, Undo, Redo, Clear */}
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => {
              onSelectTool(activeTool === 'erase' ? 'brush' : 'erase');
              sound.playErase();
            }}
            title="Ластик (Удаление кликом или протяжкой)"
            className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
              activeTool === 'erase'
                ? 'bg-rose-500 text-white border-rose-400 ring-2 ring-rose-400/40 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Eraser className="w-4 h-4" />
            <span className="text-[10px]">Ластик</span>
          </button>

          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Отменить действие (Ctrl+Z)"
            className="py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
            <span className="text-[10px]">Назад</span>
          </button>

          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Повторить действие (Ctrl+Y)"
            className="py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <Redo2 className="w-4 h-4" />
            <span className="text-[10px]">Вперёд</span>
          </button>

          <button
            onClick={() => setConfirmClearOpen(true)}
            title="Очистить все объекты на уровне"
            className="py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border border-slate-700 bg-slate-800 text-rose-300 hover:bg-rose-950/40 hover:border-rose-700 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span className="text-[10px]">Очистить</span>
          </button>
        </div>

        {/* Save / Load Row */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={onSave}
            title="Скачать файл уровня в JSON"
            className="py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Сохранить</span>
          </button>
          <button
            onClick={onLoad}
            title="Загрузить уровень из JSON или пресета"
            className="py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-purple-400" />
            <span>Загрузить</span>
          </button>
        </div>

        {/* Primary PLAY Button */}
        <button
          onClick={onPlay}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Play className="w-5 h-5 fill-slate-950" />
          <span>ИГРАТЬ В УРОВЕНЬ</span>
        </button>
      </div>

      {/* Clear Confirmation Dialog */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-500/50 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Очистить уровень?</h4>
                <p className="text-xs text-slate-300">
                  Все расставленные блоки будут удалены. Вы сможете отменить это действие кнопкой «Назад».
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmClearOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  setConfirmClearOpen(false);
                  onClear();
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                Да, очистить
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
