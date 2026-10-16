/**
 * Pixel Studio Pro - Tool & Palette Sidebar (BuilderSidebar)
 *
 * Implements Stage 1 & Stage 2 Redesign:
 * - 3 Unified, accessible tabs: «Платформы», «Интерактив и враги», «Мир и герой» (replaced 5 micro-tabs)
 * - Large clickable targets (>= 36x36px) with clean, high-contrast previews
 * - Explicit tool modes: Brush (Freehand), Area (2D Box), Eraser
 * - Pixel Studio Pro design tokens (#0B0F19 background, #131B2E surface, #F59E0B amber, #10B981 emerald)
 * - Collapsible sidebar to expand viewport when needed
 * - Separated "Сохранить проект" (LocalStorage) and "Готовые миры" (Presets/Import)
 */

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eraser,
  HelpCircle,
  Home,
  Layers,
  Maximize2,
  Minimize2,
  Move,
  Palette,
  PenTool,
  Play,
  Redo2,
  Sparkles,
  Swords,
  Trash2,
  Undo2,
  Upload,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { HEROES, PALETTE_ITEMS, THEMES } from '../game/constants';
import { HeroId, ThemeId, TileId, ToolMode } from '../types/game';
import { PaletteTilePreview } from './PaletteTilePreview';

type StudioSidebarTab = 'platforms' | 'interactive' | 'world';

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
  onExitToMenu?: () => void;
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
  onExitToMenu,
}) => {
  const [activeTab, setActiveTab] = useState<StudioSidebarTab>('platforms');
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const platformItems = PALETTE_ITEMS.filter((i) => i.category === 'platforms');
  const interactiveItems = PALETTE_ITEMS.filter((i) => i.category === 'objects');
  const enemyItems = PALETTE_ITEMS.filter((i) => i.category === 'enemies');

  // If collapsed, render slim vertical tool rail
  if (isCollapsed) {
    return (
      <aside className="w-12 h-full bg-[#131B2E] border-l border-slate-800 flex flex-col justify-between items-center py-2 shrink-0 select-none z-20">
        <button
          onClick={() => setIsCollapsed(false)}
          title="Развернуть панель инструментов"
          className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 flex items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              onSelectTool('brush');
              sound.playSelect();
            }}
            title="Кисть"
            className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
              activeTool === 'brush'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            <PenTool className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              onSelectTool('line');
              sound.playSelect();
            }}
            title="Область (прямоугольник)"
            className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
              activeTool === 'line'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            <Move className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              onSelectTool('erase');
              sound.playErase();
            }}
            title="Ластик"
            className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
              activeTool === 'erase'
                ? 'bg-rose-500 text-white font-bold'
                : 'bg-slate-800 text-rose-400'
            }`}
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={onPlay}
          title="Тест уровня"
          className="w-9 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-bold cursor-pointer shadow-md shadow-emerald-500/30"
        >
          <Play className="w-4 h-4 fill-slate-950" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-full md:w-80 lg:w-[280px] xl:w-[320px] h-full bg-[#131B2E] border-l border-slate-800 flex flex-col justify-between shrink-0 select-none shadow-2xl z-20 overflow-hidden">
      {/* 1. Header Toolbar (Title, Collapse, Settings) */}
      <div className="px-3 py-2.5 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setIsCollapsed(true)}
            title="Свернуть панель инструментов"
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider truncate">
              Мастерская блоков
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Включить звук' : 'Выключить звук'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Оконный режим' : 'Во весь экран'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onOpenTutorial}
            title="Инструкция геймдизайнера"
            className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Three Unified Studio Tabs (13px, Large targets) */}
      <div className="grid grid-cols-3 bg-[#0B0F19] border-b border-slate-800 p-1.5 gap-1 shrink-0">
        <button
          onClick={() => {
            setActiveTab('platforms');
            if (activeTool === 'erase') onSelectTool('brush');
            sound.playClick();
          }}
          className={`py-2 px-1 text-xs font-bold rounded-xl transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'platforms'
              ? 'bg-[#1E293B] text-amber-300 border border-amber-400/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Платформы</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('interactive');
            if (activeTool === 'erase') onSelectTool('brush');
            sound.playClick();
          }}
          className={`py-2 px-1 text-xs font-bold rounded-xl transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'interactive'
              ? 'bg-[#1E293B] text-amber-300 border border-amber-400/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          <span>Интерактив</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('world');
            sound.playClick();
          }}
          className={`py-2 px-1 text-xs font-bold rounded-xl transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'world'
              ? 'bg-[#1E293B] text-amber-300 border border-amber-400/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Palette className="w-3.5 h-3.5 text-cyan-400" />
          <span>Мир и герой</span>
        </button>
      </div>

      {/* 3. Palette Items Content Area */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3">
        {/* TAB 1: PLATFORMS */}
        {activeTab === 'platforms' && (
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-slate-400">
              Строительные блоки и платформы:
            </div>
            <div className="grid grid-cols-2 gap-2">
              {platformItems.map((item) => {
                const isSelected = activeTool !== 'erase' && selectedTile === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTile(item.id);
                      if (activeTool === 'erase') onSelectTool('brush');
                      sound.playPlaceTile();
                    }}
                    title={item.hint}
                    className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all cursor-pointer min-h-[44px] ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400/50 text-white'
                        : 'bg-[#0B0F19]/80 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-[#0F172A] flex items-center justify-center border border-slate-700/60">
                      <PaletteTilePreview tileId={item.id} size={30} />
                    </div>
                    <span className="text-xs font-bold leading-tight truncate">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE & ENEMIES */}
        {activeTab === 'interactive' && (
          <div className="space-y-3">
            {/* Interactive Items Section */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                Бонусы и механизмы:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {interactiveItems.map((item) => {
                  const isSelected = activeTool !== 'erase' && selectedTile === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTile(item.id);
                        if (activeTool === 'erase') onSelectTool('brush');
                        sound.playPlaceTile();
                      }}
                      title={item.hint}
                      className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all cursor-pointer min-h-[44px] ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400/50 text-white'
                          : 'bg-[#0B0F19]/80 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                      }`}
                    >
                      <div className="shrink-0 w-8 h-8 rounded-lg bg-[#0F172A] flex items-center justify-center border border-slate-700/60">
                        <PaletteTilePreview tileId={item.id} size={30} />
                      </div>
                      <span className="text-xs font-bold leading-tight truncate">
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Enemies Section */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5" />
                <span>Противники:</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {enemyItems.map((item) => {
                  const isSelected = activeTool !== 'erase' && selectedTile === item.id;
                  const roleLabel =
                    item.id === 'enemy_chaser'
                      ? 'Быстрая погоня'
                      : item.id === 'enemy_patrol'
                      ? 'Патруль 4 клетки'
                      : item.id === 'enemy_jumper'
                      ? 'Прыжки вверх'
                      : 'Воздушный слайм';

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTile(item.id);
                        if (activeTool === 'erase') onSelectTool('brush');
                        sound.playPlaceTile();
                      }}
                      title={item.hint}
                      className={`flex items-center justify-between p-2 rounded-xl text-left border transition-all cursor-pointer min-h-[44px] ${
                        isSelected
                          ? 'bg-rose-500/20 border-rose-400 ring-1 ring-rose-400/50 text-white'
                          : 'bg-[#0B0F19]/80 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="shrink-0 w-8 h-8 rounded-lg bg-[#0F172A] flex items-center justify-center border border-slate-700/60">
                          <PaletteTilePreview tileId={item.id} size={30} />
                        </div>
                        <div>
                          <div className="text-xs font-bold leading-tight text-white">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {roleLabel}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        ⚔️ прыжок сверху
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WORLD THEMES & HEROES */}
        {activeTab === 'world' && (
          <div className="space-y-3.5">
            {/* World Biomes */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-400">
                Биом и панорамный фон:
              </div>
              <div className="space-y-1.5">
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
                          ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-md'
                          : 'border-slate-700/80 hover:border-slate-500'
                      }`}
                    >
                      <div className="relative h-14 w-full overflow-hidden bg-slate-950">
                        <img
                          src={th.image}
                          alt={th.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-bottom transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
                        <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between">
                          <span className="text-xs font-bold text-white">
                            {th.name}
                          </span>
                          {isSelected && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                              Выбрано
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Playable Heroes */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Главный герой:</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
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
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400/50'
                          : 'bg-[#0B0F19]/80 hover:bg-slate-800 border-slate-700/80'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center shrink-0">
                        <PaletteTilePreview heroId={hId} size={28} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {hero.name}
                        </div>
                        <div className="text-[10px] text-emerald-400 truncate">
                          {hero.perk}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Tools & Actions Bottom Panel */}
      <div className="p-3 bg-[#0F172A] border-t border-slate-800 space-y-2 shrink-0">
        {/* Tool Mode Buttons (Brush, Area Box, Eraser, Clear) */}
        <div className="grid grid-cols-4 gap-1.5">
          {/* Freehand Brush */}
          <button
            onClick={() => {
              onSelectTool('brush');
              sound.playSelect();
            }}
            title="Свободная кисть: зажмите ЛКМ и рисуйте в любых направлениях"
            className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
              activeTool === 'brush'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span className="text-[10px]">Кисть</span>
          </button>

          {/* Area 2D Box */}
          <button
            onClick={() => {
              onSelectTool('line');
              sound.playSelect();
            }}
            title="Прямоугольная область: тяните по диагонали для заполнения стен или ям"
            className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
              activeTool === 'line'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Move className="w-4 h-4" />
            <span className="text-[10px]">Область</span>
          </button>

          {/* Eraser */}
          <button
            onClick={() => {
              onSelectTool('erase');
              sound.playErase();
            }}
            title="Ластик: удаление блоков кликом или протяжкой"
            className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
              activeTool === 'erase'
                ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                : 'bg-slate-800 text-rose-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Eraser className="w-4 h-4" />
            <span className="text-[10px]">Ластик</span>
          </button>

          {/* Clear Level */}
          <button
            onClick={() => setConfirmClearOpen(true)}
            title="Очистить уровень"
            className="py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border border-slate-700 bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-[10px]">Сброс</span>
          </button>
        </div>

        {/* Save / Presets Row (Clean Separation) */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={onSave}
            title="Сохранить уровень в библиотеку проектов студии"
            className="py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Сохранить</span>
          </button>
          <button
            onClick={onLoad}
            title="Готовые уровни студии и импорт JSON"
            className="py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-purple-400" />
            <span>Готовые миры</span>
          </button>
        </div>
      </div>

      {/* Clear Confirmation Dialog */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0F19]/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#131B2E] border border-rose-500/50 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Очистить уровень?</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Все расставленные блоки будут стёрты. Не волнуйтесь: действие можно вернуть кнопкой «Назад» (Ctrl+Z).
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
